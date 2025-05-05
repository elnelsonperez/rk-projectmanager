import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { 
  useProjectReport, 
  groupReportDataByArea, 
  calculateGrandTotals, 
  ReportItem 
} from '../hooks/useProjectReport'
import { formatCurrency } from '../utils/formatters'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import React from 'react'
import Editor from 'react-simple-wysiwyg'
import logoPlaceholder from '../assets/company-logo-placeholder.svg'

// Define the column configuration type
type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  render: (item: ReportItem) => React.ReactNode;
};

export default function ProjectReportPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project } = useProject(projectId)
  const [reportNotes, setReportNotes] = useState('')
  
  // Define columns for the report
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { id: 'category', label: 'Categoría', visible: true, render: (item) => item.category || '-' },
    { id: 'area', label: 'Área', visible: true, render: (item) => item.area || '-' },
    { id: 'item_name', label: 'Elemento', visible: true, render: (item) => item.item_name },
    { 
      id: 'description', 
      label: 'Descripción', 
      visible: true, 
      render: (item) => item.description || '-' 
    },
    { 
      id: 'estimated_cost', 
      label: 'Costo Estimado', 
      visible: true, 
      render: (item) => formatCurrency(item.estimated_cost) 
    },
    { 
      id: 'actual_cost', 
      label: 'Costo Actual', 
      visible: true, 
      render: (item) => formatCurrency(item.actual_cost) 
    },
    { 
      id: 'difference_percentage', 
      label: '% Diferencia', 
      visible: true, 
      render: (item) => item.difference_percentage ? `${item.difference_percentage.toFixed(2)}%` : '-' 
    },
    { 
      id: 'amount_paid', 
      label: 'Pagado', 
      visible: true, 
      render: (item) => formatCurrency(item.amount_paid) 
    },
    { 
      id: 'pending_to_pay', 
      label: 'Pendiente', 
      visible: true, 
      render: (item) => formatCurrency(item.pending_to_pay) 
    },
  ])
  
  // Fetch report data
  const { data: reportData, isLoading, error } = useProjectReport(projectId ? parseInt(projectId) : undefined)
  
  // Group data by area for subtotals
  const groupedData = useMemo(() => {
    if (!reportData) return []
    return groupReportDataByArea(reportData)
  }, [reportData])
  
  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return calculateGrandTotals(groupedData)
  }, [groupedData])
  
  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumnConfig(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    )
  }
  
  // Show print-friendly view
  const showPrintView = () => {
    // Format current date
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const projectName = project?.name || `Proyecto ${projectId}`;
    
    // Get visible columns
    const visibleCols = columnConfig.filter(col => col.visible);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) return;
    
    // Generate HTML for report content
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
      group.items.forEach((item) => {
        tableContent += '<tr>';
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
          tableContent += `<td class="numeric">${formatCurrency(group.totals[col.id as keyof typeof group.totals])}</td>`;
        } else {
          tableContent += '<td></td>';
        }
      });
      tableContent += '</tr>';
    });
    
    // Grand total row
    tableContent += '<tr class="total-row">';
    visibleCols.forEach((col, colIndex) => {
      if (colIndex === 0) {
        tableContent += '<td>TOTAL GENERAL</td>';
      } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
        tableContent += `<td class="numeric">${formatCurrency(grandTotals[col.id as keyof typeof grandTotals])}</td>`;
      } else {
        tableContent += '<td></td>';
      }
    });
    tableContent += '</tr></tbody>';
    
    // Write the complete HTML document to the new window
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
            .wrap-text {
              white-space: normal !important;
              word-wrap: break-word !important;
              max-width: 250px;
            }
            .subtotal-row {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            .total-row {
              background-color: #e6f3ff;
              font-weight: bold;
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
                background-color: #f5f5f5 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .total-row {
                background-color: #e6f3ff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              th {
                background-color: #f5f5f5 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <img src="${logoPlaceholder}" alt="Company Logo" class="logo" />
              <h1 class="project-name">${projectName}</h1>
              <p class="report-date">${currentDate}</p>
            </div>
            
            ${reportNotes ? `
              <div class="notes mb-6">
                <h3 class="text-lg font-medium mb-2">Notas</h3>
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Error al cargar el reporte</h2>
        <p className="text-muted-foreground mb-6">
          Ocurrió un error al obtener los datos del reporte.
        </p>
        <Link to={`/projects/${projectId}`}>
          <Button>Volver al Proyecto</Button>
        </Link>
      </div>
    )
  }
  
  if (!reportData || reportData.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No hay datos para mostrar</h2>
        <p className="text-muted-foreground mb-6">
          Este proyecto no tiene elementos para generar un reporte.
        </p>
        <Link to={`/projects/${projectId}`}>
          <Button>Volver al Proyecto</Button>
        </Link>
      </div>
    )
  }
  
  // Get visible columns
  const visibleColumns = columnConfig.filter(col => col.visible)
  
  // No print mode render block needed since we're using a new window
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reporte de Proyecto</h1>
          <Link to={`/projects/${projectId}`} className="text-blue-500 hover:underline">
            Volver al Proyecto
          </Link>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button onClick={showPrintView} variant="outline">Imprimir Reporte</Button>
        </div>
      </div>
      
      {/* Column configuration */}
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium mb-2">Configurar Columnas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {columnConfig.map(col => (
            <div key={col.id} className="flex items-center">
              <input
                type="checkbox"
                id={`col-${col.id}`}
                checked={col.visible}
                onChange={() => toggleColumn(col.id)}
                className="mr-2"
              />
              <label htmlFor={`col-${col.id}`}>{col.label}</label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Notes for the report */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Notas para el Reporte</h3>
        <Editor 
          value={reportNotes} 
          onChange={(e) => setReportNotes(e.target.value)}
          containerProps={{
            style: {
              height: '200px', 
              border: '1px solid #ddd',
              borderRadius: '0.375rem'
            }
          }}
        />
        <p className="text-sm text-gray-500 mt-1">
          Use el editor para dar formato al texto. El contenido HTML será mostrado en el reporte.
        </p>
      </div>
      
      {/* Report table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map(col => (
                <th
                  key={col.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                  <tr key={`item-${itemIndex}`} className="hover:bg-gray-50">
                    {visibleColumns.map(col => (
                      <td key={col.id} className={`px-6 py-4 text-sm text-gray-500 ${col.id === 'description' ? 'wrap-text' : 'whitespace-nowrap'}`}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Area subtotal row */}
                <tr className="bg-gray-100 font-medium">
                  {visibleColumns.map((col, colIndex) => {
                    if (colIndex === 0) {
                      // First column shows the subtotal label
                      return (
                        <td key={`subtotal-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          Subtotal: {group.area}
                        </td>
                      );
                    } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                      // Show subtotals for numeric columns
                      return (
                        <td key={`subtotal-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          {formatCurrency(group.totals[col.id as keyof typeof group.totals])}
                        </td>
                      );
                    } else {
                      // Empty cell for other columns
                      return <td key={`subtotal-${colIndex}`} className="px-6 py-4"></td>;
                    }
                  })}
                </tr>
              </React.Fragment>
            ))}
            
            {/* Grand total row */}
            <tr className="bg-blue-50 font-bold">
              {visibleColumns.map((col, colIndex) => {
                if (colIndex === 0) {
                  // First column shows the total label
                  return (
                    <td key={`total-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      TOTAL GENERAL
                    </td>
                  );
                } else if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
                  // Show totals for numeric columns
                  return (
                    <td key={`total-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      {formatCurrency(grandTotals[col.id as keyof typeof grandTotals])}
                    </td>
                  );
                } else {
                  // Empty cell for other columns
                  return <td key={`total-${colIndex}`} className="px-6 py-4"></td>;
                }
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}