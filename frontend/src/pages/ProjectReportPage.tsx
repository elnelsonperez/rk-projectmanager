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
import PrintableReport from '../components/reports/PrintableReport'

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
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [reportNotes, setReportNotes] = useState('')
  
  // Define columns for the report
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { id: 'category', label: 'Categoría', visible: true, render: (item) => item.category || '-' },
    { id: 'area', label: 'Área', visible: true, render: (item) => item.area || '-' },
    { id: 'item_name', label: 'Elemento', visible: true, render: (item) => item.item_name },
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
  
  // Export to CSV
  const exportCSV = () => {
    if (!reportData) return
    
    // Get visible columns
    const visibleColumns = columnConfig.filter(c => c.visible)
    
    // Create headers
    const headers = visibleColumns.map(c => c.label).join(',')
    
    // Create rows
    const rows = reportData.map(item => 
      visibleColumns.map(col => {
        if (['estimated_cost', 'actual_cost', 'amount_paid', 'pending_to_pay'].includes(col.id)) {
          return item[col.id as keyof ReportItem] || 0
        } else if (col.id === 'difference_percentage') {
          return item.difference_percentage ? item.difference_percentage.toFixed(2) : ''
        } else {
          return `"${item[col.id as keyof ReportItem] || ''}"`
        }
      }).join(',')
    ).join('\\n')
    
    // Combine and download
    const csvContent = `${headers}\\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_proyecto_${projectId}.csv`)
    link.click()
  }
  
  // Show print-friendly view
  const showPrintView = () => {
    setIsPrintMode(true)
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
  
  // Render print mode if active
  if (isPrintMode && reportData) {
    return (
      <PrintableReport
        projectName={project?.name || `Proyecto ${projectId}`}
        reportData={reportData}
        groupedData={groupedData}
        visibleColumns={visibleColumns}
        grandTotals={grandTotals}
        notes={reportNotes}
        onClose={() => setIsPrintMode(false)}
      />
    );
  }
  
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
          <Button onClick={exportCSV} variant="outline">Exportar CSV</Button>
          <Button onClick={showPrintView} variant="outline">Vista de Impresión</Button>
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
        <textarea
          className="w-full p-3 border rounded-md"
          rows={3}
          placeholder="Agregue aquí notas o comentarios para incluir en el reporte impreso..."
          value={reportNotes}
          onChange={(e) => setReportNotes(e.target.value)}
        />
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
                      <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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