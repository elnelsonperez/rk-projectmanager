-- Fix type issue in project report function
DROP FUNCTION IF EXISTS get_project_report(INT);
CREATE OR REPLACE FUNCTION get_project_report(p_project_id INT)
RETURNS TABLE (
  category TEXT,
  area TEXT,
  item_name TEXT,
  description TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  difference_percentage NUMERIC,
  amount_paid NUMERIC,
  pending_to_pay NUMERIC,
  supplier_id INT,
  supplier_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH transaction_sums AS (
    SELECT 
      pi.id AS project_item_id,
      COALESCE(SUM(t.amount), 0) AS total_amount_paid
    FROM 
      project_items pi
    LEFT JOIN 
      transactions t ON pi.id = t.project_item_id
    WHERE 
      pi.project_id = p_project_id
    GROUP BY 
      pi.id
  )
  SELECT 
    pi.category::TEXT, -- Cast enum to text
    pi.area,
    pi.item_name,
    pi.description,
    pi.estimated_cost,
    pi.client_cost AS actual_cost,
    CASE 
      WHEN pi.estimated_cost IS NULL OR pi.estimated_cost = 0 THEN NULL
      ELSE ((pi.client_cost - pi.estimated_cost) / pi.estimated_cost) * 100 
    END AS difference_percentage,
    ts.total_amount_paid AS amount_paid,
    CASE
      WHEN pi.client_cost IS NULL THEN 0
      ELSE pi.client_cost - ts.total_amount_paid
    END AS pending_to_pay,
    pi.supplier_id::INT,
    s.name AS supplier_name
  FROM 
    project_items pi
  LEFT JOIN 
    transaction_sums ts ON pi.id = ts.project_item_id
  LEFT JOIN
    suppliers s ON pi.supplier_id = s.id
  WHERE 
    pi.project_id = p_project_id
  ORDER BY 
    pi.area, pi.category, pi.item_name;
END;
$$ LANGUAGE plpgsql;