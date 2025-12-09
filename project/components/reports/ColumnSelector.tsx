import React from 'react';
import { ColumnConfig } from './ReportTable';
import { ColumnVisibility } from '../ui/column-visibility';

interface ColumnSelectorProps {
  columnConfig: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columnConfig,
  onToggleColumn
}) => {
  // Toggle all columns
  const handleToggleAll = (visible: boolean) => {
    // Apply the same visibility to all columns
    columnConfig.forEach(col => {
      if (col.visible !== visible) {
        onToggleColumn(col.id);
      }
    });
  };

  // Get column visibility state
  const getColumnVisibility = (column: ColumnConfig) => {
    return column.visible;
  };

  return (
    <ColumnVisibility
      columns={columnConfig}
      variant="panel"
      onToggleAll={handleToggleAll}
      onToggleColumn={onToggleColumn}
      getColumnVisibility={getColumnVisibility}
    />
  );
};

export default ColumnSelector;