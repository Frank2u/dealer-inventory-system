import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_PATH = path.join(__dirname, 'migration_backup.json');

const prisma = new PrismaClient();

async function runBackup() {
  console.log('--- BACKUP PHASE ---');
  
  const companies = await prisma.company.findMany();
  const products = await prisma.product.findMany({
    select: { id: true, companyId: true }
  });
  const stockEntries = await prisma.stockEntry.findMany({
    select: { id: true, supplierName: true }
  });
  
  const backupData = {
    companies,
    products,
    stockEntries
  };
  
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupData, null, 2));
  console.log(`Successfully backed up data to ${BACKUP_PATH}`);
  console.log(`- Companies: ${companies.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- StockEntries: ${stockEntries.length}`);
}

async function runRestore() {
  console.log('--- RESTORE PHASE ---');
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`Backup file not found at ${BACKUP_PATH}`);
    process.exit(1);
  }
  
  const backupData = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  
  // 1. Restore Suppliers
  console.log('Restoring suppliers...');
  for (const comp of backupData.companies) {
    console.log(`Creating supplier: ${comp.name}`);
    await prisma.supplier.upsert({
      where: { id: comp.id },
      update: {
        name: comp.name,
        address: comp.address,
        phone: comp.phone,
        gstNumber: comp.gstNumber
      },
      create: {
        id: comp.id,
        name: comp.name,
        address: comp.address,
        phone: comp.phone,
        gstNumber: comp.gstNumber
      }
    });
  }
  
  // 2. Link Products to Suppliers (many-to-many)
  console.log('Linking products to suppliers...');
  for (const prod of backupData.products) {
    if (prod.companyId) {
      console.log(`Linking product ${prod.id} to supplier ${prod.companyId}`);
      try {
        await prisma.product.update({
          where: { id: prod.id },
          data: {
            suppliers: {
              connect: { id: prod.companyId }
            }
          }
        });
      } catch (err) {
        console.warn(`Could not link product ${prod.id} to supplier ${prod.companyId}:`, err.message);
      }
    }
  }
  
  // 3. Link StockEntries to Suppliers
  console.log('Linking stock entries to suppliers...');
  for (const entry of backupData.stockEntries) {
    const name = entry.supplierName || 'Unknown Supplier';
    console.log(`Mapping stock entry ${entry.id} (Supplier: ${name})`);
    
    let supplier = await prisma.supplier.findFirst({
      where: { name: { equals: name } }
    });
    
    if (!supplier) {
      console.log(`  Supplier "${name}" not found. Creating on the fly...`);
      supplier = await prisma.supplier.create({
        data: {
          name,
          address: 'Auto-migrated during Supplier refactoring',
          phone: '0000000000'
        }
      });
    }
    
    await prisma.stockEntry.update({
      where: { id: entry.id },
      data: {
        supplierId: supplier.id
      }
    });
  }
  
  console.log('Migration restore phase complete.');
}

const mode = process.argv[2];
if (mode === 'backup') {
  runBackup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else if (mode === 'restore') {
  runRestore()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else {
  console.error('Please specify a mode: "backup" or "restore"');
  process.exit(1);
}
