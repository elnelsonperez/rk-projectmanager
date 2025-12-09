import { AuditLog } from '../../types/audit.types';
import { AuditLogValueDiff } from './AuditLogValueDiff';
import { formatDateTime } from '../../utils/formatters';
import { Spinner } from '../ui/spinner';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  showProjectColumn?: boolean;
}

export function AuditLogTable({ logs, isLoading, showProjectColumn = true }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">
          No se encontraron registros para los filtros seleccionados.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold">Fecha/Hora</th>
              <th className="px-3 py-3 text-left text-xs font-semibold">Usuario</th>
              {showProjectColumn && (
                <th className="px-3 py-3 text-left text-xs font-semibold">Proyecto</th>
              )}
              <th className="px-3 py-3 text-left text-xs font-semibold">Acción</th>
              <th className="px-3 py-3 text-left text-xs font-semibold">Registro</th>
              <th className="px-3 py-3 text-left text-xs font-semibold">Cambios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/10">
                <td className="px-3 py-3 text-xs whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                <td className="px-3 py-3 text-xs">Sistema</td>
                {showProjectColumn && (
                  <td className="px-3 py-3 text-xs">{log.project_name}</td>
                )}
                <td className="px-3 py-3 text-xs">
                  <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getActionClassNames(log.action_type)}`}>
                    {log.action_type}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">
                  {getRecordDescription(log)}
                </td>
                <td className="px-3 py-3 text-xs">
                  <AuditLogValueDiff log={log} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper functions
function getActionClassNames(action: string): string {
  switch (action) {
    case 'INSERT': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getRecordDescription(log: AuditLog): string {
  const recordType = log.table_name === 'project_items' ? 'Artículo' : 'Transacción';
  
  let recordName = `#${log.record_id}`;
  
  if (log.table_name === 'project_items') {
    if (log.old_values?.item_name) {
      recordName = log.old_values.item_name;
    } else if (log.new_values?.item_name) {
      recordName = log.new_values.item_name;
    }
  } else if (log.table_name === 'transactions') {
    // For transactions, try to show a more meaningful description if available
    const description = log.old_values?.description || log.new_values?.description;
    if (description) {
      const shortenedDesc = description.length > 30 
        ? description.substring(0, 30) + '...'
        : description;
      recordName = `${recordName} (${shortenedDesc})`;
    }
  }
    
  return `${recordType}: ${recordName}`;
}