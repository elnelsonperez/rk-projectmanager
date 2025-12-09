import { VisibilityState } from '@tanstack/react-table';
import { ColumnVisibility, BaseColumnOption } from './column-visibility';

interface ColumnOption extends BaseColumnOption {
  id: string;
  label: string;
}

interface ColumnSelectorProps {
  columns: ColumnOption[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (state: VisibilityState) => void;
}

export function ColumnSelector({ 
  columns, 
  columnVisibility, 
  onColumnVisibilityChange 
}: ColumnSelectorProps) {
  // Toggle all columns
  const handleToggleAll = (visible: boolean) => {
    const newState: VisibilityState = {};
    columns.forEach(column => {
      if (column.id) {
        newState[column.id] = visible;
      }
    });
    onColumnVisibilityChange(newState);
  };

  // Toggle a single column
  const handleToggleColumn = (columnId: string) => {
    // Skip if the column ID is empty
    if (!columnId) return;
    
    // Create a copy of the current visibility state
    const newState = { ...columnVisibility };
    
    // Toggle visibility state
    newState[columnId] = newState[columnId] === false ? true : false;
    
    onColumnVisibilityChange(newState);
  };

  // Get column visibility state
  const getColumnVisibility = (column: ColumnOption) => {
    return columnVisibility[column.id] === true || columnVisibility[column.id] === undefined;
  };

  return (
    <ColumnVisibility
      columns={columns}
      variant="dropdown"
      onToggleAll={handleToggleAll}
      onToggleColumn={handleToggleColumn}
      getColumnVisibility={getColumnVisibility}
    />
  );
}