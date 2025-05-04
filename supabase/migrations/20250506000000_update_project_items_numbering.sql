-- Drop existing trigger for project_items
DROP TRIGGER IF EXISTS trig_project_items_row_index ON project_items;
DROP FUNCTION IF EXISTS set_project_items_row_index();

-- Update existing records to start from 1 and prevent gaps in numbering
-- First, create a temporary table to store the new row_index values
CREATE TEMP TABLE project_items_reindex AS
SELECT id, project_id, 
  ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY row_index, created_at, id) AS new_row_index
FROM project_items;

-- Update all project_items with the new row_index values
UPDATE project_items
SET row_index = temp.new_row_index
FROM project_items_reindex temp
WHERE project_items.id = temp.id;

-- Create a new trigger function that assigns row_index by project
CREATE OR REPLACE FUNCTION set_project_items_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Always assign the next sequential number for the specific project
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        -- Get the max row_index for this specific project and add 1
        NEW.row_index := (
            SELECT COALESCE(MAX(row_index), 0) + 1 
            FROM project_items 
            WHERE project_id = NEW.project_id
        );
    ELSE
        -- If a specific row_index was provided, shift existing rows to make room
        -- This ensures there are no duplicates or gaps
        UPDATE project_items
        SET row_index = row_index + 1
        WHERE 
            project_id = NEW.project_id 
            AND row_index >= NEW.row_index;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trig_project_items_row_index
    BEFORE INSERT ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION set_project_items_row_index();

-- Create a function and trigger for when row_index is updated
CREATE OR REPLACE FUNCTION handle_project_items_reordering()
RETURNS TRIGGER AS $$
BEGIN
    -- If row_index didn't change, do nothing
    IF OLD.row_index = NEW.row_index THEN
        RETURN NEW;
    END IF;

    -- If moving to a higher row_index (moving down)
    IF NEW.row_index > OLD.row_index THEN
        UPDATE project_items
        SET row_index = row_index - 1
        WHERE 
            project_id = NEW.project_id 
            AND row_index > OLD.row_index 
            AND row_index <= NEW.row_index
            AND id != NEW.id;
    
    -- If moving to a lower row_index (moving up)
    ELSIF NEW.row_index < OLD.row_index THEN
        UPDATE project_items
        SET row_index = row_index + 1
        WHERE 
            project_id = NEW.project_id 
            AND row_index >= NEW.row_index 
            AND row_index < OLD.row_index
            AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the update trigger
CREATE TRIGGER trig_project_items_reordering
    BEFORE UPDATE OF row_index ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_items_reordering();

-- Create a function and trigger to handle deletion and reindex remaining items
CREATE OR REPLACE FUNCTION handle_project_items_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Shift down all rows with higher row_index
    UPDATE project_items
    SET row_index = row_index - 1
    WHERE 
        project_id = OLD.project_id 
        AND row_index > OLD.row_index;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the delete trigger
CREATE TRIGGER trig_project_items_deletion
    AFTER DELETE ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_items_deletion();