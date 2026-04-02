
import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
};

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Gemini API key not configured. Go to Settings to add your key.');
  return new GoogleGenAI({ apiKey });
};

// --- Chat Service ---
export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  try {
    const ai = getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

// --- Image Generation Service ---
export const generateImage = async (prompt: string, size: ImageSize) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// --- Text-to-Speech Service ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );

    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
