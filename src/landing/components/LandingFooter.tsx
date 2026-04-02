import React from 'react';

interface Props { t: (k: string) => string; }

const LandingFooter: React.FC<Props> = ({ t }) => (
  <footer className="py-12 px-6 border-t border-[#1E1E2E]">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-[10px] text-[#3A3A4A]">{t('footer.copy')}</div>
      <div className="flex items-center gap-6 text-[10px] text-[#2A2A3C]">
        <span>Valhalla</span>
        <span>Nexus</span>
        <span>Forge</span>
        <span>Void</span>
      </div>
      <div className="text-[10px] text-[#2A2A3C] italic">{t('footer.built')}</div>
    </div>
  </footer>
);

export default LandingFooter;
