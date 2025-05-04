import React, { useRef } from 'react';
import { GroupedReportData, ReportItem } from '../../hooks/useProjectReport';
import { formatCurrency } from '../../utils/formatters';
import companyLogo from '../../assets/company-logo-placeholder.svg';

interface PrintableReportProps {
  projectName: string;
  // reportData isn't used directly, but is passed through for completeness
  reportData?: ReportItem[];
  groupedData: GroupedReportData[];
  visibleColumns: {
    id: string;
    label: string;
    render: (item: ReportItem) => React.ReactNode;
  }[];
  grandTotals: {
    estimated_cost: number;
    actual_cost: number;
    amount_paid: number;
    pending_to_pay: number;
  };
  notes?: string;
  onClose: () => void;
}

const PrintableReport: React.FC<PrintableReportProps> = ({
  projectName,
  // reportData is not used directly in this component
  groupedData,
  visibleColumns,
  grandTotals,
  notes,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Format current date
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Print the report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow || !reportRef.current) return;
    
    const content = reportRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Proyecto: ${projectName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .report-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .report-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .project-name {
              font-size: 24px;
              font-weight: bold;
              margin: 15px 0 5px;
            }
            .report-date {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            }
            .notes {
              margin: 15px 0;
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 4px;
              border-left: 3px solid #ddd;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 20px;
            }
            th {
              background-color: #f5f5f5;
              text-align: left;
              padding: 8px 6px;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
            }
            td {
              padding: 6px;
              border-bottom: 1px solid #ddd;
            }
            .numeric {
              text-align: right;
            }
            .subtotal-row {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            .total-row {
              background-color: #e6f3ff;
              font-weight: bold;
            }
            .print-controls {
              display: none;
            }
            @media print {
              body {
                padding: 0;
                font-size: 12px;
              }
              .print-controls {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Add small delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-4 md:p-8">
      <div className="print-controls mb-4 flex justify-between items-center">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Volver
        </button>
        
        <button 
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Imprimir Reporte
        </button>
      </div>
      
      <div ref={reportRef} className="report-container">
        <div className="report-header">
          <img src={companyLogo} alt="Company Logo" className="logo" />
          <h1 className="project-name">{projectName}</h1>
          <p className="report-date">{currentDate}</p>
        </div>
        
        {notes && (
          <div className="notes mb-6">
            <h3 className="text-lg font-medium mb-2">Notas</h3>
            <p>{notes}</p>
          </div>
        )}
        
        <table className="w-full">
          <thead>
            <tr>
              {visibleColumns.map(col => (
                <th key={col.id}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}`}>
                {group.items.map((item, itemIndex) => (
                  <tr key={`item-${itemIndex}`}>
                    {visibleColumns.map(col => (
                      <td 
                        key={col.id} 
                        className={['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay', 'difference_percentage'].includes(col.id) ? 'numeric' : ''}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Area subtotal row */}
                <tr className="subtotal-row">
                  {visibleColumns.map((col, colIndex) => {
                    if (colIndex === 0) {
                      // First column shows the subtotal label
                      return (
                        <td key={`subtotal-${colIndex}`}>
                          Subtotal: {group.area}
                        </td>
                      );
                    } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                      // Show subtotals for numeric columns
                      return (
                        <td key={`subtotal-${colIndex}`} className="numeric">
                          {formatCurrency(group.totals[col.id as keyof typeof group.totals])}
                        </td>
                      );
                    } else {
                      // Empty cell for other columns
                      return <td key={`subtotal-${colIndex}`}></td>;
                    }
                  })}
                </tr>
              </React.Fragment>
            ))}
            
            {/* Grand total row */}
            <tr className="total-row">
              {visibleColumns.map((col, colIndex) => {
                if (colIndex === 0) {
                  // First column shows the total label
                  return (
                    <td key={`total-${colIndex}`}>
                      TOTAL GENERAL
                    </td>
                  );
                } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                  // Show totals for numeric columns
                  return (
                    <td key={`total-${colIndex}`} className="numeric">
                      {formatCurrency(grandTotals[col.id as keyof typeof grandTotals])}
                    </td>
                  );
                } else {
                  // Empty cell for other columns
                  return <td key={`total-${colIndex}`}></td>;
                }
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintableReport;