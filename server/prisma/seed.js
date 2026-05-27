import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.payment.deleteMany({});
  await prisma.deliveryItem.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.stockEntry.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing data.');

  // 2. Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Beverages' } }),
    prisma.category.create({ data: { name: 'Snacks' } }),
    prisma.category.create({ data: { name: 'Dairy & Eggs' } }),
    prisma.category.create({ data: { name: 'Households' } }),
  ]);
  console.log(`Created ${categories.length} categories.`);

  // 4. Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Coca Cola 250ml',
        sku: 'BEV-CC-250',
        brand: 'Coca Cola Co.',
        categoryId: categories[0].id,
        lotSize: 24,
        unitType: 'case',
        purchasePrice: 280.0,
        sellingPrice: 360.0,
        currentStock: 50,
        minStockAlert: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Potato Chips Salted 50g',
        sku: 'SNA-PC-050',
        brand: 'Lays',
        categoryId: categories[1].id,
        lotSize: 30,
        unitType: 'box',
        purchasePrice: 450.0,
        sellingPrice: 540.0,
        currentStock: 30,
        minStockAlert: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Whole Milk 1L',
        sku: 'DAI-FM-100',
        brand: 'Amul',
        categoryId: categories[2].id,
        lotSize: 12,
        unitType: 'crate',
        purchasePrice: 660.0,
        sellingPrice: 720.0,
        currentStock: 15,
        minStockAlert: 8,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Dishwashing Liquid 500ml',
        sku: 'HOU-DL-500',
        brand: 'Pril',
        categoryId: categories[3].id,
        lotSize: 10,
        unitType: 'box',
        purchasePrice: 850.0,
        sellingPrice: 950.0,
        currentStock: 8,
        minStockAlert: 3,
      },
    }),
  ]);
  console.log(`Created ${products.length} products.`);

  // 5. Create Shops
  const shops = await Promise.all([
    prisma.shop.create({
      data: {
        name: 'Super Mart Grocery',
        ownerName: 'John Doe',
        phone: '9876543210',
        alternatePhone: '9876543211',
        address: '123 Main Street, Sector 4',
        area: 'Downtown',
        gstNumber: '29ABCDE1234F1Z5',
        creditLimit: 50000.0,
        notes: 'Premium retail customer, delivers daily in the morning.',
        currentDue: 0.0,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Kwik Stop Express',
        ownerName: 'Jane Smith',
        phone: '8765432109',
        address: '456 Galleria Mall, High Street',
        area: 'High Street',
        gstNumber: '29GHIJK5678L2Z9',
        creditLimit: 30000.0,
        notes: 'Prefers digital payments. Check for expiry dates on dairy products.',
        currentDue: 0.0,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Corner Store & Café',
        ownerName: 'Robert Johnson',
        phone: '7654321098',
        address: '789 Residential Avenue, Phase 2',
        area: 'North Side',
        creditLimit: 15000.0,
        notes: 'Small shop. Cash deliveries only.',
        currentDue: 0.0,
      },
    }),
  ]);
  console.log(`Created ${shops.length} shops.`);

  // 6. Create some sample StockEntries (Incoming)
  await prisma.stockEntry.create({
    data: {
      supplierName: 'Coca Cola Bottlers Ltd.',
      invoiceNumber: 'INV-CC-9901',
      productId: products[0].id,
      quantity: 50,
      costPrice: 280.0,
      notes: 'Initial stock intake from factory distributor.',
    },
  });

  await prisma.stockEntry.create({
    data: {
      supplierName: 'Pepsico India',
      invoiceNumber: 'INV-LAY-4411',
      productId: products[1].id,
      quantity: 30,
      costPrice: 450.0,
      notes: 'Intake for Lay Potato Chips.',
    },
  });

  console.log('Seeded sample stock entries.');
  console.log('Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
