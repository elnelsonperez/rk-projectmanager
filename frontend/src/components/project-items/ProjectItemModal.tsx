import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateProjectItem, useUpdateProjectItem, ProjectItem, useProjectAreas } from '../../hooks/useProjectItems'
import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Combobox } from '../ui/Combobox'

interface ProjectItemModalProps {
  isOpen: boolean
  projectId: number
  item?: ProjectItem & { suppliers?: { name: string } | null }
  onClose: () => void
}

type FormData = Omit<ProjectItem, 'id' | 'created_at' | 'updated_at'>

export function ProjectItemModal({
  isOpen,
  projectId,
  item,
  onClose
}: ProjectItemModalProps) {
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(true)
  const createItem = useCreateProjectItem()
  const updateItem = useUpdateProjectItem()
  const { data: areas = [] } = useProjectAreas(projectId)
  
  const isNewItem = !item?.id
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: isNewItem
      ? {
          project_id: projectId,
          item_name: '',
          category: 'Otro',
          quantity: 1,
          estimated_cost: undefined,
          internal_cost: undefined,
          client_cost: undefined,
        }
      : {
          project_id: item.project_id,
          item_name: item.item_name,
          area: item.area || '',
          description: item.description || '',
          supplier_id: item.supplier_id || undefined,
          category: item.category,
          quantity: item.quantity || 1,
          // Ensure cost fields are undefined when NaN, null, or negative
          estimated_cost: item.estimated_cost,
          internal_cost: item.internal_cost,
          client_cost:item.client_cost,
          status: item.status || '',
          notes: item.notes || '',
        }
  })
  
  // Watch form values
  const formValues = watch()

  // Simple synchronization of internal cost to client cost
  useEffect(() => {
    // When internal cost changes, set client cost if it's empty
    const internalCost = formValues.internal_cost;
    
    if (internalCost && !formValues.client_cost) {
      setValue('client_cost', internalCost);
    }
  }, [formValues.internal_cost, setValue, formValues.client_cost])
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isNewItem) {
        await createItem.mutateAsync(data)
      } else if (item?.id) {
        await updateItem.mutateAsync({ id: item.id, ...data })
      }
      
      if (saveAndAddAnother) {
        // Completely reset the form with explicit undefined values for numeric fields
        reset({
          project_id: projectId,
          item_name: '',
          area: '',
          description: '',
          supplier_id: undefined,
          category: 'Otro',
          quantity: 1,
          estimated_cost: undefined,
          internal_cost: undefined,
          client_cost: undefined,
          status: '',
          notes: '',
        })
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error saving project item:', error)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isNewItem ? 'Añadir Elemento de Proyecto' : 'Editar Elemento de Proyecto'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Combobox
                  id="area"
                  registration={register('area')}
                  options={areas}
                  label="Área"
                  placeholder="Área o ubicación"
                  defaultValue={item?.area || ''}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="item_name" className="block font-medium">
                  Nombre del Elemento <span className="text-red-500">*</span>
                </label>
                <input
                  id="item_name"
                  {...register('item_name', { required: 'El nombre del elemento es obligatorio' })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Nombre del elemento"
                />
                {errors.item_name && (
                  <p className="text-red-500 text-sm">{errors.item_name.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="description" className="block font-medium">
                  Descripción
                </label>
                <input
                  id="description"
                  type="text"
                  {...register('description')}
                  className="w-full p-2 border rounded-md"
                  placeholder="Descripción breve del elemento"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="block font-medium">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  {...register('category', { required: 'La categoría es obligatoria' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Material">Material</option>
                  <option value="Mano de Obra">Mano de Obra</option>
                  <option value="Servicio">Servicio</option>
                  <option value="Equipo">Equipo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="quantity" className="block font-medium">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  {...register('quantity', { 
                    valueAsNumber: true,
                    min: { value: 1, message: 'La cantidad debe ser al menos 1' }
                  })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Cantidad"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm">{errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="supplier_id" className="block font-medium">
                  Proveedor
                </label>
                <select
                  id="supplier_id"
                  {...register('supplier_id', { valueAsNumber: true })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Sin proveedor</option>
                  {/* We would fetch and map suppliers here */}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <CurrencyInput
                  id="estimated_cost"
                  registration={register('estimated_cost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'El costo debe ser positivo' }
                  })}
                  label="Costo Estimado"
                  placeholder="0.00"
                  error={errors.estimated_cost?.message}
                />
              </div>
              
              <div>
                <CurrencyInput
                  id="internal_cost"
                  registration={register('internal_cost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'El costo debe ser positivo' }
                  })}
                  label="Costo Interno"
                  placeholder="0.00"
                  error={errors.internal_cost?.message}
                />
              </div>
              
              <div>
                <CurrencyInput
                  id="client_cost"
                  registration={register('client_cost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'El costo debe ser positivo' }
                  })}
                  label="Costo Cliente"
                  placeholder="0.00"
                  error={errors.client_cost?.message}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="status" className="block font-medium">
                  Estado
                </label>
                <input
                  id="status"
                  {...register('status')}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ej: Ordenado, Entregado, Instalado"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="block font-medium">
                Notas
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-background p-4 border-t flex flex-wrap justify-end gap-3">
            <label className="flex items-center mr-auto">
              <input
                type="checkbox"
                checked={saveAndAddAnother}
                onChange={e => setSaveAndAddAnother(e.target.checked)}
                className="mr-2"
              />
              Guardar y añadir otro
            </label>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : isNewItem ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}