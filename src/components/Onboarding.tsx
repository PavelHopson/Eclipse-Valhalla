
import React, { useState } from 'react';
import { ArrowRight, Check, Star, Zap, Calendar } from 'lucide-react';
import { useLanguage } from '../i18n';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: t('onboard.s1_title'),
      desc: t('onboard.s1_desc'),
      icon: Star,
      color: 'text-amber-500 bg-amber-100'
    },
    {
      title: t('onboard.s2_title'),
      desc: t('onboard.s2_desc'),
      icon: Zap,
      color: 'text-blue-500 bg-blue-100'
    },
    {
      title: t('onboard.s3_title'),
      desc: t('onboard.s3_desc'),
      icon: Calendar,
      color: 'text-green-500 bg-green-100'
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-12">
           {slides.map((_, i) => (
             <div key={i} className={`h-1.5 w-full mx-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
           ))}
        </div>

        <div className="h-64 flex flex-col items-center justify-center mb-8 animate-in slide-in-from-right duration-300 key={step}">
           <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 ${slides[step].color} shadow-xl`}>
              {React.createElement(slides[step].icon, { className: "w-12 h-12" })}
           </div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{slides[step].title}</h2>
           <p className="text-slate-500 dark:text-slate-400 text-lg">{slides[step].desc}</p>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === slides.length - 1 ? t('onboard.start') : t('onboard.next')}
          <ArrowRight className="w-5 h-5" />
        </button>

        <button onClick={onComplete} className="mt-6 text-slate-400 font-medium text-sm hover:text-slate-600">{t('onboard.skip')}</button>
      </div>
    </div>
  );
};

export default Onboarding;
