/**
 * Eclipse Valhalla — Landing Page (Redesigned)
 *
 * Dark. Cinematic. Conversion-focused.
 * Sells: execution through consequence.
 */

import React, { useState, useEffect } from 'react';
import { detectLang, t as createT, LandingLang } from './i18n';
import { Hammer, Globe, ChevronDown, ChevronRight, Check, Zap, Shield, Flame, Target, AlertTriangle, Timer, Swords, Sparkles, Rss, Monitor, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [lang, setLang] = useState<LandingLang>(detectLang);
  const toggleLang = () => { const n = lang === 'en' ? 'ru' : 'en'; setLang(n); localStorage.setItem('ev_landing_lang', n); };
  const tr = createT(lang);

  // Scroll-triggered subtle fade-in
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const APP_URL = '/';

  return (
    <div className="min-h-screen bg-[#06060B] text-[#E8E8F0] overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════ NOISE OVERLAY ══════ */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.012]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        backgroundColor: scrollY > 50 ? 'rgba(6,6,11,0.92)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(42,42,60,0.3)' : '1px solid transparent',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5DAEFF08] border border-[#5DAEFF15] flex items-center justify-center">
              <Hammer className="w-4 h-4 text-[#5DAEFF]" />
            </div>
            <span className="text-sm font-bold tracking-[0.12em] uppercase text-[#8888A0]" style={{ fontFamily: "'Cinzel', serif" }}>Eclipse</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#how" className="text-xs text-[#55556A] hover:text-[#8888A0] transition-colors hidden sm:block">{tr('nav.features')}</a>
            <a href="#pricing" className="text-xs text-[#55556A] hover:text-[#8888A0] transition-colors hidden sm:block">{tr('nav.pricing')}</a>
            <button onClick={toggleLang} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-[#3A3A4A] hover:text-[#55556A] transition-colors uppercase">
              <Globe className="w-3 h-3" />{lang === 'en' ? 'RU' : 'EN'}
            </button>
            <a href={APP_URL} className="px-5 py-2 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#06060B] rounded-lg text-xs font-bold transition-colors">
              {tr('nav.launch')}
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
           HERO — The Killing Zone
           Must convert in 3–5 seconds.
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Atmospheric layers */}
        <div className="absolute inset-0">
          {/* Deep eclipse glow — centered, massive */}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(93,174,255,0.04) 0%, rgba(122,92,255,0.02) 30%, transparent 60%)' }} />
          {/* Top vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(93,174,255,0.03) 0%, transparent 60%)' }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, #06060B, transparent)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Micro-label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5DAEFF06] border border-[#5DAEFF15] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5DAEFF] animate-pulse" />
            <span className="text-[10px] font-bold text-[#5DAEFF] uppercase tracking-[0.2em]">Discipline System</span>
          </div>

          {/* Headline — massive, sharp */}
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-tight text-[#E8E8F0] mb-6">
            {tr('hero.tagline')}
          </h1>

          {/* Sub — pain-driven, clear */}
          <p className="text-base md:text-lg text-[#6A6A82] max-w-2xl mx-auto mb-10 leading-relaxed">
            {tr('hero.sub')}
          </p>

          {/* CTA cluster */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a href={APP_URL}
              className="group relative px-8 py-4 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#06060B] rounded-xl text-sm font-bold transition-all shadow-[0_0_40px_rgba(93,174,255,0.15)] hover:shadow-[0_0_60px_rgba(93,174,255,0.25)]">
              {tr('hero.cta')}
              <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#how" className="px-6 py-4 text-[#55556A] hover:text-[#8888A0] text-sm font-medium transition-colors">
              {tr('hero.secondary')} ↓
            </a>
          </div>

          {/* ── Product mockup: Escalation visualization ── */}
          <div className="relative max-w-3xl mx-auto">
            {/* Glow behind mockup */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse at center, rgba(93,174,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

            <div className="relative bg-[#0C0C14]/90 border border-[#1A1A2E] rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
              {/* Mock titlebar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A2E]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4444]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]/60" />
                </div>
                <span className="text-[10px] text-[#3A3A4A] ml-2 font-mono">Eclipse Valhalla</span>
              </div>

              {/* Mock content — shows escalation */}
              <div className="p-6 space-y-3">
                {/* Normal quest */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
                  <div className="w-5 h-5 rounded border border-[#2A2A3C]" />
                  <span className="text-sm text-[#8888A0]">Review quarterly report</span>
                  <span className="ml-auto text-[9px] text-[#55556A] px-2 py-0.5 rounded-full border border-[#1E1E2E]">Due 3h</span>
                </div>

                {/* Warning quest — escalating */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#12121A] border border-[#FBBF2430] rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.05)]">
                  <div className="w-5 h-5 rounded border-2 border-[#FBBF24]" />
                  <span className="text-sm text-[#E8E8F0] font-medium">Deploy API update</span>
                  <span className="ml-auto text-[9px] text-[#FBBF24] px-2 py-0.5 rounded-full bg-[#FBBF2410] border border-[#FBBF2430] font-bold">OVERDUE 2h</span>
                </div>

                {/* Critical quest — maximum pressure */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#12121A] border border-[#FF444450] rounded-xl shadow-[0_0_25px_rgba(255,68,68,0.08)] animate-pulse" style={{ animationDuration: '3s' }}>
                  <AlertTriangle className="w-5 h-5 text-[#FF4444] shrink-0" />
                  <span className="text-sm text-[#FF4444] font-bold">Ship client deliverable</span>
                  <span className="ml-auto text-[9px] text-[#FF4444] px-2 py-0.5 rounded-full bg-[#FF444415] border border-[#FF444440] font-bold">CRITICAL · 6h OVERDUE</span>
                </div>

                {/* Discipline score bar */}
                <div className="flex items-center gap-3 pt-2 px-1">
                  <Shield className="w-4 h-4 text-[#FF4444]" />
                  <span className="text-[10px] text-[#55556A] uppercase tracking-wider">Discipline Score</span>
                  <div className="flex-1 h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#FF4444] to-[#FBBF24] w-[38%]" />
                  </div>
                  <span className="text-xs font-bold text-[#FF4444]">38</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-[#2A2A3C]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           PROBLEM — Emotional pain points
         ══════════════════════════════════════════════════════════════ */}
      <section id="problem" className="relative py-28 md:py-36 px-6">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,68,68,0.02) 0%, transparent 60%)' }} />

        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight mb-4">
            {tr('problem.title')}
          </h2>
          <p className="text-center text-lg text-[#5DAEFF] font-medium mb-16">{tr('problem.sub')}</p>

          <div className="space-y-5 max-w-xl mx-auto">
            {['problem.p1', 'problem.p2', 'problem.p3', 'problem.p4'].map((key, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="mt-1 w-8 h-8 rounded-lg bg-[#FF444508] border border-[#FF444415] flex items-center justify-center shrink-0 group-hover:bg-[#FF444410] transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4444]/70" />
                </div>
                <p className="text-[15px] text-[#6A6A82] leading-relaxed group-hover:text-[#8888A0] transition-colors">{tr(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           SECTION DIVIDER
         ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2A2A3C] to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
           HOW IT WORKS — Escalation mechanic
         ══════════════════════════════════════════════════════════════ */}
      <section id="how" className="py-28 md:py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How discipline works.</h2>
            <p className="text-[#55556A] max-w-lg mx-auto">Every ignored task escalates. Every completed task strengthens you. The system has consequences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="relative bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl p-6 group hover:border-[#2A2A3C] transition-all">
              <div className="absolute top-0 left-6 w-12 h-0.5 bg-[#5DAEFF30]" />
              <div className="w-10 h-10 rounded-xl bg-[#5DAEFF08] border border-[#5DAEFF15] flex items-center justify-center mb-5">
                <Target className="w-5 h-5 text-[#5DAEFF]" />
              </div>
              <div className="text-[10px] text-[#5DAEFF] font-bold uppercase tracking-[0.2em] mb-2">Step 01</div>
              <h3 className="text-lg font-bold text-[#E8E8F0] mb-2">Create a quest.</h3>
              <p className="text-sm text-[#55556A] leading-relaxed">Define your objective. Set priority and deadline. The system starts watching.</p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl p-6 group hover:border-[#2A2A3C] transition-all">
              <div className="absolute top-0 left-6 w-12 h-0.5 bg-[#FBBF2430]" />
              <div className="w-10 h-10 rounded-xl bg-[#FBBF2408] border border-[#FBBF2415] flex items-center justify-center mb-5">
                <Timer className="w-5 h-5 text-[#FBBF24]" />
              </div>
              <div className="text-[10px] text-[#FBBF24] font-bold uppercase tracking-[0.2em] mb-2">Step 02</div>
              <h3 className="text-lg font-bold text-[#E8E8F0] mb-2">Ignore it — it escalates.</h3>
              <p className="text-sm text-[#55556A] leading-relaxed">Widgets grow. Notifications intensify. Your discipline score drops. The pressure builds.</p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl p-6 group hover:border-[#2A2A3C] transition-all">
              <div className="absolute top-0 left-6 w-12 h-0.5 bg-[#4ADE8030]" />
              <div className="w-10 h-10 rounded-xl bg-[#4ADE8008] border border-[#4ADE8015] flex items-center justify-center mb-5">
                <Flame className="w-5 h-5 text-[#4ADE80]" />
              </div>
              <div className="text-[10px] text-[#4ADE80] font-bold uppercase tracking-[0.2em] mb-2">Step 03</div>
              <h3 className="text-lg font-bold text-[#E8E8F0] mb-2">Complete it — earn XP.</h3>
              <p className="text-sm text-[#55556A] leading-relaxed">Gain experience. Maintain your streak. Level up. Build an identity of discipline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           SYSTEMS — compact, secondary
         ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{tr('solution.title')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Swords, name: tr('solution.valhalla.name'), desc: tr('solution.valhalla.desc'), color: '#5DAEFF' },
              { icon: Sparkles, name: tr('solution.oracle.name'), desc: tr('solution.oracle.desc'), color: '#4ADE80' },
              { icon: Rss, name: tr('solution.nexus.name'), desc: tr('solution.nexus.desc'), color: '#7A5CFF' },
              { icon: Monitor, name: tr('solution.control.name'), desc: tr('solution.control.desc'), color: '#FBBF24' },
            ].map((sys, i) => (
              <div key={i} className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl p-5 hover:border-[#2A2A3C] transition-all">
                <sys.icon className="w-5 h-5 mb-3" style={{ color: sys.color }} />
                <h3 className="text-sm font-bold text-[#E8E8F0] mb-1">{sys.name}</h3>
                <p className="text-xs text-[#55556A] leading-relaxed">{sys.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           PRICING
         ══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 md:py-36 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{tr('pricing.title')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free */}
            <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl p-7 flex flex-col">
              <h3 className="text-lg font-bold text-[#6A6A82]">{tr('pricing.free')}</h3>
              <p className="text-xs text-[#3A3A4A] mb-5">{tr('pricing.free.tag')}</p>
              <div className="text-3xl font-black text-[#55556A] mb-6">{tr('pricing.free.price')}</div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {['50 quests', '3 widgets', 'Basic Oracle', '5 news sources', 'Local storage'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#55556A]"><Check className="w-3.5 h-3.5 text-[#3A3A4A]" />{f}</li>
                ))}
              </ul>
              <a href={APP_URL} className="block text-center py-3.5 bg-[#12121A] border border-[#1E1E2E] rounded-xl text-sm font-medium text-[#6A6A82] hover:text-[#E8E8F0] hover:border-[#2A2A3C] transition-all">
                {tr('pricing.cta.free')}
              </a>
            </div>

            {/* Pro */}
            <div className="relative bg-[#0C0C14] border-2 border-[#5DAEFF25] rounded-2xl p-7 flex flex-col shadow-[0_0_60px_rgba(93,174,255,0.04)]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5DAEFF60] to-transparent" />
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#5DAEFF]" />
                <h3 className="text-lg font-bold text-[#E8E8F0]">{tr('pricing.pro')}</h3>
              </div>
              <p className="text-xs text-[#55556A] mb-5">{tr('pricing.pro.tag')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-[#E8E8F0]">{tr('pricing.pro.price').split('/')[0]}</span>
                <span className="text-sm text-[#55556A]">/{tr('pricing.pro.price').split('/')[1]}</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {['Unlimited quests', 'Unlimited widgets', 'Full Oracle AI', 'Unlimited sources', 'AI summaries', 'Image Forge + TTS', 'Cloud sync', 'Custom themes', 'Advanced discipline'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#8888A0]"><Check className="w-3.5 h-3.5 text-[#5DAEFF]" />{f}</li>
                ))}
              </ul>
              <a href={APP_URL} className="block text-center py-3.5 bg-[#5DAEFF] hover:bg-[#4A9AEE] rounded-xl text-sm font-bold text-[#06060B] shadow-[0_0_25px_rgba(93,174,255,0.15)] hover:shadow-[0_0_40px_rgba(93,174,255,0.25)] transition-all">
                {tr('pricing.cta.pro')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           FINAL CTA
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-6 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(93,174,255,0.04) 0%, transparent 70%)' }} />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Eclipse sigil */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#5DAEFF12] mb-10" style={{ boxShadow: '0 0 50px rgba(93,174,255,0.05)' }}>
            <div className="w-6 h-6 rounded-full border border-[#5DAEFF20]" style={{ boxShadow: '0 0 20px rgba(93,174,255,0.1)' }} />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4">{tr('cta.title')}</h2>
          <p className="text-base text-[#55556A] mb-10 max-w-md mx-auto">{tr('cta.sub')}</p>

          <a href={APP_URL}
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#06060B] rounded-xl text-base font-bold shadow-[0_0_50px_rgba(93,174,255,0.2)] hover:shadow-[0_0_70px_rgba(93,174,255,0.3)] transition-all">
            {tr('cta.btn')}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           FOOTER
         ══════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-6 border-t border-[#1A1A2E]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-[#3A3A4A]">{tr('footer.copy')}</div>
          <div className="flex items-center gap-8 text-[10px] text-[#2A2A3C] uppercase tracking-widest">
            <span>Valhalla</span><span>Nexus</span><span>Forge</span><span>Void</span>
          </div>
          <div className="text-[10px] text-[#2A2A3C] italic">{tr('footer.built')}</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
