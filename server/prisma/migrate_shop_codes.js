import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating shop codes and area mappings...');

  // 1. Create default area mappings if they do not exist
  const defaultAreas = [
    { areaName: 'Downtown', codePrefix: 'DT' },
    { areaName: 'High Street', codePrefix: 'HS' },
    { areaName: 'North Side', codePrefix: 'NS' },
    { areaName: 'Singallur', codePrefix: 'SN' }
  ];

  for (const area of defaultAreas) {
    const existing = await prisma.areaMapping.findUnique({
      where: { areaName: area.areaName }
    });
    if (!existing) {
      await prisma.areaMapping.create({
        data: area
      });
      console.log(`Created area mapping: ${area.areaName} -> ${area.codePrefix}`);
    }
  }

  // 2. Fetch all shops
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Keep track of sequence count per prefix
  const counts = {};

  for (const shop of shops) {
    if (!shop.shopCode) {
      // Find corresponding area prefix (case-insensitive)
      const areaMap = await prisma.areaMapping.findFirst({
        where: {
          areaName: {
            equals: shop.area
          }
        }
      });

      const prefix = areaMap ? areaMap.codePrefix : 'SHP';
      if (!counts[prefix]) {
        counts[prefix] = 1;
      } else {
        counts[prefix]++;
      }

      const code = `${prefix}-${String(counts[prefix]).padStart(4, '0')}`;
      await prisma.shop.update({
        where: { id: shop.id },
        data: { shopCode: code }
      });
      console.log(`Assigned code ${code} to shop "${shop.name}" in area "${shop.area}"`);
    } else {
      // If shop already has a code, parse it to update the count sequence
      const parts = shop.shopCode.split('-');
      if (parts.length > 1) {
        const prefix = parts[0];
        const num = parseInt(parts[1]);
        if (!isNaN(num)) {
          counts[prefix] = Math.max(counts[prefix] || 0, num);
        }
      }
    }
  }

  console.log('Database backfill migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
