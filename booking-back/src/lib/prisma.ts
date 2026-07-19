import 'dotenv/config'; // 1. Crucial for runtime app initialization
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in your environment variables.");
  }

  // 2. Configure the Node-pg pool using the environment string
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Prevents SSL connection issues with Neon
  });
  
  const adapter = new PrismaPg(pool);

  // 3. In Prisma v7, you must pass the driver adapter option
  return new PrismaClient({ adapter }); 
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

export default prisma;
