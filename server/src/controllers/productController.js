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
        deliveryItems: true
      },
      orderBy: { name: 'asc' }
    });

    const productsWithProfit = products.map(p => {
      const totalProfit = p.deliveryItems.reduce((sum, item) => {
        const profit = item.totalAmount - (p.purchasePrice * item.quantity);
        return sum + profit;
      }, 0);
      
      const { deliveryItems, ...prodData } = p;
      return {
        ...prodData,
        profit: totalProfit
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
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, brand, categoryId, lotSize, unitType, purchasePrice, sellingPrice, currentStock, minStockAlert, expiryDate, companyName, companyAddress, companyPhone, companyGst, mrp, discountPercent, gstPercent } = req.body;

    if (!name || !sku || !brand || !categoryId || !purchasePrice || !sellingPrice) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    // SKU Unique check
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
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
        companyName: companyName || '',
        companyAddress: companyAddress || '',
        companyPhone: companyPhone || '',
        companyGst: companyGst || '',
        mrp: parseFloat(mrp) || 0.0,
        discountPercent: discountPercent || '',
        gstPercent: parseFloat(gstPercent) || 0.0,
        currentStock: parseInt(currentStock) || 0,
        minStockAlert: parseInt(minStockAlert) || 5,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        category: true
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
    const { name, sku, brand, categoryId, lotSize, unitType, purchasePrice, sellingPrice, currentStock, minStockAlert, expiryDate, companyName, companyAddress, companyPhone, companyGst, mrp, discountPercent, gstPercent } = req.body;

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
        companyName,
        companyAddress,
        companyPhone,
        companyGst,
        mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
        discountPercent,
        gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : undefined,
        currentStock: currentStock !== undefined ? parseInt(currentStock) : undefined,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined
      },
      include: {
        category: true
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
