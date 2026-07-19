import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting lot reconciliation...');
  
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    console.log(`Reconciling product: ${product.name} (SKU: ${product.sku}, Current Stock: ${product.currentStock})`);
    
    // Fetch all stock entries for this product
    const entries = await prisma.stockEntry.findMany({
      where: { productId: product.id },
      orderBy: { date: 'desc' } // Newest entries first
    });
    
    let remainingToAllocate = product.currentStock;
    
    if (entries.length === 0 && product.currentStock > 0) {
      // Self-healing: create a system initialization entry
      console.log(`  No stock entries found. Creating a virtual initialization entry for ${product.currentStock} units.`);
      await prisma.stockEntry.create({
        data: {
          supplierName: 'System Initialization',
          invoiceNumber: 'INIT-LOT',
          productId: product.id,
          quantity: product.currentStock,
          remainingStock: product.currentStock,
          costPrice: product.purchasePrice,
          date: new Date(),
          notes: 'Auto-created during lot reconciliation'
        }
      });
      continue;
    }
    
    // Allocate currentStock to entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      let remainingStock = 0;
      
      if (i === 0) {
        // The newest entry gets any overflow if currentStock > sum(entries.quantity)
        const othersQuantitySum = entries.slice(1).reduce((sum, e) => sum + e.quantity, 0);
        const expectedNewestQty = Math.max(0, product.currentStock - othersQuantitySum);
        remainingStock = Math.min(remainingToAllocate, Math.max(entry.quantity, expectedNewestQty));
      } else {
        remainingStock = Math.min(entry.quantity, remainingToAllocate);
      }
      
      remainingToAllocate -= remainingStock;
      
      console.log(`  Setting StockEntry ${entry.id} (Date: ${entry.date.toISOString().split('T')[0]}, Invoice: ${entry.invoiceNumber}) remainingStock = ${remainingStock} / ${entry.quantity}`);
      
      await prisma.stockEntry.update({
        where: { id: entry.id },
        data: { remainingStock }
      });
    }
    
    // If we still have stock left over (unexpected), add it to the newest entry
    if (remainingToAllocate > 0 && entries.length > 0) {
      const newestEntry = entries[0];
      console.log(`  Allocating leftover overflow of ${remainingToAllocate} units to newest entry ${newestEntry.id}`);
      await prisma.stockEntry.update({
        where: { id: newestEntry.id },
        data: {
          remainingStock: {
            increment: remainingToAllocate
          }
        }
      });
    }
  }
  
  console.log('Lot reconciliation complete.');
}

main()
  .catch((e) => {
    console.error('Error during lot reconciliation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
