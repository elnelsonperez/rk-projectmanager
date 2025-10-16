import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useCreateProjectItem, useUpdateProjectItem, useDeleteProjectItem, ProjectItem, useProjectAreas } from '../../hooks/useProjectItems'
import { useSuppliers } from '../../hooks/useSuppliers'
import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/CurrencyInput'
import { Combobox } from '../ui/Combobox'
import { ComboboxObject } from '../ui/ComboboxObject'
import { toast } from '../ui/toast'
import { ConfirmationDialog } from '../ui/confirmation-dialog'
import { InfoTooltip } from '../ui/InfoTooltip'
import { Trash2 } from 'lucide-react'

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
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isNewItem = !item?.id
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(isNewItem)
  const createItem = useCreateProjectItem()
  const updateItem = useUpdateProjectItem()
  const deleteItem = useDeleteProjectItem()
  const { data: areas = [] } = useProjectAreas(projectId)
  const { data: suppliers = [] } = useSuppliers()
  
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: isNewItem
      ? {
          project_id: projectId,
          item_name: '',
          category: 'Otro', // One of the enum values: 'Muebles', 'Decoración', 'Accesorios', 'Materiales', 'Mano de Obra', 'Otro'
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
          notes: item.notes || '',
        }
  })


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
  
  // Handle project item deletion
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!item?.id) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the project item
      await deleteItem.mutateAsync({ id: item.id, projectId });
      
      toast({ 
        message: `"${item.item_name}" ha sido eliminado exitosamente`, 
        type: 'success' 
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting project item:', error);
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      
      toast({ 
        message: `Error al eliminar el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        type: 'error'
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isNewItem) {
        await createItem.mutateAsync(data)
        toast({ 
          message: `"${data.item_name}" ha sido creado exitosamente`, 
          type: 'success' 
        })
      } else if (item?.id) {
        await updateItem.mutateAsync({ id: item.id, ...data })
        toast({ 
          message: `"${data.item_name}" ha sido actualizado exitosamente`, 
          type: 'success'
        })
      }
      
      if (saveAndAddAnother) {
        // Completely reset the form with explicit undefined values for numeric fields
        reset({
          project_id: projectId,
          item_name: '',
          area: '',
          description: '',
          supplier_id: undefined,
          category: 'Otro', // Using one of the enum values: 'Muebles', 'Decoración', 'Accesorios', 'Materiales', 'Mano de Obra', 'Otro'
          quantity: 1,
          estimated_cost: undefined,
          internal_cost: undefined,
          client_cost: undefined,
          notes: '',
        })
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error saving project item:', error)
      toast({ 
        message: `Error al guardar el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        type: 'error'
      })
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showDeleteConfirmation}
        title="Eliminar Artículo"
        message="¿Estás seguro que deseas eliminar este artículo? Esta acción no se puede deshacer y también eliminará todas las transacciones asociadas a este artículo."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmColor="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded-lg">
            <div className="text-center">
              <div className="spinner mb-2"></div>
              <p>Eliminando artículo...</p>
            </div>
          </div>
        )}
      
        <div className="sticky top-0 bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isNewItem ? 'Añadir Artículo de Proyecto' : 'Editar Artículo de Proyecto'}
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
                <Controller
                  name="area"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Combobox
                      id="area"
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={areas}
                      label="Área"
                      placeholder="Área o ubicación"
                    />
                  )}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="item_name" className="block font-medium">
                  Nombre del Artículo <span className="text-red-500">*</span>
                </label>
                <input
                  id="item_name"
                  {...register('item_name', { required: 'El nombre del artículo es obligatorio' })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Nombre del artículo"
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
                  placeholder="Descripción breve del artículo"
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
                  <option value="Muebles">Muebles</option>
                  <option value="Decoración">Decoración</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Materiales">Materiales</option>
                  <option value="Mano de Obra">Mano de Obra</option>
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
                <Controller
                  name="supplier_id"
                  control={control}
                  render={({ field }) => (
                    <ComboboxObject
                      id="supplier_id"
                      value={field.value}
                      onChange={field.onChange}
                      options={suppliers.map(supplier => ({
                        value: supplier.id,
                        label: supplier.name,
                        description: supplier.contact_name || undefined
                      }))}
                      label="Proveedor"
                      placeholder="Seleccionar proveedor"
                      emptyOption="Sin proveedor"
                    />
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="estimated_cost"
                    registration={register('estimated_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Presupuesto Inicial"
                    placeholder="0.00"
                    error={errors.estimated_cost?.message}
                  />
                  <InfoTooltip text="El costo estimado inicialmente para este artículo" />
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="internal_cost"
                    registration={register('internal_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Costo Interno Real"
                    placeholder="0.00"
                    error={errors.internal_cost?.message}
                  />
                  <InfoTooltip text="Lo que realmente pagamos al proveedor (puede incluir descuentos)" />
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="client_cost"
                    registration={register('client_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Costo Confirmado al Cliente"
                    placeholder="0.00"
                    error={errors.client_cost?.message}
                  />
                  <InfoTooltip text="El costo total confirmado a cobrar al cliente por este artículo" />
                </div>
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
          
          <div className="sticky bottom-0 bg-background p-4 border-t flex flex-wrap justify-between gap-3">
            <div>
              {!isNewItem && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              <label className="flex items-center">
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
          </div>
        </form>
      </div>
    </div>
  )
}