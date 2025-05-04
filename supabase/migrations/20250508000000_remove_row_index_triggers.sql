-- Remove all row_index related triggers and make it entirely frontend handled

-- Drop all project_items triggers related to row_index
DROP TRIGGER IF EXISTS trig_project_items_reordering ON project_items;
DROP FUNCTION IF EXISTS handle_project_items_reordering();

DROP TRIGGER IF EXISTS trig_project_items_deletion ON project_items;
DROP FUNCTION IF EXISTS handle_project_items_deletion();

DROP TRIGGER IF EXISTS trig_project_items_row_index ON project_items;
DROP FUNCTION IF EXISTS set_project_items_row_index();

-- Drop clients triggers related to row_index
DROP TRIGGER IF EXISTS trig_clients_row_index ON clients;
DROP FUNCTION IF EXISTS set_clients_row_index();

-- Drop suppliers triggers related to row_index
DROP TRIGGER IF EXISTS trig_suppliers_row_index ON suppliers;
DROP FUNCTION IF EXISTS set_suppliers_row_index();

-- Drop projects triggers related to row_index
DROP TRIGGER IF EXISTS trig_projects_row_index ON projects;
DROP FUNCTION IF EXISTS set_projects_row_index();

-- Drop transactions triggers related to row_index
DROP TRIGGER IF EXISTS trig_transactions_row_index ON transactions;
DROP FUNCTION IF EXISTS set_transactions_row_index();

-- Keep the row_index columns but make them nullable
ALTER TABLE project_items ALTER COLUMN row_index DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN row_index DROP NOT NULL;
ALTER TABLE suppliers ALTER COLUMN row_index DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN row_index DROP NOT NULL;
ALTER TABLE transactions ALTER COLUMN row_index DROP NOT NULL;

-- Initialize any missing row_index values with NULL
UPDATE project_items SET row_index = NULL WHERE row_index IS NULL;
UPDATE clients SET row_index = NULL WHERE row_index IS NULL;
UPDATE suppliers SET row_index = NULL WHERE row_index IS NULL;
UPDATE projects SET row_index = NULL WHERE row_index IS NULL;
UPDATE transactions SET row_index = NULL WHERE row_index IS NULL;