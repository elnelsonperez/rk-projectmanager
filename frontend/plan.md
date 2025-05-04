# Project Report Feature Implementation Plan

This document outlines the implementation plan for the project-specific reports feature. The feature will allow users to view detailed reports for any project, with customizable columns and export capabilities.

## Backend Implementation

### 1. Create PostgreSQL Function
- Create a custom PostgreSQL function `get_project_report` in Supabase
- Function will return project items with calculated fields:
  - Category, Area, Item Name, Estimated Cost
  - Actual Cost (client_cost from project_items)
  - Difference Percentage between estimated and actual cost
  - Amount Paid (sum of transactions with project_item_id)
  - Pending to Pay (difference between actual cost and amount paid)
- Include subtotals by area
- SQL implementation:

```sql
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
    pi.category,
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
```

## Frontend Implementation

### 2. Create Supabase API Function
- Add function to supabase.ts to call the PostgreSQL RPC function
- Handle errors and return data in the correct format
- Implementation:

```typescript
export async function getProjectReport(projectId: number) {
  const { data, error } = await supabase
    .rpc('get_project_report', { p_project_id: projectId });

  if (error) throw error;
  return data;
}
```

### 3. Create Report Hook
- Create a new hook `useProjectReport` in a new file `hooks/useProjectReport.ts`
- Use react-query to fetch and cache report data
- Implementation:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getProjectReport } from '../lib/supabase';

export type ReportItem = {
  category: string;
  area: string | null;
  item_name: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  difference_percentage: number | null;
  amount_paid: number;
  pending_to_pay: number;
};

export function useProjectReport(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projectReport', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return getProjectReport(projectId) as Promise<ReportItem[]>;
    },
    enabled: !!projectId,
  });
}
```

### 4. Create Project Report Page Component
- Create a new file `pages/ProjectReportPage.tsx`
- Implement the UI with:
  - Column customization (show/hide columns)
  - Report table with data
  - Area subtotals
  - Grand totals
  - Export buttons for CSV and PDF

### 5. Create Column Configuration Component
- Create a component to manage visible columns
- Allow toggling columns on/off
- Implementation will be part of the report page or a separate component

### 6. Implement Data Display Component
- Create the report table component
- Handle displaying data with correct formatting
- Include subtotal rows by area
- Include grand total row

### 7. Implement CSV Export
- Add functionality to export current report view to CSV
- Format data appropriately
- Create downloadable file

```typescript
function exportCSV(reportData, visibleColumns) {
  // Headers
  const headers = visibleColumns.map(c => c.label).join(',');
  
  // Rows
  const rows = reportData.map(item => 
    visibleColumns.map(col => {
      // Handle formatting
      if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
        return item[col.id] || 0;
      } else if (col.id === 'difference_percentage') {
        return item[col.id] ? item[col.id].toFixed(2) : '';
      } else {
        return item[col.id] || '';
      }
    }).join(',')
  ).join('\n');
  
  // Download
  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `project_report_${projectId}.csv`);
  link.click();
}
```

### 8. Implement PDF Export
- Add dependency: `npm install jspdf jspdf-autotable`
- Implement PDF generation and download
- Format data appropriately

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function exportPDF(reportData, visibleColumns, projectId) {
  const doc = new jsPDF();
  
  // Title
  doc.text(`Project Report: ${projectId}`, 14, 15);
  
  // Prepare data
  const tableColumn = visibleColumns.map(c => c.label);
  const tableRows = reportData.map(item => 
    visibleColumns.map(col => {
      // Handle formatting
      if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
        return formatCurrency(item[col.id]);
      } else if (col.id === 'difference_percentage') {
        return item[col.id] ? `${item[col.id].toFixed(2)}%` : '-';
      } else {
        return item[col.id] || '-';
      }
    })
  );
  
  // Create table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  // Download
  doc.save(`project_report_${projectId}.pdf`);
}
```

### 9. Update Routes and Navigation
- Add route to the router for the report page
- Add link/button in the ProjectPage to navigate to the report
- Implementation:

```typescript
// In router.tsx
{
  path: '/projects/:projectId/report',
  element: <ProjectReportPage />
}

// In ProjectPage.tsx
<Button 
  as={Link} 
  to={`/projects/${projectId}/report`}
  variant="outline"
>
  Ver Reporte
</Button>
```
