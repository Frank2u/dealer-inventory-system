import prisma from '../prisma.js';

export const getAllShops = async (req, res, next) => {
  try {
    const { search, hasDue, sortBy } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ownerName: { contains: search } },
        { phone: { contains: search } },
        { area: { contains: search } }
      ];
    }

    if (hasDue === 'true') {
      where.currentDue = { gt: 0 };
    }

    let orderBy = { name: 'asc' };
    if (sortBy === 'due_desc') {
      orderBy = { currentDue: 'desc' };
    } else if (sortBy === 'due_asc') {
      orderBy = { currentDue: 'asc' };
    }

    const shops = await prisma.shop.findMany({
      where,
      orderBy
    });

    res.json(shops);
  } catch (error) {
    next(error);
  }
};

export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    next(error);
  }
};

export const createShop = async (req, res, next) => {
  try {
    const { name, ownerName, phone, alternatePhone, address, area, gstNumber, creditLimit, notes } = req.body;

    if (!name || !ownerName || !phone || !address || !area) {
      return res.status(400).json({ message: 'Name, Owner Name, Phone, Address and Area are required' });
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        ownerName,
        phone,
        alternatePhone,
        address,
        area,
        gstNumber,
        creditLimit: parseFloat(creditLimit) || 0,
        notes,
        currentDue: 0
      }
    });

    res.status(201).json(shop);
  } catch (error) {
    next(error);
  }
};

export const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, ownerName, phone, alternatePhone, address, area, gstNumber, creditLimit, notes } = req.body;

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        ownerName,
        phone,
        alternatePhone,
        address,
        area,
        gstNumber,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
        notes
      }
    });

    res.json(updatedShop);
  } catch (error) {
    next(error);
  }
};

export const deleteShop = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await prisma.shop.delete({
      where: { id }
    });

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getShopHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const deliveries = await prisma.delivery.findMany({
      where: { shopId: id },
      orderBy: { deliveryDate: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const payments = await prisma.payment.findMany({
      where: { shopId: id },
      orderBy: { paymentDate: 'desc' },
      include: {
        delivery: true
      }
    });

    res.json({ deliveries, payments });
  } catch (error) {
    next(error);
  }
};
