/**
 * Eclipse Valhalla — Daily Summary Modal
 *
 * End-of-day review showing progress, streak, discipline score.
 */

import React from 'react';
import { DailySummary } from '../services/dailyLoopService';
import { Shield, Flame, Swords, AlertTriangle, Trophy, X } from 'lucide-react';

interface DailySummaryModalProps {
  summary: DailySummary;
  onClose: () => void;
}

const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ summary, onClose }) => {
  const scoreColor = summary.disciplineScore >= 80 ? '#4ADE80'
    : summary.disciplineScore >= 50 ? '#FBBF24'
    : '#FF4444';

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0A0A0F]/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 bg-[#12121A] border border-[#2A2A3C] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-[#E8E8F0]">Day Complete</h3>
            <p className="text-[10px] text-[#55556A]">{new Date(summary.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1F1F2B] text-[#55556A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Discipline Score */}
          <div className="text-center py-3">
            <div className="text-[10px] text-[#55556A] uppercase tracking-wider mb-1">Discipline Score</div>
            <div className="text-4xl font-black" style={{ color: scoreColor }}>{summary.disciplineScore}</div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={<Trophy className="w-4 h-4 text-[#4ADE80]" />} value={summary.questsCompleted} label="Completed" />
            <StatBox icon={<Swords className="w-4 h-4 text-[#5DAEFF]" />} value={summary.questsActive} label="Remaining" />
            <StatBox icon={<AlertTriangle className="w-4 h-4 text-[#FF4444]" />} value={summary.questsOverdue} label="Overdue" />
            <StatBox icon={<Flame className="w-4 h-4 text-[#FF6B35]" />} value={summary.streakMaintained ? '✓' : '✗'} label="Streak" />
          </div>

          {/* Oracle message */}
          <div className="bg-[#0E0E16] border border-[#1E1E2E] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className="w-3 h-3" style={{ color: scoreColor }} />
              <span className="text-[9px] font-bold text-[#55556A] uppercase tracking-wider">Assessment</span>
            </div>
            <p className="text-xs text-[#8888A0] leading-relaxed">{summary.oracleMessage}</p>
          </div>

          {/* Close */}
          <button onClick={onClose} className="w-full py-3 bg-[#1F1F2B] hover:bg-[#262636] text-[#E8E8F0] rounded-xl text-sm font-medium border border-[#2A2A3C] transition-colors">
            Acknowledged
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-[#0E0E16] border border-[#1E1E2E] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
    {icon}
    <div>
      <div className="text-lg font-bold text-[#E8E8F0]">{value}</div>
      <div className="text-[9px] text-[#3A3A4A] uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

export default DailySummaryModal;
