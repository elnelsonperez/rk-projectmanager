-- Update the trigger functions to respect provided row_index values

-- Update clients trigger
DROP TRIGGER IF EXISTS trig_clients_row_index ON clients;
DROP FUNCTION IF EXISTS set_clients_row_index();

CREATE OR REPLACE FUNCTION set_clients_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM clients);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_clients_row_index
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_clients_row_index();

-- Update suppliers trigger
DROP TRIGGER IF EXISTS trig_suppliers_row_index ON suppliers;
DROP FUNCTION IF EXISTS set_suppliers_row_index();

CREATE OR REPLACE FUNCTION set_suppliers_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM suppliers);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_suppliers_row_index
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION set_suppliers_row_index();

-- Update projects trigger
DROP TRIGGER IF EXISTS trig_projects_row_index ON projects;
DROP FUNCTION IF EXISTS set_projects_row_index();

CREATE OR REPLACE FUNCTION set_projects_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM projects);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_projects_row_index
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_projects_row_index();

-- Update project_items trigger
DROP TRIGGER IF EXISTS trig_project_items_row_index ON project_items;
DROP FUNCTION IF EXISTS set_project_items_row_index();

CREATE OR REPLACE FUNCTION set_project_items_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM project_items);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_project_items_row_index
    BEFORE INSERT ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION set_project_items_row_index();

-- Update transactions trigger
DROP TRIGGER IF EXISTS trig_transactions_row_index ON transactions;
DROP FUNCTION IF EXISTS set_transactions_row_index();

CREATE OR REPLACE FUNCTION set_transactions_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        NEW.row_index := (SELECT COALESCE(MAX(row_index), 0) + 1 FROM transactions);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_transactions_row_index
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transactions_row_index();