import 'dotenv/config';
import { defineConfig } from '@prisma/config';

// 1. Added explicit sslmode, connection timeout, and pooled/route fallback bypass
const directConnectionString = "postgresql://neondb_owner:npg_92XdvgOhaicm@ep-mute-bird-ahh4qdkj-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  schema: '../schema.prisma',
  migrations: {
    path: '../migrations',
  },
  datasource: {
    url: directConnectionString,
  },
});
