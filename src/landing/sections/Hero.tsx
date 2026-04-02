import React from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroProps { t: (k: string) => string; }

const Hero: React.FC<HeroProps> = ({ t }) => (
  <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
    {/* Eclipse glow */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, #5DAEFF06 0%, transparent 60%)' }} />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, #7A5CFF08 0%, transparent 70%)' }} />

    {/* Eclipse ring */}
    <div className="relative mb-8">
      <div className="w-20 h-20 rounded-full border border-[#5DAEFF20] flex items-center justify-center"
        style={{ boxShadow: '0 0 40px rgba(93,174,255,0.08), inset 0 0 20px rgba(93,174,255,0.04)' }}>
        <div className="w-8 h-8 rounded-full bg-[#0A0A0F] border border-[#5DAEFF30]"
          style={{ boxShadow: '0 0 20px rgba(93,174,255,0.15)' }} />
      </div>
    </div>

    {/* Title */}
    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[0.08em] uppercase font-serif text-[#E8E8F0] mb-4">
      {t('hero.title')}
    </h1>

    <p className="text-lg md:text-2xl text-[#5DAEFF] font-medium mb-3 tracking-wide">
      {t('hero.tagline')}
    </p>

    <p className="text-sm md:text-base text-[#55556A] max-w-xl mb-10 leading-relaxed">
      {t('hero.sub')}
    </p>

    {/* CTA */}
    <div className="flex flex-col sm:flex-row gap-3">
      <a href="#cta"
        className="px-8 py-4 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] text-white rounded-xl text-sm font-bold shadow-[0_0_30px_rgba(93,174,255,0.2)] hover:shadow-[0_0_50px_rgba(93,174,255,0.3)] transition-shadow">
        {t('hero.cta')}
      </a>
      <a href="#problem"
        className="px-8 py-4 bg-[#1A1A26] border border-[#2A2A3C] text-[#8888A0] rounded-xl text-sm font-medium hover:border-[#3A3A52] hover:text-[#E8E8F0] transition-all">
        {t('hero.secondary')}
      </a>
    </div>

    {/* Scroll hint */}
    <div className="absolute bottom-8 animate-bounce text-[#2A2A3C]">
      <ChevronDown className="w-6 h-6" />
    </div>
  </section>
);

export default Hero;
