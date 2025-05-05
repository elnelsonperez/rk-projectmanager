import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useTransactions } from '../../hooks/useTransactions'
import { Transaction } from '../../hooks/useTransactions'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'
import { Edit, PlusSquare, Paperclip } from 'lucide-react'
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
    // Add a computed column for transaction type
    columnHelper.accessor(
      row => row.amount < 0 ? 'income' : 'expense',
      {
        id: 'transaction_type',
        header: 'Tipo',
        cell: info => {
          const type = info.getValue();
          return (
            <span className={`px-2 py-1 rounded-full text-xs ${
              type === 'income' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {type === 'income' ? 'Ingreso' : 'Gasto'}
            </span>
          );
        },
      }
    ),
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
      cell: info => {
        const amount = info.getValue();
        const isIncome = amount < 0;
        return (
          <span className={isIncome ? 'text-green-800' : ''}>
            {isIncome ? 'Ingreso: ' : ''}{formatCurrency(Math.abs(amount))}
          </span>
        );
      },
    }),
    columnHelper.accessor('client_facing_amount', {
      id: 'client_facing_amount', // Explicitly add id to ensure it's defined
      header: 'Monto Cliente',
      cell: info => {
        const amount = info.getValue();
        const isIncome = amount < 0;
        return isIncome 
          ? <span className="text-green-800">{formatCurrency(Math.abs(amount))}</span>
          : formatCurrency(amount);
      },
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
    // Add a column for attachments
    columnHelper.accessor('attachment_url', {
      id: 'attachment_url',
      header: 'Adjunto',
      cell: info => {
        const attachmentUrl = info.getValue();
        if (!attachmentUrl) return '-';
        
        return (
          <a 
            href={attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5 mr-1" />
            <span>Ver</span>
          </a>
        );
      },
    }),
  ]

  // Default column visibility
  const initialColumnVisibility = {
    'date': true,
    'transaction_type': true,
    'project_items.item_name': true,
    'description': true,
    'amount': true,
    'client_facing_amount': true,
    'payment_method': true,
    'invoice_receipt_number': true,
    'attachment_url': true
  };

  // Default sorting
  const defaultSorting = [{ id: 'date', desc: true }];

  // Create a summary row to display totals
  const summaryRow = transactions && transactions.length > 0 ? (
    <>
      <td className="px-3 py-2 text-xs text-foreground font-medium">Totales</td>
      <td className="px-3 py-2 text-xs text-foreground"></td> {/* Type column */}
      <td colSpan={3} className="px-3 py-2 text-xs text-foreground"></td> {/* Item + Description */}
      
      {/* Monto column */}
      <td className="px-3 py-2 text-xs text-foreground">
        {/* Total expenses */}
        <div>Gastos: {formatCurrency(
          transactions
            .filter(t => t.amount >= 0)
            .reduce((sum, item) => sum + (item.amount || 0), 0)
        )}</div>
        {/* Total income */}
        <div className="text-green-800">Ingresos: {formatCurrency(
          Math.abs(transactions
            .filter(t => t.amount < 0)
            .reduce((sum, item) => sum + (item.amount || 0), 0))
        )}</div>
        {/* Net total */}
        <div className="mt-1 pt-1 border-t">Neto: {formatCurrency(
          transactions.reduce((sum, item) => sum + (item.amount || 0), 0)
        )}</div>
      </td>
      
      {/* Monto Cliente column */}
      <td className="px-3 py-2 text-xs text-foreground">
        {/* Total client expenses */}
        <div>Gastos: {formatCurrency(
          transactions
            .filter(t => (t.client_facing_amount || 0) >= 0)
            .reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
        )}</div>
        {/* Total client income */}
        <div className="text-green-800">Ingresos: {formatCurrency(
          Math.abs(transactions
            .filter(t => (t.client_facing_amount || 0) < 0)
            .reduce((sum, item) => sum + (item.client_facing_amount || 0), 0))
        )}</div>
        {/* Net client total */}
        <div className="mt-1 pt-1 border-t">Neto: {formatCurrency(
          transactions.reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
        )}</div>
      </td>
      
      <td colSpan={3} className="px-3 py-2 text-xs text-foreground"></td>
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