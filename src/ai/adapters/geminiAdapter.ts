/**
 * Eclipse Valhalla — Gemini AI Adapter
 */

import { AIAdapter, AIChatRequest, AIChatResponse, AIImageRequest, AIImageResponse, AIProviderConfig } from '../types';

export const geminiAdapter: AIAdapter = {
  type: 'gemini',

  async chat(request, config) {
    const start = Date.now();
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    // Convert universal format to Gemini format
    const systemMsg = request.messages.find(m => m.role === 'system');
    const history = request.messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMsg = request.messages[request.messages.length - 1];

    const fullHistory = systemMsg
      ? [
          { role: 'user', parts: [{ text: `[SYSTEM]\n${systemMsg.content}` }] },
          { role: 'model', parts: [{ text: 'Understood.' }] },
          ...history,
        ]
      : history;

    const chat = ai.chats.create({ model: config.model, history: fullHistory });
    const response = await chat.sendMessage({ message: lastMsg.content });

    return {
      content: response.text || '',
      model: config.model,
      provider: 'gemini',
      durationMs: Date.now() - start,
    };
  },

  async generateImage(request, config) {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const response = await ai.models.generateContent({
      model: request.model || 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: request.prompt }] },
      config: { imageConfig: { imageSize: request.size || '1K', aspectRatio: '1:1' } },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { url: `data:image/png;base64,${part.inlineData.data}`, model: request.model || 'gemini-3-pro-image-preview', provider: 'gemini' };
      }
    }
    throw new Error('No image data in response');
  },

  async validate(config) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const chat = ai.chats.create({ model: config.model, history: [] });
      await chat.sendMessage({ message: 'test' });
      return { valid: true, model: config.model };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Connection failed' };
    }
  },
};
