/**
 * Eclipse Valhalla - Dashboard (Tertiary Layer)
 *
 * Minimal operational context under the main pressure surfaces.
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
  try {
    const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user?.id}`) || '{}');
    streak = s.days || 0;
  } catch {}

  return (
    <div className="px-4 pb-8 md:px-6">
      <div className="rounded-[24px] border border-white/8 bg-[#121212]/92 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
        <div className="mt-1 flex items-center gap-5 border-b border-white/6 pb-4">
          <ProgressRing completed={stats.completed} total={Math.max(totalToday, 1)} size={56} strokeWidth={2.5} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7F7A72]">{isRU ? timeAdj.labelRu : timeAdj.label}</span>
              <span className="text-[9px] text-[#5F5A54]">•</span>
              <span className="text-[9px] text-[#5F5A54]">
                {new Date().toLocaleDateString(isRU ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            {streak > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#D8C18E]" />
                <span className="text-[13px] font-bold text-[#D8C18E]">{streak}d</span>
                <span className="text-[9px] text-[#5F5A54]">{isRU ? 'стрик' : 'streak'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { view: 'reminders' as ViewMode, icon: Swords, label: isRU ? 'Квесты' : 'Quests', color: '#6C8FB8' },
            { view: 'calendar' as ViewMode, icon: Calendar, label: isRU ? 'Календарь' : 'Calendar', color: '#B89B5E' },
            { view: 'oracle' as ViewMode, icon: Target, label: isRU ? 'Оракул' : 'Oracle', color: '#8E9B79' },
          ].map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className="flex flex-col items-center gap-2.5 rounded-[18px] border border-white/8 bg-[#171717] py-5 transition-all hover:border-white/14 hover:bg-[#1D1D1D]"
            >
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7F7A72]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
