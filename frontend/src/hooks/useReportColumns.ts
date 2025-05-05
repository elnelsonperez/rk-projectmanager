import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { ColumnConfig } from '../components/reports/ReportTable';

export const useReportColumns = () => {
  // Define columns for the report
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { id: 'area', label: 'Área', visible: true, render: (item) => item.area || '-' },
    { id: 'category', label: 'Categoría', visible: true, render: (item) => item.category || '-' },
    { id: 'item_name', label: 'Artículo', visible: true, render: (item) => item.item_name },
    { 
      id: 'description', 
      label: 'Descripción', 
      visible: true, 
      render: (item) => item.description || '-' 
    },
    { 
      id: 'estimated_cost', 
      label: 'Costo Estimado', 
      visible: true, 
      render: (item) => formatCurrency(item.estimated_cost) 
    },
    { 
      id: 'actual_cost', 
      label: 'Costo Actual', 
      visible: true, 
      render: (item) => formatCurrency(item.actual_cost) 
    },
    { 
      id: 'difference_percentage', 
      label: '% Diferencia', 
      visible: false, 
      render: (item) => item.difference_percentage ? `${item.difference_percentage.toFixed(2)}%` : '-' 
    },
    { 
      id: 'amount_paid', 
      label: 'Pagado', 
      visible: true, 
      render: (item) => formatCurrency(item.amount_paid) 
    },
    { 
      id: 'pending_to_pay', 
      label: 'Pendiente', 
      visible: true, 
      render: (item) => formatCurrency(item.pending_to_pay) 
    },
  ]);
  
  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };
  
  // Get visible columns only
  const visibleColumns = columnConfig.filter(col => col.visible);
  
  return {
    columnConfig,
    toggleColumn,
    visibleColumns
  };
};