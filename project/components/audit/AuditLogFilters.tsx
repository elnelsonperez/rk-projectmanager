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

export function AuditLogFilters({ 
  filters, 
  onFilterChange, 
  hideProjectFilter = false 
}: AuditLogFiltersProps) {
  const { data: projects } = useProjects();
  
  const handleFilterChange = (key: string, value: number | string | Date | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  const handleClearFilters = () => {
    onFilterChange({ 
      projectId: hideProjectFilter ? filters.projectId : undefined, 
      startDate: undefined, 
      endDate: undefined 
    });
  };
  
  // Determine if filters are active
  const hasActiveFilters = (!hideProjectFilter && filters.projectId) || 
    filters.startDate || 
    filters.endDate;
  
  return (
    <div className="mb-4 p-4 border rounded-lg bg-muted/10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Restablecer Filtros
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!hideProjectFilter && (
          <div>
            <ComboboxObject
              id="projectFilter"
              label="Proyecto"
              placeholder="Todos los proyectos"
              options={(projects || []).map(project => ({
                value: project.id,
                label: project.name
              }))}
              value={filters.projectId}
              onChange={(value) => handleFilterChange('projectId', value)}
              emptyOption="Todos los proyectos"
            />
          </div>
        )}
        
        <div>
          <DatePicker
            id="startDate"
            label="Fecha Desde"
            placeholder="Todo el tiempo"
            value={filters.startDate}
            onChange={(date) => handleFilterChange('startDate', date)}
          />
        </div>
        
        <div>
          <DatePicker
            id="endDate"
            label="Fecha Hasta"
            placeholder="Fecha actual"
            value={filters.endDate}
            onChange={(date) => handleFilterChange('endDate', date)}
          />
        </div>
      </div>
    </div>
  );
}