import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { 
  useProjectReport, 
  groupReportDataByArea, 
  calculateGrandTotals 
} from '../hooks/useProjectReport'
import { useReportColumns } from '../hooks/useReportColumns'
import { useProjectIncome } from '../hooks/useTransactions'
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
  const parsedProjectId = projectId ? parseInt(projectId) : undefined
  const { data: project } = useProject(projectId)
  const [reportNotes, setReportNotes] = useState('')
  const [showIncomeRow, setShowIncomeRow] = useState(true)
  const [showBalanceRow, setShowBalanceRow] = useState(true)
  
  // Use column configuration hook
  const { columnConfig, toggleColumn, visibleColumns } = useReportColumns();
  
  // Fetch report data
  const { data: reportData, isLoading, error } = useProjectReport(parsedProjectId)
  
  // Fetch income data (negative amount transactions)
  const { data: totalIncome = 0, isLoading: isLoadingIncome } = useProjectIncome(parsedProjectId)
  
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
    const tableContent = generateTableContent(
      visibleColumns, 
      groupedData, 
      grandTotals, 
      totalIncome,
      showIncomeRow,
      showBalanceRow
    );
    
    openPrintWindow(projectName, logoPlaceholder, reportNotes, tableContent);
  }
  
  // Loading state
  if (isLoading || isLoadingIncome) {
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
      
      {/* Column and summary rows configuration section */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Configuración del reporte</h3>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Columnas</h4>
            <ColumnSelector 
              columnConfig={columnConfig} 
              onToggleColumn={toggleColumn} 
            />
          </div>
          
          <div className="lg:w-64">
            <h4 className="text-sm font-medium mb-2">Filas de resumen</h4>
            <div className="space-y-2 border rounded-md p-3 bg-muted/10">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showIncomeRow}
                  onChange={(e) => setShowIncomeRow(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Mostrar ingresos del cliente</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBalanceRow}
                  onChange={(e) => setShowBalanceRow(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Mostrar balance restante</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
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
        totalIncome={totalIncome}
        showIncomeRow={showIncomeRow}
        showBalanceRow={showBalanceRow}
      />
    </div>
  )
}