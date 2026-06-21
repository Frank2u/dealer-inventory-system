import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'super-secret-key-12345',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'customer') {
      const shop = await prisma.shop.findUnique({
        where: { id: req.user.id }
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop customer not found' });
      }

      return res.json({
        id: shop.id,
        username: shop.shopCode,
        name: shop.name,
        role: 'customer'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

export const customerLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username/phone and password are required' });
    }

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [
          { username: username },
          { shopCode: username },
          { phone: username }
        ]
      }
    });

    if (!shop) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, shop.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: shop.id, username: shop.shopCode, role: 'customer', name: shop.name },
      process.env.JWT_SECRET || 'super-secret-key-12345',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: shop.id,
        username: shop.shopCode,
        name: shop.name,
        role: 'customer'
      }
    });
  } catch (error) {
    next(error);
  }
};
