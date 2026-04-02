/**
 * Eclipse Valhalla — Dashboard Hero
 *
 * War Table / Command Center header.
 * Shows discipline status, active quests, overdue warnings.
 */

import React from 'react';
import { User, Reminder, PlanTier } from '../types';
import { useLanguage } from '../i18n';
import { SigilIcon, VoidDivider, PremiumPanel } from '../brand';
import { Swords, Flame, Trophy, AlertTriangle, Timer } from 'lucide-react';

interface DashboardHeroProps {
  user: User;
  reminders: Reminder[];
  disciplineScore: number;
  streak: number;
  onStartFocus: () => void;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({
  user,
  reminders,
  disciplineScore,
  streak,
  onStartFocus,
}) => {
  const { t } = useLanguage();

  const now = new Date();
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'Dawn Cycle' : hour < 18 ? 'Solar Cycle' : 'Night Cycle';

  const active = reminders.filter(r => !r.isCompleted);
  const overdue = active.filter(r => new Date(r.dueDateTime) < now);
  const completedToday = reminders.filter(r =>
    r.isCompleted && new Date(r.createdAt).toDateString() === now.toDateString()
  );

  // Discipline color
  const dColor = disciplineScore >= 80 ? '#4ADE80'
    : disciplineScore >= 50 ? '#FBBF24'
    : '#FF4444';

  return (
    <div className="relative overflow-hidden">
      {/* Ambient eclipse glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${dColor}06 0%, transparent 70%)`,
        }}
      />

      <div className="relative px-6 py-6 space-y-5">

        {/* Top line — date + cycle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.2em]">{timeOfDay}</div>
            <div className="text-sm font-medium text-[#8888A0] mt-0.5">{today}</div>
          </div>

          {/* Discipline score badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
            style={{
              borderColor: `${dColor}30`,
              backgroundColor: `${dColor}08`,
            }}
          >
            <SigilIcon name="discipline" size={14} color={dColor} />
            <span className="text-xs font-bold" style={{ color: dColor }}>{disciplineScore}</span>
            <span className="text-[9px] text-[#55556A] uppercase tracking-wider">Discipline</span>
          </div>
        </div>

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-[#E8E8F0] tracking-wide font-serif">
            {t(hour < 12 ? 'greeting.morning' : hour < 18 ? 'greeting.afternoon' : 'greeting.evening')},
            <span className="text-[#5DAEFF] ml-2">{user.name}</span>
          </h1>
          <p className="text-sm text-[#55556A] mt-1">
            {overdue.length > 0
              ? `${overdue.length} quest${overdue.length > 1 ? 's' : ''} overdue. Act now.`
              : active.length > 0
              ? `${active.length} active quest${active.length > 1 ? 's' : ''} await.`
              : 'All quests resolved. Seek new objectives.'}
          </p>
        </div>

        <VoidDivider variant="accent" withMark />

        {/* Stat pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Active quests */}
          <div className="flex items-center gap-3 bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5DAEFF08] border border-[#5DAEFF20] flex items-center justify-center">
              <Swords className="w-4 h-4 text-[#5DAEFF]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#E8E8F0]">{active.length}</div>
              <div className="text-[9px] text-[#55556A] uppercase tracking-wider">Active</div>
            </div>
          </div>

          {/* Overdue */}
          <div className="flex items-center gap-3 bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overdue.length > 0 ? 'bg-[#8B000010] border border-[#8B000030]' : 'bg-[#12121A] border border-[#1E1E2E]'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${overdue.length > 0 ? 'text-[#FF4444]' : 'text-[#3A3A4A]'}`} />
            </div>
            <div>
              <div className={`text-lg font-bold ${overdue.length > 0 ? 'text-[#FF4444]' : 'text-[#3A3A4A]'}`}>{overdue.length}</div>
              <div className="text-[9px] text-[#55556A] uppercase tracking-wider">Overdue</div>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-3 bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B3508] border border-[#FF6B3520] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#E8E8F0]">{streak}</div>
              <div className="text-[9px] text-[#55556A] uppercase tracking-wider">Streak</div>
            </div>
          </div>

          {/* Completed today */}
          <div className="flex items-center gap-3 bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4ADE8008] border border-[#4ADE8020] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#4ADE80]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#E8E8F0]">{completedToday.length}</div>
              <div className="text-[9px] text-[#55556A] uppercase tracking-wider">Done</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
