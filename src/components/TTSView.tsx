import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';

export const TTSView: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const audioBuffer = await generateSpeech(text);
      playAudio(audioBuffer);
    } catch (err) {
      setError("Could not generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  };

  return (
    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/30 text-emerald-400 mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </div>
        <h2 className="text-3xl font-bold text-[#E8E8F0]">Gemini TTS Studio</h2>
        <p className="text-[#55556A]">Transform your text into lifelike speech using the Flash model.</p>
      </div>

      <div className="bg-[#1A1A26]/80 p-6 rounded-2xl border border-[#2A2A3C] shadow-xl space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to hear..."
          className="w-full h-40 bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] text-[#E8E8F0] placeholder-[#3A3A4A] resize-none"
        />

        <div className="flex justify-between items-center">
          <div className="text-[#55556A] text-sm">
            {text.length} characters
          </div>
          <button
            onClick={handleSpeak}
            disabled={isLoading || !text.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#E8E8F0] font-medium rounded-xl px-8 py-3 transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <span>Speak</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1A1A26]/60 p-4 rounded-xl border border-[#2A2A3C]">
            <h3 className="font-semibold text-[#8888A0] mb-1">Model</h3>
            <p className="text-sm text-[#55556A]">gemini-2.5-flash-preview-tts</p>
        </div>
        <div className="bg-[#1A1A26]/60 p-4 rounded-xl border border-[#2A2A3C]">
            <h3 className="font-semibold text-[#8888A0] mb-1">Voice</h3>
            <p className="text-sm text-[#55556A]">Prebuilt: Kore</p>
        </div>
      </div>
    </div>
  );
};
