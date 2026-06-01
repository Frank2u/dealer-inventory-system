import prisma from '../prisma.js';

export const getAllPayments = async (req, res, next) => {
  try {
    const { shopId } = req.query;

    const where = {};
    if (shopId) where.shopId = shopId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        shop: true,
        delivery: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { shopId, deliveryId, deliveryIds, paidAmount, paymentDate, paymentMethod, notes } = req.body;

    if (!shopId || !paidAmount) {
      return res.status(400).json({ message: 'Shop and Paid Amount are required' });
    }

    const amountToPay = parseFloat(paidAmount);
    if (amountToPay <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    const payDate = paymentDate ? new Date(paymentDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Shop
      const shop = await tx.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        throw new Error('Shop not found');
      }

      // Consolidate target delivery IDs
      const targetIds = Array.isArray(deliveryIds) 
        ? deliveryIds 
        : (deliveryId ? [deliveryId] : []);

      if (targetIds.length > 0) {
        // 2a. Pay specific invoice(s)
        const deliveries = await tx.delivery.findMany({
          where: {
            id: { in: targetIds },
            shopId
          },
          orderBy: { deliveryDate: 'asc' }
        });

        if (deliveries.length === 0) {
          throw new Error('No valid delivery invoices found');
        }

        const totalDueOfSelected = deliveries.reduce((sum, d) => sum + d.remainingDue, 0);
        if (amountToPay > totalDueOfSelected) {
          throw new Error(`Payment amount (₹${amountToPay}) exceeds total selected invoice dues (₹${totalDueOfSelected})`);
        }

        let remainingAllocation = amountToPay;
        const createdPayments = [];

        for (const delivery of deliveries) {
          if (remainingAllocation <= 0) break;

          const toAllocate = Math.min(remainingAllocation, delivery.remainingDue);
          const newRemaining = delivery.remainingDue - toAllocate;
          const newPaid = delivery.paidAmount + toAllocate;
          
          let paymentStatus = 'unpaid';
          if (newRemaining === 0) {
            paymentStatus = 'paid';
          } else if (newPaid > 0) {
            paymentStatus = 'partial';
          }

          // Update delivery invoice
          await tx.delivery.update({
            where: { id: delivery.id },
            data: {
              remainingDue: newRemaining,
              paidAmount: newPaid,
              paymentStatus
            }
          });

          // Update Shop due
          await tx.shop.update({
            where: { id: shopId },
            data: {
              currentDue: {
                decrement: toAllocate
              }
            }
          });

          // Create individual Payment record
          const ptRec = await tx.payment.create({
            data: {
              shopId,
              deliveryId: delivery.id,
              paidAmount: toAllocate,
              paymentDate: payDate,
              paymentMethod: paymentMethod || 'CASH',
              notes: notes || `Payment applied to invoice ${delivery.deliveryNumber}`
            }
          });

          createdPayments.push(ptRec);
          remainingAllocation -= toAllocate;
        }

        // Return the first created payment
        return createdPayments[0];
      } else {
        // 2b. General payment on account: Apply FIFO allocation to outstanding invoices
        const outstandingDeliveries = await tx.delivery.findMany({
          where: {
            shopId,
            remainingDue: { gt: 0 }
          },
          orderBy: { deliveryDate: 'asc' }
        });

        let remainingAllocation = amountToPay;

        for (const delivery of outstandingDeliveries) {
          if (remainingAllocation <= 0) break;

          const toAllocate = Math.min(remainingAllocation, delivery.remainingDue);
          const newRemaining = delivery.remainingDue - toAllocate;
          const newPaid = delivery.paidAmount + toAllocate;
          let paymentStatus = 'unpaid';
          if (newRemaining === 0) {
            paymentStatus = 'paid';
          } else if (newPaid > 0) {
            paymentStatus = 'partial';
          }

          await tx.delivery.update({
            where: { id: delivery.id },
            data: {
              remainingDue: newRemaining,
              paidAmount: newPaid,
              paymentStatus
            }
          });

          remainingAllocation -= toAllocate;
        }

        // Subtract full amount from shop's currentDue
        await tx.shop.update({
          where: { id: shopId },
          data: {
            currentDue: {
              decrement: amountToPay
            }
          }
        });

        // Create Payment (without a specific invoice link, or linked to the first invoice if partially applied)
        const paymentRecord = await tx.payment.create({
          data: {
            shopId,
            paidAmount: amountToPay,
            paymentDate: payDate,
            paymentMethod: paymentMethod || 'CASH',
            notes: notes || 'General payment applied to account'
          }
        });

        return paymentRecord;
      }
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('exceeds') || error.message.includes('belong') || error.message.includes('No valid')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id } });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Revert shop due balance
      await tx.shop.update({
        where: { id: payment.shopId },
        data: {
          currentDue: {
            increment: payment.paidAmount
          }
        }
      });

      // Revert invoice remaining due if payment was linked to a specific delivery
      if (payment.deliveryId) {
        const delivery = await tx.delivery.findUnique({ where: { id: payment.deliveryId } });
        if (delivery) {
          const newRemaining = delivery.remainingDue + payment.paidAmount;
          const newPaid = Math.max(0, delivery.paidAmount - payment.paidAmount);
          let paymentStatus = 'unpaid';
          if (newRemaining === 0) {
            paymentStatus = 'paid';
          } else if (newPaid > 0) {
            paymentStatus = 'partial';
          }

          await tx.delivery.update({
            where: { id: payment.deliveryId },
            data: {
              remainingDue: newRemaining,
              paidAmount: newPaid,
              paymentStatus
            }
          });
        }
      }

      await tx.payment.delete({ where: { id } });
    });

    res.json({ message: 'Payment record deleted and balances adjusted successfully' });
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
