/**
 * Eclipse Valhalla — Activation Checklist
 *
 * Shows new users their progress toward full activation.
 * Disappears once all steps are complete.
 */

import React from 'react';
import { ActivationStatus } from '../services/growthService';
import { Check, Circle, Swords, Target, Sparkles, Rss } from 'lucide-react';

interface Props {
  status: ActivationStatus;
  onAction: (action: string) => void;
}

const STEPS = [
  { key: 'questCreated',   label: 'Create first quest',    action: 'create_quest',  icon: Swords,   color: '#5DAEFF' },
  { key: 'questCompleted', label: 'Complete first quest',   action: 'focus_quest',   icon: Check,    color: '#4ADE80' },
  { key: 'widgetUsed',     label: 'Spawn a widget',         action: 'open_widgets',  icon: Target,   color: '#FBBF24' },
  { key: 'oracleUsed',     label: 'Ask the Oracle',         action: 'open_oracle',   icon: Sparkles, color: '#4ADE80' },
  { key: 'nexusUsed',      label: 'Add a Nexus source',     action: 'open_nexus',    icon: Rss,      color: '#7A5CFF' },
];

const ActivationChecklist: React.FC<Props> = ({ status, onAction }) => {
  if (status.activationScore >= 100) return null;

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">Getting Started</span>
        <span className="text-[10px] font-bold text-[#5DAEFF]">{status.activationScore}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
        <div className="h-full bg-[#5DAEFF] rounded-full transition-all duration-500"
          style={{ width: `${status.activationScore}%` }} />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {STEPS.map(step => {
          const done = (status as any)[step.key];
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => !done && onAction(step.action)}
              disabled={done}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                done ? 'opacity-40' : 'hover:bg-[#1A1A26]'
              }`}
            >
              {done ? (
                <div className="w-5 h-5 rounded-full bg-[#4ADE8015] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#4ADE80]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-[#2A2A3C] flex items-center justify-center">
                  <Icon className="w-3 h-3" style={{ color: step.color }} />
                </div>
              )}
              <span className={`text-xs ${done ? 'text-[#3A3A4A] line-through' : 'text-[#8888A0]'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivationChecklist;
