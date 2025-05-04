import { useProjects } from '../hooks/useProjects'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { formatCurrency } from '../utils/formatters'

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Panel</h1>
        <Link to="/projects/new">
          <Button>Nuevo Proyecto</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : projects?.length === 0 ? (
          <div className="col-span-full bg-muted/50 rounded-lg p-8 text-center">
            <h3 className="font-medium text-lg mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-4">Crea tu primer proyecto para comenzar.</p>
            <Link to="/projects/new">
              <Button size="sm">Crear Proyecto</Button>
            </Link>
          </div>
        ) : (
          projects?.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block"
            >
              <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full flex flex-col">
                <h3 className="font-semibold text-xl mb-2">{project.name}</h3>
                
                <div className="mt-auto flex justify-between pt-4 text-sm text-muted-foreground">
                  <div>
                    <p>Estado: {project.status}</p>
                    {project.start_date && (
                      <p>Inicio: {new Date(project.start_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  {project.budget && (
                    <p className="font-medium">
                      {formatCurrency(project.budget)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}