-- Fix the operator issue in the audit log trigger functions

-- Updated project_items trigger function with fixed field access
CREATE OR REPLACE FUNCTION log_project_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['item_name', 'estimated_cost', 'internal_cost', 'client_cost', 'area', 'category', 'supplier_id', 'description'];
  i TEXT;
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
    -- Check important fields for changes using column references explicitly
    FOREACH i IN ARRAY important_fields LOOP
      -- Check if field changed by extracting from record manually
      IF (
          (i = 'item_name' AND OLD.item_name IS DISTINCT FROM NEW.item_name) OR
          (i = 'estimated_cost' AND OLD.estimated_cost IS DISTINCT FROM NEW.estimated_cost) OR
          (i = 'internal_cost' AND OLD.internal_cost IS DISTINCT FROM NEW.internal_cost) OR
          (i = 'client_cost' AND OLD.client_cost IS DISTINCT FROM NEW.client_cost) OR
          (i = 'area' AND OLD.area IS DISTINCT FROM NEW.area) OR
          (i = 'category' AND OLD.category IS DISTINCT FROM NEW.category) OR
          (i = 'supplier_id' AND OLD.supplier_id IS DISTINCT FROM NEW.supplier_id) OR
          (i = 'description' AND OLD.description IS DISTINCT FROM NEW.description)
      ) THEN
        changed_fields := changed_fields || jsonb_build_object(i, true);
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

-- Updated transactions trigger function with fixed field access
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['amount', 'client_facing_amount', 'project_item_id', 'description', 'date', 'payment_method', 'invoice_receipt_number'];
  i TEXT;
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
    -- Check important fields for changes using column references explicitly
    FOREACH i IN ARRAY important_fields LOOP
      IF (
          (i = 'amount' AND OLD.amount IS DISTINCT FROM NEW.amount) OR
          (i = 'client_facing_amount' AND OLD.client_facing_amount IS DISTINCT FROM NEW.client_facing_amount) OR
          (i = 'project_item_id' AND OLD.project_item_id IS DISTINCT FROM NEW.project_item_id) OR
          (i = 'description' AND OLD.description IS DISTINCT FROM NEW.description) OR
          (i = 'date' AND OLD.date IS DISTINCT FROM NEW.date) OR
          (i = 'payment_method' AND OLD.payment_method IS DISTINCT FROM NEW.payment_method) OR
          (i = 'invoice_receipt_number' AND OLD.invoice_receipt_number IS DISTINCT FROM NEW.invoice_receipt_number)
      ) THEN
        changed_fields := changed_fields || jsonb_build_object(i, true);
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