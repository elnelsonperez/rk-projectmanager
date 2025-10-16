import { ColumnConfig } from '../components/reports/ReportTable';
import { GroupedReportData } from '../hooks/useProjectReport';
import { formatCurrency } from './formatters';

// CSS for print view
const printStyles = `
body {
  font-family: Arial, sans-serif;
  margin: 1cm;
  color: #333;
}
.report-container {
  max-width: 100%;
  margin: 0 auto;
}
.report-header {
  text-align: left;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.logo {
  max-width: 120px;
  height: auto;
  margin-right: 20px;
}
.report-header-text {
  flex: 1;
}
.project-name {
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 5px;
  text-align: left;
}
.report-date {
  font-size: 14px;
  color: #666;
  margin: 0;
  text-align: left;
}
.notes {
  margin: 10px 0 15px;
  padding: 8px 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #ddd;
}
.notes-content {
  line-height: 1.5;
}
.notes-content p {
  margin-bottom: 8px;
}
.notes-content ul, .notes-content ol {
  margin-left: 20px;
  margin-bottom: 8px;
}
.notes-content h1, .notes-content h2, .notes-content h3, 
.notes-content h4, .notes-content h5, .notes-content h6 {
  margin: 16px 0 8px;
  font-weight: bold;
}
.notes-content h1 { font-size: 1.8em; }
.notes-content h2 { font-size: 1.5em; }
.notes-content h3 { font-size: 1.3em; }
.notes-content h4 { font-size: 1.2em; }
.notes-content h5 { font-size: 1.1em; }
.notes-content h6 { font-size: 1em; }
.notes-content a {
  color: #0066cc;
  text-decoration: underline;
}
.notes-content table {
  border-collapse: collapse;
  margin-bottom: 8px;
}
.notes-content table td, .notes-content table th {
  border: 1px solid #ddd;
  padding: 4px 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
}
th {
  background-color: rgba(0, 0, 0, 0.05);
  text-align: left;
  padding: 6px;
  border-bottom: 2px solid #ddd;
  border-right: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
}
td {
  padding: 5px 6px;
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #e5e7eb;
  font-size: 11px;
}
th:last-child, td:last-child {
  border-right: none;
}
.numeric {
  text-align: right;
}
.wrap-text {
  white-space: normal !important;
  word-wrap: break-word !important;
  max-width: 250px;
}
.subtotal-row {
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}
.total-row {
  background-color: rgba(0, 100, 255, 0.07);
  font-weight: bold;
}
.double-border-top td {
  border-top: 3px double #999;
}
.bg-gray-50 {
  background-color: #f9fafb;
}
@media print {
  body {
    padding: 0;
    font-size: 12px;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  /* Force background colors to print */
  .subtotal-row {
    background-color: rgba(0, 0, 0, 0.05) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .total-row {
    background-color: rgba(0, 100, 255, 0.07) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  th {
    background-color: rgba(0, 0, 0, 0.05) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .bg-gray-50 {
    background-color: #f9fafb !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

// Generate report table HTML
export function generateTableContent(
  visibleCols: ColumnConfig[],
  groupedData: GroupedReportData[],
  grandTotals: {
    estimated_cost: number;
    actual_cost: number;
    amount_paid: number;
    pending_to_pay: number;
  },
  totalIncome: number = 0,
  showIncomeRow: boolean = true,
  showBalanceRow: boolean = true
): string {
  let tableContent = '';
  
  // Table header
  tableContent += '<thead><tr>';
  visibleCols.forEach(col => {
    tableContent += `<th>${col.label}</th>`;
  });
  tableContent += '</tr></thead><tbody>';
  
  // Group data rows
  groupedData.forEach((group) => {
    // Items in the group
    group.items.forEach((item, rowIndex) => {
      // Add zebra striping for alternating rows
      const rowClass = rowIndex % 2 === 0 ? '' : 'bg-gray-50';
      tableContent += `<tr class="${rowClass}">`;
      visibleCols.forEach(col => {
        const isNumeric = ['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay', 'difference_percentage'].includes(col.id);
        const isDescription = col.id === 'description';
        tableContent += `<td class="${isNumeric ? 'numeric' : ''} ${isDescription ? 'wrap-text' : ''}">${col.render(item)}</td>`;
      });
      tableContent += '</tr>';
    });
    
    // Subtotal row
    tableContent += '<tr class="subtotal-row">';
    visibleCols.forEach((col, colIndex) => {
      if (colIndex === 0) {
        tableContent += `<td>Subtotal: ${group.area}</td>`;
      } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
        // Add double-line class for amount_paid which is before pending_to_pay
        const isBeforeLast = col.id === 'amount_paid' && visibleCols.some(c => c.id === 'pending_to_pay' && c.visible);
        tableContent += `<td class="numeric ${isBeforeLast ? 'before-last-column' : ''}">${formatCurrency(group.totals[col.id as keyof typeof group.totals])}</td>`;
      } else {
        tableContent += '<td></td>';
      }
    });
    tableContent += '</tr>';
  });
  
  // Grand total row - with double-line top border
  tableContent += '<tr class="total-row double-border-top">';
  visibleCols.forEach((col, colIndex) => {
    if (colIndex === 0) {
      tableContent += '<td>TOTAL GENERAL</td>';
    } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
      tableContent += `<td class="numeric">${formatCurrency(grandTotals[col.id as keyof typeof grandTotals])}</td>`;
    } else {
      tableContent += '<td></td>';
    }
  });
  tableContent += '</tr>';
  
  // Add income row
  if (showIncomeRow) {
    tableContent += '<tr class="total-row" style="background-color: rgba(0, 200, 0, 0.07) !important;">';
    visibleCols.forEach((col, colIndex) => {
      if (colIndex === 0) {
        tableContent += '<td>INGRESOS DEL CLIENTE</td>';
      } else if (col.id === 'actual_cost') {
        tableContent += `<td class="numeric">${formatCurrency(-totalIncome)}</td>`;
      } else {
        tableContent += '<td></td>';
      }
    });
    tableContent += '</tr>';
  }
  
  // Add remaining balance row
  if (showBalanceRow) {
    const remainingBalance = grandTotals.actual_cost - totalIncome;
    const balanceClass = remainingBalance < 0 ? 'color: #e53e3e !important;' : 'color: #38a169 !important;';
    
    tableContent += '<tr class="total-row" style="background-color: rgba(0, 100, 200, 0.07) !important;">';
    visibleCols.forEach((col, colIndex) => {
      if (colIndex === 0) {
        tableContent += '<td>BALANCE RESTANTE</td>';
      } else if (col.id === 'actual_cost') {
        tableContent += `<td class="numeric" style="${balanceClass}">${formatCurrency(remainingBalance)}</td>`;
      } else {
        tableContent += '<td></td>';
      }
    });
    tableContent += '</tr>';
  }
  
  tableContent += '</tbody>';
  
  return tableContent;
}

// Open print window with the report
export function openPrintWindow(
  projectName: string,
  logoUrl: string,
  reportNotes: string,
  tableContent: string,
  filterSubtitle: string = '',
  clientName?: string
): void {
  // Format current date
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) return;
  
  // Write the complete HTML document to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Proyecto: ${projectName}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <img src="${logoUrl}" alt="RKArtSide" class="logo" />
            <div class="report-header-text">
              <h1 class="project-name">${projectName}</h1>
              ${clientName ? `<p class="report-date" style="font-weight: 600;">Cliente: ${clientName}</p>` : ''}
              <p class="report-date">${currentDate}</p>
              ${filterSubtitle ? `<p class="filter-subtitle" style="font-size: 13px; margin-top: 3px; color: #505050;"><strong>Filtro:</strong> ${filterSubtitle}</p>` : ''}
            </div>
          </div>
          
          ${reportNotes ? `
            <div class="notes">
              <h3 style="font-size: 14px; margin: 0 0 5px; font-weight: 600;">Notas</h3>
              <div class="notes-content">
                ${reportNotes}
              </div>
            </div>
          ` : ''}
          
          <table class="w-full">
            ${tableContent}
          </table>
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 250);
          }
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
}