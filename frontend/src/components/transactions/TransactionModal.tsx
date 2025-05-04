import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateTransaction, useUpdateTransaction, Transaction } from '../../hooks/useTransactions'
import { useProjectItems } from '../../hooks/useProjectItems'
import { Button } from '../ui/button'

interface TransactionModalProps {
  isOpen: boolean
  projectId: number
  transaction?: Transaction & { project_items?: { item_name: string } | null }
  onClose: () => void
}

type FormData = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>

export function TransactionModal({
  isOpen,
  projectId,
  transaction,
  onClose
}: TransactionModalProps) {
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(true)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const { data: projectItems } = useProjectItems(projectId)
  
  const isNewTransaction = !transaction?.id
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: isNewTransaction
      ? {
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'Otros',
        }
      : {
          project_id: transaction.project_id,
          project_item_id: transaction.project_item_id || undefined,
          date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: transaction.amount,
          client_facing_amount: transaction.client_facing_amount || undefined,
          payment_method: transaction.payment_method,
          description: transaction.description || '',
          invoice_receipt_number: transaction.invoice_receipt_number || '',
        }
  })
  
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
      if (isNewTransaction) {
        await createTransaction.mutateAsync(data)
      } else if (transaction?.id) {
        await updateTransaction.mutateAsync({ id: transaction.id, ...data })
      }
      
      if (saveAndAddAnother) {
        reset({
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          payment_method: 'Otros',
        })
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="block font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  {...register('date', { required: 'Date is required' })}
                  className="w-full p-2 border rounded-md"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="project_item_id" className="block font-medium">
                  Project Item
                </label>
                <select
                  id="project_item_id"
                  {...register('project_item_id', { valueAsNumber: true })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">No specific item</option>
                  {projectItems?.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.item_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block font-medium">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                className="w-full p-2 border rounded-md"
                placeholder="What was this transaction for?"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="amount" className="block font-medium">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  {...register('amount', { 
                    required: 'Amount is required',
                    valueAsNumber: true,
                  })}
                  className="w-full p-2 border rounded-md"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="client_facing_amount" className="block font-medium">
                  Client Amount
                </label>
                <input
                  type="number"
                  id="client_facing_amount"
                  step="0.01"
                  {...register('client_facing_amount', { 
                    valueAsNumber: true
                  })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="payment_method" className="block font-medium">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_method"
                  {...register('payment_method', { required: 'Payment method is required' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Efectivo">Cash</option>
                  <option value="Tarjeta">Card</option>
                  <option value="Transferencia">Transfer</option>
                  <option value="Cheque">Check</option>
                  <option value="Otros">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="invoice_receipt_number" className="block font-medium">
                  Invoice/Receipt #
                </label>
                <input
                  id="invoice_receipt_number"
                  {...register('invoice_receipt_number')}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
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