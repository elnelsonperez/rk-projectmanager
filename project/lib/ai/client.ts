import Anthropic from '@anthropic-ai/sdk';
import { AIConfig, AIMessage, AIResponse, DEFAULT_AI_CONFIG, parseJSONResponse } from './types';

/**
 * Generic AI client for server-side Claude API calls
 * Centralizes authentication, error handling, and API communication
 *
 * Usage:
 * ```typescript
 * const client = createAIClient();
 * const response = await client.sendTextPrompt('Hello', { systemPrompt: 'You are helpful' });
 * ```
 */
export class AIClient {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Send a message to Claude and get a response
   * Supports both text and image messages
   *
   * @param messages - Array of messages to send
   * @param config - Configuration including system prompt
   * @returns AI response with content and usage stats
   */
  async sendMessage(
    messages: AIMessage[],
    config: AIConfig
  ): Promise<AIResponse> {
    const response = await this.anthropic.messages.create({
      model: config.model || DEFAULT_AI_CONFIG.model!,
      max_tokens: config.maxTokens || DEFAULT_AI_CONFIG.maxTokens!,
      temperature: config.temperature ?? DEFAULT_AI_CONFIG.temperature!,
      system: config.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    return {
      content: content.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Helper: Send a simple text prompt
   * Convenient for text-only interactions
   *
   * @param userPrompt - Text prompt to send
   * @param config - Configuration including system prompt
   * @returns AI response with content and usage stats
   */
  async sendTextPrompt(
    userPrompt: string,
    config: AIConfig
  ): Promise<AIResponse> {
    return this.sendMessage(
      [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
      config
    );
  }

  /**
   * Helper: Send a text prompt and parse JSON response
   * Automatically strips markdown code blocks and validates JSON
   *
   * @param userPrompt - Text prompt to send
   * @param config - Configuration including system prompt
   * @returns Parsed JSON object
   * @throws Error if response is not valid JSON
   */
  async sendTextPromptForJSON<T = unknown>(
    userPrompt: string,
    config: AIConfig
  ): Promise<T> {
    const response = await this.sendTextPrompt(userPrompt, config);
    return parseJSONResponse<T>(response.content);
  }

  /**
   * Send a message with structured output (guaranteed valid JSON)
   * Uses Claude's structured outputs feature to ensure schema compliance
   *
   * @param messages - Array of messages to send
   * @param config - Configuration including system prompt
   * @param schema - JSON schema that defines the expected output structure
   * @returns Typed response guaranteed to match the schema
   */
  async sendMessageWithStructuredOutput<T>(
    messages: AIMessage[],
    config: AIConfig,
    schema: object
  ): Promise<T> {
    const response = await this.anthropic.beta.messages.create({
      model: config.model || DEFAULT_AI_CONFIG.model!,
      max_tokens: config.maxTokens || DEFAULT_AI_CONFIG.maxTokens!,
      temperature: config.temperature ?? DEFAULT_AI_CONFIG.temperature!,
      system: config.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      betas: ['structured-outputs-2025-11-13'],
      output_format: {
        type: 'json_schema',
        schema: schema,
      },
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Parse is now guaranteed to succeed due to structured outputs
    return JSON.parse(content.text) as T;
  }

  /**
   * Helper: Send a text prompt with structured output (guaranteed valid JSON)
   * Convenient wrapper for text-only interactions with schema enforcement
   *
   * @param userPrompt - Text prompt to send
   * @param config - Configuration including system prompt
   * @param schema - JSON schema that defines the expected output structure
   * @returns Typed response guaranteed to match the schema
   */
  async sendTextPromptWithStructuredOutput<T>(
    userPrompt: string,
    config: AIConfig,
    schema: object
  ): Promise<T> {
    return this.sendMessageWithStructuredOutput<T>(
      [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
      config,
      schema
    );
  }
}

/**
 * Create an AI client with the API key from environment
 * Throws error if ANTHROPIC_API_KEY is not configured
 *
 * @returns Configured AIClient instance
 */
export function createAIClient(): AIClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new AIClient(apiKey);
}
