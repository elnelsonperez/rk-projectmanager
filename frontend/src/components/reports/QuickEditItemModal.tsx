import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { InfoTooltip } from '../ui/InfoTooltip';
import { toast } from '../ui/toast';
import { ReportItem } from '../../hooks/useProjectReport';
import { useUpdateProjectItem } from '../../hooks/useProjectItems';

interface QuickEditItemModalProps {
  isOpen: boolean;
  item: ReportItem | null;
  projectId: number;
  onClose: () => void;
}

type FormData = {
  estimated_cost: number | null;
  internal_cost: number | null;
  client_cost: number | null;
};

export function QuickEditItemModal({ isOpen, item, projectId, onClose }: QuickEditItemModalProps) {
  const updateItem = useUpdateProjectItem();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      estimated_cost: item?.estimated_cost ?? null,
      internal_cost: item?.internal_cost ?? null,
      client_cost: item?.actual_cost ?? null,
    }
  });

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        estimated_cost: item.estimated_cost ?? null,
        internal_cost: item.internal_cost ?? null,
        client_cost: item.actual_cost ?? null,
      });
    }
  }, [item, reset]);

  // Handle escape key
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
    if (!item) return;

    // Safety check: ensure item_id exists
    if (!item.item_id) {
      toast({
        message: 'Error: No se pudo obtener el ID del artículo. Por favor, actualiza la página.',
        type: 'error'
      });
      return;
    }

    try {
      await updateItem.mutateAsync({
        id: item.item_id,
        estimated_cost: data.estimated_cost,
        internal_cost: data.internal_cost,
        client_cost: data.client_cost,
        project_id: projectId,
      });

      toast({
        message: `Costos de "${item.item_name}" actualizados exitosamente`,
        type: 'success'
      });

      onClose();
    } catch (error) {
      console.error('Error updating item costs:', error);
      toast({
        message: `Error al actualizar costos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'error'
      });
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-2xl">
        <div className="sticky top-0 bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Editar Costos: {item.item_name}
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
            {/* Reference Information */}
            <div className="bg-muted/20 p-3 rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Ejecutado:</span>
                <span className="font-medium">${item.amount_paid?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendiente (calculado):</span>
                <span className="font-medium">${item.pending_to_pay?.toFixed(2) ?? '0.00'}</span>
              </div>
            </div>

            {/* Editable Cost Fields */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="estimated_cost"
                    registration={register('estimated_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Presupuesto Inicial"
                    placeholder="0.00"
                    error={errors.estimated_cost?.message}
                  />
                  <InfoTooltip text="El costo estimado inicialmente para este artículo" />
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="internal_cost"
                    registration={register('internal_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Costo Interno Real"
                    placeholder="0.00"
                    error={errors.internal_cost?.message}
                  />
                  <InfoTooltip text="Lo que realmente pagamos al proveedor" />
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <CurrencyInput
                    id="client_cost"
                    registration={register('client_cost', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'El costo debe ser positivo' }
                    })}
                    label="Costo Confirmado al Cliente"
                    placeholder="0.00"
                    error={errors.client_cost?.message}
                  />
                  <InfoTooltip text="El costo total confirmado a cobrar al cliente" />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background p-4 border-t flex justify-end gap-3">
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
