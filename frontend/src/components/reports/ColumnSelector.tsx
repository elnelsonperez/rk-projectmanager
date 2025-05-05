import React from 'react';
import { Check } from 'lucide-react';
import { ColumnConfig } from './ReportTable';
import { Button } from '../ui/button';

interface ColumnSelectorProps {
  columnConfig: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columnConfig,
  onToggleColumn
}) => {
  // Count visible columns
  const visibleCount = columnConfig.filter(col => col.visible).length;
  const totalCount = columnConfig.length;

  // Toggle all columns
  const toggleAll = (value: boolean) => {
    // Apply the same visibility to all columns
    columnConfig.forEach(col => {
      if (col.visible !== value) {
        onToggleColumn(col.id);
      }
    });
  };

  return (
    <div className="mb-4 border rounded-lg bg-muted/20 p-3">
      <div className="flex flex-wrap justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Configurar Columnas ({visibleCount}/{totalCount})</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleAll(true)}
            className="text-xs h-7 px-2"
          >
            Mostrar Todas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleAll(false)}
            className="text-xs h-7 px-2"
          >
            Ocultar Todas
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {columnConfig.map(col => (
          <div 
            key={col.id} 
            className="flex items-center text-xs py-1 px-1 cursor-pointer hover:bg-muted/40 rounded-sm"
            onClick={() => onToggleColumn(col.id)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded mr-2 border ${col.visible ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
              {col.visible && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span>{col.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnSelector;