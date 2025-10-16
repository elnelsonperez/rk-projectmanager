import { useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProject, useUpdateProjectReportNotes } from '../hooks/useProjects'
import { 
  useProjectReport, 
  groupReportDataByArea, 
  calculateGrandTotals
} from '../hooks/useProjectReport'
import { useReportColumns } from '../hooks/useReportColumns'
import { useProjectIncome } from '../hooks/useTransactions'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { useState, useEffect } from 'react'
import logoRk from '../assets/logork.jpg'
import ReportTable from '../components/reports/ReportTable'
import ColumnSelector from '../components/reports/ColumnSelector'
import { QuickEditItemModal } from '../components/reports/QuickEditItemModal'
import { ReportItem } from '../hooks/useProjectReport'
import Editor from 'react-simple-wysiwyg'
import { generateTableContent, openPrintWindow } from '../utils/printUtils'
import { X, Filter, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { ComboboxObject } from '../components/ui/ComboboxObject'

export default function ProjectReportPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const parsedProjectId = projectId ? parseInt(projectId) : undefined
  const navigate = useNavigate()
  const { data: project } = useProject(projectId)
  const [reportNotes, setReportNotes] = useState('')
  const [showIncomeRow, setShowIncomeRow] = useState(false)
  const [showBalanceRow, setShowBalanceRow] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [editingItem, setEditingItem] = useState<ReportItem | null>(null)
  const { mutate: updateReportNotes, isPending: isSavingNotes } = useUpdateProjectReportNotes()
  
  // Filter state
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  
  // Use column configuration hook
  const { columnConfig, toggleColumn, visibleColumns } = useReportColumns();
  
  // Fetch report data
  const { data: reportData, isLoading, error } = useProjectReport(parsedProjectId)
  
  // Fetch income data (negative amount transactions)
  const { data: totalIncome = 0, isLoading: isLoadingIncome } = useProjectIncome(parsedProjectId)
  
  // Load report notes from project data when available
  useEffect(() => {
    if (project?.report_notes) {
      setReportNotes(project.report_notes);
    }
  }, [project?.report_notes]);
  
  // Extract unique areas and suppliers for filters
  const { areaOptions, supplierOptions } = useMemo(() => {
    if (!reportData) return { areaOptions: [], supplierOptions: [] };
    
    // Get unique areas
    const uniqueAreas = Array.from(new Set(
      reportData.map(item => item.area || 'Sin Área')
    )).sort();
    
    // Get unique suppliers
    const uniqueSuppliers = Array.from(new Set(
      reportData
        .filter(item => item.supplier_name)
        .map(item => item.supplier_name || '')
    )).sort();
    
    return {
      areaOptions: uniqueAreas.map(area => ({ value: area, label: area })),
      supplierOptions: uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier }))
    };
  }, [reportData]);
  
  // Filter the data based on selected filters
  const filteredReportData = useMemo(() => {
    if (!reportData) return [];
    
    return reportData.filter(item => {
      // Filter by area if selected
      if (selectedArea && (item.area || 'Sin Área') !== selectedArea) {
        return false;
      }
      
      // Filter by supplier if selected (would need supplier data in the report)
      if (selectedSupplier && item.supplier_name !== selectedSupplier) {
        return false;
      }
      
      return true;
    });
  }, [reportData, selectedArea, selectedSupplier]);
  
  // Group data by area for subtotals (using filtered data)
  const groupedData = useMemo(() => {
    if (!filteredReportData.length) return [];
    return groupReportDataByArea(filteredReportData);
  }, [filteredReportData]);
  
  // Calculate grand totals (based on filtered data)
  const grandTotals = useMemo(() => {
    return calculateGrandTotals(groupedData);
  }, [groupedData]);
  
  // Show print-friendly view
  const handlePrint = () => {
    if (!reportData) return;

    const projectName = project?.name || `Proyecto ${projectId}`;
    const clientName = project?.clients?.name;

    // Generate subtitle with active filters
    let filterSubtitle = '';
    if (selectedArea) {
      filterSubtitle += `Área: ${selectedArea}`;
    }
    if (selectedArea && selectedSupplier) {
      filterSubtitle += ' | ';
    }
    if (selectedSupplier) {
      filterSubtitle += `Proveedor: ${selectedSupplier}`;
    }

    const tableContent = generateTableContent(
      visibleColumns,
      groupedData,
      grandTotals,
      totalIncome,
      showIncomeRow,
      showBalanceRow,
    );

    openPrintWindow(projectName, logoRk, reportNotes, tableContent, filterSubtitle, clientName);
  }

  // Handle edit item costs
  const handleEditItem = (item: ReportItem) => {
    setEditingItem(item)
  }

  // Handle view transactions for item
  const handleViewTransactions = (item: ReportItem) => {
    navigate(`/projects/${projectId}?tab=transactions&itemId=${item.item_id}`)
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
      
      {/* Configuration toggle button */}
      <div className="mb-4">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 hover:bg-muted/30 px-3 py-2 rounded border"
        >
          <Settings className="h-4 w-4" />
          <span>Configuración del reporte</span>
          {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Configuration panels - collapsed by default */}
      {showConfig && (
        <div className="mb-6 space-y-4 bg-muted/5 p-4 border rounded-md">
          {/* Column and summary rows configuration section */}
          <div>
            <h3 className="text-lg font-medium mb-2">Configuración de columnas y totales</h3>
            
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Notas para el reporte</h3>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => {
                  if (parsedProjectId) {
                    updateReportNotes({ id: parsedProjectId, report_notes: reportNotes });
                  }
                }}
                disabled={isSavingNotes || !parsedProjectId}
              >
                {isSavingNotes ? 'Guardando...' : 'Guardar notas'}
              </Button>
            </div>
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
              Use el editor para dar formato al texto. El contenido HTML será guardado con el proyecto y mostrado en el reporte impreso.
            </p>
          </div>
        </div>
      )}
      
      {/* Filters section - moved closer to the table */}
      <div className="mb-4 border rounded-md p-4 bg-muted/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar datos</span>
          </div>
          
          {(selectedArea || selectedSupplier) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center gap-1 text-muted-foreground"
              onClick={() => {
                setSelectedArea('');
                setSelectedSupplier('');
              }}
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ComboboxObject
              id="area-filter"
              label="Filtrar por Área"
              options={areaOptions}
              defaultValue={selectedArea}
              onSelect={(value) => setSelectedArea(value as string)}
              placeholder="Seleccionar área"
              emptyOption="Todas las áreas"
            />
          </div>
          
          {supplierOptions.length > 0 && (
            <div>
              <ComboboxObject
                id="supplier-filter"
                label="Filtrar por Proveedor"
                options={supplierOptions}
                defaultValue={selectedSupplier}
                onSelect={(value) => setSelectedSupplier(value as string)}
                placeholder="Seleccionar proveedor"
                emptyOption="Todos los proveedores"
              />
            </div>
          )}
        </div>
        
        {(selectedArea || selectedSupplier) && (
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200 text-xs text-blue-800 flex items-center">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <div>
              {selectedArea && <span className="font-medium">Área: {selectedArea}</span>}
              {selectedArea && selectedSupplier && <span className="mx-2">|</span>}
              {selectedSupplier && <span className="font-medium">Proveedor: {selectedSupplier}</span>}
            </div>
          </div>
        )}
      </div>
      
      {/* Report table */}
      <ReportTable
        visibleColumns={visibleColumns}
        groupedData={groupedData}
        grandTotals={grandTotals}
        totalIncome={totalIncome}
        showIncomeRow={showIncomeRow}
        showBalanceRow={showBalanceRow}
        filterSubtitle={
          (selectedArea || selectedSupplier) ?
          [
            selectedArea ? `Área: ${selectedArea}` : '',
            selectedSupplier ? `Proveedor: ${selectedSupplier}` : ''
          ].filter(Boolean).join(' | ') :
          ''
        }
        onEditItem={handleEditItem}
        onViewTransactions={handleViewTransactions}
      />

      {/* Quick Edit Modal */}
      <QuickEditItemModal
        isOpen={!!editingItem}
        item={editingItem}
        projectId={parsedProjectId!}
        onClose={() => setEditingItem(null)}
      />
    </div>
  )
}