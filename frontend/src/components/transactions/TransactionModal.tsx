import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useCreateTransaction, useUpdateTransaction, Transaction } from '../../hooks/useTransactions'
import { useProjectItems, useProjectItem } from '../../hooks/useProjectItems'
import { useTransactionAttachment } from '../../hooks/useTransactionAttachment'
import { useProjectItemBudgetGuidance } from '../../hooks/useProjectItemTransactions'
import { Button } from '../ui/button'
import { FileUploader } from '../ui/file-uploader'
import { toast } from '../ui/toast'
import { ComboboxObject } from '../ui/ComboboxObject'
import { CurrencyInput } from '../ui/CurrencyInput'
import { BudgetGuidance } from './BudgetGuidance'

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
  const isNewTransaction = !transaction?.id
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(isNewTransaction)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
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
    name: 'project_item_id'
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
        setSelectedFile(null);
        reset({
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'Otros',
          transactionType: 'expense', // Reset to expense
        })
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
      
      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <CurrencyInput
                  id="amount"
                  label={`${transactionType === 'income' ? 'Monto (Ingreso)' : 'Monto'} *`}
                  registration={register('amount', { 
                    required: 'El monto es obligatorio',
                    valueAsNumber: true,
                  })}
                  error={errors.amount?.message}
                />
                {transactionType === 'income' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Para transacciones de ingreso, este monto será registrado como un pago del cliente.
                  </p>
                )}
              </div>
              
              {/* Only show client amount field for expense transactions */}
              {transactionType !== 'income' && (
                <div className="space-y-2">
                  <CurrencyInput
                    id="client_facing_amount"
                    label="Monto Cliente"
                    registration={register('client_facing_amount', { 
                      valueAsNumber: true
                    })}
                    className={selectedProjectItemId && budgetInfo?.isOverBudget ? 'border-red-300' : ''}
                  />
                  
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
              label="Adjuntar comprobante"
              onFileSelected={setSelectedFile}
              initialFileUrl={transaction?.attachment_url || null}
              onRemoveFile={() => setSelectedFile(null)}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={uploadError}
              accept="application/pdf,image/*"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="sticky bottom-0 bg-background p-4 border-t flex flex-wrap justify-end gap-3">
            <label className="flex items-center mr-auto">
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
        </form>
      </div>
    </div>
  )
}