/**
 * OCR API response structure from Claude
 */
export interface OCRAPIResponse {
  success: boolean;
  items?: Array<{
    area: string;
    item_name: string;
    description: string;
    category: string;
    cost: number;
  }>;
  items_found: number;
  message?: string;
  error?: string;
}

/**
 * Parse an image file containing a handwritten invoice/cuenta using Claude OCR
 * This function now calls the backend API to keep the API key secure
 *
 * @param imageFile - The image file to parse
 * @returns OCRAPIResponse with structured items or error message
 */
export async function parseImage(imageFile: File): Promise<OCRAPIResponse> {
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
        success: false,
        items_found: 0,
        error: data.error || 'Error al procesar la imagen',
      };
    }

    return data as OCRAPIResponse;
  } catch (error: unknown) {
    console.error('Error en OCR:', error);

    return {
      success: false,
      items_found: 0,
      error: `Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}
