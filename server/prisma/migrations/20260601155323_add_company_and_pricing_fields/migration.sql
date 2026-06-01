-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "categoryId", "createdAt", "currentStock", "expiryDate", "id", "lotSize", "minStockAlert", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt") SELECT "brand", "categoryId", "createdAt", "currentStock", "expiryDate", "id", "lotSize", "minStockAlert", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
