import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useUpdateProject, ProjectInput } from '../hooks/useProjects'
import { useClients, useCreateClient, ClientInput } from '../hooks/useClients'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Combobox } from '../components/ui/Combobox'

// We'll use ProjectInput from our hook for consistency
// We only need to define our form input type that includes the client field

// Extended type with client field for form handling
type ProjectFormInput = ProjectInput & {
  client?: string;
}

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const { data: clients, isLoading: isLoadingClients } = useClients()
  const createClient = useCreateClient()
  const [selectedClient, setSelectedClient] = useState<string>('')
  
  // Debug
  console.log("ProjectId:", projectId)
  console.log("Project data:", project)
  console.log("Loading state:", isLoading)
  console.log("Error state:", error)
  const updateProject = useUpdateProject()
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormInput>()
  
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
      
      // Find and set the client name if client_id exists
      if (project.client_id && clients) {
        const client = clients.find(c => c.id === project.client_id)
        if (client) {
          setSelectedClient(client.name)
        }
      }
    }
  }, [project, clients, reset])
  
  const onSubmit = async (formData: ProjectFormInput) => {
    if (!projectId) return
    
    try {
      // Remove the client field from the data as it's not in the database schema
      // Also ensure client_id is properly typed
      const { client, ...restData } = formData;
      const projectData: ProjectInput = restData;
      
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
      } else {
        // If no client was selected, set client_id to null
        projectData.client_id = null
      }
      
      await updateProject.mutateAsync({
        id: parseInt(projectId),
        ...projectData
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