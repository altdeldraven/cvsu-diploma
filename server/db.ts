import pg from "pg";
import { PrismaClient } from "@prisma/client";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for session store and database.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

