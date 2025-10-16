import { useState, useRef, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { Button } from './button';
import { Spinner } from './spinner';
import { ColumnSelector } from './column-selector';
import { toast } from './toast';
import { Copy, Edit } from 'lucide-react';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  isLoading: boolean;
  onEditRow: (row: TData) => void;
  onRowActionClick?: (row: TData) => void;
  actionIcon?: React.ReactNode;
  actionTooltip?: string;
  noDataMessage?: string;
  noDataAction?: {
    label: string;
    onClick: () => void;
  };
  defaultSorting?: SortingState;
  summaryRow?: React.ReactNode;
  initialColumnVisibility?: VisibilityState;
  renderTableHeader?: (props: { columnSelector: React.ReactNode; selectedRows: TData[]; clearSelection: () => void }) => React.ReactNode;
  rowClassName?: (row: TData) => string;
  enableRowSelection?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading,
  onEditRow,
  onRowActionClick,
  actionIcon,
  actionTooltip,
  noDataMessage = "No data found.",
  noDataAction,
  defaultSorting = [],
  summaryRow,
  initialColumnVisibility,
  renderTableHeader,
  rowClassName,
  enableRowSelection = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility || {}
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableMultiSort: true,
    enableRowSelection: enableRowSelection,
  });

  // Get selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  const clearSelection = () => setRowSelection({});

  // Function to copy cell content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({ 
          message: "Copiado al portapapeles", 
          type: "success", 
          duration: 1500 
        });
      })
      .catch(() => {
        toast({ 
          message: "No se pudo copiar al portapapeles", 
          type: "error" 
        });
      });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data.length) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        setSelectedRowIndex(prev => {
          const rowCount = table.getRowModel().rows.length;
          if (prev === null) {
            return e.key === 'ArrowDown' ? 0 : rowCount - 1;
          }
          
          const newIndex = prev + (e.key === 'ArrowDown' ? 1 : -1);
          return Math.max(0, Math.min(newIndex, rowCount - 1));
        });
      } else if (e.key === 'Enter' && selectedRowIndex !== null) {
        const row = table.getRowModel().rows[selectedRowIndex];
        if (row) {
          onEditRow(row.original);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, selectedRowIndex, table, onEditRow]);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRowIndex !== null && tableContainerRef.current) {
      const selectedRow = tableContainerRef.current.querySelector(
        `tbody tr:nth-child(${selectedRowIndex + 1})`
      );
      
      if (selectedRow) {
        selectedRow.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedRowIndex]);

  // Get column options for the visibility selector
  const columnOptions = columns
    .filter(col => col.id && col.id !== 'row_number' && col.id !== 'actions')
    .map(col => ({
      id: col.id as string,
      label: typeof col.header === 'string' ? col.header : col.id as string
    }));

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center p-6 border rounded-lg bg-muted/20">
        <p className="mb-4 text-sm">{noDataMessage}</p>
        {noDataAction && (
          <Button size="sm" onClick={noDataAction.onClick}>
            {noDataAction.label}
          </Button>
        )}
      </div>
    );
  }

  // Create the column selector component
  const columnSelector = (
    <ColumnSelector
      columns={columnOptions}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
    />
  );
  
  return (
    <div className="space-y-2">
      {/* Table header - either custom or default */}
      {renderTableHeader ? (
        renderTableHeader({ columnSelector, selectedRows, clearSelection })
      ) : (
        <div className="flex justify-end">
          {columnSelector}
        </div>
      )}
      
      <div ref={tableContainerRef} className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {enableRowSelection && (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground w-12">
                      <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="cursor-pointer"
                      />
                    </th>
                  )}
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-left text-xs font-semibold text-foreground"
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
                  {/* Extra header cell for action buttons that matches the others */}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground w-16"></th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`hover:bg-muted/30 transition-colors relative group ${
                    selectedRowIndex === rowIndex
                      ? 'bg-primary/10 hover:bg-primary/20'
                      : ''
                  } ${rowClassName ? rowClassName(row.original) : ''}`}
                  onMouseEnter={() => {
                    setSelectedRowIndex(rowIndex);
                  }}
                >
                  {enableRowSelection && (
                    <td className="px-3 py-2 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="cursor-pointer"
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map(cell => {
                    // Get cell value as string
                    const cellValue = String(
                      cell.column.id === 'row_number' 
                        ? rowIndex + 1 
                        : cell.getValue() !== null && cell.getValue() !== undefined
                          ? cell.getValue()
                          : '-'
                    );
                    
                    return (
                      <td
                        key={cell.id}
                        className="px-3 py-2 text-xs text-foreground relative group/cell"
                        onClick={() => {
                          // Don't copy from actions column
                          if (cell.column.id !== 'row_number' && 
                              cell.column.id !== 'actions') {
                            copyToClipboard(cellValue);
                          }
                        }}
                        style={{ cursor: cell.column.id !== 'row_number' && cell.column.id !== 'actions' ? 'pointer' : 'default' }}
                      >
                        <div className="flex items-center">
                          <div className="flex-1">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                          {cell.column.id !== 'row_number' && cell.column.id !== 'actions' && (
                            <div className="ml-1 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center rounded-sm w-5 h-5 bg-muted/30 hover:bg-muted/50">
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  
                  {/* Add an empty last cell to hold the action buttons with the same background as other cells */}
                  <td className={`relative px-3 py-2 text-xs text-foreground ${rowIndex % 2 === 1 ? 'bg-muted/10' : ''}`}>
                    {/* Edit button */}
                    <div 
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRow(row.original);
                      }}
                    >
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="p-1 h-6 w-6 text-primary hover:text-primary-foreground hover:bg-primary shadow-sm"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Custom action button */}
                    {onRowActionClick && actionIcon && (
                      <div 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowActionClick(row.original);
                        }}
                      >
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="p-1 h-6 w-6 text-primary hover:text-primary-foreground hover:bg-primary shadow-sm"
                          title={actionTooltip}
                        >
                          {actionIcon}
                        </Button>
                      </div>
                    )}
                  </td>
                  
                  {/* Note: defaultRowOnHover is removed since it caused HTML validation issues */}
                </tr>
              ))}
              
              {/* Summary row */}
              {summaryRow && (
                <tr className="bg-muted/40 font-medium">
                  {summaryRow}
                  {/* Extra cell for the actions column */}
                  <td className="px-3 py-2 text-xs"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}