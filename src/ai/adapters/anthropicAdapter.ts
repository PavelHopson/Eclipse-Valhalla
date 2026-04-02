/**
 * Eclipse Valhalla — Anthropic-compatible AI Adapter
 *
 * Works with Anthropic Claude API.
 * Note: Anthropic requires different message format than OpenAI.
 */

import { AIAdapter, AIChatRequest, AIChatResponse, AIProviderConfig } from '../types';

export const anthropicAdapter: AIAdapter = {
  type: 'anthropic',

  async chat(request, config) {
    const start = Date.now();
    const baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');

    // Extract system message
    const systemMsg = request.messages.find(m => m.role === 'system');
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const body: any = {
      model: config.model,
      max_tokens: request.maxTokens || config.maxTokens || 2048,
      messages,
    };
    if (systemMsg) body.system = systemMsg.content;

    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Anthropic API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';

    return {
      content,
      model: data.model || config.model,
      provider: 'anthropic',
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      durationMs: Date.now() - start,
    };
  },

  async validate(config) {
    try {
      const baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
      return { valid: true, model: config.model };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Connection failed' };
    }
  },
};
