/**
 * Eclipse Valhalla — Dashboard (Tertiary Layer)
 *
 * Minimal. Only stats + nav shortcuts.
 * Hero zone and quest list are in App.tsx (primary/secondary layers).
 */

import React from 'react';
import { Reminder, ViewMode, User } from '../types';
import { useLanguage } from '../i18n';
import { Swords, Calendar, Target, Flame } from 'lucide-react';
import { getDailyStats } from '../services/disciplineMode';
import { getTimeAdjustment } from '../services/systemVoice';
import ProgressRing from './ProgressRing';

interface DashboardProps {
  reminders: Reminder[];
  setView: (view: ViewMode) => void;
  user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ reminders, setView, user }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const stats = getDailyStats();
  const timeAdj = getTimeAdjustment();

  const pending = reminders.filter(r => !r.isCompleted);
  const totalToday = pending.length + stats.completed;

  let streak = 0;
  try { const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user?.id}`) || '{}'); streak = s.days || 0; } catch {}

  return (
    <div className="px-6 pb-8">
      {/* ═══ PROGRESS + TIME ═══ */}
      <div className="flex items-center gap-5 py-4 border-t border-[#16162220] mt-2">
        <ProgressRing completed={stats.completed} total={Math.max(totalToday, 1)} size={56} strokeWidth={2.5} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5E5E78] uppercase tracking-[0.25em] font-bold">{isRU ? timeAdj.labelRu : timeAdj.label}</span>
            <span className="text-[9px] text-[#3D3D52]">·</span>
            <span className="text-[9px] text-[#3D3D52]">{new Date().toLocaleDateString(isRU ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Flame className="w-3.5 h-3.5 text-[#E86835]" />
              <span className="text-[13px] font-bold text-[#E86835]">{streak}d</span>
              <span className="text-[9px] text-[#3D3D52]">{isRU ? 'стрик' : 'streak'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ NAV SHORTCUTS ═══ */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { view: 'reminders' as ViewMode, icon: Swords, label: isRU ? 'Квесты' : 'Quests', color: '#5DA8FF' },
          { view: 'calendar' as ViewMode, icon: Calendar, label: isRU ? 'Календарь' : 'Calendar', color: '#7B5CFF' },
          { view: 'oracle' as ViewMode, icon: Target, label: isRU ? 'Оракул' : 'Oracle', color: '#3DD68C' },
        ].map(item => (
          <button key={item.view} onClick={() => setView(item.view)}
            className="flex flex-col items-center gap-2.5 py-5 bg-[#08080D] border border-[#16162240] rounded-lg hover:border-[#2A2A3C70] hover:bg-[#0B0B12] transition-all">
            <item.icon className="w-5 h-5" style={{ color: item.color }} />
            <span className="text-[10px] text-[#5E5E78] font-semibold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
