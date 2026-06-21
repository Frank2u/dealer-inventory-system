import prisma from '../prisma.js';

export const getCompanies = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { gstNumber: { contains: search } }
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        products: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(companies);
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const { name, address, phone, gstNumber } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Company with this name already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        address: address || '',
        phone: phone || '',
        gstNumber: gstNumber || ''
      }
    });

    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, gstNumber } = req.body;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (name && name !== company.name) {
      const existing = await prisma.company.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: 'Company with this name already exists' });
      }
    }

    const updated = await prisma.company.update({
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

export const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.products.length > 0) {
      return res.status(400).json({
        message: `Cannot delete company. It has ${company.products.length} active products associated with it.`
      });
    }

    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};
