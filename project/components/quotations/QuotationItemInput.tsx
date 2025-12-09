import { useFormContext } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { QuotationFormData } from '../../types/quotation.types';
import { CurrencyInput } from '../ui/CurrencyInput';

interface QuotationItemInputProps {
  index: number;
  onRemove: () => void;
}

export function QuotationItemInput({ index, onRemove }: QuotationItemInputProps) {
  const { register, formState: { errors } } = useFormContext<QuotationFormData>();

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
          title="Eliminar item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register(`items.${index}.description`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={5}
            placeholder="Describe el servicio o producto (puedes usar **negrita** y *cursiva*)"
          />
          {errors.items?.[index]?.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.items[index].description?.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Soporta markdown básico: **negrita**, *cursiva*, - listas
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio
          </label>
          <CurrencyInput
            registration={register(`items.${index}.amount`, { valueAsNumber: true })}
            placeholder="0.00"
            className="w-full"
          />
          {errors.items?.[index]?.amount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.items[index].amount?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}