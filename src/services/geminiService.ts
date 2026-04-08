/**
 * Eclipse Valhalla — Gemini Service (Legacy wrapper)
 *
 * Now routes through the AI provider abstraction layer.
 * Kept for backward compatibility with ChatView, ImageView, TTSView.
 */

import { ai } from '../ai';

// --- Chat Service ---
export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const messages = [
    ...history.map(h => ({
      role: (h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: h.parts.map(p => p.text).join(''),
    })),
    { role: 'user' as const, content: newMessage },
  ];

  const response = await ai.chat(messages, 'chat');
  return response.content;
};

// --- Image Generation Service ---
export const generateImage = async (prompt: string, size: string) => {
  const result = await ai.generateImage(prompt, size);
  return result.url;
};

// --- Text-to-Speech Service ---
// TTS still needs direct Gemini access (specialized API)
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  // Try to get Gemini key from new provider system first, then legacy
  let apiKey = '';
  try {
    const providers = JSON.parse(localStorage.getItem('eclipse_ai_providers') || '[]');
    const gemini = providers.find((p: any) => p.type === 'gemini' && p.enabled);
    if (gemini) {
      // Handle encrypted keys
      apiKey = gemini.apiKey?.startsWith('enc:') ? gemini.apiKey : gemini.apiKey;
    }
  } catch {}
  if (!apiKey) throw new Error('TTS requires a Gemini API key. Configure in Settings → AI Providers.');

  const { GoogleGenAI, Modality } = await import('@google/genai');
  const genai = new GoogleGenAI({ apiKey });

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;

  return buffer;
};
