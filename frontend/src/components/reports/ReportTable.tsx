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
}

const ReportTable: React.FC<ReportTableProps> = ({
  visibleColumns,
  groupedData,
  grandTotals
}) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns.map(col => (
              <th
                key={col.id}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                style={{ borderRight: col === visibleColumns[visibleColumns.length - 1] ? 'none' : '1px solid #e5e7eb' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Render each group */}
          {groupedData.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {/* Render items in this group */}
              {group.items.map((item, itemIndex) => (
                <tr key={`item-${itemIndex}`} className={itemIndex % 2 === 0 ? '' : 'bg-gray-50'}>
                  {visibleColumns.map((col, colIndex) => {
                    const isNumeric = ['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay', 'difference_percentage'].includes(col.id);
                    const isDescription = col.id === 'description';
                    
                    return (
                      <td 
                        key={col.id} 
                        className={`px-3 py-2 text-sm text-gray-500 ${isDescription ? 'wrap-text' : 'whitespace-nowrap'} ${isNumeric ? 'numeric' : ''}`}
                        style={{ borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid #e5e7eb' }}
                      >
                        {col.render(item)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Area subtotal row */}
              <tr className="bg-gray-100 font-medium">
                {visibleColumns.map((col, colIndex) => {
                  if (colIndex === 0) {
                    // First column shows the subtotal label
                    return (
                      <td 
                        key={`subtotal-${colIndex}`} 
                        className="px-3 py-2 whitespace-nowrap text-sm font-bold"
                        style={{ borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid #e5e7eb' }}
                      >
                        Subtotal: {group.area}
                      </td>
                    );
                  } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                    // Show subtotals for numeric columns
                    return (
                      <td 
                        key={`subtotal-${colIndex}`} 
                        className="px-3 py-2 whitespace-nowrap text-sm font-bold numeric"
                        style={{ borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid #e5e7eb' }}
                      >
                        {formatCurrency(group.totals[col.id as keyof typeof group.totals])}
                      </td>
                    );
                  } else {
                    // Empty cell for other columns
                    return (
                      <td 
                        key={`subtotal-${colIndex}`} 
                        className="px-3 py-2"
                        style={{ borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid #e5e7eb' }}
                      ></td>
                    );
                  }
                })}
              </tr>
            </React.Fragment>
          ))}
          
          {/* Grand total row with double border */}
          <tr className="bg-blue-50 font-bold">
            {visibleColumns.map((col, colIndex) => {
              const style = {
                borderRight: colIndex === visibleColumns.length - 1 ? 'none' : '1px solid #e5e7eb',
                borderTop: '3px double #999'
              };
              
              if (colIndex === 0) {
                // First column shows the total label
                return (
                  <td 
                    key={`total-${colIndex}`} 
                    className="px-3 py-2 whitespace-nowrap text-sm font-bold"
                    style={style}
                  >
                    TOTAL GENERAL
                  </td>
                );
              } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                // Show totals for numeric columns
                return (
                  <td 
                    key={`total-${colIndex}`} 
                    className="px-3 py-2 whitespace-nowrap text-sm font-bold numeric"
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
                    className="px-3 py-2"
                    style={style}
                  ></td>
                );
              }
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;