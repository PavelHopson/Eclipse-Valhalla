import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { Volume2, Mic2, Waves, Loader2, RotateCcw } from 'lucide-react';
import { useLanguage } from '../i18n';

export const TTSView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBuffer, setLastBuffer] = useState<AudioBuffer | null>(null);

  interface SavedVoice {
    id: string;
    text: string;
    createdAt: string;
  }

  const [voiceHistory, setVoiceHistory] = useState<SavedVoice[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eclipse_voice_history') || '[]');
    } catch { return []; }
  });

  const handleSpeak = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const audioBuffer = await generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      setLastBuffer(audioBuffer);
      const newVoice: SavedVoice = {
        id: `voice_${Date.now()}`,
        text: text.slice(0, 200),
        createdAt: new Date().toISOString(),
      };
      setVoiceHistory(prev => {
        const updated = [newVoice, ...prev].slice(0, 20);
        localStorage.setItem('eclipse_voice_history', JSON.stringify(updated));
        return updated;
      });
    } catch {
      setError(isRu ? 'Синтез голоса не удался. Попробуй снова.' : 'Voice synthesis failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-8">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#8E9B7928] bg-[#8E9B7912]">
          <Mic2 className="h-9 w-9 text-[#8E9B79]" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">{isRu ? 'Голосовая палата' : 'Voice chamber'}</div>
        <h1 className="mt-3 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRu ? 'Кузня голоса' : 'Voice forge'}</h1>
        <p className="mt-3 text-sm leading-6 text-[#B4B0A7]">
          {isRu ? 'Превращай команды, скрипты и воззвания в управляемый голосовой вывод.' : 'Turn written commands, scripts, and invocations into a controlled voice output. This should feel like summoning system speech, not pressing a generic TTS button.'}
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#121212]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">{isRu ? 'Текст в голос' : 'Text to voice'}</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRu ? 'Напиши слова, которые палата должна произнести...' : 'Write the words the chamber should speak...'}
          className="h-48 w-full resize-none rounded-[18px] border border-[#8E9B7924] bg-[#0F0F0F] px-5 py-4 text-sm leading-6 text-[#F2F1EE] outline-none placeholder:text-[#5F5A54]"
        />

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#7F7A72]">
            {text.length} {isRu ? 'символов' : 'characters'} / model: gemini-2.5-flash-preview-tts / voice: Kore
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSpeak}
              disabled={isLoading || !text.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#8E9B7930] bg-[#8E9B79] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:bg-[#9AA786] disabled:opacity-30"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              {isLoading ? (isRu ? 'Синтез...' : 'Synthesizing') : (isRu ? 'Произнести' : 'Speak')}
            </button>
            {lastBuffer && (
              <button
                onClick={() => {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const src = ctx.createBufferSource();
                  src.buffer = lastBuffer;
                  src.connect(ctx.destination);
                  src.start(0);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#6C8FB830] bg-[#6C8FB814] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#BFD4E8] transition-all hover:bg-[#6C8FB824]"
              >
                <Volume2 className="h-4 w-4" />
                {isRu ? 'Переиграть' : 'Replay'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="mt-4 rounded-[14px] border border-[#7A1F2435] bg-[#7A1F240D] px-4 py-3 text-sm text-[#F4D6D8]">{error}</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[22px] border border-white/8 bg-[#121212]/92 p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
            <Waves className="h-4 w-4 text-[#8E9B79]" />
            {isRu ? 'Профиль вывода' : 'Output profile'}
          </div>
          <div className="mt-3 text-sm leading-6 text-[#B4B0A7]">
            {isRu ? 'Точный, управляемый синтез для команд, скриптов и ритуального текста.' : 'Tight, controlled synthesis for commands, scripts, prompts, and spoken ritual text.'}
          </div>
        </div>
        <div className="rounded-[22px] border border-white/8 bg-[#121212]/92 p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
            <Mic2 className="h-4 w-4 text-[#B89B5E]" />
            {isRu ? 'Рекомендуемое использование' : 'Suggested use'}
          </div>
          <div className="mt-3 text-sm leading-6 text-[#B4B0A7]">
            {isRu ? 'Прочитай боевые планы вслух, преврати вердикты Оракула в голос.' : 'Read battle plans aloud, convert Oracle verdicts into voice, or prototype ritual feedback for focus mode.'}
          </div>
        </div>
      </div>

      {/* Voice History */}
      {voiceHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#7F7A72' }}>
              {isRu ? 'История' : 'History'}
            </h3>
            <button onClick={() => { setVoiceHistory([]); localStorage.removeItem('eclipse_voice_history'); }}
              className="text-[10px] font-bold text-[#5F5A54] hover:text-[#FF4444] transition-colors">
              {isRu ? 'Очистить' : 'Clear'}
            </button>
          </div>
          <div className="space-y-2">
            {voiceHistory.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
                <button onClick={() => {
                  setText(v.text);
                }}
                  className="p-2 rounded-lg" style={{ backgroundColor: '#5DAEFF15', color: '#5DAEFF' }}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#B4B0A7] truncate">{v.text}</p>
                  <p className="text-[10px] text-[#5F5A54]">{new Date(v.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
