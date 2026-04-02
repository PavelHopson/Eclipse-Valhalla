/**
 * Eclipse Valhalla — AI Service (Provider-Agnostic)
 *
 * Central AI orchestrator. Routes requests to the correct adapter
 * based on user's provider configuration and capability requirements.
 *
 * Usage:
 *   import { ai } from './ai';
 *   const response = await ai.chat([{ role: 'user', content: 'Plan my day' }], 'planning');
 */

import {
  AIProviderConfig, AIProviderType, AICapability, AIAdapter,
  AIChatRequest, AIChatResponse, AIMessage, AIUsageLog,
  DEFAULT_MODELS, PROVIDER_CAPABILITIES,
} from './types';
import { geminiAdapter } from './adapters/geminiAdapter';
import { openaiAdapter } from './adapters/openaiAdapter';
import { anthropicAdapter } from './adapters/anthropicAdapter';

// ═══════════════════════════════════════════
// ADAPTER REGISTRY
// ═══════════════════════════════════════════

const ADAPTERS: Record<AIProviderType, AIAdapter> = {
  gemini: geminiAdapter,
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  custom: openaiAdapter, // Custom endpoints use OpenAI-compatible API
};

// ═══════════════════════════════════════════
// PROVIDER CONFIG STORAGE
// ═══════════════════════════════════════════

const CONFIG_KEY = 'eclipse_ai_providers';
const USAGE_KEY = 'eclipse_ai_usage';

function getProviders(): AIProviderConfig[] {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Legacy migration: if gemini_api_key exists, create a Gemini provider
  const legacyKey = localStorage.getItem('gemini_api_key');
  if (legacyKey) {
    const defaultProvider: AIProviderConfig = {
      id: 'default_gemini',
      type: 'gemini',
      name: 'Gemini (Default)',
      apiKey: legacyKey,
      model: DEFAULT_MODELS.gemini,
      enabled: true,
      isDefault: true,
      capabilities: PROVIDER_CAPABILITIES.gemini,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProviders([defaultProvider]);
    return [defaultProvider];
  }

  return [];
}

function saveProviders(providers: AIProviderConfig[]): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(providers));
}

// ═══════════════════════════════════════════
// USAGE LOGGING
// ═══════════════════════════════════════════

function logUsage(entry: AIUsageLog): void {
  try {
    const logs: AIUsageLog[] = JSON.parse(localStorage.getItem(USAGE_KEY) || '[]');
    logs.push(entry);
    localStorage.setItem(USAGE_KEY, JSON.stringify(logs.slice(-500)));
  } catch {}
}

export function getUsageLogs(): AIUsageLog[] {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY) || '[]'); } catch { return []; }
}

// ═══════════════════════════════════════════
// PROVIDER RESOLUTION
// ═══════════════════════════════════════════

/**
 * Find the best provider for a given capability.
 * Priority: capability-specific default → global default → first enabled with capability.
 */
function resolveProvider(capability: AICapability): AIProviderConfig | null {
  const providers = getProviders().filter(p => p.enabled);

  // Find provider that has this capability and is default
  const defaultWithCapability = providers.find(p => p.isDefault && p.capabilities.includes(capability));
  if (defaultWithCapability) return defaultWithCapability;

  // Find any provider with this capability
  const anyWithCapability = providers.find(p => p.capabilities.includes(capability));
  if (anyWithCapability) return anyWithCapability;

  // Fallback: any enabled provider
  return providers[0] || null;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export const ai = {
  /**
   * Send a chat message using the best available provider.
   */
  async chat(messages: AIMessage[], capability: AICapability = 'chat'): Promise<AIChatResponse> {
    const provider = resolveProvider(capability);
    if (!provider) throw new Error('No AI provider configured. Go to Settings → AI Providers.');

    const adapter = ADAPTERS[provider.type];
    if (!adapter) throw new Error(`Unknown provider type: ${provider.type}`);

    const request: AIChatRequest = { messages };

    try {
      const response = await adapter.chat(request, provider);
      logUsage({
        id: `log_${Date.now().toString(36)}`,
        providerId: provider.id,
        providerType: provider.type,
        model: response.model,
        capability,
        tokensUsed: response.tokensUsed || 0,
        durationMs: response.durationMs,
        success: true,
        timestamp: new Date().toISOString(),
      });
      return response;
    } catch (e: any) {
      logUsage({
        id: `log_${Date.now().toString(36)}`,
        providerId: provider.id,
        providerType: provider.type,
        model: provider.model,
        capability,
        tokensUsed: 0,
        durationMs: 0,
        success: false,
        error: e.message,
        timestamp: new Date().toISOString(),
      });
      throw e;
    }
  },

  /**
   * Generate an image using a provider that supports it.
   */
  async generateImage(prompt: string, size?: string): Promise<{ url: string }> {
    const provider = resolveProvider('image');
    if (!provider) throw new Error('No AI provider configured for image generation.');

    const adapter = ADAPTERS[provider.type];
    if (!adapter.generateImage) throw new Error(`${provider.type} does not support image generation.`);

    return adapter.generateImage({ prompt, size }, provider);
  },

  /**
   * Check if any provider is configured.
   */
  isConfigured(): boolean {
    return getProviders().some(p => p.enabled && p.apiKey);
  },

  /**
   * Check if a specific capability is available.
   */
  hasCapability(capability: AICapability): boolean {
    return resolveProvider(capability) !== null;
  },

  /**
   * Get current default provider info.
   */
  getDefaultProvider(): AIProviderConfig | null {
    return resolveProvider('chat');
  },
};

// ═══════════════════════════════════════════
// PROVIDER MANAGEMENT API
// ═══════════════════════════════════════════

export function getAllProviders(): AIProviderConfig[] {
  return getProviders();
}

export function addProvider(config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): AIProviderConfig {
  const providers = getProviders();
  const newProvider: AIProviderConfig = {
    ...config,
    id: `prov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If this is default, unset others
  if (newProvider.isDefault) {
    providers.forEach(p => p.isDefault = false);
  }

  providers.push(newProvider);
  saveProviders(providers);
  return newProvider;
}

export function updateProvider(id: string, updates: Partial<AIProviderConfig>): void {
  const providers = getProviders().map(p => {
    if (p.id === id) return { ...p, ...updates, updatedAt: new Date().toISOString() };
    // If setting as default, unset others
    if (updates.isDefault && p.id !== id) return { ...p, isDefault: false };
    return p;
  });
  saveProviders(providers);
}

export function removeProvider(id: string): void {
  const providers = getProviders().filter(p => p.id !== id);
  saveProviders(providers);
}

export async function testProvider(config: AIProviderConfig): Promise<{ valid: boolean; error?: string }> {
  const adapter = ADAPTERS[config.type];
  if (!adapter) return { valid: false, error: 'Unknown provider type' };
  return adapter.validate(config);
}
