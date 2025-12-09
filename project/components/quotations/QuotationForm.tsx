import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

import { QuotationFormData } from '../../types/quotation.types';
import { QuotationItemInput } from './QuotationItemInput';
import { formatCurrency } from '../../utils/formatters';
import { generateQuotationDocument } from '../../utils/quotationUtils';

// Validation schema
const quotationSchema = z.object({
  clientName: z.string().min(1, "Nombre del cliente requerido"),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Descripción requerida"),
    amount: z.number().min(0, "Monto debe ser positivo")
  })).min(1, "Al menos un item requerido")
});

interface QuotationFormProps {
  initialData?: QuotationFormData;
  onDataChange?: (data: QuotationFormData) => void;
}

export function QuotationForm({ initialData, onDataChange }: QuotationFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const methods = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData || {
      clientName: '',
      items: [
        { id: crypto.randomUUID(), description: '', amount: 0 }
      ]
    }
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      methods.reset(initialData);
    }
  }, [initialData, methods]);

  // Watch for changes and notify parent
  const watchedData = methods.watch();
  useEffect(() => {
    onDataChange?.(watchedData);
  }, [watchedData, onDataChange]);

  const { control, handleSubmit, watch, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Watch all items to calculate total
  const watchedItems = watch('items');
  const total = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const addItem = () => {
    append({ id: crypto.randomUUID(), description: '', amount: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: QuotationFormData) => {
    setIsGenerating(true);
    try {
      await generateQuotationDocument({
        clientName: data.clientName,
        items: data.items,
        total,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error generating quotation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Cliente
          </label>
          <input
            {...methods.register('clientName')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingrese el nombre del cliente"
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
          )}
        </div>

        {/* Items Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Items de la Cotización</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Item
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <QuotationItemInput
                key={field.id}
                index={index}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        {/* Total */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Generar Cotización
              </>
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}