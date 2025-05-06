import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { useTransactions } from '../../hooks/useTransactions'
import { Transaction } from '../../hooks/useTransactions'
import { formatCurrency } from '../../utils/formatters'
import { DataTable } from '../ui/data-table'
import { PlusSquare, Paperclip, FilterX } from 'lucide-react'
import { Button } from '../ui/button'
import { useState } from 'react'

type TransactionWithProjectItem = Transaction & { 
  project_items: { item_name: string } | null 
}

interface TransactionsTableProps {
  projectId: number
  onEditTransaction: (transaction: TransactionWithProjectItem) => void
}

type TransactionType = 'all' | 'expense' | 'income'

export function TransactionsTable({ projectId, onEditTransaction }: TransactionsTableProps) {
  const { data: transactions, isLoading } = useTransactions(projectId)
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType>('all')
  
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
            {isIncome ? 'Ingreso: ' : ''}{formatCurrency(amount)}
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
          ? <span className="text-green-800">{formatCurrency(amount)}</span>
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
    'invoice_receipt_number': false, // Hide by default
    'attachment_url': true
  };

  // Default sorting - this just affects the UI table and is secondary to the database sort
  const defaultSorting = [{ id: 'date', desc: true }];

  // Calculate visible columns to properly set colspan values in the summary row
  const getVisibleColumnCount = (columnIds: string[]) => {
    return columnIds.filter(id => {
      // Use type assertion to safely access initialColumnVisibility with string keys
      const visibility = initialColumnVisibility as Record<string, boolean>;
      return visibility[id] !== false;
    }).length;
  };

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
          transactions
            .filter(t => t.amount < 0)
            .reduce((sum, item) => sum + (item.amount || 0), 0)
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
          transactions
            .filter(t => (t.client_facing_amount || 0) < 0)
            .reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
        )}</div>
        {/* Net client total */}
        <div className="mt-1 pt-1 border-t">Neto: {formatCurrency(
          transactions.reduce((sum, item) => sum + (item.client_facing_amount || 0), 0)
        )}</div>
      </td>
      
      {/* Dynamically calculate colspan based on visible columns, +1 for action column */}
      <td 
        colSpan={getVisibleColumnCount(['payment_method', 'invoice_receipt_number', 'attachment_url'])}
        className="px-3 py-2 text-xs text-foreground"
      ></td>
    </>
  ) : null;

  // Filter data based on transaction type
  const filteredData = transactions?.filter(transaction => {
    if (transactionTypeFilter === 'all') return true;
    if (transactionTypeFilter === 'income') return transaction.amount < 0;
    if (transactionTypeFilter === 'expense') return transaction.amount >= 0;
    return true;
  }) || [];
  
  // Create transaction type filter buttons
  const renderTransactionTypeFilter = () => (
    <div className="hidden md:flex items-center space-x-2">
      <span className="text-xs font-medium">Filtrar:</span>
      <div className="flex bg-muted/30 rounded-md p-0.5">
        <Button
          variant={transactionTypeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs h-7 px-2 rounded ${transactionTypeFilter === 'all' ? '' : 'hover:bg-muted'}`}
          onClick={() => setTransactionTypeFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={transactionTypeFilter === 'expense' ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs h-7 px-2 rounded ${transactionTypeFilter === 'expense' ? '' : 'hover:bg-muted'}`}
          onClick={() => setTransactionTypeFilter('expense')}
        >
          Gastos
        </Button>
        <Button
          variant={transactionTypeFilter === 'income' ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs h-7 px-2 rounded ${transactionTypeFilter === 'income' ? '' : 'hover:bg-muted'}`}
          onClick={() => setTransactionTypeFilter('income')}
        >
          Ingresos
        </Button>
        {transactionTypeFilter !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 w-7 p-0 ml-1"
            onClick={() => setTransactionTypeFilter('all')}
            title="Limpiar filtro"
          >
            <FilterX className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        onEditRow={onEditTransaction}
        /* Removing onRowActionClick to avoid duplicate edit buttons */
        noDataMessage="No se encontraron transacciones. Añade tu primera transacción para comenzar."
        noDataAction={{
          label: "Añadir Primera Transacción",
          onClick: () => onEditTransaction({} as TransactionWithProjectItem)
        }}
        summaryRow={summaryRow}
        initialColumnVisibility={initialColumnVisibility}
        defaultSorting={defaultSorting}
        rowClassName={(row) => {
          // Highlight expense transactions without project_item_id
          return (!row.project_item_id && row.amount >= 0) ? 'bg-amber-50' : '';
        }}
        renderTableHeader={({ columnSelector }) => (
          <div className="flex flex-row justify-between items-start sm:items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => onEditTransaction({} as TransactionWithProjectItem)}
              className="flex gap-1 items-center"
            >
              <PlusSquare className="h-3.5 w-3.5" />
              <span>Añadir Transacción</span>
            </Button>
            <div className="flex xs:flex-row gap-4 items-center">
              {renderTransactionTypeFilter()}
              {columnSelector}
            </div>
          </div>
        )}
      />
      {filteredData.length > 0 && (
        <div className="text-xs text-muted-foreground bg-amber-50 px-3 py-2 rounded-sm border border-amber-200 flex items-center">
          <div className="w-3 h-3 bg-amber-50 border border-amber-200 mr-2"></div>
          <span>Las filas resaltadas son gastos sin artículo de proyecto asociado</span>
        </div>
      )}
    </div>
  )
}