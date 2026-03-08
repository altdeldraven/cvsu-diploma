import { createClient } from '@supabase/supabase-js';
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for session store.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For backwards compatibility, but we'll use supabase directly
export const db = supabase;
