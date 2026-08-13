"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // 1. Crucial for runtime app initialization
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const prismaClientSingleton = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in your environment variables.");
    }
    // 2. Configure the Node-pg pool using the environment string
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Prevents SSL connection issues with Neon
    });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    // 3. In Prisma v7, you must pass the driver adapter option
    return new client_1.PrismaClient({ adapter });
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalThis.prismaGlobal = prisma;
exports.default = prisma;
