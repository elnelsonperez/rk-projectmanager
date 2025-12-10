import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAIClient } from '@/lib/ai/client';
import { IMPROVE_ITEMS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type {
  ImproveItemsRequest,
  ImproveItemsResponse,
} from '@/types/improvements.types';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parse request
    const body: ImproveItemsRequest = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron artículos para mejorar.' },
        { status: 400 }
      );
    }

    // Prepare input for AI
    const itemsInput = items.map((item) => ({
      id: item.id,
      name: item.item_name,
      description: item.description || '',
      category: item.category,
    }));

    const userPrompt = JSON.stringify(itemsInput, null, 2);

    // Call AI using standardized JSON parser
    const aiClient = createAIClient();
    let aiResponse: ImproveItemsResponse;

    try {
      aiResponse = await aiClient.sendTextPromptForJSON<ImproveItemsResponse>(
        userPrompt,
        {
          systemPrompt: IMPROVE_ITEMS_SYSTEM_PROMPT,
          temperature: 0.3, // Lower temperature for more consistent improvements
        }
      );

      // Check if AI couldn't process the data
      if (!aiResponse.success) {
        return NextResponse.json(
          {
            success: false,
            error: aiResponse.error || 'Error al procesar los artículos',
            improvements: [],
            items_processed: 0,
            items_with_changes: 0,
          } as ImproveItemsResponse,
          { status: 400 }
        );
      }

      // Check if no improvements were needed
      if (aiResponse.items_with_changes === 0) {
        return NextResponse.json({
          success: true,
          improvements: [],
          items_processed: aiResponse.items_processed,
          items_with_changes: 0,
          message:
            aiResponse.message ||
            'No se encontraron mejoras necesarias. Todos los artículos ya tienen buena calidad.',
        } as ImproveItemsResponse);
      }

      // Validate improvements array structure
      if (!Array.isArray(aiResponse.improvements)) {
        throw new Error('Improvements is not an array');
      }

      // Validate each improvement
      aiResponse.improvements.forEach((imp, idx) => {
        if (
          typeof imp.id !== 'number' ||
          !imp.improved_name ||
          !imp.improved_category
        ) {
          throw new Error(`Invalid improvement at index ${idx}`);
        }
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al procesar la respuesta de IA. Intenta de nuevo.',
          improvements: [],
          items_processed: 0,
          items_with_changes: 0,
        } as ImproveItemsResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(aiResponse);
  } catch (error: unknown) {
    console.error('Error improving items:', error);
    return NextResponse.json(
      {
        error: `Error al mejorar artículos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      },
      { status: 500 }
    );
  }
}
