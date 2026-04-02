import React from 'react';
import { Hammer, Globe } from 'lucide-react';
import type { LandingLang } from '../i18n';

interface Props {
  t: (k: string) => string;
  lang: LandingLang;
  onToggleLang: () => void;
}

const LandingNav: React.FC<Props> = ({ t, lang, onToggleLang }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[#1E1E2E]/50">
    <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#5DAEFF08] border border-[#5DAEFF20] flex items-center justify-center">
          <Hammer className="w-3.5 h-3.5 text-[#5DAEFF]" />
        </div>
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#8888A0]">Eclipse</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-5">
        <a href="#features" className="text-xs text-[#55556A] hover:text-[#8888A0] transition-colors hidden sm:block">{t('nav.features')}</a>
        <a href="#pricing" className="text-xs text-[#55556A] hover:text-[#8888A0] transition-colors hidden sm:block">{t('nav.pricing')}</a>

        {/* Language toggle */}
        <button onClick={onToggleLang}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-[#3A3A4A] hover:text-[#55556A] border border-[#1E1E2E] hover:border-[#2A2A3C] transition-colors uppercase">
          <Globe className="w-3 h-3" />
          {lang === 'en' ? 'RU' : 'EN'}
        </button>

        <a href="#cta"
          className="px-4 py-1.5 bg-[#1A1A26] border border-[#2A2A3C] rounded-lg text-xs font-medium text-[#8888A0] hover:text-[#E8E8F0] hover:border-[#3A3A52] transition-all">
          {t('nav.launch')}
        </a>
      </div>
    </div>
  </nav>
);

export default LandingNav;
