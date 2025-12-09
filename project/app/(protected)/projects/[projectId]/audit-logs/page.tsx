'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useProject } from '@/hooks/useProjects';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { AuditLogFilters } from '@/components/audit/AuditLogFilters';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';

export default function ProjectAuditLogsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);

  // Filters state (projectId is fixed based on route)
  const [filters, setFilters] = useState({
    projectId: Number(projectId),
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch audit logs with current filters and pagination
  const { data, isLoading: isLoadingLogs } = useAuditLogs({
    ...filters,
    page,
    pageSize
  });

  // Handle filter changes (preserving projectId)
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters({
      ...newFilters,
      projectId: Number(projectId), // Always preserve project ID
    });
    setPage(1); // Reset to first page when filters change
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  // Handle changing project ID when route params change
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      projectId: Number(projectId),
    }));
  }, [projectId]);

  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container max-w-[1600px] mx-auto px-4 py-6">
        <div className="text-center p-8">
          <p className="text-lg mb-4">Proyecto no encontrado</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al Panel Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[1600px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Historial de Cambios: {project.name}</h1>
        <Link href={`/projects/${projectId}`} className="text-blue-600 hover:underline mt-2 sm:mt-0">
          Volver al Proyecto
        </Link>
      </div>

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        hideProjectFilter={true}
      />

      {/* Audit Logs Table */}
      <AuditLogTable
        logs={data?.logs || []}
        isLoading={isLoadingLogs}
        showProjectColumn={false}
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
