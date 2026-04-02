/**
 * Eclipse Valhalla — Milestone Toast
 *
 * Celebration + share prompt when milestones are achieved.
 */

import React from 'react';
import { Milestone } from '../services/growthService';
import { Share2, X } from 'lucide-react';

interface MilestoneToastProps {
  milestone: Milestone;
  onShare: () => void;
  onDismiss: () => void;
}

const MilestoneToast: React.FC<MilestoneToastProps> = ({ milestone, onShare, onDismiss }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm mx-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1A1A26] border border-[#FFD70030] rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.08)] overflow-hidden">
        {/* Gold accent top */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#FFD70008] border border-[#FFD70020] flex items-center justify-center text-lg shrink-0">
            {milestone.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wider mb-0.5">Milestone</div>
            <div className="text-sm font-bold text-[#E8E8F0]">{milestone.title}</div>
            <div className="text-xs text-[#55556A] mt-0.5">{milestone.message}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onShare}
              className="p-2 rounded-lg bg-[#FFD70010] text-[#FFD700] hover:bg-[#FFD70020] transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-lg text-[#3A3A4A] hover:text-[#55556A] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneToast;
