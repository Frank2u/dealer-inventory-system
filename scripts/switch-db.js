import fs from 'fs';
import path from 'path';

const target = process.argv[2];

if (target !== 'sqlite' && target !== 'postgres') {
  console.error('Usage: node switch-db.js <sqlite|postgres>');
  process.exit(1);
}

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, 'server', 'prisma', 'schema.prisma');
const envPath = path.join(rootDir, 'server', '.env');
const envExamplePath = path.join(rootDir, 'server', '.env.example');

// Helper to make directory if not exist
const ensureDir = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

if (!fs.existsSync(schemaPath)) {
  console.log(`Schema file not found yet. Creating folders...`);
  ensureDir(schemaPath);
}

// 1. Modify schema.prisma
let schemaContent = '';
if (fs.existsSync(schemaPath)) {
  schemaContent = fs.readFileSync(schemaPath, 'utf8');
} else {
  // Fallback initial schema skeleton if it doesn't exist
  schemaContent = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;
}

if (target === 'sqlite') {
  schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('Swapped schema.prisma provider to sqlite');
} else {
  schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('Swapped schema.prisma provider to postgresql');
}
fs.writeFileSync(schemaPath, schemaContent, 'utf8');

// 2. Modify .env
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf8');
} else {
  envContent = 'DATABASE_URL=""\nJWT_SECRET="super-secret-key-12345"\nPORT=5000\nNODE_ENV="development"\n';
}

if (target === 'sqlite') {
  // Replace DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL\s*=\s*".*"/g, 'DATABASE_URL="file:./dev.db"');
    envContent = envContent.replace(/DATABASE_URL\s*=\s*[^"\n]+/g, 'DATABASE_URL="file:./dev.db"');
  } else {
    envContent += '\nDATABASE_URL="file:./dev.db"';
  }
  console.log('Updated server/.env DATABASE_URL to SQLite file:./dev.db');
} else {
  const pgUrl = 'postgresql://postgres:postgres@localhost:5432/dealer_inventory?schema=public';
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL\s*=\s*".*"/g, `DATABASE_URL="${pgUrl}"`);
    envContent = envContent.replace(/DATABASE_URL\s*=\s*[^"\n]+/g, `DATABASE_URL="${pgUrl}"`);
  } else {
    envContent += `\nDATABASE_URL="${pgUrl}"`;
  }
  console.log('Updated server/.env DATABASE_URL to PostgreSQL default URL');
}

ensureDir(envPath);
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Database switch completed successfully.');
