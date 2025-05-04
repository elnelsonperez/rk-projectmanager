-- Migration to remove row_index column from all tables
-- This column is no longer needed as it was causing TypeScript issues

-- Remove from clients table
ALTER TABLE clients DROP COLUMN IF EXISTS row_index;

-- Remove from projects table
ALTER TABLE projects DROP COLUMN IF EXISTS row_index;

-- Remove from project_items table
ALTER TABLE project_items DROP COLUMN IF EXISTS row_index;

-- Remove from suppliers table
ALTER TABLE suppliers DROP COLUMN IF EXISTS row_index;

-- Remove from transactions table
ALTER TABLE transactions DROP COLUMN IF EXISTS row_index;