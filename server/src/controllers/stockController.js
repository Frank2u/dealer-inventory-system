import prisma from '../prisma.js';

export const getAllStockEntries = async (req, res, next) => {
  try {
    const entries = await prisma.stockEntry.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    next(error);
  }
};

export const createStockEntry = async (req, res, next) => {
  try {
    const { supplierName, invoiceNumber, productId, quantity, costPrice, date, notes } = req.body;

    if (!supplierName || !invoiceNumber || !productId || !quantity || !costPrice) {
      return res.status(400).json({ message: 'Missing required stock entry fields' });
    }

    const qty = parseInt(quantity);
    const price = parseFloat(costPrice);

    if (qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    // Run in Transaction to ensure stock updates match entries
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify product exists
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      // 2. Create StockEntry
      const entry = await tx.stockEntry.create({
        data: {
          supplierName,
          invoiceNumber,
          productId,
          quantity: qty,
          costPrice: price,
          date: date ? new Date(date) : new Date(),
          notes
        }
      });

      // 3. Update Product Stock and optionally Update Purchase Price
      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            increment: qty
          },
          purchasePrice: price // Update purchase price to reflect latest cost price
        }
      });

      return entry;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

export const deleteStockEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const entry = await tx.stockEntry.findUnique({ where: { id } });
      if (!entry) {
        throw new Error('Stock entry not found');
      }

      // Rollback stock
      const product = await tx.product.findUnique({ where: { id: entry.productId } });
      if (product) {
        // Prevent negative stock rollback
        const newStock = product.currentStock - entry.quantity;
        if (newStock < 0) {
          throw new Error('Cannot delete: resulting stock would go below zero');
        }

        await tx.product.update({
          where: { id: entry.productId },
          data: {
            currentStock: {
              decrement: entry.quantity
            }
          }
        });
      }

      await tx.stockEntry.delete({ where: { id } });
    });

    res.json({ message: 'Stock entry deleted and stock reverted successfully' });
  } catch (error) {
    if (error.message === 'Stock entry not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('resulting stock')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
