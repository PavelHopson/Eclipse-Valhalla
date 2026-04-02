/**
 * Eclipse Valhalla — Pricing Card
 */

import React from 'react';
import { PlanConfig } from '../services/billingService';
import { Check, Zap } from 'lucide-react';

interface PricingCardProps {
  plan: PlanConfig;
  isCurrent: boolean;
  interval: 'monthly' | 'annual';
  onSelect: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isCurrent, interval, onSelect }) => {
  const price = interval === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.price;
  const accent = plan.highlighted ? '#5DAEFF' : '#2A2A3C';

  return (
    <div
      className={`relative bg-[#1A1A26] rounded-2xl overflow-hidden transition-all ${
        plan.highlighted
          ? 'border-2 border-[#5DAEFF40] shadow-[0_0_40px_rgba(93,174,255,0.08)]'
          : 'border border-[#2A2A3C]'
      }`}
    >
      {/* Highlight badge */}
      {plan.highlighted && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#5DAEFF] to-transparent" />
      )}

      <div className="p-6 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            {plan.highlighted && <Zap className="w-4 h-4 text-[#5DAEFF]" />}
            <h3 className="text-lg font-bold text-[#E8E8F0]">{plan.name}</h3>
          </div>
          <p className="text-xs text-[#55556A]">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-3xl font-black text-[#8888A0]">Free</span>
          ) : (
            <>
              <span className="text-3xl font-black text-[#E8E8F0]">${price}</span>
              <span className="text-sm text-[#55556A]">/mo</span>
            </>
          )}
          {interval === 'annual' && price > 0 && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#4ADE8010] text-[#4ADE80] border border-[#4ADE8030] font-bold">
              Save 33%
            </span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent === '#2A2A3C' ? '#55556A' : accent }} />
              <span className="text-[#8888A0]">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onSelect}
          disabled={isCurrent}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
            isCurrent
              ? 'bg-[#1F1F2B] text-[#55556A] cursor-default'
              : plan.highlighted
              ? 'bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] shadow-[0_0_20px_rgba(93,174,255,0.2)]'
              : 'bg-[#1F1F2B] hover:bg-[#262636] text-[#E8E8F0] border border-[#2A2A3C]'
          }`}
        >
          {isCurrent ? 'Current Plan' : plan.cta}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
