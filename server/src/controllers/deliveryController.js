import prisma from '../prisma.js';

export const getAllDeliveries = async (req, res, next) => {
  try {
    const { shopId, paymentStatus } = req.query;

    const where = {};
    if (shopId) where.shopId = shopId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        shop: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { deliveryDate: 'desc' }
    });

    res.json(deliveries);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        shop: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true
      }
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery invoice not found' });
    }

    res.json(delivery);
  } catch (error) {
    next(error);
  }
};

export const createDelivery = async (req, res, next) => {
  try {
    const { shopId, deliveryDate, paidAmount, items } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Shop and list of items are required' });
    }

    const payAmount = parseFloat(paidAmount) || 0;

    // Execute in a transaction
    const delivery = await prisma.$transaction(async (tx) => {
      // 1. Verify Shop
      const shop = await tx.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        throw new Error('Shop not found');
      }

      // 2. Process and validate products, stock and totals
      let totalAmount = 0;
      const dbItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product ID ${item.productId} not found`);
        }

        const qty = parseInt(item.quantity);
        if (qty <= 0) {
          throw new Error(`Quantity for product ${product.name} must be greater than 0`);
        }

        // Check stock availability
        if (product.currentStock < qty) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${qty}`);
        }

        const itemTotal = product.sellingPrice * qty;
        totalAmount += itemTotal;

        dbItems.push({
          productId: product.id,
          quantity: qty,
          lotSize: product.lotSize,
          price: product.sellingPrice,
          totalAmount: itemTotal
        });
      }

      // Calculate dues
      const remainingDue = totalAmount - payAmount;
      if (remainingDue < 0) {
        throw new Error('Paid amount cannot exceed the total invoice amount');
      }

      let paymentStatus = 'unpaid';
      if (remainingDue === 0) {
        paymentStatus = 'paid';
      } else if (payAmount > 0) {
        paymentStatus = 'partial';
      }

      // Generate invoice number
      const count = await tx.delivery.count();
      const prefix = 'DLV-';
      const year = new Date().getFullYear();
      const deliveryNumber = `${prefix}${year}-${String(count + 1).padStart(5, '0')}`;

      // 3. Create Delivery/Invoice
      const newDelivery = await tx.delivery.create({
        data: {
          deliveryNumber,
          shopId,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
          totalAmount,
          paidAmount: payAmount,
          remainingDue,
          paymentStatus,
          items: {
            create: dbItems
          }
        },
        include: {
          items: true
        }
      });

      // 4. Update Product Stock levels
      for (const item of dbItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 5. Update Shop outstanding balance
      await tx.shop.update({
        where: { id: shopId },
        data: {
          currentDue: {
            increment: remainingDue
          }
        }
      });

      // 6. Log payment collection if paidAmount is provided
      if (payAmount > 0) {
        await tx.payment.create({
          data: {
            shopId,
            deliveryId: newDelivery.id,
            paidAmount: payAmount,
            paymentDate: deliveryDate ? new Date(deliveryDate) : new Date(),
            paymentMethod: req.body.paymentMethod || 'CASH',
            notes: `Auto-recorded on invoice ${deliveryNumber} creation`
          }
        });
      }

      return newDelivery;
    });

    res.status(201).json(delivery);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock') || error.message.includes('Paid amount')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const deleteDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // 1. Revert product stocks
      for (const item of delivery.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity
            }
          }
        });
      }

      // 2. Revert shop current due
      await tx.shop.update({
        where: { id: delivery.shopId },
        data: {
          currentDue: {
            decrement: delivery.remainingDue
          }
        }
      });

      // 3. Delete delivery (linked payments and items cascade/setNull)
      await tx.delivery.delete({ where: { id } });
    });

    res.json({ message: 'Delivery invoice deleted and inventory reverted successfully' });
  } catch (error) {
    if (error.message === 'Delivery not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
