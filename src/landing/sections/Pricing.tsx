import React from 'react';
import { Check, Zap } from 'lucide-react';

interface Props { t: (k: string) => string; }

const FREE_FEATURES = [
  '50 quests', '3 widgets', 'Basic Oracle (10/day)', '5 news sources', 'Local storage',
];
const PRO_FEATURES = [
  'Unlimited quests', 'Unlimited widgets', 'Full Oracle', 'Unlimited sources',
  'AI summaries', 'Image Forge + TTS', 'Cloud sync', 'Custom themes', 'Advanced discipline', 'Priority support',
];

const Pricing: React.FC<Props> = ({ t }) => (
  <section id="pricing" className="py-24 md:py-32 px-6">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-4xl font-bold text-[#E8E8F0] text-center mb-16">{t('pricing.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Free */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#8888A0]">{t('pricing.free')}</h3>
          <p className="text-xs text-[#3A3A4A] mb-4">{t('pricing.free.tag')}</p>
          <div className="text-3xl font-black text-[#55556A] mb-6">{t('pricing.free.price')}</div>
          <ul className="space-y-2 flex-1 mb-6">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-[#55556A]">
                <Check className="w-3.5 h-3.5 text-[#3A3A4A] shrink-0" />{f}
              </li>
            ))}
          </ul>
          <a href="#cta" className="block text-center py-3 bg-[#1A1A26] border border-[#2A2A3C] rounded-xl text-sm font-medium text-[#8888A0] hover:text-[#E8E8F0] hover:border-[#3A3A52] transition-all">
            {t('pricing.cta.free')}
          </a>
        </div>

        {/* Pro */}
        <div className="relative bg-[#12121A] border-2 border-[#5DAEFF30] rounded-2xl p-6 flex flex-col shadow-[0_0_40px_rgba(93,174,255,0.06)]">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#5DAEFF] to-transparent" />
          <div className="flex items-center gap-2 mb-0.5">
            <Zap className="w-4 h-4 text-[#5DAEFF]" />
            <h3 className="text-lg font-bold text-[#E8E8F0]">{t('pricing.pro')}</h3>
          </div>
          <p className="text-xs text-[#55556A] mb-4">{t('pricing.pro.tag')}</p>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-black text-[#E8E8F0]">{t('pricing.pro.price').split('/')[0]}</span>
            <span className="text-sm text-[#55556A]">/{t('pricing.pro.price').split('/')[1]}</span>
          </div>
          <ul className="space-y-2 flex-1 mb-6">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-[#8888A0]">
                <Check className="w-3.5 h-3.5 text-[#5DAEFF] shrink-0" />{f}
              </li>
            ))}
          </ul>
          <a href="#cta" className="block text-center py-3 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(93,174,255,0.15)] hover:shadow-[0_0_30px_rgba(93,174,255,0.25)] transition-shadow">
            {t('pricing.cta.pro')}
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default Pricing;
