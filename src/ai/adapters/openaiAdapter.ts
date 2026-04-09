/**
 * Eclipse Valhalla — OpenAI-compatible AI Adapter
 *
 * Works with: OpenAI, Azure OpenAI, Together, Groq, Ollama, LM Studio,
 * or any endpoint implementing the OpenAI Chat Completions API.
 */

import { AIAdapter, AIChatRequest, AIChatResponse, AIImageRequest, AIImageResponse, AIProviderConfig } from '../types';

export const openaiAdapter: AIAdapter = {
  type: 'openai',

  async chat(request, config) {
    const start = Date.now();
    const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

    const body: Record<string, unknown> = {
      model: config.model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens || config.maxTokens || 2048,
      temperature: request.temperature ?? config.temperature ?? 0.7,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`OpenAI API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || config.model,
      provider: 'openai',
      tokensUsed: data.usage?.total_tokens,
      durationMs: Date.now() - start,
    };
  },

  async generateImage(request, config) {
    const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'dall-e-3',
        prompt: request.prompt,
        size: request.size || '1024x1024',
        n: 1,
        response_format: 'b64_json',
      }),
    });

    if (!res.ok) throw new Error(`Image API ${res.status}`);
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data');

    return { url: `data:image/png;base64,${b64}`, model: request.model || 'dall-e-3', provider: 'openai' };
  },

  async validate(config) {
    try {
      const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
      });
      if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
      return { valid: true, model: config.model };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Connection failed' };
    }
  },
};

/**
 * Streaming chat — yields chunks as they arrive from an OpenAI-compatible endpoint.
 */
export async function streamChat(
  request: { messages: { role: string; content: string }[] },
  config: { apiKey: string; model: string; baseUrl?: string; maxTokens?: number; temperature?: number },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<void> {
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        max_tokens: config.maxTokens || 2048,
        temperature: config.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      onError(`API ${res.status}: ${err}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError('No response body'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') { onDone(); return; }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        } catch { /* skip malformed chunks */ }
      }
    }

    onDone();
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : 'Stream failed');
  }
}
