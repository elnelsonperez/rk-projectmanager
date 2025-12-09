import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AuditLogFilters, AuditLogsResult, AuditLogResponse, AuditLog } from '../types/audit.types';

/**
 * Hook for fetching audit logs with filtering and pagination
 */
export function useAuditLogs({
  projectId,
  startDate,
  endDate,
  page = 1,
  pageSize = 20
}: AuditLogFilters) {
  return useQuery<AuditLogsResult>({
    queryKey: ['auditLogs', projectId, startDate?.toISOString(), endDate?.toISOString(), page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_audit_logs', {
          p_project_id: projectId || undefined,
          p_start_date: startDate?.toISOString() || undefined,
          p_end_date: endDate?.toISOString() || undefined,
          p_page: page,
          p_page_size: pageSize
        });

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      // Extract the total from first row (all rows have same total)
      const total = data && data.length > 0 ? (data[0] as AuditLogResponse).total_count : 0;
      
      return { 
        logs: data as AuditLog[], 
        total
      };
    }
  });
}