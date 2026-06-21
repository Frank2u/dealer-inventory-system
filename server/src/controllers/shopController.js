import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';

export const getAllShops = async (req, res, next) => {
  try {
    const { search, hasDue, sortBy } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ownerName: { contains: search } },
        { phone: { contains: search } },
        { area: { contains: search } },
        { shopCode: { contains: search } }
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
      include: {
        deliveries: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy
    });

    const shopsWithProfit = shops.map(s => {
      let totalProfit = 0;
      s.deliveries.forEach(d => {
        d.items.forEach(item => {
          if (item.product) {
            totalProfit += item.totalAmount - (item.product.purchasePrice * item.quantity);
          }
        });
      });
      
      const { deliveries, ...shopData } = s;
      return {
        ...shopData,
        profit: totalProfit
      };
    });

    res.json(shopsWithProfit);
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
    const { name, ownerName, phone, alternatePhone, address, area, gstNumber, creditLimit, notes, password } = req.body;

    if (!name || !ownerName || !phone || !address || !area) {
      return res.status(400).json({ message: 'Name, Owner Name, Phone, Address and Area are required' });
    }

    // Hash the password (defaults to phone number if not provided)
    const defaultPassword = password ? password.trim() : (phone ? phone.trim() : '123456');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Lookup area code prefix
    const areaMap = await prisma.areaMapping.findFirst({
      where: { areaName: { equals: area } }
    });
    const prefix = areaMap ? areaMap.codePrefix : 'SHP';

    // Get the last shop created with this prefix to determine sequence
    const lastShop = await prisma.shop.findFirst({
      where: {
        shopCode: {
          startsWith: `${prefix}-`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let nextNum = 1;
    if (lastShop && lastShop.shopCode) {
      const parts = lastShop.shopCode.split('-');
      if (parts.length > 1) {
        const seq = parseInt(parts[1]);
        if (!isNaN(seq)) {
          nextNum = seq + 1;
        }
      }
    }
    const shopCode = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    const shop = await prisma.shop.create({
      data: {
        shopCode,
        name,
        ownerName,
        phone,
        alternatePhone,
        address,
        area,
        gstNumber,
        creditLimit: parseFloat(creditLimit) || 0,
        notes,
        currentDue: 0,
        password: hashedPassword
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
    const { name, ownerName, phone, alternatePhone, address, area, gstNumber, creditLimit, notes, password } = req.body;

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    let hashedPassword = undefined;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password.trim(), salt);
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
        notes,
        password: hashedPassword
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
