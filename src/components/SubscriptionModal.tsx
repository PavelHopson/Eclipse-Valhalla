
import React from 'react';
import { Check, Crown, Shield, Zap, X, Star } from 'lucide-react';
import { PlanTier } from '../types';
import { useLanguage } from '../i18n';

interface SubscriptionModalProps {
  currentPlan: PlanTier;
  onSelectPlan: (plan: PlanTier) => void;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ currentPlan, onSelectPlan, onClose }) => {
  const { t } = useLanguage();

  const plans = [
    {
        id: PlanTier.FREE,
        name: t('plan.free'),
        subtitle: t('plan.free_sub'),
        price: 'Free',
        features: ['Basic Tasks & Notes', 'Local Calendar', 'Standard Workouts', 'Community Support'],
        bg: 'bg-[#1A1A26]',
        border: 'border-[#2A2A3C]',
        text: 'text-[#8888A0]',
        btn: 'bg-[#12121A] text-[#8888A0]',
        icon: Shield,
        accent: 'text-[#55556A]'
    },
    {
        id: PlanTier.STANDARD,
        name: t('plan.standard'),
        subtitle: t('plan.standard_sub'),
        price: '$5/mo',
        features: [t('plan.feature_ads'), t('plan.feature_themes'), 'Priority Support', 'Cloud Backup'],
        bg: 'bg-[#1A1A26]',
        border: 'border-[#5DAEFF]/30',
        text: 'text-[#E8E8F0]',
        btn: 'bg-[#5DAEFF] hover:bg-[#5DAEFF]/80 text-[#E8E8F0] shadow-lg shadow-[#5DAEFF]/20',
        tag: t('plan.most_popular'),
        icon: Zap,
        accent: 'text-[#5DAEFF]'
    },
    {
        id: PlanTier.PRO,
        name: t('plan.pro'),
        subtitle: t('plan.pro_sub'),
        price: '$12/mo',
        features: [t('plan.feature_ai'), t('plan.feature_game'), t('plan.feature_sync'), t('plan.feature_priority')],
        bg: 'bg-[#0A0A0F]',
        border: 'border-[#FBBF24]/50',
        text: 'text-[#FBBF24]',
        btn: 'bg-gradient-to-r from-[#FBBF24] to-orange-600 hover:from-[#FBBF24]/80 hover:to-orange-500 text-[#E8E8F0] shadow-xl shadow-[#FBBF24]/30',
        tag: t('plan.best_value'),
        icon: Crown,
        isPremium: true,
        accent: 'text-[#FBBF24]'
    }
  ];

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto relative scrollbar-hide">

        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-[#E8E8F0]/10 rounded-full text-[#55556A] hover:text-[#E8E8F0] hover:bg-[#E8E8F0]/20 transition-colors">
            <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-12 mt-8">
            <h2 className="text-4xl md:text-6xl font-bold font-serif tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#E8E8F0] to-[#55556A] uppercase">
                {t('plan.upgrade_title')}
            </h2>
            <p className="text-[#55556A] text-lg font-light">{t('plan.upgrade_desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4 pb-12 items-stretch">
            {plans.map(plan => {
                const isCurrent = currentPlan === plan.id;
                const isPro = plan.isPremium;

                return (
                    <div
                        key={plan.id}
                        className={`
                            relative rounded-3xl border-2 p-8 flex flex-col transition-all duration-300 group
                            ${plan.bg} ${plan.border}
                            ${isPro ? 'md:scale-105 z-10 shadow-[0_0_50px_-10px_rgba(245,158,11,0.2)]' : 'hover:scale-[1.02] shadow-xl'}
                        `}
                    >
                        {plan.tag && (
                            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg border ${isPro ? 'bg-[#FBBF24] text-[#E8E8F0] border-[#FBBF24]' : 'bg-[#5DAEFF] text-[#E8E8F0] border-[#5DAEFF]'}`}>
                                {plan.tag}
                            </div>
                        )}

                        <div className="text-center mb-8">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-inner ${plan.accent} ${isPro ? 'bg-[#FBBF24]/10' : 'bg-[#12121A]'}`}>
                                <plan.icon className="w-8 h-8" />
                            </div>
                            <h3 className={`text-2xl font-bold font-serif tracking-widest uppercase ${plan.text}`}>{plan.name}</h3>
                            <p className="text-xs opacity-60 uppercase tracking-widest mb-4 font-bold">{plan.subtitle}</p>
                            <div className={`text-4xl font-black ${plan.text}`}>{plan.price}</div>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {plan.features.map((f, i) => (
                                <div key={i} className={`flex items-start gap-3 text-sm ${plan.text}`}>
                                    <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${isPro ? 'bg-[#FBBF24]/20 text-[#FBBF24]' : 'bg-[#55556A]/20 text-[#55556A]'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="opacity-80 font-medium">{f}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={isCurrent}
                            onClick={() => onSelectPlan(plan.id)}
                            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all transform active:scale-95 ${plan.btn} ${isCurrent ? 'opacity-50 cursor-default grayscale' : ''}`}
                        >
                            {isCurrent ? t('plan.btn_free') : t('plan.btn_upgrade')}
                        </button>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
