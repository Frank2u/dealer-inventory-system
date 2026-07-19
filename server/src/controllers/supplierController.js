import prisma from '../prisma.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { gstNumber: { contains: search } }
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        products: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, address, phone, gstNumber } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const existing = await prisma.supplier.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Supplier with this name already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        address: address || '',
        phone: phone || '',
        gstNumber: gstNumber || ''
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, gstNumber } = req.body;

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (name && name !== supplier.name) {
      const existing = await prisma.supplier.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: 'Supplier with this name already exists' });
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        gstNumber: gstNumber !== undefined ? gstNumber : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (supplier.products.length > 0) {
      return res.status(400).json({
        message: `Cannot delete supplier. It has ${supplier.products.length} active products associated with it.`
      });
    }

    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};
