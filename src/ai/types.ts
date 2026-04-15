/**
 * Eclipse Valhalla — AI Provider Type System
 *
 * Provider-agnostic AI interface.
 * Supports: Gemini, OpenAI, Anthropic, local/self-hosted, custom endpoints.
 */

// ═══════════════════════════════════════════
// PROVIDER IDENTITY
// ═══════════════════════════════════════════

export type AIProviderType = 'gemini' | 'openai' | 'anthropic' | 'nvidia' | 'custom';

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;              // "My OpenAI", "Local Ollama", etc.
  baseUrl?: string;          // For custom/self-hosted endpoints
  apiKey: string;            // Stored in localStorage, never sent to our backend
  model: string;             // "gpt-4o", "claude-sonnet-4-20250514", "gemini-2.5-flash", etc.
  enabled: boolean;
  isDefault: boolean;
  capabilities: AICapability[];
  maxTokens?: number;
  temperature?: number;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// CAPABILITIES
// ═══════════════════════════════════════════

export type AICapability =
  | 'chat'           // Oracle conversations
  | 'planning'       // Day planning
  | 'analysis'       // Productivity analysis
  | 'summarization'  // News summarization
  | 'classification' // Category detection, tagging
  | 'image'          // Image generation
  | 'tts'            // Text-to-speech
  | 'enrichment';    // News article enrichment

export const CAPABILITY_LABELS: Record<AICapability, string> = {
  chat: 'Chat / Oracle',
  planning: 'Day Planning',
  analysis: 'Productivity Analysis',
  summarization: 'Summarization',
  classification: 'Classification',
  image: 'Image Generation',
  tts: 'Text-to-Speech',
  enrichment: 'News Enrichment',
};

// ═══════════════════════════════════════════
// MESSAGE FORMAT (universal)
// ═══════════════════════════════════════════

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  content: string;
  model: string;
  provider: AIProviderType;
  tokensUsed?: number;
  durationMs: number;
}

export interface AIImageRequest {
  prompt: string;
  size?: string;
  model?: string;
}

export interface AIImageResponse {
  url: string;       // data URL or remote URL
  model: string;
  provider: AIProviderType;
}

// ═══════════════════════════════════════════
// ADAPTER INTERFACE
// ═══════════════════════════════════════════

export interface AIAdapter {
  readonly type: AIProviderType;

  /** Send chat/completion request */
  chat(request: AIChatRequest, config: AIProviderConfig): Promise<AIChatResponse>;

  /** Generate image (if supported) */
  generateImage?(request: AIImageRequest, config: AIProviderConfig): Promise<AIImageResponse>;

  /** Validate connection / API key */
  validate(config: AIProviderConfig): Promise<{ valid: boolean; error?: string; model?: string }>;
}

// ═══════════════════════════════════════════
// USAGE LOGGING
// ═══════════════════════════════════════════

export interface AIUsageLog {
  id: string;
  providerId: string;
  providerType: AIProviderType;
  model: string;
  capability: AICapability;
  tokensUsed: number;
  durationMs: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

// ═══════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════

export const DEFAULT_MODELS: Record<AIProviderType, string> = {
  gemini: 'gemini-2.5-flash-preview-05-20',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  nvidia: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  custom: '',
};

export const PROVIDER_CAPABILITIES: Record<AIProviderType, AICapability[]> = {
  gemini: ['chat', 'planning', 'analysis', 'summarization', 'classification', 'image', 'tts', 'enrichment'],
  openai: ['chat', 'planning', 'analysis', 'summarization', 'classification', 'image', 'enrichment'],
  anthropic: ['chat', 'planning', 'analysis', 'summarization', 'classification', 'enrichment'],
  nvidia: ['chat', 'planning', 'analysis', 'summarization', 'classification', 'enrichment'],
  custom: ['chat', 'planning', 'analysis', 'summarization', 'classification', 'enrichment'],
};

export const NVIDIA_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
