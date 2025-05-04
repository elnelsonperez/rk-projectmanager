
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCreateProject, ProjectInput } from '../hooks/useProjects'
import { useClients, useCreateClient, ClientInput } from '../hooks/useClients'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Combobox } from '../components/ui/Combobox'

// We'll use ProjectInput from our hook

export default function NewProjectPage() {
  const navigate = useNavigate()
  const createProject = useCreateProject()
  const { data: clients, isLoading: isLoadingClients } = useClients()
  const createClient = useCreateClient()
  const [selectedClient, setSelectedClient] = useState<string>('')
  
  // Extended type with client field for form handling
  type ProjectFormInput = ProjectInput & {
    client?: string;
  }
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectFormInput>({
    defaultValues: {
      name: '',
      status: 'Planificación',
      notes: '',
    }
  })
  
  const onSubmit = async (formData: ProjectFormInput) => {
    try {
      // Remove the client field from the data as it's not in the database schema
      // Also ensure client_id is properly typed
      const { client, ...restData } = formData;
      
      // Create a clean project data object with properly handled dates
      const projectData: ProjectInput = {
        ...restData,
        // Ensure empty date strings are converted to null
        start_date: restData.start_date && restData.start_date !== '' ? restData.start_date : null,
        estimated_completion: restData.estimated_completion && restData.estimated_completion !== '' ? restData.estimated_completion : null
      };
      
      // If a client was selected, make sure it exists or create it
      if (selectedClient) {
        let clientId: number | null = null
        
        // Check if this is an existing client
        const existingClient = clients?.find(c => c.name === selectedClient)
        
        if (existingClient) {
          clientId = existingClient.id
        } else {
          // Create a new client
          const clientData: ClientInput = {
            name: selectedClient
          }
          const newClient = await createClient.mutateAsync(clientData)
          clientId = newClient.id
        }
        
        // Set the client ID in the data to be submitted
        projectData.client_id = clientId
      }

      const newProject = await createProject.mutateAsync(projectData)
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
          <label htmlFor="client" className="block font-medium">
            Cliente
          </label>
          {isLoadingClients ? (
            <div className="w-full p-2 border rounded-md flex items-center">
              <Spinner size="sm" className="mr-2" /> Cargando clientes...
            </div>
          ) : (
            <Combobox
              id="client"
              options={clients?.map(client => client.name) || []}
              registration={register('client', {
                required: false,
                onChange: (e) => setSelectedClient(e.target.value)
              })}
              defaultValue={selectedClient}
              placeholder="Seleccionar o crear un cliente"
            />
          )}
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