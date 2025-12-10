import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAIClient } from '@/lib/ai/client';
import { OCR_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { OCRAPIResponse } from '@/lib/ocrService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parse the request body
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Get media type
    const mediaType = getMediaType(file.type);

    // Create AI client and send image request
    const aiClient = createAIClient();
    const response = await aiClient.sendMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      { systemPrompt: OCR_SYSTEM_PROMPT }
    );

    // Parse JSON response
    const ocrResponse = JSON.parse(response.content) as OCRAPIResponse;

    // Handle AI response based on success status
    if (!ocrResponse.success) {
      return NextResponse.json(
        { error: ocrResponse.error || 'Error al procesar la imagen' },
        { status: 400 }
      );
    }

    // Check if any items were found
    if (ocrResponse.items_found === 0) {
      return NextResponse.json(
        {
          error: ocrResponse.message || 'No se encontraron artículos en la imagen'
        },
        { status: 400 }
      );
    }

    // Return successful JSON response
    return NextResponse.json(ocrResponse);
  } catch (error: unknown) {
    console.error('Error en OCR:', error);

    // Provide user-friendly error messages
    if (error instanceof Error && error.message?.includes('api_key')) {
      return NextResponse.json(
        { error: 'Error de autenticación con el servicio de OCR. Verifica tu API key.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

/**
 * Get media type from file type
 */
function getMediaType(fileType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (fileType === 'image/jpeg' || fileType === 'image/jpg') return 'image/jpeg';
  if (fileType === 'image/png') return 'image/png';
  if (fileType === 'image/gif') return 'image/gif';
  if (fileType === 'image/webp') return 'image/webp';
  // Default to jpeg
  return 'image/jpeg';
}
