import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProject, useDeleteProject } from '../hooks/useProjects'
import { useProjectStore } from '../store/projectStore'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { ProjectItemsTable } from '../components/project-items/ProjectItemsTable'
import { ProjectItemModal } from '../components/project-items/ProjectItemModal'
import { ProjectItem } from '../hooks/useProjectItems'
import { TransactionsTable } from '../components/transactions/TransactionsTable'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { Transaction } from '../hooks/useTransactions'
import { formatCurrency } from '../utils/formatters'
import { ConfirmationDialog } from '../components/ui/confirmation-dialog'
import { DropdownMenu } from '../components/ui/dropdown-menu'
import { Trash2, Edit, FileText, LayoutDashboard, Package, Receipt, Calendar, Tag, DollarSign } from 'lucide-react'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const [activeTab, setActiveTab] = useState('items') // Default to 'items' tab, options: 'items', 'transactions', 'dashboard'
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Project Items state
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProjectItem | undefined>()
  
  // Transactions state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>()
  
  // Set current project in global state when loaded
  const setCurrentProject = useProjectStore(state => state.setCurrentProject)
  useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
    
    return () => {
      // Clear the current project when leaving this page
      setCurrentProject(null)
    }
  }, [project, setCurrentProject])
  
  // Edit project handler
  const handleEditProject = () => {
    if (project) {
      navigate(`/projects/edit/${project.id}`);
    }
  }
  
  // Delete project handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  }
  
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  }
  
  const handleConfirmDelete = async () => {
    if (!project) return;
    
    try {
      setIsDeleting(true);
      await deleteProject.mutateAsync(project.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting project:', error);
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  }
  
  const handleEditItem = (item: ProjectItem) => {
    setSelectedItem(item)
    setItemModalOpen(true)
  }

  const handleCreateTransactionForItem = (item: ProjectItem) => {
    // Create a partial transaction with the project item pre-selected
    setSelectedTransaction({
      project_id: Number(projectId),
      project_item_id: item.id,
    } as Transaction)
    setTransactionModalOpen(true)
    setActiveTab('transactions')
  }
  
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setTransactionModalOpen(true)
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (error || !project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-6">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }
  
  return (
    <div className="relative">
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded-lg">
          <Spinner />
        </div>
      )}
      
      {/* Project Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4 border-b mb-4">
        <div className="flex-1">
          <div className="hidden sm:flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
            {project.client_id && (
              <div className="flex items-center gap-1" title="Cliente del proyecto">
                <span>Cliente: {project.client_id}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1" title="Estado del proyecto">
              <Tag className="h-3 w-3" />
              <span>{project.status || 'Sin estado'}</span>
            </div>
            
            <div className="flex items-center gap-1" title="Fecha estimada de finalización">
              <Calendar className="h-3 w-3" />
              <span>
                {project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString() : 'Sin fecha'}
              </span>
            </div>
            
            <div className="flex items-center gap-1" title="Presupuesto del proyecto">
              <DollarSign className="h-3 w-3" />
              <span>
                {project.budget ? formatCurrency(project.budget) : 'Sin presupuesto'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          <Link to={`/projects/${projectId}/report`}>
            <Button variant="outline" size="sm" title="Ver reporte del proyecto">
              <FileText className="h-3.5 w-3.5 mr-1" />
              <span className="text-sm">Reporte</span>
            </Button>
          </Link>
          <div className="flex items-center" title="Más opciones">
            <DropdownMenu
              items={[
                {
                  label: "Editar Proyecto",
                  onClick: handleEditProject,
                  icon: <Edit className="h-4 w-4" />
                },
                {
                  label: "Eliminar Proyecto",
                  onClick: handleDeleteClick,
                  variant: "destructive",
                  icon: <Trash2 className="h-4 w-4" />
                }
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <div className="overflow-x-auto no-scrollbar border-b mb-4">
          <TabsList className="h-auto w-full rounded-none p-0 bg-transparent flex min-w-max">
            <div title="Ver artículos del proyecto">
              <TabsTrigger 
                value="items" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 sm:px-6 whitespace-nowrap"
              >
                <Package className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Artículos</span>
              </TabsTrigger>
            </div>
            <div title="Ver transacciones del proyecto">
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 sm:px-6 whitespace-nowrap"
              >
                <Receipt className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Transacciones</span>
              </TabsTrigger>
            </div>
            <div title="Ver dashboard con estadísticas del proyecto">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-4 sm:px-6 whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Dashboard</span>
              </TabsTrigger>
            </div>
          </TabsList>
        </div>
        
        {/* Project Notes - Only shown when project has notes */}
        {project.notes && (
          <div className="bg-muted/20 rounded-lg p-3 mb-4">
            <details className="text-sm">
              <summary className="font-medium cursor-pointer">Notas del proyecto</summary>
              <p className="whitespace-pre-line mt-2">{project.notes}</p>
            </details>
          </div>
        )}
        
        <TabsContent value="items" className="p-0 mt-2">
          <ProjectItemsTable 
            projectId={Number(projectId)}
            onEditItem={handleEditItem}
            onCreateTransaction={handleCreateTransactionForItem}
          />
          
          {itemModalOpen && (
            <ProjectItemModal
              isOpen={itemModalOpen}
              projectId={Number(projectId)}
              item={selectedItem}
              onClose={() => setItemModalOpen(false)}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="p-0 mt-2">
          <TransactionsTable 
            projectId={Number(projectId)}
            onEditTransaction={handleEditTransaction}
          />
          
          {transactionModalOpen && (
            <TransactionModal
              isOpen={transactionModalOpen}
              projectId={Number(projectId)}
              transaction={selectedTransaction}
              onClose={() => setTransactionModalOpen(false)}
            />
          )}
        </TabsContent>
        
        <TabsContent value="dashboard" className="p-0 mt-2">
          <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Dashboard en construcción</h3>
            <p className="text-muted-foreground text-center max-w-md">
              El dashboard mostrará resúmenes y estadísticas del proyecto próximamente.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showDeleteConfirmation}
        title="Eliminar Proyecto"
        message={`¿Estás seguro que deseas eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer y eliminará todos los elementos y transacciones asociados al proyecto.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmColor="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}