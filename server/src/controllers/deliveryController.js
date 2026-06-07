import prisma from '../prisma.js';

export const getAllDeliveries = async (req, res, next) => {
  try {
    const { shopId, paymentStatus, status, date } = req.query;

    const where = {};
    if (shopId) where.shopId = shopId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (status) where.status = status;

    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const targetDate = new Date(year, month, day, 0, 0, 0, 0);
        const nextDay = new Date(year, month, day + 1, 0, 0, 0, 0);
        where.deliveryDate = {
          gte: targetDate,
          lt: nextDay
        };
      }
    }

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
    const { shopId, deliveryDate, paidAmount, items, status } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Shop and list of items are required' });
    }

    const payAmount = parseFloat(paidAmount) || 0;
    const deliveryStatus = status || 'ordered';

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

        // Check stock availability (Only if status is "delivered")
        if (deliveryStatus === 'delivered' && product.currentStock < qty) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${qty}`);
        }

        const price = item.price !== undefined ? parseFloat(item.price) : product.sellingPrice;
        const itemTotal = price * qty;
        totalAmount += itemTotal;

        const gstPercent = product.gstPercent || 0;
        const gstAmount = parseFloat((itemTotal * (gstPercent / (100 + gstPercent))).toFixed(2));

        dbItems.push({
          productId: product.id,
          quantity: qty,
          lotSize: product.lotSize,
          price: price,
          totalAmount: itemTotal,
          gstPercent: gstPercent,
          gstAmount: gstAmount
        });
      }

      // Calculate GST sums
      const totalGst = parseFloat(dbItems.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2));
      const hasGstNumber = !!(shop.gstNumber && shop.gstNumber.trim());
      const gstPaidByShop = hasGstNumber ? totalGst : 0;
      const gstPaidByMe = hasGstNumber ? 0 : totalGst;

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
          status: deliveryStatus,
          totalGst,
          gstPaidByShop,
          gstPaidByMe,
          items: {
            create: dbItems
          }
        },
        include: {
          items: true
        }
      });

      // 4. Update Product Stock levels (ONLY IF DELIVERED)
      if (deliveryStatus === 'delivered') {
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
      }

      // 5. Update Shop outstanding balance (ONLY IF DELIVERED)
      if (deliveryStatus === 'delivered') {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            currentDue: {
              increment: remainingDue
            }
          }
        });
      }

      // 6. Log payment collection if paidAmount is provided (ONLY IF DELIVERED)
      if (deliveryStatus === 'delivered' && payAmount > 0) {
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

      // 1. Revert product stocks (ONLY IF DELIVERED)
      if (delivery.status === 'delivered') {
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
      }

      // 2. Revert shop current due (ONLY IF DELIVERED)
      if (delivery.status === 'delivered') {
        await tx.shop.update({
          where: { id: delivery.shopId },
          data: {
            currentDue: {
              decrement: delivery.remainingDue
            }
          }
        });
      }

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

export const dispatchDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, paidAmount, paymentMethod, deliveryDate } = req.body;

    const delivery = await prisma.$transaction(async (tx) => {
      // 1. Fetch delivery with items
      const d = await tx.delivery.findUnique({
        where: { id },
        include: {
          shop: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!d) {
        throw new Error('Delivery not found');
      }

      if (d.status === 'delivered') {
        throw new Error('Delivery invoice has already been dispatched');
      }

      // 2. Determine items, prices and quantities (either updated or original)
      const dispatchItems = [];
      let totalAmount = 0;

      if (items && Array.isArray(items) && items.length > 0) {
        // Use updated items from request body
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

          const price = item.price !== undefined ? parseFloat(item.price) : product.sellingPrice;
          const itemTotal = price * qty;
          totalAmount += itemTotal;

          const gstPercent = product.gstPercent || 0;
          const gstAmount = parseFloat((itemTotal * (gstPercent / (100 + gstPercent))).toFixed(2));

          dispatchItems.push({
            productId: product.id,
            quantity: qty,
            lotSize: product.lotSize,
            price: price,
            totalAmount: itemTotal,
            gstPercent,
            gstAmount
          });
        }
      } else {
        // Use original items from the database
        for (const item of d.items) {
          // Check stock availability
          if (item.product.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}. Available: ${item.product.currentStock}, Requested: ${item.quantity}`);
          }
          totalAmount += item.totalAmount;

          const gstPercent = item.gstPercent || item.product.gstPercent || 0;
          const gstAmount = parseFloat((item.totalAmount * (gstPercent / (100 + gstPercent))).toFixed(2));

          dispatchItems.push({
            productId: item.productId,
            quantity: item.quantity,
            lotSize: item.lotSize,
            price: item.price,
            totalAmount: item.totalAmount,
            gstPercent,
            gstAmount
          });
        }
      }

      // Calculate GST sums
      const totalGst = parseFloat(dispatchItems.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2));
      const hasGstNumber = !!(d.shop.gstNumber && d.shop.gstNumber.trim());
      const gstPaidByShop = hasGstNumber ? totalGst : 0;
      const gstPaidByMe = hasGstNumber ? 0 : totalGst;

      const payAmount = paidAmount !== undefined ? parseFloat(paidAmount) : d.paidAmount;
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

      // 3. Update Product Stock levels
      for (const item of dispatchItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 4. Update Shop outstanding balance
      await tx.shop.update({
        where: { id: d.shopId },
        data: {
          currentDue: {
            increment: remainingDue
          }
        }
      });

      // 5. Log payment collection if paidAmount is provided
      if (payAmount > 0) {
        await tx.payment.create({
          data: {
            shopId: d.shopId,
            deliveryId: d.id,
            paidAmount: payAmount,
            paymentDate: deliveryDate ? new Date(deliveryDate) : new Date(),
            paymentMethod: paymentMethod || 'CASH',
            notes: `Auto-recorded on dispatch of invoice ${d.deliveryNumber}`
          }
        });
      }

      // 6. Delete old items and create updated ones (if updated items were sent)
      if (items && Array.isArray(items) && items.length > 0) {
        await tx.deliveryItem.deleteMany({
          where: { deliveryId: id }
        });
        
        // Use createMany to insert items in bulk
        await tx.deliveryItem.createMany({
          data: dispatchItems.map(item => ({
            deliveryId: id,
            productId: item.productId,
            quantity: item.quantity,
            lotSize: item.lotSize,
            price: item.price,
            totalAmount: item.totalAmount,
            gstPercent: item.gstPercent,
            gstAmount: item.gstAmount
          }))
        });
      } else {
        // Even if updated items were not sent in request, we need to populate/update gstPercent and gstAmount on the original deliveryItems.
        for (const item of dispatchItems) {
          const matchedItem = d.items.find(di => di.productId === item.productId);
          if (matchedItem) {
            await tx.deliveryItem.update({
              where: { id: matchedItem.id },
              data: {
                gstPercent: item.gstPercent,
                gstAmount: item.gstAmount
              }
            });
          }
        }
      }

      // 7. Update status to delivered and total values
      const updatedDelivery = await tx.delivery.update({
        where: { id },
        data: {
          status: 'delivered',
          deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
          totalAmount,
          paidAmount: payAmount,
          remainingDue,
          paymentStatus,
          totalGst,
          gstPaidByShop,
          gstPaidByMe
        },
        include: {
          shop: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return updatedDelivery;
    });

    res.json(delivery);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock') || error.message.includes('already') || error.message.includes('exceed')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
