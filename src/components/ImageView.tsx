import React, { useState } from 'react';
import { GeneratedImage, ImageSize } from '../types/index';
import { generateImage } from '../services/geminiService';
import { ImagePlus, Download, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n';

export const ImageView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt, size);
      setGeneratedImages(prev => [{ url: imageUrl, prompt, size, timestamp: Date.now() }, ...prev]);
      import('../services/achievementService').then(({ trackEvent }) => {
        trackEvent('image_generate');
      }).catch(() => {});
    } catch {
      setError(isRu ? 'Розжиг кузни не удался. Попробуй снова.' : 'Forge ignition failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <section className="rounded-[28px] border border-white/10 bg-[#121212]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">{isRu ? 'Палата кузни' : 'Forge chamber'}</div>
        <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRu ? 'Кузня образов' : 'Image forge'}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#B4B0A7]">
          {isRu ? 'Опиши артефакт, символ, настроение или сцену. Кузня формирует визуальный материал.' : 'Describe an artifact, a symbol, a mood, or a scene. The forge should feel like a ritual that shapes visual material, not a generic image prompt box.'}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_120px_160px]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isRu ? 'Опиши артефакт, который кузня должна проявить...' : 'Describe the artifact you want the forge to reveal...'}
            className="rounded-[16px] border border-[#B89B5E24] bg-[#0F0F0F] px-5 py-4 text-sm text-[#F2F1EE] outline-none placeholder:text-[#5F5A54]"
          />
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as ImageSize)}
            className="rounded-[16px] border border-white/8 bg-[#171717] px-4 py-4 text-sm text-[#F2F1EE] outline-none"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#B89B5E30] bg-[#B89B5E] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:bg-[#C5A76A] disabled:opacity-30"
          >
            {isLoading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <ImagePlus className="h-4 w-4" />}
            {isRu ? 'Создать' : 'Forge'}
          </button>
        </div>

        {error && <div className="mt-4 rounded-[14px] border border-[#7A1F2435] bg-[#7A1F240D] px-4 py-3 text-sm text-[#F4D6D8]">{error}</div>}
      </section>

      <div className="flex-1 overflow-y-auto pr-2">
        {generatedImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {generatedImages.map((img, idx) => (
              <div key={idx} className="group overflow-hidden rounded-[24px] border border-white/8 bg-[#121212]/92">
                <div className="aspect-square overflow-hidden">
                  <img src={img.url} alt={img.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="space-y-3 p-4">
                  <div className="text-sm font-bold text-[#F2F1EE]">{img.prompt}</div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#B89B5E28] bg-[#B89B5E10] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D8C18E]">{img.size}</span>
                    <a href={img.url} download={`valhalla-image-${img.timestamp}.png`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#B4B0A7] hover:text-[#F2F1EE]">
                      <Download className="h-3.5 w-3.5" />
                      {isRu ? 'Скачать' : 'Download'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-[#121212]/92">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-[#B89B5E28] bg-[#B89B5E10]">
                <ImagePlus className="h-10 w-10 text-[#D8C18E]" />
              </div>
              <div className="font-ritual text-3xl text-[#F2F1EE]">{isRu ? 'Кузня молчит.' : 'The forge is silent.'}</div>
              <div className="mt-3 text-sm text-[#7F7A72]">{isRu ? 'Созданные артефакты проявятся здесь.' : 'Generated artifacts will manifest here.'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
