/**
 * Eclipse Valhalla — Daily Habits Tracker
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import { Plus, X, Check, Flame } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedDates: string[]; // ISO date strings (YYYY-MM-DD)
}

const STORAGE_KEY = 'eclipse_habits';
const ICONS = ['🧘', '💧', '📚', '🏃', '😴', '🍎', '💪', '🧠', '✍️', '🚫'];

function loadHabits(): Habit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveHabits(habits: Habit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

const HabitsView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [habits, setHabits] = useState<Habit[]>(loadHabits);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🧘');

  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = useMemo(() =>
    habits.filter(h => h.completedDates.includes(today)).length,
  [habits, today]);

  const update = (updated: Habit[]) => { setHabits(updated); saveHabits(updated); };

  const addHabit = () => {
    if (!newName.trim()) return;
    update([...habits, { id: generateId(), name: newName.trim(), icon: newIcon, streak: 0, completedDates: [] }]);
    setNewName(''); setNewIcon('🧘'); setIsAdding(false);
  };

  const toggleToday = (id: string) => {
    update(habits.map(h => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(today);
      const dates = done ? h.completedDates.filter(d => d !== today) : [...h.completedDates, today];
      // Calculate streak
      let streak = 0;
      const sorted = [...dates].sort().reverse();
      for (let i = 0; i < sorted.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        if (sorted[i] === expected.toISOString().split('T')[0]) streak++;
        else break;
      }
      return { ...h, completedDates: dates, streak };
    }));
  };

  const deleteHabit = (id: string) => {
    update(habits.filter(h => h.id !== id));
  };

  // Last 7 days for heatmap
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#F2F1EE]">{isRu ? 'Привычки' : 'Habits'}</h2>
            <p className="text-xs text-[#55556A] mt-0.5">
              {todayCompleted}/{habits.length} {isRu ? 'сегодня' : 'today'}
            </p>
          </div>
          <button onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: '#FF6B35', color: '#0A0A0F', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
            <Plus className="w-4 h-4" /> {isRu ? 'Добавить' : 'Add'}
          </button>
        </div>

        {/* Today's progress */}
        {habits.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F7A72]">{isRu ? 'Прогресс дня' : 'Daily Progress'}</span>
              <span className="text-lg font-extrabold text-[#D8C18E]">{Math.round((todayCompleted / Math.max(habits.length, 1)) * 100)}%</span>
            </div>
            <div className="h-3 bg-[#0A0A0F] rounded-full overflow-hidden border border-[#1A1A26]">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(todayCompleted / Math.max(habits.length, 1)) * 100}%`, background: 'linear-gradient(90deg, #B89B5E, #D8C18E)', boxShadow: '0 0 12px rgba(184,155,94,0.4)' }} />
            </div>
          </div>
        )}

        {/* Add form */}
        {isAdding && (
          <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#12121A', border: '1px solid #2A2A3C' }}>
            <div className="flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder={isRu ? 'Название привычки' : 'Habit name'}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-[#0A0A0F] border border-[#1E1E2E] text-[#F2F1EE]" autoFocus />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${newIcon === icon ? 'ring-2 ring-[#D8C18E]' : ''}`}
                  style={{ backgroundColor: newIcon === icon ? '#D8C18E20' : '#0A0A0F' }}>
                  {icon}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs text-[#55556A]">{isRu ? 'Отмена' : 'Cancel'}</button>
              <button onClick={addHabit} disabled={!newName.trim()} className="px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-30"
                style={{ backgroundColor: '#5DAEFF', color: '#0A0A0F' }}>{isRu ? 'Добавить' : 'Add'}</button>
            </div>
          </div>
        )}

        {/* Habits list */}
        <div className="space-y-2">
          {habits.map(habit => {
            const doneToday = habit.completedDates.includes(today);
            return (
              <div key={habit.id}
                className="flex items-center gap-3 p-4 rounded-2xl transition-all group"
                style={{ backgroundColor: doneToday ? '#4ADE8008' : '#12121A', border: `1px solid ${doneToday ? '#4ADE8030' : '#1E1E2E'}` }}>
                {/* Toggle */}
                <button onClick={() => toggleToday(habit.id)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${doneToday ? 'ring-2 ring-[#4ADE80]' : ''}`}
                  style={{ backgroundColor: doneToday ? '#4ADE8020' : '#0A0A0F' }}>
                  {doneToday ? <Check className="w-5 h-5 text-[#4ADE80]" /> : <span>{habit.icon}</span>}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${doneToday ? 'text-[#4ADE80] line-through' : 'text-[#F2F1EE]'}`}>{habit.name}</div>
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3 text-[#D8C18E]" />
                      <span className="text-[10px] font-bold text-[#D8C18E]">{habit.streak}{isRu ? 'д' : 'd'}</span>
                    </div>
                  )}
                </div>

                {/* 7-day heatmap */}
                <div className="flex gap-0.5 shrink-0">
                  {last7.map(date => (
                    <div key={date}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: habit.completedDates.includes(date) ? '#4ADE80' : '#1A1A26' }}
                      title={date} />
                  ))}
                </div>

                {/* Delete */}
                <button onClick={() => deleteHabit(habit.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-[#3A3A4A] hover:text-[#FF4444]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {habits.length === 0 && !isAdding && (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block">🧘</span>
            <p className="font-semibold text-[#55556A]">{isRu ? 'Нет привычек' : 'No habits'}</p>
            <p className="text-sm text-[#3A3A4A] mt-1">{isRu ? 'Добавь ежедневные действия: медитация, вода, чтение' : 'Add daily actions: meditation, water, reading'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitsView;
