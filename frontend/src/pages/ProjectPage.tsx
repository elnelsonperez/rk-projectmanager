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
import { Trash2, Edit, FileText } from 'lucide-react'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const [activeTab, setActiveTab] = useState('items')
  
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
  
  // Project Items handlers
  const handleAddItem = () => {
    setSelectedItem(undefined)
    setItemModalOpen(true)
  }
  
  const handleEditItem = (item: ProjectItem) => {
    setSelectedItem(item)
    setItemModalOpen(true)
  }
  
  // Transaction handlers
  const handleAddTransaction = () => {
    setSelectedTransaction(undefined)
    setTransactionModalOpen(true)
    setActiveTab('transactions')
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
    <div className="space-y-4 relative">
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded-lg">
          <Spinner />
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.client_id && (
            <p className="text-xs text-muted-foreground">
              Cliente: {project.client_id}
            </p>
          )}
        </div>
        
        <div className="flex gap-1 relative">
          <Button size="sm" variant="outline" onClick={handleEditProject}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
          <Link to={`/projects/${projectId}/report`}>
            <Button size="sm" variant="outline">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Reporte
            </Button>
          </Link>
          <DropdownMenu
            items={[
              {
                label: 'Eliminar proyecto',
                onClick: handleDeleteClick,
                variant: 'destructive',
                icon: <Trash2 className="h-3.5 w-3.5" />
              }
            ]}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 bg-muted/20 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Estado:</span>
          <span className="text-sm">{project.status || 'No establecido'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Inicio:</span>
          <span className="text-sm">
            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No establecido'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Fin est.:</span>
          <span className="text-sm">
            {project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString() : 'No establecido'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium text-muted-foreground">Presupuesto:</span>
          <span className="text-sm font-semibold">
            {project.budget ? formatCurrency(project.budget) : 'No establecido'}
          </span>
        </div>
      </div>
      
      {project.notes && (
        <div className="bg-muted/20 rounded-lg p-3">
          <details className="text-sm">
            <summary className="font-medium cursor-pointer">Notas</summary>
            <p className="whitespace-pre-line mt-2">{project.notes}</p>
          </details>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="h-9 mb-2">
          <TabsTrigger value="items" className="text-sm px-3 py-1.5">Artículos</TabsTrigger>
          <TabsTrigger value="transactions" className="text-sm px-3 py-1.5">Transacciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="p-0 border-0 mt-2">
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
        
        <TabsContent value="transactions" className="p-0 border-0 mt-2">
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