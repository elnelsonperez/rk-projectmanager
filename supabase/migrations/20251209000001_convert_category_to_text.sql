-- Convert category column from enum to TEXT for flexibility
-- This allows users to enter any category value without being restricted to predefined options

-- Step 1: Alter the column type from categoria_item enum to TEXT
ALTER TABLE project_items
  ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- Step 2: Update the default value to be a simple TEXT default instead of enum
ALTER TABLE project_items
  ALTER COLUMN category SET DEFAULT 'Otro';

-- Step 3: Drop the enum type since it's no longer used
-- Note: Only drop if no other tables are using it
DROP TYPE IF EXISTS categoria_item;

-- Add comment explaining the change
COMMENT ON COLUMN project_items.category IS 'Item category - accepts any text value for flexibility';
