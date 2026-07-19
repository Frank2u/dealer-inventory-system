import prisma from '../prisma.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { search, categoryId, lowStock } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        deliveryItems: true,
        supplier: true,
        stockEntries: {
          where: {
            remainingStock: { gt: 0 }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const productsWithProfit = products.map(p => {
      const totalProfit = p.deliveryItems.reduce((sum, item) => {
        const profit = item.totalAmount - (p.purchasePrice * item.quantity);
        return sum + profit;
      }, 0);
      
      const lots = (p.stockEntries || []).sort((a, b) => {
        if (a.expiryDate && b.expiryDate) {
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        }
        if (a.expiryDate && !b.expiryDate) return -1;
        if (!a.expiryDate && b.expiryDate) return 1;
        return new Date(a.date) - new Date(b.date);
      });

      const { deliveryItems, stockEntries, ...prodData } = p;
      return {
        ...prodData,
        profit: totalProfit,
        lots
      };
    });

    // Client-side / server-side filter for low stock
    if (lowStock === 'true') {
      const filtered = productsWithProfit.filter(p => p.currentStock <= p.minStockAlert);
      return res.json(filtered);
    }

    res.json(productsWithProfit);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        stockEntries: {
          where: {
            remainingStock: { gt: 0 }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const lots = (product.stockEntries || []).sort((a, b) => {
      if (a.expiryDate && b.expiryDate) {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (a.expiryDate && !b.expiryDate) return -1;
      if (!a.expiryDate && b.expiryDate) return 1;
      return new Date(a.date) - new Date(b.date);
    });

    const { stockEntries, ...prodData } = product;

    res.json({
      ...prodData,
      lots
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, brand, categoryId, lotSize, unitType, purchasePrice, sellingPrice, currentStock, minStockAlert, expiryDate, supplierId, mrp, discountPercent, gstPercent } = req.body;

    if (!name || !sku || !brand || !categoryId || !purchasePrice || !sellingPrice || !supplierId) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    // SKU Unique check
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }

    // Supplier+Name uniqueness validation
    const existingProduct = await prisma.product.findUnique({
      where: {
        supplierId_name: {
          supplierId,
          name
        }
      }
    });
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name is already registered for this supplier' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        brand,
        categoryId,
        lotSize: parseInt(lotSize) || 1,
        unitType: unitType || 'pcs',
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        supplierId,
        mrp: parseFloat(mrp) || 0.0,
        discountPercent: discountPercent || '',
        gstPercent: parseFloat(gstPercent) || 0.0,
        currentStock: parseInt(currentStock) || 0,
        minStockAlert: parseInt(minStockAlert) || 5,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        category: true,
        supplier: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, brand, categoryId, lotSize, unitType, purchasePrice, sellingPrice, currentStock, minStockAlert, expiryDate, supplierId, mrp, discountPercent, gstPercent } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return res.status(400).json({ message: 'A product with this SKU already exists' });
      }
    }

    // Supplier+Name uniqueness validation
    if ((name && name !== product.name) || (supplierId && supplierId !== product.supplierId)) {
      const targetName = name || product.name;
      const targetSupplierId = supplierId || product.supplierId;
      const duplicate = await prisma.product.findUnique({
        where: {
          supplierId_name: {
            supplierId: targetSupplierId,
            name: targetName
          }
        }
      });
      if (duplicate && duplicate.id !== id) {
        return res.status(400).json({ message: 'A product with this name is already registered for this supplier' });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        brand,
        categoryId,
        lotSize: lotSize !== undefined ? parseInt(lotSize) : undefined,
        unitType,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        supplierId: supplierId !== undefined ? (supplierId || undefined) : undefined,
        mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
        discountPercent,
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : undefined,
        currentStock: currentStock !== undefined ? parseInt(currentStock) : undefined,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined
      },
      include: {
        category: true,
        supplier: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Category Controllers
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};
