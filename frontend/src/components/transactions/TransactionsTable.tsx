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
import { useTransactions } from '../../hooks/useTransactions'
import { Transaction } from '../../hooks/useTransactions'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { formatCurrency } from '../../utils/formatters'

type TransactionWithProjectItem = Transaction & { 
  project_items: { item_name: string } | null 
}

interface TransactionsTableProps {
  projectId: number
  onEditTransaction: (transaction: TransactionWithProjectItem) => void
}

export function TransactionsTable({ projectId, onEditTransaction }: TransactionsTableProps) {
  const { data: transactions, isLoading } = useTransactions(projectId)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  const columnHelper = createColumnHelper<TransactionWithProjectItem>()
  
  const columns: ColumnDef<TransactionWithProjectItem, any>[] = [
    {
      id: 'row_number',
      header: '#',
      cell: ({ row }) => row.index + 1,
    },
    columnHelper.accessor('date', {
      header: 'Fecha',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('project_items.item_name', {
      header: 'Elemento de Proyecto',
      cell: info => info.getValue() || 'N/A',
    }),
    columnHelper.accessor('description', {
      header: 'Descripción',
      cell: info => info.getValue() || '',
    }),
    columnHelper.accessor('amount', {
      header: 'Monto',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('client_facing_amount', {
      header: 'Monto Cliente',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('payment_method', {
      header: 'Método de Pago',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('invoice_receipt_number', {
      header: 'Factura #',
      cell: info => info.getValue() || '-',
    }),
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={e => {
            e.stopPropagation()
            onEditTransaction(row.original)
          }}
        >
          Editar
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: transactions || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Remove pagination to show all items
  })

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!transactions?.length) return
      
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
          onEditTransaction(row.original)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [transactions, selectedRowIndex, table, onEditTransaction])

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

  if (!transactions?.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="mb-4">No se encontraron transacciones. Añade tu primera transacción para comenzar.</p>
        <Button onClick={() => onEditTransaction({} as TransactionWithProjectItem)}>
          Añadir Primera Transacción
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
                onClick={() => onEditTransaction(row.original)}
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
            {transactions && transactions.length > 0 && (
              <tr className="bg-muted/40 font-medium">
                <td className="px-4 py-3 text-sm text-foreground">Total</td>
                <td colSpan={3} className="px-4 py-3 text-sm text-foreground"></td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatCurrency(
                    transactions.reduce((sum, item) => sum + (item.amount || 0), 0)
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatCurrency(
                    transactions.reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
                  )}
                </td>
                <td colSpan={3} className="px-4 py-3 text-sm text-foreground"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination removed - showing all items */}
    </div>
  )
}