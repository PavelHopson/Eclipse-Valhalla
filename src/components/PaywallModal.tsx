/**
 * Eclipse Valhalla — Paywall Modal
 *
 * Soft upgrade prompt. Shows when free users hit limits.
 * Not aggressive — communicates value.
 */

import React from 'react';
import { PaywallTrigger } from '../services/paywallService';
import { Crown, X, ChevronRight } from 'lucide-react';

interface PaywallModalProps {
  trigger: PaywallTrigger;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ trigger, onUpgrade, onDismiss }) => {
  if (!trigger.show) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onDismiss} />

      <div className="relative w-full max-w-sm mx-4 bg-[#12121A] border border-[#5DAEFF20] rounded-2xl shadow-[0_0_40px_rgba(93,174,255,0.06)] overflow-hidden">
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#5DAEFF] to-transparent" />

        <div className="p-6 space-y-4 text-center">
          {/* Close */}
          <button onClick={onDismiss} className="absolute top-3 right-3 p-1 text-[#3A3A4A] hover:text-[#55556A]">
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5DAEFF08] border border-[#5DAEFF20]">
            <Crown className="w-6 h-6 text-[#5DAEFF]" />
          </div>

          {/* Message */}
          <div>
            <h3 className="text-base font-bold text-[#E8E8F0]">{trigger.title}</h3>
            <p className="text-xs text-[#55556A] mt-1.5 leading-relaxed">{trigger.message}</p>
          </div>

          {/* CTA */}
          <button
            onClick={onUpgrade}
            className="w-full py-3 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(93,174,255,0.15)] hover:shadow-[0_0_30px_rgba(93,174,255,0.25)] transition-shadow flex items-center justify-center gap-2"
          >
            {trigger.cta}
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button onClick={onDismiss} className="text-[10px] text-[#3A3A4A] hover:text-[#55556A]">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
