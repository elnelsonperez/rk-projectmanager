# Audit Log Implementation Plan

## 1. Database Schema and Functions

### A. Create `audit_logs` Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL, -- 'project_items' or 'transactions'
  record_id INTEGER NOT NULL, -- ID of the modified record
  project_id INTEGER NOT NULL, -- For easier filtering by project
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_fields JSONB, -- Store changed fields and values
  old_values JSONB, -- Previous values (for updates and deletes)
  new_values JSONB, -- New values (for inserts and updates)
  user_id UUID, -- Reference to auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX audit_logs_project_id_idx ON audit_logs(project_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
```

### B. Create Trigger Functions

```sql
-- For project_items table
CREATE OR REPLACE FUNCTION log_project_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['item_name', 'estimated_cost', 'internal_cost', 'client_cost'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'project_items', NEW.id, NEW.project_id, 'INSERT',
      NULL, NULL, row_to_json(NEW)::JSONB, auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check important fields for changes
    FOR i IN 1..array_length(important_fields, 1) LOOP
      IF OLD->(important_fields[i]) IS DISTINCT FROM NEW->(important_fields[i]) THEN
        changed_fields := changed_fields || jsonb_build_object(important_fields[i], true);
      END IF;
    END LOOP;
    
    -- Only log if important fields changed
    IF changed_fields != '{}'::JSONB THEN
      INSERT INTO audit_logs (
        table_name, record_id, project_id, action_type, 
        changed_fields, old_values, new_values, user_id
      ) VALUES (
        'project_items', NEW.id, NEW.project_id, 'UPDATE',
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'project_items', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, auth.uid()
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similar function for transactions table
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}'::JSONB;
  important_fields TEXT[] := ARRAY['amount', 'client_facing_amount', 'project_item_id'];
BEGIN
  -- Similar implementation to project_items, adjusted for transactions
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'transactions', NEW.id, NEW.project_id, 'INSERT',
      NULL, NULL, row_to_json(NEW)::JSONB, auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check important fields for changes
    FOR i IN 1..array_length(important_fields, 1) LOOP
      IF OLD->(important_fields[i]) IS DISTINCT FROM NEW->(important_fields[i]) THEN
        changed_fields := changed_fields || jsonb_build_object(important_fields[i], true);
      END IF;
    END LOOP;
    
    -- Only log if important fields changed
    IF changed_fields != '{}'::JSONB THEN
      INSERT INTO audit_logs (
        table_name, record_id, project_id, action_type, 
        changed_fields, old_values, new_values, user_id
      ) VALUES (
        'transactions', NEW.id, NEW.project_id, 'UPDATE',
        changed_fields, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, project_id, action_type, 
      changed_fields, old_values, new_values, user_id
    ) VALUES (
      'transactions', OLD.id, OLD.project_id, 'DELETE',
      NULL, row_to_json(OLD)::JSONB, NULL, auth.uid()
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### C. Add Triggers to Tables

```sql
CREATE TRIGGER project_items_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON project_items
FOR EACH ROW EXECUTE FUNCTION log_project_item_changes();

CREATE TRIGGER transactions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();
```

### D. Create Retrieval Function

```sql
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_project_id INTEGER DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
) 
RETURNS TABLE (
  id INTEGER,
  table_name TEXT,
  record_id INTEGER,
  project_id INTEGER,
  project_name TEXT,
  action_type TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.table_name, a.record_id, a.project_id, 
    p.name as project_name,
    a.action_type, a.changed_fields, a.old_values, a.new_values, 
    a.user_id, u.email as user_email, a.created_at
  FROM 
    audit_logs a
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN auth.users u ON a.user_id = u.id
  WHERE 
    (p_project_id IS NULL OR a.project_id = p_project_id) AND
    (p_start_date IS NULL OR a.created_at >= p_start_date) AND
    (p_end_date IS NULL OR a.created_at <= p_end_date)
  ORDER BY a.created_at DESC
  LIMIT p_page_size
  OFFSET ((p_page - 1) * p_page_size);
END;
$$ LANGUAGE plpgsql;
```

## 2. Backend Integration

### A. Database Types Update

Update the TypeScript database types to include the new audit log structure.

```typescript
// In frontend/src/types/database.types.ts
export type AuditLog = {
  id: number;
  table_name: string;
  record_id: number;
  project_id: number;
  project_name: string | null;
  action_type: string;
  changed_fields: Record<string, boolean> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
};
```

### B. Create React Query Hook

```typescript
// In frontend/src/hooks/useAuditLogs.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AuditLog } from '../types/database.types';

interface UseAuditLogsParams {
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
}

export function useAuditLogs({
  projectId,
  startDate,
  endDate,
  page = 1,
  pageSize = 20
}: UseAuditLogsParams) {
  return useQuery({
    queryKey: ['auditLogs', projectId, startDate, endDate, page, pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .rpc('get_audit_logs', {
          p_project_id: projectId || null,
          p_start_date: startDate?.toISOString() || null,
          p_end_date: endDate?.toISOString() || null,
          p_page: page,
          p_page_size: pageSize
        });

      if (error) throw error;
      return { logs: data as AuditLog[], total: count || 0 };
    }
  });
}
```

## 3. Frontend Implementation

### A. Create AuditLogPage Component

```typescript
// In frontend/src/pages/AuditLogsPage.tsx
import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLogTable } from '../components/audit/AuditLogTable';
import { AuditLogFilters } from '../components/audit/AuditLogFilters';
import { Pagination } from '../components/ui/pagination';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    projectId: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const { data, isLoading } = useAuditLogs({
    ...filters,
    page,
    pageSize
  });
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Audit Logs</h1>
      
      <AuditLogFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <AuditLogTable 
        logs={data?.logs || []} 
        isLoading={isLoading} 
      />
      
      {data?.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(data.total / pageSize)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

### B. Create ProjectAuditLogsPage Component

```typescript
// In frontend/src/pages/ProjectAuditLogsPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useProject } from '../hooks/useProjects';
import { AuditLogTable } from '../components/audit/AuditLogTable';
import { AuditLogFilters } from '../components/audit/AuditLogFilters';
import { Pagination } from '../components/ui/pagination';

export default function ProjectAuditLogsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [filters, setFilters] = useState({
    startDate: undefined,
    endDate: undefined,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const { data: project } = useProject(projectId);
  const { data, isLoading } = useAuditLogs({
    projectId: Number(projectId),
    ...filters,
    page,
    pageSize
  });
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Audit Logs: {project?.name || 'Loading...'}
      </h1>
      
      <AuditLogFilters 
        filters={filters} 
        onFilterChange={setFilters}
        hideProjectFilter={true}
      />
      
      <AuditLogTable 
        logs={data?.logs || []} 
        isLoading={isLoading} 
      />
      
      {data?.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(data.total / pageSize)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

### C. Create AuditLogTable Component

```typescript
// In frontend/src/components/audit/AuditLogTable.tsx
import { AuditLog } from '../../types/database.types';
import { formatDateTime } from '../../utils/formatters';
import { AuditLogValueDiff } from './AuditLogValueDiff';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return <div className="spinner" />;
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        No audit logs found for the selected filters.
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-semibold">Date/Time</th>
            <th className="px-3 py-3 text-left text-xs font-semibold">User</th>
            <th className="px-3 py-3 text-left text-xs font-semibold">Project</th>
            <th className="px-3 py-3 text-left text-xs font-semibold">Action</th>
            <th className="px-3 py-3 text-left text-xs font-semibold">Record</th>
            <th className="px-3 py-3 text-left text-xs font-semibold">Changes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-muted/10">
              <td className="px-3 py-3 text-xs">{formatDateTime(log.created_at)}</td>
              <td className="px-3 py-3 text-xs">{log.user_email || 'System'}</td>
              <td className="px-3 py-3 text-xs">{log.project_name}</td>
              <td className="px-3 py-3 text-xs">
                <span className={`inline-block px-2 py-1 rounded ${getActionClassNames(log.action_type)}`}>
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
  );
}

// Helper functions
function getActionClassNames(action: string): string {
  switch (action) {
    case 'INSERT': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100';
  }
}

function getRecordDescription(log: AuditLog): string {
  const recordType = log.table_name === 'project_items' ? 'Item' : 'Transaction';
  const recordName = log.table_name === 'project_items' 
    ? (log.old_values?.item_name || log.new_values?.item_name || `#${log.record_id}`)
    : `#${log.record_id}`;
    
  return `${recordType}: ${recordName}`;
}
```

### D. Create AuditLogValueDiff Component

```typescript
// In frontend/src/components/audit/AuditLogValueDiff.tsx
import { useState } from 'react';
import { AuditLog } from '../../types/database.types';
import { formatCurrency } from '../../utils/formatters';

interface AuditLogValueDiffProps {
  log: AuditLog;
}

export function AuditLogValueDiff({ log }: AuditLogValueDiffProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (log.action_type === 'INSERT') {
    return (
      <div>
        <span className="text-green-600">New {log.table_name === 'project_items' ? 'item' : 'transaction'} created</span>
        {expanded && renderNewValues(log)}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="ml-2 text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>
    );
  }
  
  if (log.action_type === 'DELETE') {
    return (
      <div>
        <span className="text-red-600">{log.table_name === 'project_items' ? 'Item' : 'Transaction'} deleted</span>
        {expanded && renderDeletedValues(log)}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="ml-2 text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>
    );
  }
  
  // For updates
  const changedFields = log.changed_fields ? Object.keys(log.changed_fields) : [];
  
  if (changedFields.length === 0) {
    return <span className="text-muted-foreground">No important fields changed</span>;
  }
  
  return (
    <div>
      <div>
        {changedFields.map(field => (
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
      
      {changedFields.length > 2 && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-xs text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Show all changes'}
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
  
  return String(value);
}

function renderNewValues(log: AuditLog) {
  if (!log.new_values) return null;
  
  // Display important fields only
  const fields = log.table_name === 'project_items' 
    ? ['item_name', 'estimated_cost', 'internal_cost', 'client_cost'] 
    : ['amount', 'client_facing_amount', 'project_item_id'];
  
  return (
    <div className="mt-1 pl-2 border-l-2 border-green-300">
      {fields.map(field => (
        log.new_values?.[field] !== undefined && (
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
    ? ['item_name', 'estimated_cost', 'internal_cost', 'client_cost'] 
    : ['amount', 'client_facing_amount', 'project_item_id'];
  
  return (
    <div className="mt-1 pl-2 border-l-2 border-red-300">
      {fields.map(field => (
        log.old_values?.[field] !== undefined && (
          <div key={field} className="text-xs">
            <span className="font-medium">{formatFieldName(field)}: </span>
            <span>{formatFieldValue(field, log.old_values[field])}</span>
          </div>
        )
      ))}
    </div>
  );
}
```

### E. Create AuditLogFilters Component

```typescript
// In frontend/src/components/audit/AuditLogFilters.tsx
import { useProjects } from '../../hooks/useProjects';
import { DatePicker } from '../ui/date-picker';
import { ComboboxObject } from '../ui/ComboboxObject';

interface AuditLogFiltersProps {
  filters: {
    projectId?: number;
    startDate?: Date;
    endDate?: Date;
  };
  onFilterChange: (filters: any) => void;
  hideProjectFilter?: boolean;
}

export function AuditLogFilters({ filters, onFilterChange, hideProjectFilter = false }: AuditLogFiltersProps) {
  const { data: projects } = useProjects();
  
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  return (
    <div className="mb-4 p-4 border rounded-lg bg-muted/10">
      <h2 className="text-sm font-semibold mb-3">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!hideProjectFilter && (
          <div>
            <ComboboxObject
              id="projectId"
              label="Project"
              placeholder="All projects"
              options={(projects || []).map(project => ({
                value: project.id,
                label: project.name
              }))}
              value={filters.projectId}
              onChange={(value) => handleFilterChange('projectId', value)}
              emptyOption="All projects"
            />
          </div>
        )}
        
        <div>
          <DatePicker
            id="startDate"
            label="From Date"
            placeholder="All time"
            value={filters.startDate}
            onChange={(date) => handleFilterChange('startDate', date)}
          />
        </div>
        
        <div>
          <DatePicker
            id="endDate"
            label="To Date"
            placeholder="Current date"
            value={filters.endDate}
            onChange={(date) => handleFilterChange('endDate', date)}
          />
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onFilterChange({ projectId: undefined, startDate: undefined, endDate: undefined })}
          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
```

### F. Update Navigation Components

```typescript
// Update Sidebar.tsx to include audit logs link
// Add a new route in the router configuration

// Update ProjectPage.tsx to add audit logs option to the dropdown menu
// In the DropdownMenu items array:
{
  label: "View Audit Logs",
  onClick: () => navigate(`/projects/${projectId}/audit-logs`),
  icon: <History className="h-4 w-4" />
}
```

## 4. Implementation Steps

1. **Database Changes**:
   - Create the audit_logs table
   - Create trigger functions for project_items and transactions
   - Implement the get_audit_logs function

2. **TypeScript Types**:
   - Update database.types.ts with AuditLog type

3. **Backend Integration**:
   - Create useAuditLogs hook

4. **UI Components**:
   - Implement AuditLogTable component
   - Implement AuditLogValueDiff component for displaying changes
   - Create AuditLogFilters component
   - Create pagination component if not already available

5. **Pages**:
   - Create main AuditLogsPage
   - Create ProjectAuditLogsPage
   
6. **Navigation**:
   - Update sidebar navigation
   - Add route configuration
   - Add menu option in project page

7. **Testing**:
   - Test database triggers by making changes
   - Verify proper recording of changes
   - Test UI components with sample data
   - Test filtering and pagination