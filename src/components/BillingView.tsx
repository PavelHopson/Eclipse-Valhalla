/**
 * Eclipse Valhalla — Billing View
 *
 * Subscription management screen.
 */

import React, { useState } from 'react';
import { getPlans, getCurrentPlan, subscribe, getBillingState, BillingInterval } from '../services/billingService';
import PricingCard from './PricingCard';
import { Crown, Shield } from 'lucide-react';
import type { Tier } from '../backend/schema/entities';

const BillingView: React.FC = () => {
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const plans = getPlans();
  const current = getCurrentPlan();
  const state = getBillingState();

  const handleSelect = async (tier: Tier) => {
    if (tier === state.currentTier) return;
    setLoading(true);
    await subscribe(tier, interval);
    setLoading(false);
    window.location.reload(); // Refresh to apply tier changes
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5DAEFF08] border border-[#5DAEFF20] mb-2">
            <Crown className="w-7 h-7 text-[#5DAEFF]" />
          </div>
          <h1 className="text-2xl font-black text-[#E8E8F0] tracking-wide font-serif">Choose Your Path</h1>
          <p className="text-sm text-[#55556A] max-w-md mx-auto">
            Discipline demands commitment. Choose the tier that matches your ambition.
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex justify-center">
          <div className="flex bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
            {(['monthly', 'annual'] as BillingInterval[]).map(i => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  interval === i
                    ? 'bg-[#1A1A26] text-[#E8E8F0] shadow-sm'
                    : 'text-[#55556A] hover:text-[#8888A0]'
                }`}
              >
                {i === 'monthly' ? 'Monthly' : 'Annual'}
                {i === 'annual' && <span className="ml-1 text-[#4ADE80]">-33%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.tier === state.currentTier}
              interval={interval}
              onSelect={() => handleSelect(plan.tier)}
            />
          ))}
        </div>

        {/* Current subscription info */}
        {state.subscriptionId && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#5DAEFF]" />
              <span className="text-xs font-bold text-[#8888A0] uppercase tracking-wider">Active Subscription</span>
            </div>
            <div className="text-xs text-[#55556A] space-y-1">
              <p>Plan: <span className="text-[#E8E8F0]">{current.name}</span></p>
              {state.periodEnd && (
                <p>Renews: <span className="text-[#E8E8F0]">{new Date(state.periodEnd).toLocaleDateString()}</span></p>
              )}
              {state.cancelAtPeriodEnd && (
                <p className="text-[#FF4444]">Cancels at period end.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingView;
