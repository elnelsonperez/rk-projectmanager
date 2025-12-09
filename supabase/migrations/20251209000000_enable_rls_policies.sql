-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
-- Allow authenticated users to read all clients
CREATE POLICY "Allow authenticated users to read clients"
ON clients FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert clients
CREATE POLICY "Allow authenticated users to insert clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update clients
CREATE POLICY "Allow authenticated users to update clients"
ON clients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete clients
CREATE POLICY "Allow authenticated users to delete clients"
ON clients FOR DELETE
TO authenticated
USING (true);

-- Create policies for suppliers table
CREATE POLICY "Allow authenticated users to read suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert suppliers"
ON suppliers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete suppliers"
ON suppliers FOR DELETE
TO authenticated
USING (true);

-- Create policies for projects table
CREATE POLICY "Allow authenticated users to read projects"
ON projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
ON projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects"
ON projects FOR DELETE
TO authenticated
USING (true);

-- Create policies for project_items table
CREATE POLICY "Allow authenticated users to read project_items"
ON project_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert project_items"
ON project_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_items"
ON project_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_items"
ON project_items FOR DELETE
TO authenticated
USING (true);

-- Create policies for transactions table
CREATE POLICY "Allow authenticated users to read transactions"
ON transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transactions"
ON transactions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete transactions"
ON transactions FOR DELETE
TO authenticated
USING (true);

-- Create policies for audit_logs table
CREATE POLICY "Allow authenticated users to read audit_logs"
ON audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert audit_logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: We typically don't allow updates or deletes on audit logs
-- They should be append-only for integrity

-- Add comment explaining the security model
COMMENT ON TABLE clients IS 'RLS enabled: Authenticated users have full access';
COMMENT ON TABLE suppliers IS 'RLS enabled: Authenticated users have full access';
COMMENT ON TABLE projects IS 'RLS enabled: Authenticated users have full access';
COMMENT ON TABLE project_items IS 'RLS enabled: Authenticated users have full access';
COMMENT ON TABLE transactions IS 'RLS enabled: Authenticated users have full access';
COMMENT ON TABLE audit_logs IS 'RLS enabled: Authenticated users can read and insert only';
