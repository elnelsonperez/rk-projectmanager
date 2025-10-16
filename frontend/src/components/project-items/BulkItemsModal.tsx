import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useCreateProjectItem, useProjectAreas } from '../../hooks/useProjectItems'
import { useSuppliers } from '../../hooks/useSuppliers'
import { Button } from '../ui/button'
import { Combobox } from '../ui/Combobox'
import { ComboboxObject } from '../ui/ComboboxObject'
import { toast } from '../ui/toast'
import { Trash2, Plus } from 'lucide-react'

interface BulkItemsModalProps {
  isOpen: boolean
  projectId: number
  onClose: () => void
}

interface BulkItemFormData {
  items: {
    area: string
    item_name: string
    description: string
    category: 'Muebles' | 'Decoración' | 'Accesorios' | 'Materiales' | 'Mano de Obra' | 'Otro'
    supplier_id?: number
    cost: number | undefined
  }[]
}

export function BulkItemsModal({ isOpen, projectId, onClose }: BulkItemsModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const createItem = useCreateProjectItem()
  const { data: areas = [] } = useProjectAreas(projectId)
  const { data: suppliers = [] } = useSuppliers()

  const { register, control, handleSubmit, formState: { errors } } = useForm<BulkItemFormData>({
    defaultValues: {
      items: [
        {
          area: '',
          item_name: '',
          description: '',
          category: 'Otro',
          supplier_id: undefined,
          cost: undefined
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const onSubmit = async (data: BulkItemFormData) => {
    setIsSaving(true)

    try {
      let successCount = 0
      let failCount = 0

      for (const item of data.items) {
        // Skip empty rows (rows with no item name)
        if (!item.item_name.trim()) continue

        try {
          await createItem.mutateAsync({
            project_id: projectId,
            item_name: item.item_name,
            area: item.area || undefined,
            description: item.description || undefined,
            category: item.category,
            supplier_id: item.supplier_id || undefined,
            quantity: 1,
            // Save the single cost to all three cost fields
            estimated_cost: item.cost,
            internal_cost: item.cost,
            client_cost: item.cost
          })
          successCount++
        } catch (error) {
          console.error(`Error creating item "${item.item_name}":`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          message: `${successCount} artículo${successCount > 1 ? 's' : ''} creado${successCount > 1 ? 's' : ''} exitosamente`,
          type: 'success'
        })
      }

      if (failCount > 0) {
        toast({
          message: `${failCount} artículo${failCount > 1 ? 's' : ''} no pudo${failCount > 1 ? 'ieron' : ''} ser creado${failCount > 1 ? 's' : ''}`,
          type: 'error'
        })
      }

      if (failCount === 0) {
        onClose()
      }
    } catch (error) {
      console.error('Error in bulk creation:', error)
      toast({
        message: 'Error al crear los artículos',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addRow = () => {
    append({
      area: '',
      item_name: '',
      description: '',
      category: 'Otro',
      supplier_id: undefined,
      cost: undefined
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop that doesn't close on click */}
      <div className="fixed inset-0 bg-black/50" />

      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] min-h-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Creación Masiva de Artículos</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Table Container */}
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b">
                  <th className="text-left p-2 font-medium min-w-[150px]">Área</th>
                  <th className="text-left p-2 font-medium min-w-[120px]">
                    Categoría <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left p-2 font-medium min-w-[200px]">
                    Nombre <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left p-2 font-medium min-w-[200px]">Descripción</th>
                  <th className="text-left p-2 font-medium min-w-[200px]">Proveedor</th>
                  <th className="text-left p-2 font-medium min-w-[150px]">Costo</th>
                  <th className="text-left p-2 font-medium w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Controller
                        name={`items.${index}.area`}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            id={`area-${index}`}
                            value={field.value || ''}
                            onChange={field.onChange}
                            options={areas}
                            placeholder="Área"
                          />
                        )}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        {...register(`items.${index}.category`, { required: 'Requerido' })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="Muebles">Muebles</option>
                        <option value="Decoración">Decoración</option>
                        <option value="Accesorios">Accesorios</option>
                        <option value="Materiales">Materiales</option>
                        <option value="Mano de Obra">Mano de Obra</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.item_name`, { required: 'Requerido' })}
                        className={`w-full p-2 border rounded-md ${errors.items?.[index]?.item_name ? 'border-red-500' : ''}`}
                        placeholder="Nombre del artículo"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.description`)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Descripción"
                      />
                    </td>
                    <td className="p-2">
                      <Controller
                        name={`items.${index}.supplier_id`}
                        control={control}
                        render={({ field }) => (
                          <ComboboxObject
                            id={`supplier-${index}`}
                            value={field.value}
                            onChange={field.onChange}
                            options={suppliers.map(supplier => ({
                              value: supplier.id,
                              label: supplier.name,
                              description: supplier.contact_name || undefined
                            }))}
                            placeholder="Proveedor"
                            emptyOption="Sin proveedor"
                          />
                        )}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.cost`, {
                          valueAsNumber: true,
                          min: { value: 0, message: 'Debe ser positivo' }
                        })}
                        className="w-full p-2 border rounded-md"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-2">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-background p-4 border-t flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir Fila
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Todos'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
