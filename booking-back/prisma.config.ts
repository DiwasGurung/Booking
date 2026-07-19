import "dotenv/config"; // 1. Manually pull variables if using standard .env
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // 2. Defines where your main schema or schema folders are located
  schema: "prisma/schema.prisma", 

  // 3. Custom pathing for migrations and seed scripts
  migrations: {
    path: "prisma/migrations",

  },
  datasource: {
    url: env("DATABASE_URL"), 
  },
});
