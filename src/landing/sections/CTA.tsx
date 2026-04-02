import React from 'react';

interface Props { t: (k: string) => string; }

const CTA: React.FC<Props> = ({ t }) => (
  <section id="cta" className="py-24 md:py-32 px-6 relative overflow-hidden">
    {/* Background glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #5DAEFF06 0%, transparent 70%)' }} />

    <div className="max-w-2xl mx-auto text-center relative">
      {/* Eclipse icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#5DAEFF15] mb-8"
        style={{ boxShadow: '0 0 40px rgba(93,174,255,0.06)' }}>
        <div className="w-6 h-6 rounded-full bg-[#0A0A0F] border border-[#5DAEFF25]"
          style={{ boxShadow: '0 0 15px rgba(93,174,255,0.12)' }} />
      </div>

      <h2 className="text-2xl md:text-4xl font-bold text-[#E8E8F0] mb-3">{t('cta.title')}</h2>
      <p className="text-sm md:text-base text-[#55556A] mb-10 max-w-md mx-auto">{t('cta.sub')}</p>

      <a href="/src/main.tsx"
        className="inline-block px-10 py-4 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] text-white rounded-xl text-base font-bold shadow-[0_0_40px_rgba(93,174,255,0.2)] hover:shadow-[0_0_60px_rgba(93,174,255,0.3)] transition-shadow">
        {t('cta.btn')}
      </a>
    </div>
  </section>
);

export default CTA;
