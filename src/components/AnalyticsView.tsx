/**
 * Eclipse Valhalla — Productivity Analytics
 */

import React, { useMemo } from 'react';
import { Reminder, WorkoutLog } from '../types';
import { useLanguage } from '../i18n';
import { TrendingUp, Target, Flame, Clock, Calendar, CheckCircle2, BarChart3, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  reminders: Reminder[];
  workoutLogs: WorkoutLog[];
  streak: number;
  level: number;
  xp: number;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ reminders, workoutLogs, streak, level, xp }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Stats calculations
  const totalQuests = reminders.length;
  const completedQuests = reminders.filter(r => r.isCompleted).length;
  const completionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  const thisWeekCompleted = useMemo(() => {
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return reminders.filter(r => r.isCompleted && r.completedAt && new Date(r.completedAt) > weekAgo).length;
  }, [reminders]);

  const thisMonthCompleted = useMemo(() => {
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    return reminders.filter(r => r.isCompleted && r.completedAt && new Date(r.completedAt) > monthAgo).length;
  }, [reminders]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const cats: Record<string, { total: number; done: number }> = {};
    reminders.forEach(r => {
      const cat = r.category || 'Other';
      if (!cats[cat]) cats[cat] = { total: 0, done: 0 };
      cats[cat].total++;
      if (r.isCompleted) cats[cat].done++;
    });
    return Object.entries(cats).sort((a, b) => b[1].total - a[1].total);
  }, [reminders]);

  // Activity heatmap (last 30 days)
  const heatmap = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const count = reminders.filter(r => r.isCompleted && r.completedAt &&
        new Date(r.completedAt).toISOString().split('T')[0] === dateStr).length;
      return { date: dateStr, count, day: d.getDate() };
    });
  }, [reminders]);

  const maxHeat = Math.max(...heatmap.map(h => h.count), 1);

  // Priority distribution
  const priorityStats = useMemo(() => ({
    high: reminders.filter(r => r.priority === 'High').length,
    medium: reminders.filter(r => r.priority === 'Medium').length,
    low: reminders.filter(r => r.priority === 'Low').length,
  }), [reminders]);

  // Overdue
  const overdue = reminders.filter(r => !r.isCompleted && r.dueDateTime && new Date(r.dueDateTime) < now).length;

  // Best day
  const bestDay = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    reminders.filter(r => r.isCompleted && r.completedAt).forEach(r => {
      const d = new Date(r.completedAt!).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short' });
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    const entries = Object.entries(dayCounts);
    if (entries.length === 0) return isRu ? '—' : '—';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [reminders]);

  const V = {
    bg0: '#0A0A0F', bg2: '#12121A', bg3: '#1A1A26',
    text: '#E8E8F0', textSec: '#8888A0', textTer: '#55556A', textDis: '#3A3A4A',
    border: '#1E1E2E', borderL: '#2A2A3C',
    accent: '#5DAEFF', orange: '#FF6B35', gold: '#D8C18E', success: '#4ADE80', danger: '#FF4444',
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${V.accent}20, ${V.accent}08)`, border: `1px solid ${V.accent}30` }}>
            <BarChart3 className="w-5 h-5" style={{ color: V.accent }} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: V.text }}>
              {isRu ? 'Аналитика' : 'Analytics'}
            </h2>
            <p className="text-xs" style={{ color: V.textTer }}>
              {isRu ? 'Статистика продуктивности' : 'Productivity statistics'}
            </p>
          </div>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <CheckCircle2 className="w-5 h-5" />, value: `${completionRate}%`, label: isRu ? 'Выполнение' : 'Completion', color: V.success },
            { icon: <Flame className="w-5 h-5" />, value: `${streak}д`, label: isRu ? 'Стрик' : 'Streak', color: V.gold },
            { icon: <Zap className="w-5 h-5" />, value: `${level}`, label: isRu ? 'Уровень' : 'Level', color: V.accent },
            { icon: <TrendingUp className="w-5 h-5" />, value: `${xp}`, label: 'XP', color: V.orange },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${s.color}15` }}>
                <div style={{ color: s.color }}>{s.icon}</div>
              </div>
              <div className="text-2xl font-extrabold" style={{ color: V.text }}>{s.value}</div>
              <p className="text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: V.textTer }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity + Period stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Period breakdown */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: V.text }}>
              {isRu ? 'Выполнено квестов' : 'Quests Completed'}
            </h3>
            <div className="space-y-3">
              {[
                { label: isRu ? 'Всего' : 'Total', value: completedQuests, max: totalQuests, color: V.accent },
                { label: isRu ? 'Эта неделя' : 'This Week', value: thisWeekCompleted, max: Math.max(thisWeekCompleted, 10), color: V.success },
                { label: isRu ? 'Этот месяц' : 'This Month', value: thisMonthCompleted, max: Math.max(thisMonthCompleted, 30), color: V.gold },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: V.textSec }}>{s.label}</span>
                    <span className="font-bold" style={{ color: V.text }}>{s.value}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: V.bg3 }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(s.value / Math.max(s.max, 1)) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: V.text }}>
              {isRu ? 'Обзор' : 'Overview'}
            </h3>
            <div className="space-y-3">
              {[
                { label: isRu ? 'Всего квестов' : 'Total Quests', value: totalQuests },
                { label: isRu ? 'Просрочено' : 'Overdue', value: overdue, danger: overdue > 0 },
                { label: isRu ? 'Тренировок' : 'Workouts', value: workoutLogs.length },
                { label: isRu ? 'Лучший день' : 'Best Day', value: bestDay },
              ].map((s, i) => (
                <div key={i} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${V.border}` }}>
                  <span className="text-xs" style={{ color: V.textSec }}>{s.label}</span>
                  <span className={`text-sm font-bold ${(s as any).danger ? 'text-[#FF4444]' : ''}`} style={{ color: (s as any).danger ? V.danger : V.text }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 30-day activity heatmap */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: V.text }}>
            {isRu ? 'Активность за 30 дней' : '30-Day Activity'}
          </h3>
          <div className="flex gap-1">
            {heatmap.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full aspect-square rounded-sm transition-all"
                  style={{ backgroundColor: h.count === 0 ? V.bg3 : `rgba(74,222,128,${0.2 + (h.count / maxHeat) * 0.8})` }}
                  title={`${h.date}: ${h.count} ${isRu ? 'квестов' : 'quests'}`} />
                {(i === 0 || i === 14 || i === 29) && (
                  <span className="text-[8px]" style={{ color: V.textDis }}>{h.day}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <div className="rounded-2xl p-5" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: V.text }}>
              {isRu ? 'По категориям' : 'By Category'}
            </h3>
            <div className="space-y-2">
              {categoryStats.map(([cat, stats]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs w-24 truncate" style={{ color: V.textSec }}>{cat}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: V.bg3 }}>
                    <div className="h-full rounded-full" style={{ width: `${(stats.done / Math.max(stats.total, 1)) * 100}%`, backgroundColor: V.accent }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: V.textDis }}>{stats.done}/{stats.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority distribution */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: V.text }}>
            {isRu ? 'Приоритеты' : 'Priorities'}
          </h3>
          <div className="flex gap-3">
            {[
              { label: isRu ? 'Высокий' : 'High', count: priorityStats.high, color: V.danger },
              { label: isRu ? 'Средний' : 'Medium', count: priorityStats.medium, color: V.gold },
              { label: isRu ? 'Низкий' : 'Low', count: priorityStats.low, color: V.success },
            ].map(p => (
              <div key={p.label} className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: `${p.color}08`, border: `1px solid ${p.color}20` }}>
                <div className="text-xl font-extrabold" style={{ color: p.color }}>{p.count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: V.textTer }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
