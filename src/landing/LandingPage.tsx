/**
 * Eclipse Valhalla — Landing Page
 *
 * Production-ready. Dark. Premium. Cold. Cosmic.
 * Fully bilingual (EN/RU) with auto-detection.
 */

import React, { useState } from 'react';
import { detectLang, t as createT, LandingLang } from './i18n';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';
import Hero from './sections/Hero';
import Problem from './sections/Problem';
import Solution from './sections/Solution';
import Demo from './sections/Demo';
import Features from './sections/Features';
import Pricing from './sections/Pricing';
import CTA from './sections/CTA';

const LandingPage: React.FC = () => {
  const [lang, setLang] = useState<LandingLang>(detectLang);

  const toggleLang = () => {
    const next = lang === 'en' ? 'ru' : 'en';
    setLang(next);
    localStorage.setItem('ev_landing_lang', next);
  };

  const tr = createT(lang);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#E8E8F0] font-sans overflow-x-hidden">
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

      <LandingNav t={tr} lang={lang} onToggleLang={toggleLang} />

      <main>
        <Hero t={tr} />
        <Problem t={tr} />
        <Solution t={tr} />
        <Demo t={tr} />
        <Features t={tr} />
        <Pricing t={tr} />
        <CTA t={tr} />
      </main>

      <LandingFooter t={tr} />
    </div>
  );
};

export default LandingPage;
