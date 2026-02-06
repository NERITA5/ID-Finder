import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Manually load .env variables
dotenv.config();

export default defineConfig({
  datasource: {
    // Now process.env.DATABASE_URL will definitely be found
    url: process.env.DATABASE_URL,
  },
});