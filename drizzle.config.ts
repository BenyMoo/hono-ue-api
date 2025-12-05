import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.dev.vars' });

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
