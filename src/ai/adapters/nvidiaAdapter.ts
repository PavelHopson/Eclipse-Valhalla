/**
 * Eclipse Valhalla — NVIDIA NIM AI Adapter
 *
 * NVIDIA NIM (build.nvidia.com) exposes an OpenAI-compatible Chat
 * Completions API at https://integrate.api.nvidia.com/v1. This adapter
 * is a thin wrapper that forces the NIM base URL and surfaces 'nvidia'
 * as the provider type in usage logs and the UI.
 *
 * Default model: nvidia/llama-3.3-nemotron-super-49b-v1 (see types.ts).
 * Free tier is available at https://build.nvidia.com/models.
 */

import {
  AIAdapter,
  AIChatRequest,
  AIChatResponse,
  AIProviderConfig,
  NVIDIA_NIM_BASE_URL,
} from '../types';

function normalizeBaseUrl(raw: string | undefined): string {
  const url = (raw && raw.trim().length > 0 ? raw : NVIDIA_NIM_BASE_URL).replace(/\/+$/, '');
  return url;
}

export const nvidiaAdapter: AIAdapter = {
  type: 'nvidia',

  async chat(request: AIChatRequest, config: AIProviderConfig): Promise<AIChatResponse> {
    const start = Date.now();
    const baseUrl = normalizeBaseUrl(config.baseUrl);

    const body: Record<string, unknown> = {
      model: config.model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
      temperature: request.temperature ?? config.temperature ?? 0.7,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`NVIDIA NIM API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || config.model,
      provider: 'nvidia',
      tokensUsed: data.usage?.total_tokens,
      durationMs: Date.now() - start,
    };
  },

  async validate(config: AIProviderConfig) {
    try {
      const baseUrl = normalizeBaseUrl(config.baseUrl);
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
      return { valid: true, model: config.model };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Connection failed';
      return { valid: false, error: message };
    }
  },
};
