import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { GroupedReportData, ReportItem } from '../../hooks/useProjectReport';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

// Refresh icon component
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  render: (item: ReportItem) => React.ReactNode;
};

interface ReportTableProps {
  visibleColumns: ColumnConfig[];
  groupedData: GroupedReportData[];
  grandTotals: {
    estimated_cost: number;
    actual_cost: number;
    amount_paid: number;
    internal_amount_paid: number;
    pending_to_pay: number;
  };
  totalIncome?: number;
  showIncomeRow?: boolean;
  showBalanceRow?: boolean;
  filterSubtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  onEditItem?: (item: ReportItem) => void;
  onViewTransactions?: (item: ReportItem) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({
  visibleColumns,
  groupedData,
  grandTotals,
  totalIncome = 0,
  showIncomeRow = true,
  showBalanceRow = true,
  filterSubtitle = '',
  onRefresh,
  isLoading = false,
  onEditItem,
  onViewTransactions
}) => {
  // Identify numeric columns for styling
  const numericColumns = ['estimated_cost', 'actual_cost', 'amount_paid', 'internal_amount_paid', 'pending_to_pay', 'difference_percentage'];
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center bg-muted/20 p-2 border-b border-border">
        <div className="text-xs">
          {filterSubtitle && (
            <><strong>Filtro:</strong> {filterSubtitle}</>
          )}
        </div>
        
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <RefreshIcon className="h-3 w-3" />
                <span>Actualizar</span>
              </>
            )}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[80vh] relative">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <tr>
              {visibleColumns.map(col => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-xs font-semibold text-foreground bg-muted/50"
                  style={{
                    borderRight: '1px solid var(--border)'
                  }}
                >
                  {col.label}
                </th>
              ))}
              {(onEditItem || onViewTransactions) && (
                <th className="px-3 py-2 text-left text-xs font-semibold text-foreground bg-muted/50">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Render each group */}
            {groupedData.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}`}>
                {/* Render items in this group */}
                {group.items.map((item, itemIndex) => (
                  <tr 
                    key={`item-${itemIndex}`} 
                    className={itemIndex % 2 === 0 ? '' : 'bg-muted/10'}
                  >
                    {visibleColumns.map((col) => {
                      const isNumeric = numericColumns.includes(col.id);
                      const isDescription = col.id === 'description';
                      
                      // Check if this is an amount column with potential highlight
                      const isAmountPaidColumn = col.id === 'amount_paid' || col.id === 'internal_amount_paid';
                      
                      // Determine if we should highlight the cell (amounts differ and both columns are visible)
                      const shouldHighlight = isAmountPaidColumn && 
                        item.amount_paid !== item.internal_amount_paid && 
                        visibleColumns.some(c => c.id === 'amount_paid') && 
                        visibleColumns.some(c => c.id === 'internal_amount_paid');
                      
                      return (
                        <td
                          key={col.id}
                          className={`px-3 py-2 text-xs text-foreground ${isDescription ? 'max-w-xs' : 'whitespace-nowrap'} ${isNumeric ? 'text-right' : ''} ${shouldHighlight ? 'bg-amber-100 dark:bg-amber-950/10' : ''}`}
                          style={{
                            borderRight: '1px solid var(--border)'
                          }}
                        >
                          {col.render(item)}
                        </td>
                      );
                    })}
                    {(onEditItem || onViewTransactions) && (
                      <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                        <div className="flex gap-1">
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Editar costos"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                          )}
                          {onViewTransactions && (
                            <button
                              onClick={() => onViewTransactions(item)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Ver transacciones"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                
                {/* Area subtotal row */}
                <tr className="bg-muted/40 font-medium">
                  {visibleColumns.map((col, colIndex) => {
                    
                    if (colIndex === 0) {
                      // First column shows the subtotal label
                      return (
                        <td 
                          key={`subtotal-${colIndex}`} 
                          className="px-3 py-2 whitespace-nowrap text-xs font-semibold"
                          style={{ 
                            borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)' 
                          }}
                        >
                          Subtotal: {group.area}
                        </td>
                      );
                    } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'internal_amount_paid', 'pending_to_pay'].includes(col.id)) {
                      // Show subtotals for numeric columns
                      return (
                        <td 
                          key={`subtotal-${colIndex}`} 
                          className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-right"
                          style={{ 
                            borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)' 
                          }}
                        >
                          {formatCurrency(group.totals[col.id as keyof typeof group.totals])}
                        </td>
                      );
                    } else {
                      // Empty cell for other columns
                      return (
                        <td
                          key={`subtotal-${colIndex}`}
                          className="px-3 py-2 text-xs"
                          style={{
                            borderRight: '1px solid var(--border)'
                          }}
                        ></td>
                      );
                    }
                  })}
                  {(onEditItem || onViewTransactions) && (
                    <td className="px-3 py-2 text-xs"></td>
                  )}
                </tr>
              </React.Fragment>
            ))}
            
            {/* Grand total row with double border */}
            <tr className="bg-primary/10 font-bold">
              {visibleColumns.map((col, colIndex) => {
                const style = {
                  borderRight: '1px solid var(--border)',
                  borderTop: '3px double #999'
                };

                if (colIndex === 0) {
                  // First column shows the total label
                  return (
                    <td
                      key={`total-${colIndex}`}
                      className="px-3 py-2 whitespace-nowrap text-xs font-bold"
                      style={style}
                    >
                      TOTAL GENERAL
                    </td>
                  );
                } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'internal_amount_paid', 'pending_to_pay'].includes(col.id)) {
                  // Show totals for numeric columns
                  return (
                    <td
                      key={`total-${colIndex}`}
                      className="px-3 py-2 whitespace-nowrap text-xs font-bold text-right"
                      style={style}
                    >
                      {formatCurrency(grandTotals[col.id as keyof typeof grandTotals])}
                    </td>
                  );
                } else {
                  // Empty cell for other columns
                  return (
                    <td
                      key={`total-${colIndex}`}
                      className="px-3 py-2 text-xs"
                      style={style}
                    ></td>
                  );
                }
              })}
              {(onEditItem || onViewTransactions) && (
                <td className="px-3 py-2 text-xs" style={{ borderTop: '3px double #999' }}></td>
              )}
            </tr>
            
            {/* Income row */}
            {showIncomeRow && (
              <tr className="bg-green-50">
                {visibleColumns.map((col, colIndex) => {
                  const style = {
                    borderRight: '1px solid var(--border)'
                  };

                  if (colIndex === 0) {
                    return (
                      <td
                        key={`income-${colIndex}`}
                        className="px-3 py-2 whitespace-nowrap text-xs font-bold"
                        style={style}
                      >
                        INGRESOS DEL CLIENTE
                      </td>
                    );
                  } else if (col.id === 'actual_cost') {
                    return (
                      <td
                        key={`income-${colIndex}`}
                        className="px-3 py-2 whitespace-nowrap text-xs font-bold text-right"
                        style={style}
                      >
                        {formatCurrency(-totalIncome)}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={`income-${colIndex}`}
                        className="px-3 py-2 text-xs"
                        style={style}
                      ></td>
                    );
                  }
                })}
                {(onEditItem || onViewTransactions) && (
                  <td className="px-3 py-2 text-xs"></td>
                )}
              </tr>
            )}
            
            {/* Balance row */}
            {showBalanceRow && (
              <tr className="bg-blue-50">
                {visibleColumns.map((col, colIndex) => {
                  const style = {
                    borderRight: '1px solid var(--border)',
                    borderTop: '1px solid #999'
                  };

                  if (colIndex === 0) {
                    return (
                      <td
                        key={`balance-${colIndex}`}
                        className="px-3 py-2 whitespace-nowrap text-xs font-bold"
                        style={style}
                      >
                        BALANCE RESTANTE
                      </td>
                    );
                  } else if (col.id === 'actual_cost') {
                    // Calculate remaining balance
                    const remainingBalance = grandTotals.actual_cost - totalIncome;
                    return (
                      <td
                        key={`balance-${colIndex}`}
                        className={`px-3 py-2 whitespace-nowrap text-xs font-bold text-right ${remainingBalance < 0 ? 'text-red-600' : 'text-green-600'}`}
                        style={style}
                      >
                        {formatCurrency(remainingBalance)}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={`balance-${colIndex}`}
                        className="px-3 py-2 text-xs"
                        style={style}
                      ></td>
                    );
                  }
                })}
                {(onEditItem || onViewTransactions) && (
                  <td className="px-3 py-2 text-xs" style={{ borderTop: '1px solid #999' }}></td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;