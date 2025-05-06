-- Create audit_logs table to track changes to project_items and transactions
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL, -- 'project_items' or 'transactions'
  record_id INTEGER NOT NULL, -- ID of the modified record
  project_id INTEGER NOT NULL, -- For easier filtering by project
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_fields JSONB, -- Store changed fields and values
  old_values JSONB, -- Previous values (for updates and deletes)
  new_values JSONB, -- New values (for inserts and updates)
  user_id UUID, -- Reference to auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX audit_logs_project_id_idx ON audit_logs(project_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX audit_logs_table_name_idx ON audit_logs(table_name);

-- Add comment to the table
COMMENT ON TABLE audit_logs IS 'Tracks changes to project_items and transactions';

-- Trigger function for project_items
CREATE OR REPLACE FUNCTION log_project_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['item_name', 'estimated_cost', 'internal_cost', 'client_cost', 'area', 'category', 'supplier_id', 'description'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'project_items', NEW.id, NEW.project_id, 'INSERT',
      NULL, NULL, row_to_json(NEW)::JSONB, auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check important fields for changes
    FOR i IN 1..array_length(important_fields, 1) LOOP
      IF OLD->(important_fields[i]) IS DISTINCT FROM NEW->(important_fields[i]) THEN
        changed_fields := changed_fields || jsonb_build_object(important_fields[i], true);
      END IF;
    END LOOP;
    
    -- Only log if important fields changed
    IF changed_fields != '{}'::JSONB THEN
      INSERT INTO audit_logs (
        table_name, record_id, project_id, action_type, 
        changed_fields, old_values, new_values, user_id
      ) VALUES (
        'project_items', NEW.id, NEW.project_id, 'UPDATE',
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'project_items', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for transactions
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['amount', 'client_facing_amount', 'project_item_id', 'description', 'date', 'payment_method', 'invoice_receipt_number'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'transactions', NEW.id, NEW.project_id, 'INSERT',
      NULL, NULL, row_to_json(NEW)::JSONB, auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check important fields for changes
    FOR i IN 1..array_length(important_fields, 1) LOOP
      IF OLD->(important_fields[i]) IS DISTINCT FROM NEW->(important_fields[i]) THEN
        changed_fields := changed_fields || jsonb_build_object(important_fields[i], true);
      END IF;
    END LOOP;
    
    -- Only log if important fields changed
    IF changed_fields != '{}'::JSONB THEN
      INSERT INTO audit_logs (
        table_name, record_id, project_id, action_type, 
        changed_fields, old_values, new_values, user_id
      ) VALUES (
        'transactions', NEW.id, NEW.project_id, 'UPDATE',
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'transactions', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to project_items table
CREATE TRIGGER project_items_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON project_items
FOR EACH ROW EXECUTE FUNCTION log_project_item_changes();

-- Add triggers to transactions table
CREATE TRIGGER transactions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

-- Create function to get audit logs with pagination and filtering
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_project_id INTEGER DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
) 
RETURNS TABLE (
  id INTEGER,
  table_name TEXT,
  record_id INTEGER,
  project_id INTEGER,
  project_name TEXT,
  action_type TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Count total records first (for pagination)
  SELECT COUNT(*) INTO v_total_count
  FROM audit_logs a
  WHERE 
    (p_project_id IS NULL OR a.project_id = p_project_id) AND
    (p_start_date IS NULL OR a.created_at >= p_start_date) AND
    (p_end_date IS NULL OR a.created_at <= p_end_date);
  
  -- Return the audit logs with total count
  RETURN QUERY
  SELECT 
    a.id, a.table_name, a.record_id, a.project_id, 
    p.name as project_name,
    a.action_type, a.changed_fields, a.old_values, a.new_values, 
    a.user_id, u.email as user_email, a.created_at,
    v_total_count
  FROM 
    audit_logs a
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN auth.users u ON a.user_id = u.id
  WHERE 
    (p_project_id IS NULL OR a.project_id = p_project_id) AND
    (p_start_date IS NULL OR a.created_at >= p_start_date) AND
    (p_end_date IS NULL OR a.created_at <= p_end_date)
  ORDER BY a.created_at DESC
  LIMIT p_page_size
  OFFSET ((p_page - 1) * p_page_size);
END;
$$ LANGUAGE plpgsql;

-- Add audit logs table to public API
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read-only access to authenticated users
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);