'use client';

import { useState } from 'react';
import { useCreateProjectItem, useProjectAreas, useProjectCategories } from '../../hooks/useProjectItems';
import { Button } from '../ui/button';
import { FileUploader } from '../ui/file-uploader';
import { CSVPreviewTable } from './CSVPreviewTable';
import { toast } from '../ui/toast';
import { parseCSVFile } from '../../utils/csvParser';
import { csvItemSchema } from '../../utils/bulkItemSchema';
import { parseImage } from '../../lib/ocrService';

interface BulkItemsModalProps {
  isOpen: boolean
  projectId: number
  onClose: () => void
}

interface PreviewItem {
  row: number
  area: string
  item_name: string
  description: string
  category: string
  cost: number
  errors: { field: string; message: string }[]
  isValid: boolean
}

type Step = 'upload' | 'preview'

export function BulkItemsModal({ isOpen, projectId, onClose }: BulkItemsModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const createItem = useCreateProjectItem()
  const { data: areas = [] } = useProjectAreas(projectId)
  const { data: categories = [] } = useProjectCategories(projectId)

  // Reusable function to process CSV data (works for both file upload and future OCR)
  const processCSVData = (rawData: any[]): PreviewItem[] => {
    return rawData.map((row, idx) => {
      const parseResult = csvItemSchema.safeParse(row)

      if (parseResult.success) {
        return {
          row: idx + 2, // +2 for header + 0-indexing
          ...parseResult.data,
          errors: [],
          isValid: true
        }
      } else {
        return {
          row: idx + 2,
          area: row.area || '',
          item_name: row.item_name || '',
          description: row.description || '',
          category: row.category || 'Otro',
          cost: parseFloat(row.cost) || 0,
          errors: parseResult.error.issues.map(issue => ({
            field: issue.path[0] as string,
            message: issue.message
          })),
          isValid: false
        }
      }
    })
  }

  // Handle file upload (CSV or Image)
  const handleFileSelected = async (file: File | null) => {
    if (!file) {
      setParseError(null)
      return
    }

    setIsProcessing(true)
    setParseError(null)

    try {
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        await handleImageOCR(file)
      } else {
        await handleCSVFile(file)
      }
    } catch (error) {
      setParseError('Error al procesar el archivo')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle CSV file upload
  const handleCSVFile = async (file: File) => {
    // 1. Parse CSV file
    const result = await parseCSVFile<any>(file, [
      'area', 'item_name', 'description', 'category', 'cost'
    ])

    if (result.errors.length > 0) {
      setParseError(result.errors.join('. '))
      return
    }

    // 2. Validate and process data
    const validated = processCSVData(result.data)

    setPreviewItems(validated)
    setStep('preview')
  }

  // Handle image OCR
  const handleImageOCR = async (imageFile: File) => {
    // 1. Parse image with OCR
    const ocrResult = await parseImage(imageFile)

    // 2. Check for errors or no results
    if (!ocrResult.success || ocrResult.error) {
      setParseError(ocrResult.error || 'Error al procesar la imagen')
      return
    }

    if (ocrResult.items_found === 0) {
      setParseError(ocrResult.message || 'No se encontraron artículos en la imagen')
      return
    }

    if (!ocrResult.items || ocrResult.items.length === 0) {
      setParseError('No se encontraron artículos en la imagen')
      return
    }

    // 3. Convert OCR items to CSV data format for validation
    const csvData = ocrResult.items.map(item => ({
      area: item.area,
      item_name: item.item_name,
      description: item.description,
      category: item.category,
      cost: item.cost.toString(),
    }))

    // 4. Validate and process data
    const validated = processCSVData(csvData)

    setPreviewItems(validated)
    setStep('preview')
  }

  const handleRemoveItem = (index: number) => {
    setPreviewItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleBackToUpload = () => {
    setStep('upload')
    setPreviewItems([])
    setParseError(null)
  }

  const handleSubmit = async () => {
    setIsSaving(true)

    try {
      const validItems = previewItems.filter(item => item.isValid)

      if (validItems.length === 0) {
        toast({
          message: 'No hay artículos válidos para crear',
          type: 'error'
        })
        setIsSaving(false)
        return
      }

      let successCount = 0
      let failCount = 0

      // Same sequential creation as current implementation
      for (const item of validItems) {
        try {
          await createItem.mutateAsync({
            project_id: projectId,
            item_name: item.item_name,
            area: item.area || undefined,
            description: item.description || undefined,
            category: item.category,
            quantity: 1,
            // Cost duplicated to all three fields
            estimated_cost: item.cost,
            internal_cost: item.cost,
            client_cost: item.cost
          })
          successCount++
        } catch (error) {
          console.error(`Error creating item "${item.item_name}":`, error)
          failCount++
        }
      }

      // Same toast logic as current implementation
      if (successCount > 0) {
        toast({
          message: `${successCount} artículo${successCount > 1 ? 's' : ''} creado${successCount > 1 ? 's' : ''} exitosamente`,
          type: 'success'
        })
      }

      if (failCount > 0) {
        toast({
          message: `${failCount} artículo${failCount > 1 ? 's' : ''} no pudo${failCount > 1 ? 'ieron' : ''} ser creado${failCount > 1 ? 's' : ''}`,
          type: 'error'
        })
      }

      // Only close if all succeeded
      if (failCount === 0) {
        onClose()
      }
    } catch (error) {
      console.error('Error in bulk creation:', error)
      toast({
        message: 'Error al crear los artículos',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const validCount = previewItems.filter(item => item.isValid).length
  const invalidCount = previewItems.length - validCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop that doesn't close on click */}
      <div className="fixed inset-0 bg-black/50" />

      <div className="z-10 bg-background rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] min-h-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-background p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 'upload' ? 'Creación Masiva de Artículos - Importar' : 'Creación Masiva de Artículos - Revisar Datos'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving || isProcessing}
            className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
            <div className="max-w-2xl w-full space-y-6">
              {/* Main heading */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Importar Artículos con IA</h3>
                <p className="text-sm text-muted-foreground">
                  Sube una foto de tu cuenta o factura escrita a mano
                </p>
              </div>

              {/* AI Feature highlight */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">Extracción Automática con IA</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Nuestro sistema usa inteligencia artificial para leer tu factura y extraer automáticamente los artículos, cantidades y costos.
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>✓ Funciona con escritura a mano</li>
                      <li>✓ Reconoce artículos y precios en español</li>
                      <li>✓ Expande abreviaciones automáticamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* File uploader */}
              <FileUploader
                onFileSelected={handleFileSelected}
                accept="image/jpeg,image/jpg,image/png,image/webp,.csv,text/csv"
                label="Seleccionar imagen de factura"
                isUploading={isProcessing}
                error={parseError}
              />

              {/* OCR Processing indicator */}
              {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Procesando imagen...</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Extrayendo artículos y costos de la imagen. Esto puede tomar unos segundos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">o también</span>
                </div>
              </div>

              {/* CSV Alternative */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium">Importar desde archivo CSV</p>
                          <p className="text-xs text-muted-foreground">Para usuarios avanzados</p>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>
                <div className="mt-3 p-4 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium mb-2">Formato del archivo CSV:</p>
                  <code className="text-xs bg-background p-2 rounded block mb-3">
                    area,item_name,description,category,cost
                  </code>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>area</strong>: Área del proyecto (opcional)</li>
                    <li>• <strong>item_name</strong>: Nombre del artículo (requerido)</li>
                    <li>• <strong>description</strong>: Descripción (opcional)</li>
                    <li>• <strong>category</strong>: Muebles, Decoración, Accesorios, Materiales, Mano de Obra, Otro</li>
                    <li>• <strong>cost</strong>: Costo en DOP (requerido)</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <>
            <div className="flex-1 overflow-auto p-4">
              {/* Summary bar */}
              <div className="bg-muted/50 p-3 rounded-lg mb-4 flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">{validCount}</span> válidos,
                  <span className="font-medium text-destructive ml-1">{invalidCount}</span> con errores
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToUpload}
                  disabled={isSaving}
                >
                  Cargar otro archivo
                </Button>
              </div>

              {/* Preview table */}
              <CSVPreviewTable
                items={previewItems}
                onItemsChange={setPreviewItems}
                onRemoveItem={handleRemoveItem}
                areas={areas}
                categories={categories}
                projectId={projectId}
              />
            </div>

            {/* Footer */}
            <div className="bg-background p-4 border-t flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Se crearán {validCount} artículo{validCount !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || validCount === 0}
                >
                  {isSaving ? 'Creando...' : `Crear ${validCount} Artículo${validCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
