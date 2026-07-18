import 'dotenv/config';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { defineConfig } from '@prisma/config';

// 1. Connection string for CLI operations (Migrations / Push)
const directConnectionString = "postgresql://neondb_owner:npg_92XdvgOhaicm@ep-mute-bird-ahh4qdkj-pooler.c-3.us-east-1.aws.neon.tech/prisma_migrate_shadow_db_a483c39c-017b-41a6-9d3a-f3ba38853965?sslmode=require&channel_binding=require";

// 2. Connection string for regular application runtime queries
const pooledConnectionString = "postgresql://neondb_owner:npg_92XdvgOhaicm@ep-mute-bird-ahh4qdkj-pooler.c-3.us-east-1.aws.neon.tech/prisma_migrate_shadow_db_a483c39c-017b-41a6-9d3a-f3ba38853965?sslmode=require&channel_binding=require";

// --- CLI ENGINE CONFIGURATION ---
export default defineConfig({
  schema: '../schema.prisma',
  migrations: {
    path: '../migrations',
  },
  datasource: {
    url: directConnectionString,
  },
});

// --- RUNTIME CLIENT CONFIGURATION (DRIVER ADAPTER) ---
const pool = new pg.Pool({ connectionString: pooledConnectionString });
const adapter = new PrismaPg(pool);

// Export this instance to use throughout your backend application logic
export const prisma = new PrismaClient({ adapter });
