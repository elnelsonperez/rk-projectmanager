-- Add row_index column to clients table
ALTER TABLE clients ADD COLUMN row_index INTEGER;

-- Update existing records to have sequential row_index values
UPDATE clients SET row_index = id_seq.seq
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq 
  FROM clients
) id_seq
WHERE clients.id = id_seq.id;

-- Make row_index NOT NULL for all future records
ALTER TABLE clients ALTER COLUMN row_index SET NOT NULL;

-- Create a trigger to set row_index when creating new records
CREATE OR REPLACE FUNCTION set_clients_row_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM clients);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_clients_row_index
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_clients_row_index();

-- Add row_index column to suppliers table
ALTER TABLE suppliers ADD COLUMN row_index INTEGER;

-- Update existing records to have sequential row_index values
UPDATE suppliers SET row_index = id_seq.seq
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq 
  FROM suppliers
) id_seq
WHERE suppliers.id = id_seq.id;

-- Make row_index NOT NULL for all future records
ALTER TABLE suppliers ALTER COLUMN row_index SET NOT NULL;

-- Create a trigger to set row_index when creating new records
CREATE OR REPLACE FUNCTION set_suppliers_row_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM suppliers);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_suppliers_row_index
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION set_suppliers_row_index();

-- Add row_index column to projects table
ALTER TABLE projects ADD COLUMN row_index INTEGER;

-- Update existing records to have sequential row_index values
UPDATE projects SET row_index = id_seq.seq
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq 
  FROM projects
) id_seq
WHERE projects.id = id_seq.id;

-- Make row_index NOT NULL for all future records
ALTER TABLE projects ALTER COLUMN row_index SET NOT NULL;

-- Create a trigger to set row_index when creating new records
CREATE OR REPLACE FUNCTION set_projects_row_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM projects);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_projects_row_index
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_projects_row_index();

-- Add row_index column to project_items table
ALTER TABLE project_items ADD COLUMN row_index INTEGER;

-- Update existing records to have sequential row_index values
UPDATE project_items SET row_index = id_seq.seq
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq 
  FROM project_items
) id_seq
WHERE project_items.id = id_seq.id;

-- Make row_index NOT NULL for all future records
ALTER TABLE project_items ALTER COLUMN row_index SET NOT NULL;

-- Create a trigger to set row_index when creating new records
CREATE OR REPLACE FUNCTION set_project_items_row_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM project_items);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_project_items_row_index
    BEFORE INSERT ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION set_project_items_row_index();

-- Add row_index column to transactions table
ALTER TABLE transactions ADD COLUMN row_index INTEGER;

-- Update existing records to have sequential row_index values
UPDATE transactions SET row_index = id_seq.seq
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS seq 
  FROM transactions
) id_seq
WHERE transactions.id = id_seq.id;

-- Make row_index NOT NULL for all future records
ALTER TABLE transactions ALTER COLUMN row_index SET NOT NULL;

-- Create a trigger to set row_index when creating new records
CREATE OR REPLACE FUNCTION set_transactions_row_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM transactions);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_transactions_row_index
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transactions_row_index();