-- Remove user_id from audit logs functionality to avoid permissions issues
-- Update the trigger functions to not use auth.uid()

-- Update project_items trigger function
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
      NULL, NULL, row_to_json(NEW)::JSONB, NULL
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
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, NULL
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'project_items', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update transactions trigger function
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
      NULL, NULL, row_to_json(NEW)::JSONB, NULL
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
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, NULL
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'transactions', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_audit_logs function to remove join with auth.users table
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
    a.user_id, NULL::TEXT as user_email, a.created_at,
    v_total_count
  FROM 
    audit_logs a
    LEFT JOIN projects p ON a.project_id = p.id
  WHERE 
    (p_project_id IS NULL OR a.project_id = p_project_id) AND
    (p_start_date IS NULL OR a.created_at >= p_start_date) AND
    (p_end_date IS NULL OR a.created_at <= p_end_date)
  ORDER BY a.created_at DESC
  LIMIT p_page_size
  OFFSET ((p_page - 1) * p_page_size);
END;
$$ LANGUAGE plpgsql;