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
    "totalGst" REAL NOT NULL DEFAULT 0,
    "gstPaidByShop" REAL NOT NULL DEFAULT 0,
    "gstPaidByMe" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("createdAt", "deliveryDate", "deliveryNumber", "id", "paidAmount", "paymentStatus", "remainingDue", "shopId", "status", "totalAmount", "updatedAt") SELECT "createdAt", "deliveryDate", "deliveryNumber", "id", "paidAmount", "paymentStatus", "remainingDue", "shopId", "status", "totalAmount", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
CREATE UNIQUE INDEX "Delivery_deliveryNumber_key" ON "Delivery"("deliveryNumber");
CREATE TABLE "new_DeliveryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lotSize" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "gstPercent" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryItem" ("createdAt", "deliveryId", "id", "lotSize", "price", "productId", "quantity", "totalAmount", "updatedAt") SELECT "createdAt", "deliveryId", "id", "lotSize", "price", "productId", "quantity", "totalAmount", "updatedAt" FROM "DeliveryItem";
DROP TABLE "DeliveryItem";
ALTER TABLE "new_DeliveryItem" RENAME TO "DeliveryItem";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "lotSize" INTEGER NOT NULL DEFAULT 1,
    "unitType" TEXT NOT NULL DEFAULT 'pcs',
    "purchasePrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyGst" TEXT NOT NULL DEFAULT '',
    "mrp" REAL NOT NULL DEFAULT 0.0,
    "discountPercent" TEXT NOT NULL DEFAULT '',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 5,
    "gstPercent" REAL NOT NULL DEFAULT 0.0,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "categoryId", "companyAddress", "companyGst", "companyName", "companyPhone", "createdAt", "currentStock", "discountPercent", "expiryDate", "id", "lotSize", "minStockAlert", "mrp", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt") SELECT "brand", "categoryId", "companyAddress", "companyGst", "companyName", "companyPhone", "createdAt", "currentStock", "discountPercent", "expiryDate", "id", "lotSize", "minStockAlert", "mrp", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
