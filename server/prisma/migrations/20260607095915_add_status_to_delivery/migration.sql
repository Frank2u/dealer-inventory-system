-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryNumber" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "deliveryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "remainingDue" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "status" TEXT NOT NULL DEFAULT 'ordered',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("createdAt", "deliveryDate", "deliveryNumber", "id", "paidAmount", "paymentStatus", "remainingDue", "shopId", "totalAmount", "updatedAt") SELECT "createdAt", "deliveryDate", "deliveryNumber", "id", "paidAmount", "paymentStatus", "remainingDue", "shopId", "totalAmount", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
CREATE UNIQUE INDEX "Delivery_deliveryNumber_key" ON "Delivery"("deliveryNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
