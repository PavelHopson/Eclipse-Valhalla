/**
 * Eclipse Valhalla — Dashboard (Command Center)
 *
 * Execution-focused. No decoration. Every pixel drives action.
 *
 * Sections:
 * 1. Streak/discipline status
 * 2. Today's quests (tap to focus)
 * 3. Quick stats
 * 4. Recent completions
 */

import React from 'react';
import { Reminder, ViewMode, User } from '../types';
import { useLanguage } from '../i18n';
import { Swords, Calendar, CheckCircle, AlertTriangle, ArrowRight, Flame, Target, Clock } from 'lucide-react';
import { getDailyStats } from '../services/disciplineMode';
import { getTimeAdjustment, getTimePressure, checkRareMoment } from '../services/systemVoice';
import ProgressRing from './ProgressRing';

interface DashboardProps {
  reminders: Reminder[];
  setView: (view: ViewMode) => void;
  user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ reminders, setView, user }) => {
  const { language, t } = useLanguage();
  const stats = getDailyStats();

  const pending = reminders.filter(r => !r.isCompleted);
  const completed = reminders.filter(r => r.isCompleted);
  const overdue = pending.filter(r => new Date(r.dueDateTime) < new Date());
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = reminders.filter(r => r.isCompleted && new Date(r.createdAt).toISOString().split('T')[0] === todayStr);
  const highPriority = pending.filter(r => r.priority === 'High');

  // Streak
  let streak = 0;
  try { const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user?.id}`) || '{}'); streak = s.days || 0; } catch {}

  // Time-based system
  const timeAdj = getTimeAdjustment();
  const isRU = language === 'ru';
  const timePressure = getTimePressure(pending.length, isRU);
  const totalToday = pending.length + completedToday.length;

  // Rare moment check
  const rareMoment = checkRareMoment({
    completedToday: stats.completed,
    escapesToday: stats.escapes,
    streak,
    pendingCount: pending.length,
    totalCompleted: completed.length,
  }, isRU);

  return (
    <div className="h-full overflow-y-auto pb-8">

      {/* ═══ PROGRESS + STATS ═══ */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-5 mb-4">
          {/* Daily progress ring */}
          <ProgressRing completed={stats.completed} total={Math.max(totalToday, 1)} size={72} strokeWidth={3} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: '#5E5E78' }}>
                {isRU ? timeAdj.labelRu : timeAdj.label}
              </span>
              <span className="text-[8px] text-[#3D3D52]">·</span>
              <span className="text-[9px] text-[#3D3D52]">{new Date().toLocaleDateString(isRU ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Flame className="w-3 h-3 text-[#E86835]" />
                <span className="text-xs font-bold text-[#E86835]">{streak}d</span>
                <span className="text-[9px] text-[#3D3D52]">{isRU ? 'стрик' : 'streak'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Swords className="w-3.5 h-3.5 text-[#5DA8FF]" />} value={pending.length} label={isRU ? 'Актив.' : 'Active'} />
          <StatCard icon={<AlertTriangle className="w-3.5 h-3.5 text-[#E03030]" />} value={overdue.length} label={isRU ? 'Просроч.' : 'Overdue'} danger={overdue.length > 0} />
          <StatCard icon={<CheckCircle className="w-3.5 h-3.5 text-[#3DD68C]" />} value={stats.completed} label={isRU ? 'Сегодня' : 'Today'} />
        </div>
      </div>

      {/* ═══ TIME PRESSURE ═══ */}
      {timePressure && (
        <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-[#E0303006] border border-[#E0303010]">
          <p className="text-[10px] text-[#E03030] font-medium">{timePressure}</p>
        </div>
      )}

      {/* ═══ RARE MOMENT ═══ */}
      {rareMoment && (
        <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-[#D4A82806] border border-[#D4A82810]">
          <p className="text-[10px] text-[#D4A828] font-medium italic">{rareMoment}</p>
        </div>
      )}

      {/* ═══ HIGH PRIORITY / OVERDUE ═══ */}
      {(overdue.length > 0 || highPriority.length > 0) && (
        <div className="px-6 py-3">
          <div className="text-[9px] text-[#FF4444] uppercase tracking-[0.2em] font-bold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {language === 'ru' ? 'Требуют внимания' : 'Requires attention'}
          </div>
          <div className="space-y-1.5">
            {[...overdue, ...highPriority.filter(h => !overdue.includes(h))].slice(0, 3).map(r => {
              const isOD = new Date(r.dueDateTime) < new Date();
              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isOD ? 'border-[#E0303015] bg-[#E0303006] state-overdue' : 'border-[#E8A82015] bg-[#E8A82006] state-active'
                }`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isOD ? 'bg-[#E03030]' : 'bg-[#E8A820]'}`} />
                  <span className={`text-sm font-medium flex-1 truncate ${isOD ? 'text-[#FF4444]' : 'text-[#E8E8F0]'}`}>{r.title}</span>
                  <span className="text-[9px] text-[#55556A]">
                    {isOD ? (language === 'ru' ? 'Просрочено' : 'Overdue') : 'High'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PENDING QUESTS ═══ */}
      {pending.length > 0 && (
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-[#55556A] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              {language === 'ru' ? 'Квесты' : 'Quests'}
            </span>
            <button onClick={() => setView('reminders')} className="text-[9px] text-[#5DAEFF] hover:text-[#4A9AEE] flex items-center gap-1 transition-colors">
              {language === 'ru' ? 'Все' : 'All'} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {pending.filter(r => !overdue.includes(r) && r.priority !== 'High').slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0F0F18] border border-[#1E1E3050] rounded-xl hover:border-[#2A2A3C] transition-all state-active">
                <div className="w-2 h-2 rounded-full bg-[#5DA8FF] shrink-0" />
                <span className="text-sm text-[#8888A0] flex-1 truncate">{r.title}</span>
                <Clock className="w-3 h-3 text-[#3A3A4A]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RECENT COMPLETIONS ═══ */}
      {completedToday.length > 0 && (
        <div className="px-6 py-3">
          <span className="text-[9px] text-[#4ADE80] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3 h-3" />
            {language === 'ru' ? 'Завершено сегодня' : 'Completed today'}
          </span>
          <div className="space-y-1">
            {completedToday.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                <span className="text-xs text-[#55556A] line-through truncate">{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {pending.length === 0 && completedToday.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Target className="w-10 h-10 text-[#1E1E2E] mx-auto mb-3" />
          <p className="text-sm text-[#55556A]">{language === 'ru' ? 'Нет активных квестов.' : 'No active quests.'}</p>
          <p className="text-xs text-[#3A3A4A] mt-1">{language === 'ru' ? 'Используй поле ввода выше.' : 'Use the input above to create one.'}</p>
        </div>
      )}

      {/* ═══ NAV SHORTCUTS ═══ */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { view: 'reminders' as ViewMode, icon: Swords, label: language === 'ru' ? 'Квесты' : 'Quests', color: '#5DAEFF' },
            { view: 'calendar' as ViewMode, icon: Calendar, label: language === 'ru' ? 'Календарь' : 'Calendar', color: '#7A5CFF' },
            { view: 'oracle' as ViewMode, icon: Target, label: language === 'ru' ? 'Оракул' : 'Oracle', color: '#4ADE80' },
          ].map(item => (
            <button key={item.view} onClick={() => setView(item.view)}
              className="flex flex-col items-center gap-2 py-4 bg-[#0F0F18] border border-[#1E1E3050] rounded-xl hover:border-[#2A2A3C] transition-all">
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
              <span className="text-[10px] text-[#55556A] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════

const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; danger?: boolean }> = ({ icon, value, label, danger }) => (
  <div className={`bg-[#0B0B12] border rounded-lg px-3 py-3 ${danger ? 'border-[#E0303015]' : 'border-[#1E1E3040]'}`}>
    <div className="flex items-center gap-1.5 mb-1.5">{icon}</div>
    <div className={`text-2xl font-black tracking-tight ${danger ? 'text-[#E03030]' : 'text-[#EAEAF2]'}`}>{value}</div>
    <div className="text-[10px] text-[#3D3D52] uppercase tracking-[0.15em] font-medium mt-0.5">{label}</div>
  </div>
);

export default Dashboard;
