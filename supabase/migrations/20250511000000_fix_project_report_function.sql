-- Fix the get_project_report function to handle enum type properly
-- The previous version had type mismatch between categoria_item enum and text

CREATE OR REPLACE FUNCTION get_project_report(p_project_id INT)
RETURNS TABLE (
  category TEXT,
  area TEXT,
  item_name TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  difference_percentage NUMERIC,
  amount_paid NUMERIC,
  pending_to_pay NUMERIC
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
    END AS pending_to_pay
  FROM 
    project_items pi
  LEFT JOIN 
    transaction_sums ts ON pi.id = ts.project_item_id
  WHERE 
    pi.project_id = p_project_id
  ORDER BY 
    pi.area, pi.category, pi.item_name;
END;
$$ LANGUAGE plpgsql;