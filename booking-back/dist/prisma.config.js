"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // 1. Manually pull variables if using standard .env
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    // 2. Defines where your main schema or schema folders are located
    schema: "prisma/schema.prisma",
    // 3. Custom pathing for migrations and seed scripts
    migrations: {
        path: "prisma/migrations",
        seed: "tsx scripts/seed-plans.ts",
    },
    datasource: {
        url: (0, config_1.env)("DATABASE_URL"),
    },
});
