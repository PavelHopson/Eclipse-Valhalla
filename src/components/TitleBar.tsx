/**
 * Eclipse Valhalla — Custom Title Bar (frameless window)
 */

import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { Seal } from '../brand/Seal';

const TitleBar: React.FC = () => {
  const isElectron = !!(window as any).valhalla?.isDesktop;
  if (!isElectron) return null;

  const minimize = () => (window as any).valhalla?.windowMinimize?.();
  const maximize = () => (window as any).valhalla?.windowMaximize?.();
  const close = () => (window as any).valhalla?.windowClose?.();

  return (
    <div
      className="flex items-center justify-between h-9 px-3 shrink-0 select-none"
      style={{
        backgroundColor: '#050508',
        borderBottom: '1px solid #12121A',
        WebkitAppRegion: 'drag',
      } as any}
    >
      {/* Left — App icon + name */}
      <div className="flex items-center gap-2">
        <Seal size={14} variant="watching" color="#5F5A54" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3A3A4A]">
          Eclipse Valhalla
        </span>
      </div>

      {/* Right — Window controls */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={minimize}
          className="w-10 h-9 flex items-center justify-center text-[#5F5A54] hover:text-[#B4B0A7] hover:bg-[#1A1A26] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={maximize}
          className="w-10 h-9 flex items-center justify-center text-[#5F5A54] hover:text-[#B4B0A7] hover:bg-[#1A1A26] transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={close}
          className="w-10 h-9 flex items-center justify-center text-[#5F5A54] hover:text-white hover:bg-[#E03030] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
