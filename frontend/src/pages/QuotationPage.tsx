import { useState } from 'react';
import { QuotationForm } from '../components/quotations/QuotationForm';
import { QuotationManager } from '../components/quotations/QuotationManager';
import { QuotationFormData } from '../types/quotation.types';

export default function QuotationPage() {
  const [currentData, setCurrentData] = useState<QuotationFormData>({
    clientName: '',
    items: [{ id: crypto.randomUUID(), description: '', amount: 0 }]
  });
  const [loadedData, setLoadedData] = useState<QuotationFormData | undefined>();

  const handleLoadQuotation = (data: QuotationFormData) => {
    setLoadedData(data);
  };

  const handleDataChange = (data: QuotationFormData) => {
    setCurrentData(data);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Generar Cotización
          </h1>
          <p className="text-gray-600 mt-2">
            Crea cotizaciones profesionales para tus clientes
          </p>
        </div>
        
        <QuotationManager
          currentQuotation={currentData}
          onLoadQuotation={handleLoadQuotation}
        />
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <QuotationForm 
            initialData={loadedData}
            onDataChange={handleDataChange}
          />
        </div>
      </div>
    </div>
  );
}