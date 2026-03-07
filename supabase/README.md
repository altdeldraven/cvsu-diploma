# Supabase Migration for Diploma-Chainify

This directory contains the database migrations for the Diploma-Chainify project.

## How to Apply the Migration

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/20240307120000_initial_schema.sql`
4. Run the SQL to create the tables

### Option 2: Using Supabase CLI
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Apply migrations: `supabase db push`

## Tables Created

- `users`: Stores user accounts (admin/student)
- `diplomas`: Stores diploma records
- `diploma_settings`: Stores campus registrar and administrator info

## Notes

- The migration includes enum types for user roles and diploma statuses
- Foreign key constraints ensure data integrity
- Indexes are created for common query patterns
- Row Level Security is commented out - enable if needed for multi-tenant setup