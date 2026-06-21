import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration for companies and passwords...');

  // 1. Migrate Products to Companies
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to check.`);

  for (const product of products) {
    const rawName = product.companyName ? product.companyName.trim() : '';
    if (!rawName) {
      continue;
    }

    // Check if company already exists
    let company = await prisma.company.findUnique({
      where: { name: rawName }
    });

    if (!company) {
      console.log(`Creating company: ${rawName}`);
      company = await prisma.company.create({
        data: {
          name: rawName,
          address: product.companyAddress || '',
          phone: product.companyPhone || '',
          gstNumber: product.companyGst || ''
        }
      });
    }

    // Update product
    await prisma.product.update({
      where: { id: product.id },
      data: {
        companyId: company.id
      }
    });
    console.log(`Associated product "${product.name}" with company "${rawName}"`);
  }

  // 2. Migrate Shops (set default username and password)
  const shops = await prisma.shop.findMany();
  console.log(`Found ${shops.length} shops to check.`);

  for (const shop of shops) {
    const defaultPassword = shop.phone ? shop.phone.trim() : '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const targetUsername = shop.username || (shop.shopCode ? shop.shopCode.trim().toLowerCase() : '') || shop.phone || '';

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        username: targetUsername,
        password: shop.password || hashedPassword
      }
    });
    console.log(`Updated shop "${shop.name}": username = "${targetUsername}"`);
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
