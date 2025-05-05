import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useTransactions } from '../../hooks/useTransactions'
import { Transaction } from '../../hooks/useTransactions'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'
import { Edit, PlusSquare } from 'lucide-react'
import { Button } from '../ui/button'

type TransactionWithProjectItem = Transaction & { 
  project_items: { item_name: string } | null 
}

interface TransactionsTableProps {
  projectId: number
  onEditTransaction: (transaction: TransactionWithProjectItem) => void
}

export function TransactionsTable({ projectId, onEditTransaction }: TransactionsTableProps) {
  const { data: transactions, isLoading } = useTransactions(projectId)
  
  const columnHelper = createColumnHelper<TransactionWithProjectItem>()
  
  const columns: ColumnDef<TransactionWithProjectItem, any>[] = [
    {
      id: 'row_number',
      header: '#',
      cell: ({ row }) => row.index + 1,
    },
    columnHelper.accessor('date', {
      id: 'date', // Explicitly add id to ensure it's defined
      header: 'Fecha',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    // Use accessorFn instead of dot notation to safely handle nullable nested objects
    columnHelper.accessor(
      row => row.project_items?.item_name || null,
      {
        id: 'project_items.item_name',
        header: 'Artículo de Proyecto',
        cell: info => info.getValue() || 'N/A',
      }
    ),
    columnHelper.accessor('description', {
      id: 'description', // Explicitly add id to ensure it's defined
      header: 'Descripción',
      cell: info => info.getValue() || '',
    }),
    columnHelper.accessor('amount', {
      id: 'amount', // Explicitly add id to ensure it's defined
      header: 'Monto',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('client_facing_amount', {
      id: 'client_facing_amount', // Explicitly add id to ensure it's defined
      header: 'Monto Cliente',
      cell: info => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('payment_method', {
      id: 'payment_method', // Explicitly add id to ensure it's defined
      header: 'Método de Pago',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('invoice_receipt_number', {
      id: 'invoice_receipt_number', // Explicitly add id to ensure it's defined
      header: 'Factura #',
      cell: info => info.getValue() || '-',
    }),
  ]

  // Default column visibility
  const initialColumnVisibility = {
    'date': true,
    'project_items.item_name': true,
    'description': true,
    'amount': true,
    'client_facing_amount': true,
    'payment_method': true,
    'invoice_receipt_number': true
  };

  // Default sorting
  const defaultSorting = [{ id: 'date', desc: true }];

  // Create a summary row to display totals
  const summaryRow = transactions && transactions.length > 0 ? (
    <>
      <td className="px-3 py-2 text-xs text-foreground">Total</td>
      <td colSpan={3} className="px-3 py-2 text-xs text-foreground"></td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          transactions.reduce((sum, item) => sum + (item.amount || 0), 0)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCurrency(
          transactions.reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
        )}
      </td>
      <td colSpan={2} className="px-3 py-2 text-xs text-foreground"></td>
    </>
  ) : null;

  return (
    <DataTable
      data={transactions || []}
      columns={columns}
      isLoading={isLoading}
      onEditRow={onEditTransaction}
      onRowActionClick={onEditTransaction}
      actionIcon={<Edit className="h-3 w-3" />}
      actionTooltip="Editar transacción"
      noDataMessage="No se encontraron transacciones. Añade tu primera transacción para comenzar."
      noDataAction={{
        label: "Añadir Primera Transacción",
        onClick: () => onEditTransaction({} as TransactionWithProjectItem)
      }}
      summaryRow={summaryRow}
      initialColumnVisibility={initialColumnVisibility}
      defaultSorting={defaultSorting}
      renderTableHeader={({ columnSelector }) => (
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            onClick={() => onEditTransaction({} as TransactionWithProjectItem)}
            className="flex gap-1 items-center"
          >
            <PlusSquare className="h-3.5 w-3.5" />
            <span>Añadir Transacción</span>
          </Button>
          {columnSelector}
        </div>
      )}
    />
  )
}