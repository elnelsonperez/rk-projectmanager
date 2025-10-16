-- Add item_id and internal_cost to the report function output
-- This allows editing items directly from the report

DROP FUNCTION IF EXISTS get_project_report(INT);

CREATE OR REPLACE FUNCTION get_project_report(p_project_id INT)
RETURNS TABLE (
  item_id BIGINT,
  category TEXT,
  area TEXT,
  item_name TEXT,
  description TEXT,
  estimated_cost NUMERIC,
  internal_cost NUMERIC,
  actual_cost NUMERIC,
  difference_percentage NUMERIC,
  amount_paid NUMERIC,
  pending_to_pay NUMERIC,
  supplier_id INT,
  supplier_name TEXT,
  internal_amount_paid NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH transaction_sums AS (
    SELECT
      pi.id AS project_item_id,
      COALESCE(SUM(t.client_facing_amount), 0) AS total_client_facing_amount_paid,
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
    pi.id AS item_id,
    pi.category::TEXT,
    pi.area,
    pi.item_name,
    pi.description,
    pi.estimated_cost,
    pi.internal_cost,
    pi.client_cost AS actual_cost,
    CASE
      WHEN pi.estimated_cost IS NULL OR pi.estimated_cost = 0 THEN NULL
      ELSE ((pi.client_cost - pi.estimated_cost) / pi.estimated_cost) * 100
    END AS difference_percentage,
    ts.total_client_facing_amount_paid AS amount_paid,
    CASE
      WHEN pi.client_cost IS NOT NULL THEN pi.client_cost - ts.total_client_facing_amount_paid
      WHEN pi.estimated_cost IS NOT NULL THEN pi.estimated_cost - ts.total_client_facing_amount_paid
      ELSE 0
    END AS pending_to_pay,
    pi.supplier_id::INT,
    s.name AS supplier_name,
    ts.total_amount_paid AS internal_amount_paid
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
