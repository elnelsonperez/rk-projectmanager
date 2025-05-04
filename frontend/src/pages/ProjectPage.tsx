import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
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

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const [activeTab, setActiveTab] = useState('items')
  
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.client_id && (
            <p className="text-muted-foreground mt-1">
              Client ID: {project.client_id}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditProject}>Editar Proyecto</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="font-medium mb-2">Estado</h3>
          <p>{project.status}</p>
        </div>
        
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="font-medium mb-2">Cronograma</h3>
          <div className="text-sm">
            {project.start_date ? (
              <p>Inicio: {new Date(project.start_date).toLocaleDateString()}</p>
            ) : (
              <p>Fecha de inicio no establecida</p>
            )}
            
            {project.estimated_completion ? (
              <p>Finalización est.: {new Date(project.estimated_completion).toLocaleDateString()}</p>
            ) : (
              <p>Fecha de finalización no establecida</p>
            )}
          </div>
        </div>
        
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="font-medium mb-2">Presupuesto</h3>
          {project.budget ? (
            <p className="text-xl font-semibold">{formatCurrency(project.budget)}</p>
          ) : (
            <p>Sin presupuesto establecido</p>
          )}
        </div>
      </div>
      
      {project.notes && (
        <div className="bg-muted/20 rounded-lg p-4">
          <h3 className="font-medium mb-2">Notas</h3>
          <p className="whitespace-pre-line">{project.notes}</p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Elementos del Proyecto</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="p-0 border-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Elementos del Proyecto</h2>
            <Button onClick={handleAddItem}>Añadir Elemento</Button>
          </div>
          
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
        
        <TabsContent value="transactions" className="p-0 border-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transacciones</h2>
            <Button onClick={handleAddTransaction}>Añadir Transacción</Button>
          </div>
          
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
    </div>
  )
}