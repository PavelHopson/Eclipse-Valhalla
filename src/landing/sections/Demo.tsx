import React from 'react';

interface Props { t: (k: string) => string; }

const Demo: React.FC<Props> = ({ t }) => (
  <section className="py-20 md:py-28 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-xl md:text-3xl font-bold text-[#E8E8F0] mb-10">{t('demo.title')}</h2>

      {/* Pipeline visualization */}
      <div className="relative inline-block">
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-0 text-xs md:text-sm font-mono">
          {t('demo.flow').split(' → ').map((step, i, arr) => (
            <React.Fragment key={i}>
              <span className="px-3 py-2 md:px-4 md:py-2.5 bg-[#12121A] border border-[#2A2A3C] rounded-lg text-[#8888A0] whitespace-nowrap">
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-[#2A2A3C] hidden md:inline mx-1">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Accent line */}
      <div className="mt-12 h-px bg-gradient-to-r from-transparent via-[#5DAEFF15] to-transparent" />
    </div>
  </section>
);

export default Demo;
