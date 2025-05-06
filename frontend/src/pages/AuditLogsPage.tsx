import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLogTable } from '../components/audit/AuditLogTable';
import { AuditLogFilters } from '../components/audit/AuditLogFilters';
import { Pagination } from '../components/ui/pagination';

export default function AuditLogsPage() {
  // Filters state
  const [filters, setFilters] = useState({
    projectId: undefined as number | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Fetch audit logs with current filters and pagination
  const { data, isLoading } = useAuditLogs({
    ...filters,
    page,
    pageSize
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };
  
  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);
  
  return (
    <div className="container max-w-[1600px] mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Registro de Cambios</h1>
      
      {/* Filters */}
      <AuditLogFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* Audit Logs Table */}
      <AuditLogTable 
        logs={data?.logs || []} 
        isLoading={isLoading}
        showProjectColumn={true}
      />
      
      {/* Pagination */}
      {data && data.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(data.total / pageSize)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}