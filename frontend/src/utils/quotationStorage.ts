import { QuotationFormData } from '../types/quotation.types';

const STORAGE_KEY = 'saved_quotations';

export interface SavedQuotation {
  id: string;
  name: string;
  data: QuotationFormData;
  savedAt: string;
}

// Get all saved quotations from localStorage
export function getSavedQuotations(): SavedQuotation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved quotations:', error);
    return [];
  }
}

// Save a quotation to localStorage
export function saveQuotation(name: string, data: QuotationFormData): string {
  try {
    const saved = getSavedQuotations();
    const id = crypto.randomUUID();
    const newQuotation: SavedQuotation = {
      id,
      name,
      data,
      savedAt: new Date().toISOString()
    };
    
    saved.push(newQuotation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return id;
  } catch (error) {
    console.error('Error saving quotation:', error);
    throw new Error('No se pudo guardar la cotización');
  }
}

// Delete a saved quotation
export function deleteSavedQuotation(id: string): void {
  try {
    const saved = getSavedQuotations();
    const filtered = saved.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting quotation:', error);
    throw new Error('No se pudo eliminar la cotización');
  }
}

// Get a specific saved quotation
export function getSavedQuotation(id: string): SavedQuotation | null {
  const saved = getSavedQuotations();
  return saved.find(q => q.id === id) || null;
}

// Update a saved quotation
export function updateSavedQuotation(id: string, name: string, data: QuotationFormData): void {
  try {
    const saved = getSavedQuotations();
    const index = saved.findIndex(q => q.id === id);
    
    if (index !== -1) {
      saved[index] = {
        ...saved[index],
        name,
        data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw new Error('No se pudo actualizar la cotización');
  }
}