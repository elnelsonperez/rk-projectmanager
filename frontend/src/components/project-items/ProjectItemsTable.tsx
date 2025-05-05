import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useProjectItems } from '../../hooks/useProjectItems'
import { ProjectItem } from '../../hooks/useProjectItems'
import { PlusSquare } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'

type ProjectItemWithSupplier = ProjectItem & { 
  suppliers: { name: string } | null 
}

interface ProjectItemsTableProps {
  projectId: number
  onEditItem: (item: ProjectItemWithSupplier) => void
  onCreateTransaction?: (item: ProjectItemWithSupplier) => void
}

export function ProjectItemsTable({ projectId, onEditItem, onCreateTransaction }: ProjectItemsTableProps) {
  const { data: items, isLoading } = useProjectItems(projectId)
  
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
    columnHelper.accessor('status', {
      id: 'status', // Explicitly add id to ensure it's defined
      header: 'Estado',
      cell: info => info.getValue() || '-',
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
    'client_cost': true,
    'status': true
  };

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
      <td className="px-3 py-2 text-xs text-foreground"></td>
    </>
  ) : null;

  return (
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
    />
  )
}