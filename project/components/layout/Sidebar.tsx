'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '../../hooks/useProjects';
import { Spinner } from '../ui/spinner';
import { cn } from '../../lib/utils';

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { data: projects, isLoading } = useProjects();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    // Exact match or starts with path followed by '/'
    return pathname === path || pathname.startsWith(path + '/');
  };
  
  return (
    <div className="h-full py-4 flex flex-col">
      <div className="px-3 py-2">
        {!collapsed && <h2 className="mb-2 px-4 text-lg font-semibold">Panel</h2>}
        <div className="space-y-1">
          <Link
            href="/"
            className={cn(
              'flex items-center py-2 rounded-md',
              collapsed ? 'justify-center px-2' : 'px-4',
              isActive('/')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            title="Resumen"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ) : (
              <span>Resumen</span>
            )}
          </Link>

          <Link
            href="/audit-logs"
            className={cn(
              'flex items-center py-2 rounded-md',
              collapsed ? 'justify-center px-2' : 'px-4',
              isActive('/audit-logs')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            title="Registro de Cambios"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ) : (
              <span>Registro de Cambios</span>
            )}
          </Link>

          <Link
            href="/cotizaciones"
            className={cn(
              'flex items-center py-2 rounded-md',
              collapsed ? 'justify-center px-2' : 'px-4',
              isActive('/cotizaciones')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            title="Cotizaciones"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <span>Cotizaciones</span>
            )}
          </Link>
        </div>
      </div>
      
      <div className="px-3 py-2 flex-1 overflow-auto">
        <div className={cn('flex items-center mb-2', collapsed ? 'justify-center' : 'justify-between px-4')}>
          {!collapsed && <h2 className="text-lg font-semibold">Proyectos</h2>}
          <Link
            href="/projects/new"
            className={cn(
              collapsed
                ? 'flex items-center justify-center p-2'
                : 'text-xs text-blue-600 hover:text-blue-800 font-medium'
            )}
            title="Nuevo Proyecto"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ) : (
              'Nuevo'
            )}
          </Link>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          ) : projects?.length === 0 ? (
            <p className={cn('text-sm text-muted-foreground', collapsed ? 'text-center py-2' : 'px-4 py-2')}>
              {collapsed ? '...' : 'No se encontraron proyectos.'}
            </p>
          ) : (
            projects?.map((project) => {
              const isProjectActive = isActive(`/projects/${project.id}`);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={cn(
                    'flex items-center py-2 text-sm rounded-md',
                    collapsed ? 'justify-center px-2' : 'px-4 truncate',
                    isProjectActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  title={project.name}
                >
                  {collapsed ? (
                    <div
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                        isProjectActive
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {project.name.charAt(0)}
                    </div>
                  ) : (
                    project.name
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}