import React, { useState } from 'react';
import { GeneratedImage, ImageSize } from '../types/index';
import { generateImage } from '../services/geminiService';

export const ImageView: React.FC = () => {
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

      const newImage: GeneratedImage = {
        url: imageUrl,
        prompt: prompt,
        size: size,
        timestamp: Date.now()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      // Keep input for refinements, but maybe clear error
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Controls */}
      <div className="bg-[#1A1A26]/80 p-6 rounded-2xl border border-[#2A2A3C] shadow-xl space-y-4">
        <h2 className="text-xl font-semibold text-[#E8E8F0] flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
           Gemini 3 Pro Image Studio
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="flex-1 bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7A5CFF] text-[#E8E8F0] placeholder-[#3A3A4A]"
          />

          <select
            value={size}
            onChange={(e) => setSize(e.target.value as ImageSize)}
            className="bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7A5CFF] text-[#E8E8F0] min-w-[100px]"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#E8E8F0] font-medium rounded-xl px-6 py-3 transition-all flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generatedImages.map((img, idx) => (
            <div key={idx} className="group relative bg-[#12121A] rounded-xl overflow-hidden border border-[#2A2A3C] aspect-square">
              <img
                src={img.url}
                alt={img.prompt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-[#E8E8F0] text-sm line-clamp-2 font-medium">{img.prompt}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-[#55556A] bg-[#12121A]/80 px-2 py-1 rounded">{img.size}</span>
                  <a
                    href={img.url}
                    download={`valhalla-image-${img.timestamp}.png`}
                    className="text-[#E8E8F0] hover:text-purple-400"
                    title="Download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
          {generatedImages.length === 0 && !isLoading && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-[#55556A] border-2 border-dashed border-[#2A2A3C] rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <p>Your generated masterpieces will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
