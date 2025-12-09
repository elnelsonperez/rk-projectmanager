import { Check, ChevronsUpDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Button } from './button';

export interface BaseColumnOption {
  id: string;
  label: string;
}

export interface ColumnVisibilityProps<TColumn extends BaseColumnOption> {
  columns: TColumn[];
  variant?: 'dropdown' | 'panel';
  className?: string;
  onToggleAll?: (visible: boolean) => void;
  onToggleColumn: (columnId: string) => void;
  getColumnVisibility: (column: TColumn) => boolean;
}

export function ColumnVisibility<TColumn extends BaseColumnOption>({
  columns,
  variant = 'dropdown',
  className = '',
  onToggleAll,
  onToggleColumn,
  getColumnVisibility,
}: ColumnVisibilityProps<TColumn>) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count visible columns
  const visibleCount = columns.filter(col => getColumnVisibility(col)).length;
  const totalCount = columns.length;

  // Handle clicks outside the dropdown
  useEffect(() => {
    if (variant !== 'dropdown') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  // Show all columns
  const showAllColumns = () => {
    if (onToggleAll) {
      onToggleAll(true);
    } else {
      // Default implementation if onToggleAll not provided
      columns.forEach(column => {
        if (!getColumnVisibility(column)) {
          onToggleColumn(column.id);
        }
      });
    }
  };

  // Hide all columns
  const hideAllColumns = () => {
    if (onToggleAll) {
      onToggleAll(false);
    } else {
      // Default implementation if onToggleAll not provided
      columns.forEach(column => {
        if (getColumnVisibility(column)) {
          onToggleColumn(column.id);
        }
      });
    }
  };

  // Toggle a single column
  const toggleColumn = (columnId: string) => {
    onToggleColumn(columnId);
  };

  // Dropdown Variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
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
                  {getColumnVisibility(column) && <Check className="h-3.5 w-3.5" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Panel Variant
  return (
    <div className={`mb-4 border rounded-lg bg-muted/20 p-3 ${className}`}>
      <div className="flex flex-wrap justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Configurar Columnas ({visibleCount}/{totalCount})</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={showAllColumns}
            className="text-xs h-7 px-2"
          >
            Mostrar Todas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={hideAllColumns}
            className="text-xs h-7 px-2"
          >
            Ocultar Todas
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {columns.map(col => (
          <div 
            key={col.id} 
            className="flex items-center text-xs py-1 px-1 cursor-pointer hover:bg-muted/40 rounded-sm"
            onClick={() => toggleColumn(col.id)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded mr-2 border ${getColumnVisibility(col) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
              {getColumnVisibility(col) && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span>{col.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}