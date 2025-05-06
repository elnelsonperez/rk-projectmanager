-- Add report_notes column to projects table
ALTER TABLE projects ADD COLUMN report_notes TEXT DEFAULT NULL;

-- Comment on new column
COMMENT ON COLUMN projects.report_notes IS 'Notes for the project report';