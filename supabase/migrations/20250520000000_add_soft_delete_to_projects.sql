-- Add deleted_at column to projects table
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster filtering
CREATE INDEX projects_deleted_at_idx ON projects(deleted_at);

-- Create function to filter out deleted projects
CREATE OR REPLACE FUNCTION get_active_projects(
  p_client_id INTEGER DEFAULT NULL
) 
RETURNS SETOF projects AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM projects
  WHERE 
    deleted_at IS NULL AND
    (p_client_id IS NULL OR client_id = p_client_id)
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to filter out deleted projects
-- First get the current RLS policies to preserve them
DO $$
DECLARE
    pol_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' AND 
              policyname = 'Allow authenticated users to read all projects'
    ) INTO pol_exists;
    
    IF pol_exists THEN
        DROP POLICY "Allow authenticated users to read all projects" ON projects;
        
        CREATE POLICY "Allow authenticated users to read all projects"
        ON projects
        FOR SELECT
        TO authenticated
        USING (deleted_at IS NULL);
    END IF;
END
$$;

-- Create a function to soft delete projects
CREATE OR REPLACE FUNCTION soft_delete_project(project_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;