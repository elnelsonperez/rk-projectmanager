import { Database } from './database.types';

/**
 * Custom type for representing an audit log entry.
 * This extends the result of the get_audit_logs function.
 */
export type AuditLog = {
  id: number;
  table_name: string;
  record_id: number;
  project_id: number;
  project_name: string;
  action_type: string;
  changed_fields: Record<string, boolean> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
};

/**
 * Response from the get_audit_logs function
 */
export type AuditLogResponse = Database['public']['Functions']['get_audit_logs']['Returns'][0] & {
  total_count: number;
};

/**
 * The result returned from the useAuditLogs hook
 */
export type AuditLogsResult = {
  logs: AuditLog[];
  total: number;
};

/**
 * Parameters for filtering audit logs
 */
export type AuditLogFilters = {
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
};