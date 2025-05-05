import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { 
  useProjectReport, 
  groupReportDataByArea, 
  calculateGrandTotals 
} from '../hooks/useProjectReport'
import { useReportColumns } from '../hooks/useReportColumns'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { useState } from 'react'
import logoPlaceholder from '../assets/company-logo-placeholder.svg'
import ReportTable from '../components/reports/ReportTable'
import ColumnSelector from '../components/reports/ColumnSelector'
import NotesEditor from '../components/reports/NotesEditor'
import { generateTableContent, openPrintWindow } from '../utils/printUtils'

export default function ProjectReportPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project } = useProject(projectId)
  const [reportNotes, setReportNotes] = useState('')
  
  // Use column configuration hook
  const { columnConfig, toggleColumn, visibleColumns } = useReportColumns();
  
  // Fetch report data
  const { data: reportData, isLoading, error } = useProjectReport(
    projectId ? parseInt(projectId) : undefined
  )
  
  // Group data by area for subtotals
  const groupedData = useMemo(() => {
    if (!reportData) return []
    return groupReportDataByArea(reportData)
  }, [reportData])
  
  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return calculateGrandTotals(groupedData)
  }, [groupedData])
  
  // Show print-friendly view
  const handlePrint = () => {
    if (!reportData) return;
    
    const projectName = project?.name || `Proyecto ${projectId}`;
    const tableContent = generateTableContent(visibleColumns, groupedData, grandTotals);
    
    openPrintWindow(projectName, logoPlaceholder, reportNotes, tableContent);
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }
  
  // Error state
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
  
  // Empty data state
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
  
  return (
    <div className="w-full">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reporte de Proyecto</h1>
          <Link to={`/projects/${projectId}`} className="text-blue-500 hover:underline text-sm">
            Volver al Proyecto
          </Link>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={handlePrint} variant="outline" size="sm" className="text-xs sm:text-sm">
            Imprimir Reporte
          </Button>
        </div>
      </div>
      
      {/* Column configuration section */}
      <ColumnSelector 
        columnConfig={columnConfig} 
        onToggleColumn={toggleColumn} 
      />
      
      {/* Notes editor section */}
      <NotesEditor 
        value={reportNotes} 
        onChange={setReportNotes} 
      />
      
      {/* Report table */}
      <ReportTable 
        visibleColumns={visibleColumns}
        groupedData={groupedData}
        grandTotals={grandTotals}
      />
    </div>
  )
}