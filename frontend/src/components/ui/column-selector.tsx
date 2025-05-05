import { Check, ChevronsUpDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { VisibilityState } from '@tanstack/react-table';

interface ColumnOption {
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count visible columns - a column is visible if it's NOT explicitly set to false
  const visibleCount = columns.filter(col => {
    // A column is visible if it's explicitly true or undefined/null (default visibility)
    return columnVisibility[col.id] === true || columnVisibility[col.id] === undefined;
  }).length;
  const totalCount = columns.length;

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show all columns
  const showAllColumns = () => {
    // For show all, we explicitly set all columns to true
    const newState: VisibilityState = {};
    columns.forEach(column => {
      if (column.id) {
        newState[column.id] = true;
      }
    });
    onColumnVisibilityChange(newState);
  };

  // Hide all columns
  const hideAllColumns = () => {
    // For hide all, we set every column to false
    const newState: VisibilityState = {};
    columns.forEach(column => {
      if (column.id) {
        newState[column.id] = false;
      }
    });
    onColumnVisibilityChange(newState);
  };

  // Toggle a single column
  const toggleColumn = (columnId: string) => {
    // Skip if the column ID is empty
    if (!columnId) return;
    
    // Create a copy of the current visibility state
    const newState = { ...columnVisibility };
    
    // Toggle visibility state
    newState[columnId] = newState[columnId] === false ? true : false;
    
    onColumnVisibilityChange(newState);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center text-xs h-7 px-2"
      >
        Columnas ({visibleCount}/{totalCount})
        <ChevronsUpDown className="ml-1 h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-background rounded-md shadow-md border border-border w-52 py-1 text-xs">
          <div className="p-1 border-b border-border">
            <div 
              className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-muted rounded-sm"
              onClick={showAllColumns}
            >
              <span>Mostrar todas</span>
              {visibleCount === totalCount && <Check className="h-3.5 w-3.5" />}
            </div>
            <div 
              className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-muted rounded-sm"
              onClick={hideAllColumns}
            >
              <span>Ocultar todas</span>
              {visibleCount === 0 && <Check className="h-3.5 w-3.5" />}
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto p-1">
            {columns.map(column => (
              <div
                key={column.id}
                className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-muted rounded-sm"
                onClick={() => toggleColumn(column.id)}
              >
                <span>{column.label}</span>
                {(columnVisibility[column.id] === true || columnVisibility[column.id] === undefined) && 
                  <Check className="h-3.5 w-3.5" />
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}