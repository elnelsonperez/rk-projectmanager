import { useState } from 'react';
import { AuditLog } from '../../types/audit.types';
import { formatCurrency } from '../../utils/formatters';

interface AuditLogValueDiffProps {
  log: AuditLog;
}

export function AuditLogValueDiff({ log }: AuditLogValueDiffProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Handle INSERT action
  if (log.action_type === 'INSERT') {
    return (
      <div>
        <span className="text-green-600 font-medium">
          {log.table_name === 'project_items' ? 'Artículo nuevo creado' : 'Transacción nueva creada'}
        </span>
        {expanded && renderNewValues(log)}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="ml-2 text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Ocultar detalles' : 'Mostrar detalles'}
        </button>
      </div>
    );
  }
  
  // Handle DELETE action
  if (log.action_type === 'DELETE') {
    return (
      <div>
        <span className="text-red-600 font-medium">
          {log.table_name === 'project_items' ? 'Artículo eliminado' : 'Transacción eliminada'}
        </span>
        {expanded && renderDeletedValues(log)}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="ml-2 text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Ocultar detalles' : 'Mostrar detalles'}
        </button>
      </div>
    );
  }
  
  // For updates, show which fields changed
  const changedFields = log.changed_fields ? Object.keys(log.changed_fields) : [];
  
  if (changedFields.length === 0) {
    return <span className="text-muted-foreground">No se modificaron campos importantes</span>;
  }
  
  // If there are more than 2 fields, we'll only show the first two unless expanded
  const displayFields = expanded ? changedFields : changedFields.slice(0, 2);
  const hasMoreFields = changedFields.length > 2;
  
  return (
    <div>
      <div>
        {displayFields.map(field => (
          <div key={field} className="mb-1">
            <span className="font-medium">{formatFieldName(field)}: </span>
            <span className="text-red-500 line-through mr-1">
              {formatFieldValue(field, log.old_values?.[field])}
            </span>
            <span className="text-green-600">
              {formatFieldValue(field, log.new_values?.[field])}
            </span>
          </div>
        ))}
      </div>
      
      {hasMoreFields && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Mostrar ${changedFields.length - 2} campos más`}
        </button>
      )}
    </div>
  );
}

// Helper functions
function formatFieldName(field: string): string {
  // Convert snake_case to Title Case
  return field.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) return 'None';
  
  // Format currency fields
  if (['amount', 'client_facing_amount', 'estimated_cost', 'internal_cost', 'client_cost'].includes(field)) {
    return formatCurrency(value);
  }
  
  // Format project_item_id as custom display with lookup value if available
  if (field === 'project_item_id') {
    return String(value);
  }
  
  // Format dates
  if (field === 'date' || field.endsWith('_date')) {
    return new Date(value).toLocaleDateString();
  }
  
  return String(value);
}

function renderNewValues(log: AuditLog) {
  if (!log.new_values) return null;
  
  // Display important fields only
  const fields = log.table_name === 'project_items' 
    ? ['item_name', 'estimated_cost', 'internal_cost', 'client_cost', 'area', 'category', 'supplier_id'] 
    : ['amount', 'client_facing_amount', 'project_item_id', 'date', 'description'];
  
  return (
    <div className="mt-1 pl-2 border-l-2 border-green-300">
      {fields.map(field => (
        log.new_values && log.new_values[field] !== undefined && (
          <div key={field} className="text-xs">
            <span className="font-medium">{formatFieldName(field)}: </span>
            <span>{formatFieldValue(field, log.new_values[field])}</span>
          </div>
        )
      ))}
    </div>
  );
}

function renderDeletedValues(log: AuditLog) {
  if (!log.old_values) return null;
  
  // Display important fields only
  const fields = log.table_name === 'project_items' 
    ? ['item_name', 'estimated_cost', 'internal_cost', 'client_cost', 'area', 'category', 'supplier_id'] 
    : ['amount', 'client_facing_amount', 'project_item_id', 'date', 'description'];
  
  return (
    <div className="mt-1 pl-2 border-l-2 border-red-300">
      {fields.map(field => (
        log.old_values && log.old_values[field] !== undefined && (
          <div key={field} className="text-xs">
            <span className="font-medium">{formatFieldName(field)}: </span>
            <span>{formatFieldValue(field, log.old_values[field])}</span>
          </div>
        )
      ))}
    </div>
  );
}