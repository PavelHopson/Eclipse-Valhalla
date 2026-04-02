import React from 'react';
import { Swords, Target, Sparkles, Rss, Flame, Cloud, Monitor, Smartphone } from 'lucide-react';

interface Props { t: (k: string) => string; }

const FEATURES = [
  { key: 'quests',       icon: Swords,     color: '#5DAEFF' },
  { key: 'widgets',      icon: Target,     color: '#FBBF24' },
  { key: 'oracle',       icon: Sparkles,   color: '#4ADE80' },
  { key: 'nexus',        icon: Rss,        color: '#7A5CFF' },
  { key: 'gamification', icon: Flame,      color: '#FF6B35' },
  { key: 'sync',         icon: Cloud,      color: '#5DAEFF' },
  { key: 'desktop',      icon: Monitor,    color: '#8888A0' },
  { key: 'mobile',       icon: Smartphone, color: '#8888A0' },
];

const Features: React.FC<Props> = ({ t }) => (
  <section id="features" className="py-24 md:py-32 px-6">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-4xl font-bold text-[#E8E8F0] text-center mb-16">{t('features.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(feat => {
          const Icon = feat.icon;
          return (
            <div key={feat.key} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#2A2A3C] transition-all group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 border"
                style={{ backgroundColor: `${feat.color}06`, borderColor: `${feat.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: feat.color }} />
              </div>
              <h3 className="text-sm font-bold text-[#E8E8F0] mb-1">{t(`feat.${feat.key}`)}</h3>
              <p className="text-xs text-[#55556A] leading-relaxed">{t(`feat.${feat.key}.d`)}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Features;
