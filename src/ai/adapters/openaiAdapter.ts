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

    const body = {
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
