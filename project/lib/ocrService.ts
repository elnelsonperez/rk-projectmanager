export interface OCRResult {
  csvData: string;
  error?: string;
}

/**
 * Parse an image file containing a handwritten invoice/cuenta using Claude OCR
 * This function now calls the backend API to keep the API key secure
 *
 * @param imageFile - The image file to parse
 * @returns OCRResult with CSV data or error message
 */
export async function parseImageToCSV(imageFile: File): Promise<OCRResult> {
  try {
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('image', imageFile);

    // Call the backend API
    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        csvData: '',
        error: data.error || 'Error al procesar la imagen',
      };
    }

    return {
      csvData: data.csvData,
    };
  } catch (error: unknown) {
    console.error('Error en OCR:', error);

    return {
      csvData: '',
      error: `Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}
