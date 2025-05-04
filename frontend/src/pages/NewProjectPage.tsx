
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCreateProject } from '../hooks/useProjects'
import { Button } from '../components/ui/button'
import { Database } from '../types/database.types'

// Use the project insert type directly from the database types
type ProjectInput = Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'created_at' | 'updated_at'>

export default function NewProjectPage() {
  const navigate = useNavigate()
  const createProject = useCreateProject()
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectInput>({
    defaultValues: {
      name: '',
      status: 'Planificación',
      notes: '',
      row_index: 0, // Will be auto-incremented by database trigger
    }
  })
  
  const onSubmit = async (data: ProjectInput) => {
    try {

      const newProject = await createProject.mutateAsync(data as any)
      navigate(`/projects/${newProject.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Nuevo Proyecto</h1>
      
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
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>
    </div>
  )
}