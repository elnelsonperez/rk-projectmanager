import React from 'react';
import { ColumnConfig } from './ReportTable';

interface ColumnSelectorProps {
  columnConfig: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columnConfig,
  onToggleColumn
}) => {
  return (
    <div className="mb-6 p-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Configurar Columnas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {columnConfig.map(col => (
          <div key={col.id} className="flex items-center">
            <input
              type="checkbox"
              id={`col-${col.id}`}
              checked={col.visible}
              onChange={() => onToggleColumn(col.id)}
              className="mr-2"
            />
            <label htmlFor={`col-${col.id}`}>{col.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnSelector;