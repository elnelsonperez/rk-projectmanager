import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { GroupedReportData, ReportItem } from '../../hooks/useProjectReport';

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
    pending_to_pay: number;
  };
  totalIncome?: number;
  showIncomeRow?: boolean;
  showBalanceRow?: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({
  visibleColumns,
  groupedData,
  grandTotals,
  totalIncome = 0,
  showIncomeRow = true,
  showBalanceRow = true
}) => {
  // Identify numeric columns for styling
  const numericColumns = ['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay', 'difference_percentage'];
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {visibleColumns.map(col => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-xs font-semibold text-foreground"
                  style={{ 
                    borderRight: col === visibleColumns[visibleColumns.length - 1] ? 'none' : '1px solid var(--border)' 
                  }}
                >
                  {col.label}
                </th>
              ))}
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
                    {visibleColumns.map((col, colIndex) => {
                      const isNumeric = numericColumns.includes(col.id);
                      const isDescription = col.id === 'description';
                      
                      return (
                        <td 
                          key={col.id} 
                          className={`px-3 py-2 text-xs text-foreground ${isDescription ? 'max-w-xs' : 'whitespace-nowrap'} ${isNumeric ? 'text-right' : ''}`}
                          style={{ 
                            borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)' 
                          }}
                        >
                          {col.render(item)}
                        </td>
                      );
                    })}
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
                    } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
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
                            borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)' 
                          }}
                        ></td>
                      );
                    }
                  })}
                </tr>
              </React.Fragment>
            ))}
            
            {/* Grand total row with double border */}
            <tr className="bg-primary/10 font-bold">
              {visibleColumns.map((col, colIndex) => {
                const style = {
                  borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)',
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
                } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                  // Show totals for numeric columns
                  // For the Costo Actual column, also show the TOTAL GENERAL value in bold
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
            </tr>
            
            {/* Income row */}
            {showIncomeRow && (
              <tr className="bg-green-50">
                {visibleColumns.map((col, colIndex) => {
                  const style = {
                    borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)'
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
              </tr>
            )}
            
            {/* Balance row */}
            {showBalanceRow && (
              <tr className="bg-blue-50">
                {visibleColumns.map((col, colIndex) => {
                  const style = {
                    borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid var(--border)',
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
                      const remainingBalance = grandTotals.actual_cost - totalIncome ;
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
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;