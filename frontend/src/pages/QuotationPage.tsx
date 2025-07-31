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
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);

  const handleLoadQuotation = (data: QuotationFormData, quotationId?: string) => {
    setLoadedData(data);
    setEditingQuotationId(quotationId || null);
  };

  const handleDataChange = (data: QuotationFormData) => {
    setCurrentData(data);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">

        <QuotationManager
          currentQuotation={currentData}
          onLoadQuotation={handleLoadQuotation}
          editingQuotationId={editingQuotationId}
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