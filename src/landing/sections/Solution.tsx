import React from 'react';
import { Swords, Sparkles, Rss, Monitor } from 'lucide-react';

interface Props { t: (k: string) => string; }

const SYSTEMS = [
  { key: 'valhalla', icon: Swords,   color: '#5DAEFF' },
  { key: 'oracle',   icon: Sparkles, color: '#4ADE80' },
  { key: 'nexus',    icon: Rss,      color: '#7A5CFF' },
  { key: 'control',  icon: Monitor,  color: '#FBBF24' },
];

const Solution: React.FC<Props> = ({ t }) => (
  <section className="py-24 md:py-32 px-6">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-4xl font-bold text-[#E8E8F0] text-center mb-16">{t('solution.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SYSTEMS.map(sys => {
          const Icon = sys.icon;
          return (
            <div key={sys.key}
              className="relative bg-[#12121A]/80 backdrop-blur-md border border-[#2A2A3C] rounded-2xl p-6 hover:border-[#3A3A52] transition-all group"
              style={{ boxShadow: `0 0 1px ${sys.color}10` }}>

              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-8 h-0.5 rounded-r" style={{ backgroundColor: `${sys.color}40` }} />
              <div className="absolute top-0 left-0 h-8 w-0.5 rounded-b" style={{ backgroundColor: `${sys.color}40` }} />

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${sys.color}08`, borderColor: `${sys.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: sys.color }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E8E8F0] mb-1">{t(`solution.${sys.key}.name`)}</h3>
                  <p className="text-sm text-[#55556A] leading-relaxed">{t(`solution.${sys.key}.desc`)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Solution;
