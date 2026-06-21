-- AlterTable
ALTER TABLE "StockEntry" ADD COLUMN "expiryDate" DATETIME;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "gstNumber" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "companyId" TEXT,
    "mrp" REAL NOT NULL DEFAULT 0.0,
    "discountPercent" TEXT NOT NULL DEFAULT '',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 5,
    "gstPercent" REAL NOT NULL DEFAULT 0.0,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "categoryId", "companyAddress", "companyGst", "companyName", "companyPhone", "createdAt", "currentStock", "discountPercent", "expiryDate", "gstPercent", "id", "lotSize", "minStockAlert", "mrp", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt") SELECT "brand", "categoryId", "companyAddress", "companyGst", "companyName", "companyPhone", "createdAt", "currentStock", "discountPercent", "expiryDate", "gstPercent", "id", "lotSize", "minStockAlert", "mrp", "name", "purchasePrice", "sellingPrice", "sku", "unitType", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE TABLE "new_Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopCode" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "gstNumber" TEXT,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "currentDue" REAL NOT NULL DEFAULT 0,
    "password" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Shop" ("address", "alternatePhone", "area", "createdAt", "creditLimit", "currentDue", "gstNumber", "id", "name", "notes", "ownerName", "phone", "shopCode", "updatedAt") SELECT "address", "alternatePhone", "area", "createdAt", "creditLimit", "currentDue", "gstNumber", "id", "name", "notes", "ownerName", "phone", "shopCode", "updatedAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
