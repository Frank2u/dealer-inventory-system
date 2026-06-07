-- CreateTable
CREATE TABLE "AreaMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaName" TEXT NOT NULL,
    "codePrefix" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Shop" ("address", "alternatePhone", "area", "createdAt", "creditLimit", "currentDue", "gstNumber", "id", "name", "notes", "ownerName", "phone", "updatedAt") SELECT "address", "alternatePhone", "area", "createdAt", "creditLimit", "currentDue", "gstNumber", "id", "name", "notes", "ownerName", "phone", "updatedAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AreaMapping_areaName_key" ON "AreaMapping"("areaName");

-- CreateIndex
CREATE UNIQUE INDEX "AreaMapping_codePrefix_key" ON "AreaMapping"("codePrefix");
