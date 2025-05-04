import { useState, useRef, useEffect } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table'
import { useProjectItems } from '../../hooks/useProjectItems'
import { ProjectItem } from '../../hooks/useProjectItems'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { formatCurrency } from '../../utils/formatters'

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
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  const columnHelper = createColumnHelper<ProjectItemWithSupplier>()
  
  const columns: ColumnDef<ProjectItemWithSupplier, any>[] = [
    {
      id: 'row_number',
      header: '#',
      cell: ({ row }) => row.index + 1,
    },
    columnHelper.accessor('item_name', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('area', {
      header: 'Área',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('category', {
      header: 'Categoría',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('suppliers.name', {
      header: 'Proveedor',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('quantity', {
      header: 'Cant.',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('estimated_cost', {
      header: 'Costo Est.',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('internal_cost', {
      header: 'Costo Interno',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('client_cost', {
      header: 'Costo Cliente',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: info => info.getValue() || '-',
    }),
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={e => {
              e.stopPropagation()
              onEditItem(row.original)
            }}
          >
            Editar
          </Button>
          
          {onCreateTransaction && (
            <Button
              size="sm"
              variant="outline"
              onClick={e => {
                e.stopPropagation()
                onCreateTransaction(row.original)
              }}
            >
              + Trans
            </Button>
          )}
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: items || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Remove pagination to show all items
    enableSorting: true,
    enableMultiSort: true,
  })

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!items?.length) return
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        
        setSelectedRowIndex(prev => {
          const rowCount = table.getRowModel().rows.length
          if (prev === null) {
            return e.key === 'ArrowDown' ? 0 : rowCount - 1
          }
          
          const newIndex = prev + (e.key === 'ArrowDown' ? 1 : -1)
          return Math.max(0, Math.min(newIndex, rowCount - 1))
        })
      } else if (e.key === 'Enter' && selectedRowIndex !== null) {
        const row = table.getRowModel().rows[selectedRowIndex]
        if (row) {
          onEditItem(row.original)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedRowIndex, table, onEditItem])

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRowIndex !== null && tableContainerRef.current) {
      const selectedRow = tableContainerRef.current.querySelector(
        `tbody tr:nth-child(${selectedRowIndex + 1})`
      )
      
      if (selectedRow) {
        selectedRow.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedRowIndex])

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (!items?.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="mb-4">No se encontraron elementos. Añade tu primer elemento para comenzar.</p>
        <Button onClick={() => onEditItem({} as ProjectItemWithSupplier)}>
          Añadir Primer Elemento
        </Button>
      </div>
    )
  }

  return (
    <div ref={tableContainerRef} className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className="ml-1">
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onEditItem(row.original)}
                className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                  selectedRowIndex === rowIndex
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : ''
                }`}
                onMouseEnter={() => setSelectedRowIndex(rowIndex)}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Summary row */}
            {items && items.length > 0 && (
              <tr className="bg-muted/40 font-medium">
                <td className="px-4 py-3 text-sm text-foreground">Total</td>
                <td colSpan={4} className="px-4 py-3 text-sm text-foreground"></td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatCurrency(
                    items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatCurrency(
                    items.reduce((sum, item) => sum + (item.internal_cost || 0), 0)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatCurrency(
                    items.reduce((sum, item) => sum + (item.client_cost || 0), 0)
                  )}
                </td>
                <td colSpan={2} className="px-4 py-3 text-sm text-foreground"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination removed - showing all items */}
    </div>
  )
}