import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Edit3 } from 'lucide-react';
import { QuotationFormData } from '../../types/quotation.types';
import { 
  getSavedQuotations, 
  saveQuotation, 
  deleteSavedQuotation, 
  updateSavedQuotation,
  SavedQuotation 
} from '../../utils/quotationStorage';

interface QuotationManagerProps {
  currentQuotation: QuotationFormData;
  onLoadQuotation: (data: QuotationFormData) => void;
  onSaveSuccess?: () => void;
}

export function QuotationManager({ currentQuotation, onLoadQuotation, onSaveSuccess }: QuotationManagerProps) {
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedQuotations();
  }, []);

  const loadSavedQuotations = () => {
    setSavedQuotations(getSavedQuotations());
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    
    try {
      if (editingId) {
        updateSavedQuotation(editingId, saveName.trim(), currentQuotation);
        setEditingId(null);
      } else {
        saveQuotation(saveName.trim(), currentQuotation);
      }
      
      setSaveName('');
      setShowSaveDialog(false);
      loadSavedQuotations();
      onSaveSuccess?.();
    } catch (error) {
      console.error('Error saving quotation:', error);
    }
  };

  const handleLoad = (quotation: SavedQuotation) => {
    onLoadQuotation(quotation.data);
    setShowLoadDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
      try {
        deleteSavedQuotation(id);
        loadSavedQuotations();
      } catch (error) {
        console.error('Error deleting quotation:', error);
      }
    }
  };

  const startEdit = (quotation: SavedQuotation) => {
    setEditingId(quotation.id);
    setSaveName(quotation.name);
    setShowSaveDialog(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveName('');
    setShowSaveDialog(false);
  };

  const canSave = currentQuotation.clientName.trim() || currentQuotation.items.some(item => item.description.trim() || item.amount > 0);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Gestión de Cotizaciones</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!canSave}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Guardar cotización actual"
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </button>
          <button
            onClick={() => setShowLoadDialog(true)}
            disabled={savedQuotations.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Cargar cotización guardada"
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            Cargar
          </button>
        </div>
      </div>

      {savedQuotations.length > 0 && (
        <div className="text-sm text-gray-600">
          {savedQuotations.length} cotización{savedQuotations.length !== 1 ? 'es' : ''} guardada{savedQuotations.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-medium mb-4">
              {editingId ? 'Actualizar Cotización' : 'Guardar Cotización'}
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la cotización
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Ej: Cotización Cliente ABC"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-medium mb-4">Cargar Cotización</h4>
            {savedQuotations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay cotizaciones guardadas</p>
            ) : (
              <div className="space-y-3">
                {savedQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{quotation.name}</h5>
                        <p className="text-sm text-gray-600">
                          Cliente: {quotation.data.clientName || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {quotation.data.items.length} item{quotation.data.items.length !== 1 ? 's' : ''} • 
                          Guardado: {new Date(quotation.savedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEdit(quotation)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar nombre"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quotation.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleLoad(quotation)}
                          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Cargar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}