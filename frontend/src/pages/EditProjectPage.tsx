import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'

import { Database } from '../types/database.types'

// Define the ProjectInput type to match the database Update type
type ProjectInput = Partial<Database['public']['Tables']['projects']['Update']> & { 
  id?: number
}

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  
  // Debug
  console.log("ProjectId:", projectId)
  console.log("Project data:", project)
  console.log("Loading state:", isLoading)
  console.log("Error state:", error)
  const updateProject = useUpdateProject()
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectInput>()
  
  // Load project data into form
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        client_id: project.client_id || undefined,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : undefined,
        estimated_completion: project.estimated_completion ? new Date(project.estimated_completion).toISOString().split('T')[0] : undefined,
        budget: project.budget,
        status: project.status,
        notes: project.notes || '',
      })
    }
  }, [project, reset])
  
  const onSubmit = async (data: ProjectInput) => {
    if (!projectId) return
    
    try {
      await updateProject.mutateAsync({
        id: parseInt(projectId),
        ...data
      })
      navigate(`/projects/${projectId}`)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Proyecto no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El proyecto que buscas no existe o no tienes acceso a él.
        </p>
        <Button onClick={() => navigate('/')}>
          Volver al Panel
        </Button>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Editar Proyecto</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block font-medium">
            Nombre del Proyecto
          </label>
          <input
            id="name"
            {...register('name', { required: 'El nombre del proyecto es obligatorio' })}
            className="w-full p-2 border rounded-md"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="client_id" className="block font-medium">
            Cliente
          </label>
          <select
            id="client_id"
            {...register('client_id')}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Sin cliente</option>
            {/* We would fetch and map clients here */}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="start_date" className="block font-medium">
              Fecha de Inicio
            </label>
            <input
              type="date"
              id="start_date"
              {...register('start_date')}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="estimated_completion" className="block font-medium">
              Fecha Estimada de Finalización
            </label>
            <input
              type="date"
              id="estimated_completion"
              {...register('estimated_completion')}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="budget" className="block font-medium">
              Presupuesto
            </label>
            <input
              type="number"
              id="budget"
              step="0.01"
              min="0"
              {...register('budget', { 
                valueAsNumber: true,
                validate: value => !value || value >= 0 || 'El presupuesto debe ser positivo'
              })}
              className="w-full p-2 border rounded-md"
            />
            {errors.budget && (
              <p className="text-red-500 text-sm">{errors.budget.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="status" className="block font-medium">
              Estado
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full p-2 border rounded-md"
            >
              <option value="Planificación">Planificación</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
              <option value="En Pausa">En Pausa</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="notes" className="block font-medium">
            Notas
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}