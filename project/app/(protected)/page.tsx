'use client';

import { useProjects } from '@/hooks/useProjects';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/utils/formatters';

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Panel</h1>
        <Link href="/projects/new">
          <Button size="sm" className="text-xs sm:text-sm">
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

{isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : projects?.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h3 className="font-medium text-lg mb-2">No hay proyectos</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer proyecto para comenzar.</p>
          <Link href="/projects/new">
            <Button size="sm">Crear Proyecto</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                    Fecha de Inicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                    Presupuesto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects?.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/projects/${project.id}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {project.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {project.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {project.budget ? formatCurrency(project.budget) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
