-- Fix stack depth limit exceeded error in project items triggers
-- Drop existing triggers that may be causing recursion issues
DROP TRIGGER IF EXISTS trig_project_items_reordering ON project_items;
DROP FUNCTION IF EXISTS handle_project_items_reordering();

DROP TRIGGER IF EXISTS trig_project_items_deletion ON project_items;
DROP FUNCTION IF EXISTS handle_project_items_deletion();

-- Create a simplified reordering function that avoids recursion
CREATE OR REPLACE FUNCTION handle_project_items_reordering()
RETURNS TRIGGER AS $$
DECLARE
    item_id integer := NEW.id;
    project_id integer := NEW.project_id;
    target_index integer := NEW.row_index;
BEGIN
    -- Prevent recursion by using a session variable
    IF current_setting('app.reordering_in_progress', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Set flag to prevent recursion
    PERFORM set_config('app.reordering_in_progress', 'true', true);
    
    -- Reordering logic using a direct approach without recursive triggers
    -- First identify what needs to be done
    IF OLD.row_index < target_index THEN
        -- Moving down - decrement items in between
        UPDATE project_items
        SET row_index = row_index - 1
        WHERE 
            id != item_id
            AND project_id = project_id
            AND row_index > OLD.row_index 
            AND row_index <= target_index;
    ELSIF OLD.row_index > target_index THEN
        -- Moving up - increment items in between
        UPDATE project_items
        SET row_index = row_index + 1
        WHERE 
            id != item_id
            AND project_id = project_id
            AND row_index >= target_index 
            AND row_index < OLD.row_index;
    END IF;
    
    -- Reset flag
    PERFORM set_config('app.reordering_in_progress', 'false', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the update trigger with a WHEN clause to further avoid recursion
CREATE TRIGGER trig_project_items_reordering
    AFTER UPDATE OF row_index ON project_items
    FOR EACH ROW
    WHEN (OLD.row_index IS DISTINCT FROM NEW.row_index)
    EXECUTE FUNCTION handle_project_items_reordering();

-- Create a simplified deletion function
CREATE OR REPLACE FUNCTION handle_project_items_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Simply decrement all rows with higher row_index
    UPDATE project_items
    SET row_index = row_index - 1
    WHERE 
        project_id = OLD.project_id 
        AND row_index > OLD.row_index;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create deletion trigger
CREATE TRIGGER trig_project_items_deletion
    AFTER DELETE ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_items_deletion();

-- Ensure we start all projects with row index 1
-- Create a new version of the insert trigger
DROP TRIGGER IF EXISTS trig_project_items_row_index ON project_items;
DROP FUNCTION IF EXISTS set_project_items_row_index();

CREATE OR REPLACE FUNCTION set_project_items_row_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set row_index if it's NULL or 0 (default)
    IF NEW.row_index IS NULL OR NEW.row_index = 0 THEN
        -- Get the max row_index for this specific project and add 1
        -- Ensuring we start from 1 for the first item
        NEW.row_index := COALESCE(
            (SELECT MAX(row_index) FROM project_items WHERE project_id = NEW.project_id),
            0
        ) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trig_project_items_row_index
    BEFORE INSERT ON project_items
    FOR EACH ROW
    EXECUTE FUNCTION set_project_items_row_index();

-- Fix existing data by renumbering in sequence
-- Create a temporary function for one-time renumbering
CREATE OR REPLACE FUNCTION renumber_project_items()
RETURNS void AS $$
DECLARE
    proj record;
    item record;
    idx integer;
BEGIN
    -- For each project
    FOR proj IN SELECT DISTINCT project_id FROM project_items LOOP
        idx := 1;
        
        -- For each item in the project, ordered by current row_index
        FOR item IN 
            SELECT id 
            FROM project_items 
            WHERE project_id = proj.project_id 
            ORDER BY row_index, created_at, id
        LOOP
            -- Update the row_index to the new sequential value
            UPDATE project_items 
            SET row_index = idx 
            WHERE id = item.id;
            
            idx := idx + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the renumbering function
SELECT renumber_project_items();

-- Clean up the temporary function
DROP FUNCTION renumber_project_items();