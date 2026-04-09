/**
 * Eclipse Valhalla - Dashboard (Tertiary Layer)
 *
 * Minimal operational context under the main pressure surfaces.
 */

import React, { useState, useEffect } from 'react';
import { Reminder, ViewMode, User } from '../types';
import { useLanguage } from '../i18n';
import { Swords, Calendar, Target, Flame } from 'lucide-react';
import { getDailyStats } from '../services/disciplineMode';
import { getTimeAdjustment } from '../services/systemVoice';
import { playNotificationSound } from '../utils';
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

  const [miniTimer, setMiniTimer] = useState(0);
  const [miniTimerRunning, setMiniTimerRunning] = useState(false);
  const [miniTimerPreset, setMiniTimerPreset] = useState(25 * 60);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (miniTimerRunning && miniTimer > 0) {
      interval = setInterval(() => {
        setMiniTimer(prev => {
          if (prev <= 1) {
            setMiniTimerRunning(false);
            try { playNotificationSound(); } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [miniTimerRunning, miniTimer]);

  const pending = reminders.filter(r => !r.isCompleted);
  const totalToday = pending.length + stats.completed;

  const now = new Date();
  const dueToday = reminders.filter(r => !r.isCompleted && r.dueDateTime && new Date(r.dueDateTime).toDateString() === now.toDateString()).length;
  const doneToday = reminders.filter(r => r.isCompleted && r.completedAt && new Date(r.completedAt).toDateString() === now.toDateString()).length;

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

        {/* Today's Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F7A72] mb-1">{isRU ? 'На сегодня' : 'Due Today'}</div>
            <div className="text-2xl font-extrabold text-[#F2F1EE]">{dueToday}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F7A72] mb-1">{isRU ? 'Выполнено' : 'Done'}</div>
            <div className="text-2xl font-extrabold text-[#4ADE80]">{doneToday}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F7A72] mb-1">{isRU ? 'Серия' : 'Streak'}</div>
            <div className="text-2xl font-extrabold text-[#D8C18E]">{streak}{isRU ? 'д' : 'd'}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F7A72] mb-1">{isRU ? 'Уровень' : 'Level'}</div>
            <div className="text-2xl font-extrabold text-[#5DAEFF]">{user?.level || 1}</div>
          </div>
        </div>

        {/* Mini Timer */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F7A72]">{isRU ? 'Быстрый таймер' : 'Quick Timer'}</span>
            {miniTimerRunning && (
              <button onClick={() => { setMiniTimerRunning(false); setMiniTimer(0); }}
                className="text-[10px] font-bold text-[#FF4444]">
                {isRU ? 'Стоп' : 'Stop'}
              </button>
            )}
          </div>

          {miniTimerRunning || miniTimer > 0 ? (
            <div className="text-center">
              <div className="text-3xl font-mono font-extrabold text-[#F2F1EE] mb-2">
                {Math.floor(miniTimer / 60).toString().padStart(2, '0')}:{(miniTimer % 60).toString().padStart(2, '0')}
              </div>
              {!miniTimerRunning && miniTimer === 0 && (
                <p className="text-xs text-[#4ADE80] font-bold">{isRU ? 'Готово!' : 'Done!'}</p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {[5, 10, 15, 25].map(min => (
                <button key={min} onClick={() => { setMiniTimer(min * 60); setMiniTimerPreset(min * 60); setMiniTimerRunning(true); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-[#55556A] hover:text-[#F2F1EE]"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                  {min}{isRU ? 'м' : 'm'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
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
