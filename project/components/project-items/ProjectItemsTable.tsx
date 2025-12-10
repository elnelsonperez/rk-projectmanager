import { useState } from 'react'
import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useProjectItems, useBulkDeleteProjectItems, useImproveProjectItems } from '../../hooks/useProjectItems'
import { ProjectItem } from '../../hooks/useProjectItems'
import { PlusSquare, Trash2, Sparkles } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'
import { Button } from '../ui/button'
import { ConfirmationDialog } from '../ui/confirmation-dialog'
import { toast } from '../ui/toast'
import { ImprovementsComparisonModal } from './ImprovementsComparisonModal'
import type { ItemComparison } from '../../types/improvements.types'

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
  const improveItems = useImproveProjectItems()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<ProjectItemWithSupplier[]>([])
  const [clearSelectionCallback, setClearSelectionCallback] = useState<(() => void) | null>(null)
  const [showImprovementsModal, setShowImprovementsModal] = useState(false)
  const [improvements, setImprovements] = useState<ItemComparison[]>([])
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  
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
      cell: info => {
        const cost = info.getValue();
        const quantity = info.row.original.quantity || 1;
        return formatCurrency(cost ? cost * quantity : null);
      },
    }),
    columnHelper.accessor('internal_cost', {
      id: 'internal_cost', // Explicitly add id to ensure it's defined
      header: 'Costo Interno',
      cell: info => {
        const cost = info.getValue();
        const quantity = info.row.original.quantity || 1;
        return formatCurrency(cost ? cost * quantity : null);
      },
    }),
    columnHelper.accessor('client_cost', {
      id: 'client_cost', // Explicitly add id to ensure it's defined
      header: 'Costo Cliente',
      cell: info => {
        const cost = info.getValue();
        const quantity = info.row.original.quantity || 1;
        return formatCurrency(cost ? cost * quantity : null);
      },
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

  // Handle AI improvements
  const handleImproveWithAI = async () => {
    if (!items || items.length === 0) {
      toast({
        message: 'No hay artículos para mejorar',
        type: 'error',
      })
      return
    }

    setIsProcessingAI(true)

    try {
      const result = await improveItems.mutateAsync(projectId)

      console.log('AI Improvement Result:', result)

      // Check if AI returned an error
      if (!result.success || result.error) {
        console.error('AI returned error:', result.error)
        toast({
          message: result.error || 'Error al procesar los artículos',
          type: 'error',
        })
        return
      }

      // Check if no improvements were found
      if (result.items_with_changes === 0) {
        console.log('No improvements found')
        toast({
          message: result.message || 'No se encontraron mejoras necesarias',
          type: 'info',
        })
        return
      }

      console.log('Processing improvements:', result.improvements.length)

      // Transform improvements into comparisons
      const comparisons: ItemComparison[] = result.improvements.map((improvement: any) => {
        const originalItem = items.find((item) => item.id === improvement.id)
        if (!originalItem) {
          throw new Error(`Item with id ${improvement.id} not found`)
        }

        const hasChanges =
          originalItem.item_name !== improvement.improved_name ||
          (originalItem.description || '') !== improvement.improved_description ||
          originalItem.category !== improvement.improved_category

        return {
          id: improvement.id,
          original_name: originalItem.item_name,
          original_description: originalItem.description || '',
          original_category: originalItem.category,
          improved_name: improvement.improved_name,
          improved_description: improvement.improved_description,
          improved_category: improvement.improved_category,
          has_changes: hasChanges,
          accepted: hasChanges, // Auto-accept items with changes by default
        }
      })

      console.log('Comparisons created:', comparisons.length)
      console.log('Items with changes:', comparisons.filter(c => c.has_changes).length)

      setImprovements(comparisons)
      setShowImprovementsModal(true)

      console.log('Modal should now be visible')
    } catch (error) {
      console.error('Error improving items:', error)
      toast({
        message:
          error instanceof Error
            ? error.message
            : 'Error al mejorar artículos',
        type: 'error',
      })
    } finally {
      setIsProcessingAI(false)
    }
  }

  // Create a summary row to display totals
  const summaryRow = items && items.length > 0 ? (
    <>
      <td className="px-3 py-2 text-xs text-foreground">Total</td>
      <td colSpan={5} className="px-3 py-2 text-xs text-foreground"></td>
      <td className="px-3 py-2 text-xs text-foreground">
        {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + ((item.estimated_cost || 0) * (item.quantity || 1)), 0)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + ((item.internal_cost || 0) * (item.quantity || 1)), 0)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          items.reduce((sum, item) => sum + ((item.client_cost || 0) * (item.quantity || 1)), 0)
        )}
      </td>
    </>
  ) : null;

  // Show action buttons when there are no items
  const emptyStateButtons = !items || items.length === 0 ? (
    <div className="flex gap-2 justify-center mb-4">
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
    </div>
  ) : null;

  return (
    <>
      {emptyStateButtons}
      <DataTable
        data={items || []}
        columns={columns}
        isLoading={isLoading}
        onEditRow={onEditItem}
        onRowActionClick={onCreateTransaction}
        actionIcon={<PlusSquare className="h-3 w-3" />}
        actionTooltip="Crear transacción"
        noDataMessage="No se encontraron artículos."
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImproveWithAI}
                    disabled={isProcessingAI || !items || items.length === 0}
                    className="flex gap-1 items-center"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      {isProcessingAI ? 'Procesando...' : 'Mejorar con AI'}
                    </span>
                  </Button>
                </>
              )}
            </div>
            {columnSelector}
          </div>
        )}
      />

      <ImprovementsComparisonModal
        isOpen={showImprovementsModal}
        projectId={projectId}
        comparisons={improvements}
        onClose={() => setShowImprovementsModal(false)}
        onSuccess={() => {
          // Modal will close itself
          toast({
            message: 'Artículos mejorados exitosamente',
            type: 'success',
          })
        }}
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