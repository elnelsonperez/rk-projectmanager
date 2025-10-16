import { useState } from 'react'
import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useProjectItems, useBulkDeleteProjectItems } from '../../hooks/useProjectItems'
import { ProjectItem } from '../../hooks/useProjectItems'
import { PlusSquare, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'
import { Button } from '../ui/button'
import { ConfirmationDialog } from '../ui/confirmation-dialog'
import { toast } from '../ui/toast'

type ProjectItemWithSupplier = ProjectItem & { 
  suppliers: { name: string } | null 
}

interface ProjectItemsTableProps {
  projectId: number
  onEditItem: (item: ProjectItemWithSupplier) => void
  onCreateTransaction?: (item: ProjectItemWithSupplier) => void
  onBulkCreate?: () => void
}

export function ProjectItemsTable({ projectId, onEditItem, onCreateTransaction, onBulkCreate }: ProjectItemsTableProps) {
  const { data: items, isLoading } = useProjectItems(projectId)
  const bulkDelete = useBulkDeleteProjectItems()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<ProjectItemWithSupplier[]>([])
  const [clearSelectionCallback, setClearSelectionCallback] = useState<(() => void) | null>(null)
  
  const columnHelper = createColumnHelper<ProjectItemWithSupplier>()
  
  const columns: ColumnDef<ProjectItemWithSupplier, any>[] = [
    {
      id: 'row_number',
      header: '#',
      cell: ({ row }) => row.index + 1,
    },
    columnHelper.accessor('item_name', {
      id: 'item_name', // Explicitly add id to ensure it's defined
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('area', {
      id: 'area', // Explicitly add id to ensure it's defined
      header: 'Área',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('category', {
      id: 'category', // Explicitly add id to ensure it's defined
      header: 'Categoría',
      cell: info => info.getValue(),
    }),
    // Use accessorFn instead of dot notation to safely handle nullable nested objects
    columnHelper.accessor(
      row => row.suppliers?.name || null,
      {
        id: 'suppliers.name',
        header: 'Proveedor',
        cell: info => info.getValue() || '-',
      }
    ),
    columnHelper.accessor('quantity', {
      id: 'quantity', // Explicitly add id to ensure it's defined
      header: 'Cant.',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('estimated_cost', {
      id: 'estimated_cost', // Explicitly add id to ensure it's defined
      header: 'Costo Est.',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('internal_cost', {
      id: 'internal_cost', // Explicitly add id to ensure it's defined
      header: 'Costo Interno',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('client_cost', {
      id: 'client_cost', // Explicitly add id to ensure it's defined
      header: 'Costo Cliente',
      cell: info => formatCurrency(info.getValue()),
    }),
  ]

  // Default column visibility
  const initialColumnVisibility = {
    'area': true,
    'category': true,
    'suppliers.name': true,
    'quantity': true,
    'estimated_cost': true,
    'internal_cost': true,
    'client_cost': true
  };

  // Handle bulk delete
  const handleBulkDeleteClick = (selectedItems: ProjectItemWithSupplier[], clearSelection: () => void) => {
    setItemsToDelete(selectedItems)
    setClearSelectionCallback(() => clearSelection)
    setShowDeleteConfirmation(true)
  }

  const handleConfirmBulkDelete = async () => {
    try {
      const ids = itemsToDelete.map(item => item.id)
      await bulkDelete.mutateAsync({ ids, projectId })

      toast({
        message: `${ids.length} artículo${ids.length > 1 ? 's' : ''} eliminado${ids.length > 1 ? 's' : ''} exitosamente`,
        type: 'success'
      })

      if (clearSelectionCallback) {
        clearSelectionCallback()
      }
      setShowDeleteConfirmation(false)
      setItemsToDelete([])
    } catch (error) {
      console.error('Error deleting items:', error)
      toast({
        message: 'Error al eliminar los artículos',
        type: 'error'
      })
    }
  }

  const handleCancelBulkDelete = () => {
    setShowDeleteConfirmation(false)
    setItemsToDelete([])
  }

  // Create a summary row to display totals
  const summaryRow = items && items.length > 0 ? (
    <>
      <td className="px-3 py-2 text-xs text-foreground">Total</td>
      <td colSpan={4} className="px-3 py-2 text-xs text-foreground"></td>
      <td className="px-3 py-2 text-xs text-foreground">
        {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + (item.internal_cost || 0), 0)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + (item.client_cost || 0), 0)
        )}
      </td>
    </>
  ) : null;

  return (
    <>
      <DataTable
        data={items || []}
        columns={columns}
        isLoading={isLoading}
        onEditRow={onEditItem}
        onRowActionClick={onCreateTransaction}
        actionIcon={<PlusSquare className="h-3 w-3" />}
        actionTooltip="Crear transacción"
        noDataMessage="No se encontraron artículos. Añade tu primer artículo para comenzar."
        noDataAction={{
          label: "Añadir Primer Artículo",
          onClick: () => onEditItem({} as ProjectItemWithSupplier)
        }}
        summaryRow={summaryRow}
        initialColumnVisibility={initialColumnVisibility}
        enableRowSelection={true}
        renderTableHeader={({ columnSelector, selectedRows, clearSelection }) => (
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {selectedRows.length > 0 ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkDeleteClick(selectedRows as ProjectItemWithSupplier[], clearSelection)}
                  className="flex gap-1 items-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar {selectedRows.length} seleccionado{selectedRows.length > 1 ? 's' : ''}</span>
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => onEditItem({} as ProjectItemWithSupplier)}
                    className="flex gap-1 items-center"
                  >
                    <PlusSquare className="h-3.5 w-3.5" />
                    <span>Añadir Artículo</span>
                  </Button>
                  {onBulkCreate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onBulkCreate}
                      className="flex gap-1 items-center"
                    >
                      <PlusSquare className="h-3.5 w-3.5" />
                      <span>Creación Masiva</span>
                    </Button>
                  )}
                </>
              )}
            </div>
            {columnSelector}
          </div>
        )}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Eliminar Artículos"
        message={`¿Estás seguro que deseas eliminar ${itemsToDelete.length} artículo${itemsToDelete.length > 1 ? 's' : ''}? Esta acción no se puede deshacer y también eliminará todas las transacciones asociadas.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmColor="destructive"
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
      />
    </>
  )
}