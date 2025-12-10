import Anthropic from '@anthropic-ai/sdk';

/**
 * Generic message type for AI requests
 * Supports both text and image content
 */
export interface AIMessage {
  role: 'user' | 'assistant';
  content: AIMessageContent[];
}

/**
 * Content types supported in AI messages
 */
export type AIMessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string
      }
    };

/**
 * Configuration for AI requests
 */
export interface AIConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt: string;
}

/**
 * Default AI configuration values
 * Used across all AI features for consistency
 */
export const DEFAULT_AI_CONFIG: Omit<AIConfig, 'systemPrompt'> = {
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 20000,
  temperature: 1,
};

/**
 * Generic AI response structure
 */
export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Parse JSON response from AI, removing markdown code blocks
 * @param content - Raw AI response content
 * @returns Parsed JSON object
 * @throws Error if response is not valid JSON
 */
export function parseJSONResponse<T = unknown>(content: string): T {
  try {
    // Remove markdown code blocks if present
    let jsonText = content.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const parsed = JSON.parse(jsonText);
    return parsed as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

