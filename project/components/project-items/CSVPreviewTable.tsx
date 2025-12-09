import { useForm, Controller } from 'react-hook-form'
import { Combobox } from '../ui/Combobox'
import { Trash2 } from 'lucide-react'

interface PreviewItem {
  row: number
  area: string
  item_name: string
  description: string
  category: 'Muebles' | 'Decoración' | 'Accesorios' | 'Materiales' | 'Mano de Obra' | 'Otro'
  cost: number
  errors: { field: string; message: string }[]
  isValid: boolean
}

interface CSVPreviewTableProps {
  items: PreviewItem[]
  onItemsChange: (items: PreviewItem[]) => void
  onRemoveItem: (index: number) => void
  areas: string[]
}

interface FormData {
  items: Omit<PreviewItem, 'errors' | 'isValid' | 'row'>[]
}

export function CSVPreviewTable({ items, onItemsChange, onRemoveItem, areas }: CSVPreviewTableProps) {
  const { register, control } = useForm<FormData>({
    defaultValues: {
      items: items.map(item => ({
        area: item.area,
        item_name: item.item_name,
        description: item.description,
        category: item.category,
        cost: item.cost
      }))
    }
  })

  const handleFieldChange = (index: number, field: keyof PreviewItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }

    // Re-validate the specific field
    const errors = []
    if (field === 'item_name' && (!value || value.trim() === '')) {
      errors.push({ field: 'item_name', message: 'Nombre requerido' })
    }
    if (field === 'cost' && (value < 0 || isNaN(value))) {
      errors.push({ field: 'cost', message: 'Costo debe ser ≥ 0' })
    }

    updatedItems[index].errors = errors
    updatedItems[index].isValid = errors.length === 0

    onItemsChange(updatedItems)
  }

  const getFieldError = (item: PreviewItem, fieldName: string) => {
    return item.errors.find(err => err.field === fieldName)?.message
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left p-2 font-medium w-[60px]">Fila</th>
            <th className="text-left p-2 font-medium w-[120px]">Área</th>
            <th className="text-left p-2 font-medium w-[140px]">
              Categoría
            </th>
            <th className="text-left p-2 font-medium min-w-[250px]">
              Nombre <span className="text-red-500">*</span>
            </th>
            <th className="text-left p-2 font-medium min-w-[250px]">Descripción</th>
            <th className="text-left p-2 font-medium w-[120px]">Costo</th>
            <th className="text-left p-2 font-medium w-[50px]"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemNameError = getFieldError(item, 'item_name')
            const costError = getFieldError(item, 'cost')
            const hasErrors = !item.isValid

            return (
              <tr
                key={index}
                className={`border-b hover:bg-muted/50 ${hasErrors ? 'bg-red-50/30' : ''}`}
              >
                <td className="p-2 text-sm text-muted-foreground">
                  #{item.row}
                </td>
                <td className="p-2">
                  <Controller
                    name={`items.${index}.area`}
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        id={`area-${index}`}
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value)
                          handleFieldChange(index, 'area', value)
                        }}
                        options={areas}
                        placeholder="Área"
                      />
                    )}
                  />
                </td>
                <td className="p-2">
                  <select
                    {...register(`items.${index}.category`)}
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      register(`items.${index}.category`).onChange(e)
                      handleFieldChange(index, 'category', e.target.value as any)
                    }}
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
                  <div>
                    <input
                      {...register(`items.${index}.item_name`)}
                      className={`w-full p-2 border rounded-md ${itemNameError ? 'border-red-500' : ''}`}
                      placeholder="Nombre del artículo"
                      onChange={(e) => {
                        register(`items.${index}.item_name`).onChange(e)
                        handleFieldChange(index, 'item_name', e.target.value)
                      }}
                    />
                    {itemNameError && (
                      <p className="text-xs text-red-500 mt-1">{itemNameError}</p>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <input
                    {...register(`items.${index}.description`)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Descripción"
                    onChange={(e) => {
                      register(`items.${index}.description`).onChange(e)
                      handleFieldChange(index, 'description', e.target.value)
                    }}
                  />
                </td>
                <td className="p-2">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.cost`, { valueAsNumber: true })}
                      className={`w-full p-2 border rounded-md ${costError ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      onChange={(e) => {
                        register(`items.${index}.cost`).onChange(e)
                        handleFieldChange(index, 'cost', parseFloat(e.target.value))
                      }}
                    />
                    {costError && (
                      <p className="text-xs text-red-500 mt-1">{costError}</p>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar fila"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
