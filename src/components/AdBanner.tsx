
import React from 'react';
import { X, Zap } from 'lucide-react';
import { useLanguage } from '../i18n';

interface AdBannerProps {
  onUpgrade: () => void;
  onClose: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ onUpgrade, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 bg-[#12121A] text-[#E8E8F0] p-4 rounded-xl shadow-2xl border border-[#1E1E2E] z-50 flex items-center justify-between gap-4 max-w-2xl animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FBBF24] rounded-lg text-[#12121A]">
            <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
            <h4 className="font-bold text-sm">{t('ad.title')}</h4>
            <p className="text-xs text-[#55556A]">{t('ad.desc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-[#5DAEFF] text-[#E8E8F0] font-bold text-xs rounded-lg hover:bg-[#5DAEFF]/80 transition-colors whitespace-nowrap"
        >
            {t('ad.btn')}
        </button>
        <button onClick={onClose} className="p-2 text-[#55556A] hover:text-[#E8E8F0]">
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdBanner;
