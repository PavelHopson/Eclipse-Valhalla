import React from 'react';

interface Props { t: (k: string) => string; }

const Problem: React.FC<Props> = ({ t }) => {
  const points = ['problem.p1', 'problem.p2', 'problem.p3', 'problem.p4'];

  return (
    <section id="problem" className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold text-[#E8E8F0] mb-2">{t('problem.title')}</h2>
          <p className="text-lg text-[#5DAEFF]">{t('problem.sub')}</p>
        </div>

        <div className="space-y-4 max-w-lg mx-auto">
          {points.map((key, i) => (
            <div key={i} className="flex items-start gap-4 text-left">
              <div className="w-6 h-6 rounded-full bg-[#8B000015] border border-[#8B000030] flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF4444]" />
              </div>
              <p className="text-sm md:text-base text-[#8888A0] leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
