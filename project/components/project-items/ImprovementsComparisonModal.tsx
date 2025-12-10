'use client';

import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from '../ui/toast';
import { ImprovementComparisonTable } from './ImprovementComparisonTable';
import { useBulkUpdateProjectItems } from '../../hooks/useProjectItems';
import type { ItemComparison } from '../../types/improvements.types';

interface ImprovementsComparisonModalProps {
  isOpen: boolean;
  projectId: number;
  comparisons: ItemComparison[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ImprovementsComparisonModal({
  isOpen,
  projectId,
  comparisons,
  onClose,
  onSuccess,
}: ImprovementsComparisonModalProps) {
  const [items, setItems] = useState<ItemComparison[]>(comparisons);
  const [isSaving, setIsSaving] = useState(false);
  const bulkUpdate = useBulkUpdateProjectItems();

  // Sync items when comparisons prop changes
  useEffect(() => {
    setItems(comparisons);
  }, [comparisons]);

  // Calculate statistics
  const stats = useMemo(() => {
    const itemsWithChanges = items.filter((item) => item.has_changes);
    const acceptedItems = items.filter(
      (item) => item.accepted && item.has_changes
    );
    return {
      total: items.length,
      withChanges: itemsWithChanges.length,
      accepted: acceptedItems.length,
    };
  }, [items]);

  // Toggle individual item acceptance
  const handleToggleAccept = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, accepted: !item.accepted } : item
      )
    );
  };

  // Accept all items with changes
  const handleAcceptAll = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.has_changes ? { ...item, accepted: true } : item
      )
    );
  };

  // Reject all
  const handleRejectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, accepted: false })));
  };

  // Apply accepted changes
  const handleApplyChanges = async () => {
    const acceptedItems = items.filter(
      (item) => item.accepted && item.has_changes
    );

    if (acceptedItems.length === 0) {
      toast({
        message: 'No hay cambios aceptados para aplicar',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);

    try {
      const updates = acceptedItems.map((item) => ({
        id: item.id,
        item_name: item.improved_name,
        description: item.improved_description || null,
        category: item.improved_category,
      }));

      await bulkUpdate.mutateAsync({ items: updates, projectId });

      toast({
        message: `${acceptedItems.length} artículo${acceptedItems.length > 1 ? 's' : ''} mejorado${acceptedItems.length > 1 ? 's' : ''} exitosamente`,
        type: 'success',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error applying improvements:', error);
      toast({
        message: 'Error al aplicar mejoras',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={!isSaving ? onClose : undefined}
      />

      {/* Modal */}
      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-background p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Mejoras Sugeridas por IA
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.withChanges} de {stats.total} artículos tienen mejoras
              sugeridas
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-muted/30 p-3 border-b flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium text-green-600">
              {stats.accepted}
            </span>{' '}
            cambios aceptados
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRejectAll}
              disabled={isSaving || stats.accepted === 0}
            >
              Rechazar Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcceptAll}
              disabled={isSaving || stats.withChanges === 0}
            >
              Aceptar Todos
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto p-4">
          <ImprovementComparisonTable
            items={items}
            onToggleAccept={handleToggleAccept}
          />
        </div>

        {/* Footer */}
        <div className="bg-background p-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Se aplicarán {stats.accepted} mejora
            {stats.accepted !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleApplyChanges}
              disabled={isSaving || stats.accepted === 0}
            >
              {isSaving
                ? 'Aplicando...'
                : `Aplicar ${stats.accepted} Cambio${stats.accepted !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
