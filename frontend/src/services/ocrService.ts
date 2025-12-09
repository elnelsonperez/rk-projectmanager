import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a document parser specialized in extracting itemized costs from handwritten invoices, accounts ("cuentas"), and budget notes, particularly in Spanish for interior design and construction projects.

## Task
Parse the provided image of a handwritten cuenta/invoice and extract all line items into a structured CSV format.

## Output Format
Return ONLY a valid CSV with these exact columns:
\`\`\`
area,item_name,description,category,cost
\`\`\`

## Column Rules
- **area**: Guess the best fitting area/category for the item (e.g., Pintura, Textiles, Mobiliario, Iluminación, Plomería, Electricidad, Ferretería, Decoración). Use "General" if uncertain.
- **item_name**: Full item name with abbreviations expanded (see abbreviation guide below)
- **description**: Leave empty
- **category**: Choose the most appropriate category from: Muebles, Decoración, Accesorios, Materiales, Mano de Obra, Otro. Default to "Otro" if uncertain.
- **cost**: Numeric value only, no currency symbols or thousand separators. Use 0 if no price is listed.

## Abbreviation Guide (expand these in item_name)
- hab. → Habitación
- M.O / M.D → Mano de Obra (treat as separate line item when associated with another item)
- inst. → Instalación
- dec. → Decoración
- dorm. → Dormitorio
- baño → Baño
- coc. → Cocina
- sal. → Sala
- com. → Comedor

## Parsing Rules
1. Each line item in the image becomes one row in the CSV
2. If "Mano de Obra" (M.O/M.D) appears alongside another item with a separate cost, create TWO rows: one for the item, one for the labor
3. Expand all abbreviations to their full words in Spanish
4. Ignore totals or subtotals - only parse individual line items
5. If an item has no price listed, set cost to 0
6. Currency is DOP (Dominican Pesos) - extract only the numeric value

## Example Input
\`\`\`
Pintura hab.    7,367 + M.O 3,000
Molduras        3,820
Manta Cama      1,500
\`\`\`

## Example Output
\`\`\`
area,item_name,description,category,cost
Pintura,Pintura Habitación,,Mano de Obra,7367
Pintura,Mano de Obra Pintura Habitación,,Mano de Obra,3000
Decoración,Molduras,,Decoración,3820
Textiles,Manta Cama,,Accesorios,1500
\`\`\`

Now parse the provided image and return ONLY the CSV output, no explanations.`;

export interface OCRResult {
  csvData: string;
  error?: string;
}

/**
 * Convert a File object to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get media type from file
 */
function getMediaType(file: File): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const type = file.type;
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/gif') return 'image/gif';
  if (type === 'image/webp') return 'image/webp';
  // Default to jpeg
  return 'image/jpeg';
}

/**
 * Parse an image file containing a handwritten invoice/cuenta using Claude OCR
 *
 * @param imageFile - The image file to parse
 * @returns OCRResult with CSV data or error message
 */
export async function parseImageToCSV(imageFile: File): Promise<OCRResult> {
  try {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        csvData: '',
        error: 'API key no configurada. Por favor configura VITE_ANTHROPIC_API_KEY en las variables de entorno.'
      };
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    // Convert image to base64
    const base64Data = await fileToBase64(imageFile);
    const mediaType = getMediaType(imageFile);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 20000,
      temperature: 1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    // Extract CSV from response
    const content = message.content[0];
    if (content.type === 'text') {
      let csvData = content.text.trim();

      // Remove markdown code blocks if present
      csvData = csvData.replace(/```csv\n?/g, '').replace(/```\n?/g, '');

      // Validate that we have CSV data
      if (!csvData.includes('area,item_name,description,category,cost')) {
        return {
          csvData: '',
          error: 'La respuesta no contiene datos CSV válidos'
        };
      }

      return { csvData };
    } else {
      return {
        csvData: '',
        error: 'Respuesta inesperada del servicio de OCR'
      };
    }

  } catch (error: any) {
    console.error('Error en OCR:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('api_key')) {
      return {
        csvData: '',
        error: 'Error de autenticación con el servicio de OCR. Verifica tu API key.'
      };
    }

    return {
      csvData: '',
      error: `Error al procesar la imagen: ${error.message || 'Error desconocido'}`
    };
  }
}
