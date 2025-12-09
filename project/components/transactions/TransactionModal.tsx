import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction, Transaction } from '../../hooks/useTransactions'
import { useProjectItems, useProjectItem } from '../../hooks/useProjectItems'
import { useTransactionAttachment } from '../../hooks/useTransactionAttachment'
import { useProjectItemBudgetGuidance } from '../../hooks/useProjectItemTransactions'
import { Button } from '../ui/button'
import { FileUploader } from '../ui/file-uploader'
import { toast } from '../ui/toast'
import { ComboboxObject } from '../ui/ComboboxObject'
import { CurrencyInput } from '../ui/CurrencyInput'
import { BudgetGuidance } from './BudgetGuidance'
import { ConfirmationDialog } from '../ui/confirmation-dialog'
import { InfoTooltip } from '../ui/InfoTooltip'
import { Trash2 } from 'lucide-react'

interface TransactionModalProps {
  isOpen: boolean
  projectId: number
  transaction?: Transaction & { project_items?: { item_name: string } | null }
  onClose: () => void
}

type FormData = Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & {
  transactionType: 'expense' | 'income'
}

export function TransactionModal({
  isOpen,
  projectId,
  transaction,
  onClose
}: TransactionModalProps) {
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isNewTransaction = !transaction?.id
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(isNewTransaction)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const { data: projectItems } = useProjectItems(projectId)
  const { 
    handleUpload, 
    handleRemove, 
    isUploading, 
    uploadProgress, 
    uploadError 
  } = useTransactionAttachment()
  
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: isNewTransaction
      ? {
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'Otros',
          transactionType: 'expense', // Default to expense
        }
      : {
          project_id: transaction.project_id,
          project_item_id: transaction.project_item_id || undefined,
          date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: Math.abs(transaction.amount || 0), // Store absolute value for display
          client_facing_amount: transaction.client_facing_amount ? Math.abs(transaction.client_facing_amount) : undefined,
          payment_method: transaction.payment_method,
          description: transaction.description || '',
          invoice_receipt_number: transaction.invoice_receipt_number || '',
          transactionType: transaction.amount < 0 ? 'income' : 'expense', // Determine type based on amount sign
        }
  })
  
  // Watch for transaction type changes
  const transactionType = useWatch({
    control,
    name: 'transactionType',
    defaultValue: 'expense'
  })
  
  // Watch project_item_id for budget guidance
  const selectedProjectItemId = useWatch({
    control,
    name: 'project_item_id',
    defaultValue: transaction?.project_item_id // Set default value from transaction prop
  }) as number | undefined
  
  // Fetch selected project item details if needed
  const { data: selectedProjectItem } = useProjectItem(selectedProjectItemId)
  
  // Get budget guidance for the selected project item
  const budgetInfo = useProjectItemBudgetGuidance(
    selectedProjectItemId,
    projectId,
    selectedProjectItem,
    transaction?.id // Pass current transaction ID to avoid double-counting
  )
  
  // Function to apply recommended amount
  const applyRecommendedAmount = (amount: number) => {
    setValue('client_facing_amount', amount)
  }
  
  // Set default description when switching to income type
  useEffect(() => {
    if (transactionType === 'income' && !isSubmitting) {
      setValue('description', 'Abono por parte del cliente')
    }
  }, [transactionType, setValue, isSubmitting])
  
  // Make sure project item ID from transaction is set when the modal opens
  useEffect(() => {
    if (transaction?.project_item_id) {
      setValue('project_item_id', transaction.project_item_id)
    }
  }, [transaction?.project_item_id, setValue])
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Handle transaction deletion
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!transaction?.id) return;
    
    try {
      setIsDeleting(true);
      
      // If there's an attachment, remove it first
      if (transaction.attachment_url) {
        await handleRemove(transaction.attachment_url);
      }
      
      // Delete the transaction
      await deleteTransaction.mutateAsync({ id: transaction.id, projectId });
      
      toast({ 
        message: 'Transacción eliminada exitosamente', 
        type: 'success' 
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      
      toast({ 
        message: `Error al eliminar la transacción: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        type: 'error'
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Handle transaction type
      const { transactionType, ...transactionData } = data
      
      // Apply negative sign for income transactions
      const amount = transactionType === 'income' 
        ? -Math.abs(data.amount) 
        : Math.abs(data.amount)
      
      // For income, set client_facing_amount equal to amount
      const client_facing_amount = transactionType === 'income'
        ? amount
        : data.client_facing_amount

      // Handle file upload if a file was selected
      let attachmentUrl = transaction?.attachment_url;
      
      // If we're removing the existing attachment
      if (attachmentUrl && !selectedFile) {
        await handleRemove(attachmentUrl);
        attachmentUrl = null;
      }
      
      // If we have a new file to upload
      if (selectedFile) {
        // Remove existing attachment if there is one
        if (attachmentUrl) {
          await handleRemove(attachmentUrl);
        }
        
        // Upload the new file
        attachmentUrl = await handleUpload(selectedFile);
      }

      // Prepare the data with the correct sign and attachment
      const submitData = {
        ...transactionData,
        amount,
        client_facing_amount,
        attachment_url: attachmentUrl
      }
      
      if (isNewTransaction) {
        await createTransaction.mutateAsync(submitData)
        toast({ 
          message: `Transacción de ${transactionType === 'income' ? 'ingreso' : 'gasto'} creada exitosamente`, 
          type: 'success' 
        })
      } else if (transaction?.id) {
        await updateTransaction.mutateAsync({ id: transaction.id, ...submitData })
        toast({ 
          message: `Transacción actualizada exitosamente`, 
          type: 'success'
        })
      }
      
      if (saveAndAddAnother) {
        // Set flag that we just submitted a form with "Save and add another"
        setJustSubmitted(true);
        
        // Clear the selected file state
        setSelectedFile(null);
        
        // If transaction was opened with a pre-selected project item (from items table),
        // preserve that project_item_id
        const preserveProjectItemId = !isNewTransaction ? undefined : transaction?.project_item_id;
        
        // Reset the form completely
        reset({
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'Otros',
          transactionType: 'expense', // Reset to expense
          // Conditionally preserve project_item_id if it was provided initially
          project_item_id: preserveProjectItemId,
          client_facing_amount: undefined,
          description: '',
          invoice_receipt_number: '',
          attachment_url: null,
        })
        
        // Reset the submitted flag after a brief delay to ensure FileUploader rerenders
        setTimeout(() => {
          setJustSubmitted(false);
        }, 100);
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      toast({ 
        message: `Error al guardar la transacción: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        type: 'error'
      })
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showDeleteConfirmation}
        title="Eliminar Transacción"
        message="¿Estás seguro que deseas eliminar esta transacción? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmColor="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded-lg">
            <div className="text-center">
              <div className="spinner mb-2"></div>
              <p>Eliminando transacción...</p>
            </div>
          </div>
        )}
      
        <div className="sticky top-0 bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isNewTransaction ? 'Añadir Transacción' : 'Editar Transacción'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 space-y-4">
            {/* Transaction Type selector */}
            <div className="space-y-2">
              <label className="block font-medium">
                Tipo de Transacción <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label 
                  className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                    transactionType === 'expense' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    value="expense"
                    {...register('transactionType')}
                    className="sr-only"
                  />
                  <span>Gasto</span>
                </label>
                <label 
                  className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                    transactionType === 'income' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    value="income"
                    {...register('transactionType')}
                    className="sr-only"
                  />
                  <span>Ingreso</span>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${transactionType !== 'income' ? 'md:grid-cols-2' : ''} gap-4`}>
              <div className="space-y-2">
                <label htmlFor="date" className="block font-medium">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  {...register('date', { required: 'La fecha es obligatoria' })}
                  className="w-full p-2 border rounded-md"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>
              
              {/* Only show project item field for expense transactions */}
              {transactionType !== 'income' && (
                <div className="space-y-2">
                  <ComboboxObject
                    id="project_item_id"
                    label="Artículo del Proyecto"
                    registration={register('project_item_id', { 
                      valueAsNumber: true
                    })}
                    options={(projectItems || []).map(item => ({
                      value: item.id,
                      label: item.item_name,
                      description: item.description || (item.area ? `Área: ${item.area}` : undefined)
                    }))}
                    defaultValue={transaction?.project_item_id || undefined}
                    placeholder="Buscar por nombre o descripción..."
                    emptyOption="Sin artículo específico"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block font-medium">
                Descripción
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                className="w-full p-2 border rounded-md"
                placeholder="¿Para qué fue esta transacción?"
              />
            </div>
            
            <div className={`grid grid-cols-1 ${transactionType === 'income' ? '' : 'md:grid-cols-2'} gap-4`}>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CurrencyInput
                    id="amount"
                    label={`${transactionType === 'income' ? 'Monto (Ingreso)' : 'Monto Interno'} *`}
                    registration={register('amount', {
                      required: 'El monto es obligatorio',
                      valueAsNumber: true,
                    })}
                    error={errors.amount?.message}
                  />
                  {transactionType !== 'income' && (
                    <InfoTooltip text="El monto real que pagaste al proveedor (costo interno)" />
                  )}
                </div>
                {transactionType === 'income' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Para transacciones de ingreso, este monto será registrado como un pago del cliente.
                  </p>
                )}
              </div>
              
              {/* Only show client amount field for expense transactions */}
              {transactionType !== 'income' && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CurrencyInput
                      id="client_facing_amount"
                      label="Monto a Aplicar al Presupuesto"
                      registration={register('client_facing_amount', {
                        valueAsNumber: true
                      })}
                      className={selectedProjectItemId && budgetInfo?.isOverBudget ? 'border-red-300' : ''}
                    />
                    <InfoTooltip text="Cuánto de este gasto se aplica al presupuesto del cliente (puede ser diferente del costo interno)" />
                  </div>
                  
                  {/* Show budget guidance when a project item is selected */}
                  {selectedProjectItemId && budgetInfo && (
                    <BudgetGuidance 
                      budgetInfo={budgetInfo} 
                      onApplyRecommended={applyRecommendedAmount}
                    />
                  )}
                  
                  {/* General help text when no project item is selected */}
                  {!selectedProjectItemId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Seleccione un artículo de proyecto para ver recomendaciones de presupuesto.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="payment_method" className="block font-medium">
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_method"
                  {...register('payment_method', { required: 'El método de pago es obligatorio' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="invoice_receipt_number" className="block font-medium">
                  Factura/Recibo #
                </label>
                <input
                  id="invoice_receipt_number"
                  {...register('invoice_receipt_number')}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            {/* File attachment */}
            <FileUploader
              key={justSubmitted ? "new-uploader" : "file-uploader"} // Force re-render when submitted
              label="Adjuntar comprobante"
              onFileSelected={setSelectedFile}
              initialFileUrl={justSubmitted ? null : transaction?.attachment_url || null}
              onRemoveFile={() => setSelectedFile(null)}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={uploadError}
              accept="application/pdf,image/*"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="sticky bottom-0 bg-background p-4 border-t flex flex-wrap justify-between gap-3">
            <div>
              {!isNewTransaction && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={saveAndAddAnother}
                  onChange={e => setSaveAndAddAnother(e.target.checked)}
                  className="mr-2"
                />
                Guardar y añadir otra
              </label>
              
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : isNewTransaction ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}