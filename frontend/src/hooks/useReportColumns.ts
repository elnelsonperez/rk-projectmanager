import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { ColumnConfig } from '../components/reports/ReportTable';

const STORAGE_KEY = 'projectReportColumnConfig';

const defaultColumns: ColumnConfig[] = [
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
    label: 'Abonado',
    visible: true,
    render: (item) => formatCurrency(item.amount_paid)
  },
  {
    id: 'internal_amount_paid',
    label: 'Abonado (Interno)',
    visible: false,
    render: (item) => formatCurrency(item.internal_amount_paid)
  },
  {
    id: 'pending_to_pay',
    label: 'Pendiente',
    visible: true,
    render: (item) => formatCurrency(item.pending_to_pay)
  },
];

// Load column visibility from localStorage
const loadColumnVisibility = (): Record<string, boolean> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading column config from localStorage:', error);
  }
  return null;
};

// Save column visibility to localStorage
const saveColumnVisibility = (config: ColumnConfig[]) => {
  try {
    const visibilityMap = config.reduce((acc, col) => {
      acc[col.id] = col.visible;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibilityMap));
  } catch (error) {
    console.error('Error saving column config to localStorage:', error);
  }
};

export const useReportColumns = () => {
  // Initialize columns with default values
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const savedVisibility = loadColumnVisibility();

    if (savedVisibility) {
      // Merge saved visibility with default columns
      return defaultColumns.map(col => ({
        ...col,
        visible: savedVisibility[col.id] !== undefined ? savedVisibility[col.id] : col.visible
      }));
    }

    return defaultColumns;
  });

  // Save to localStorage whenever columnConfig changes
  useEffect(() => {
    saveColumnVisibility(columnConfig);
  }, [columnConfig]);
  
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