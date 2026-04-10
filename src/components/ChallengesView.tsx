/**
 * Eclipse Valhalla — Challenges System
 * Time-bound goals: weekly/monthly fitness + productivity challenges
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import { Plus, X, Trophy, Flame, Target, Clock, Check } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string; // ISO date
  createdAt: string;
  completedAt?: string;
  category: 'fitness' | 'productivity' | 'habits';
}

const STORAGE_KEY = 'eclipse_challenges';
const V = { bg0:'#0A0A0F', bg2:'#12121A', bg3:'#1A1A26', text:'#E8E8F0', textSec:'#8888A0', textTer:'#55556A', textDis:'#3A3A4A', border:'#1E1E2E', accent:'#5DAEFF', orange:'#FF6B35', gold:'#D8C18E', success:'#4ADE80', danger:'#FF4444' };

const PRESETS_RU = [
  { title: '7 дней без пропуска', target: 7, unit: 'дней', category: 'habits' as const, days: 7 },
  { title: '100 отжиманий за неделю', target: 100, unit: 'повторов', category: 'fitness' as const, days: 7 },
  { title: '30 минут фокуса каждый день', target: 30, unit: 'дней', category: 'productivity' as const, days: 30 },
  { title: '10 квестов за неделю', target: 10, unit: 'квестов', category: 'productivity' as const, days: 7 },
  { title: '5 тренировок за месяц', target: 5, unit: 'тренировок', category: 'fitness' as const, days: 30 },
  { title: '2 литра воды каждый день', target: 14, unit: 'дней', category: 'habits' as const, days: 14 },
  { title: '🧱 Планка 2 минуты — 30 дней', target: 30, unit: 'дней', category: 'fitness' as const, days: 30 },
  { title: '🪑 Стульчик у стены — 30 дней', target: 30, unit: 'дней', category: 'fitness' as const, days: 30 },
  { title: '⚡ Утренний ритуал — 30 дней', target: 30, unit: 'дней', category: 'fitness' as const, days: 30 },
];
const PRESETS_EN = [
  { title: '7-day streak', target: 7, unit: 'days', category: 'habits' as const, days: 7 },
  { title: '100 push-ups this week', target: 100, unit: 'reps', category: 'fitness' as const, days: 7 },
  { title: '30 min focus daily', target: 30, unit: 'days', category: 'productivity' as const, days: 30 },
  { title: '10 quests this week', target: 10, unit: 'quests', category: 'productivity' as const, days: 7 },
  { title: '5 workouts this month', target: 5, unit: 'workouts', category: 'fitness' as const, days: 30 },
  { title: 'Drink water daily (2 weeks)', target: 14, unit: 'days', category: 'habits' as const, days: 14 },
  { title: '🧱 Plank 2 min — 30 days', target: 30, unit: 'days', category: 'fitness' as const, days: 30 },
  { title: '🪑 Wall Sit — 30 days', target: 30, unit: 'days', category: 'fitness' as const, days: 30 },
  { title: '⚡ Morning Ritual — 30 days', target: 30, unit: 'days', category: 'fitness' as const, days: 30 },
];

function load(): Challenge[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(data: Challenge[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

const ChallengesView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const PRESETS = isRu ? PRESETS_RU : PRESETS_EN;

  const [challenges, setChallenges] = useState<Challenge[]>(load);
  const [showPresets, setShowPresets] = useState(false);

  const update = (u: Challenge[]) => { setChallenges(u); save(u); };

  const addFromPreset = (preset: typeof PRESETS[0]) => {
    const deadline = new Date(); deadline.setDate(deadline.getDate() + preset.days);
    const ch: Challenge = { id: generateId(), title: preset.title, target: preset.target, current: 0, unit: preset.unit, deadline: deadline.toISOString(), createdAt: new Date().toISOString(), category: preset.category };
    update([ch, ...challenges]); setShowPresets(false);
  };

  const increment = (id: string, amount: number = 1) => {
    update(challenges.map(c => {
      if (c.id !== id) return c;
      const next = Math.min(c.current + amount, c.target);
      return { ...c, current: next, completedAt: next >= c.target ? new Date().toISOString() : undefined };
    }));
  };

  const active = challenges.filter(c => !c.completedAt && new Date(c.deadline) > new Date());
  const completed = challenges.filter(c => c.completedAt);
  const expired = challenges.filter(c => !c.completedAt && new Date(c.deadline) <= new Date());

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: V.text }}>{isRu ? 'Челленджи' : 'Challenges'}</h2>
            <p className="text-xs" style={{ color: V.textTer }}>{active.length} {isRu ? 'активных' : 'active'} · {completed.length} {isRu ? 'завершено' : 'completed'}</p>
          </div>
          <button onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: V.orange, color: V.bg0 }}>
            <Plus className="w-4 h-4" /> {isRu ? 'Начать' : 'Start'}
          </button>
        </div>

        {showPresets && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => addFromPreset(p)}
                className="p-3 rounded-xl text-left transition-all hover:translate-y-[-1px]"
                style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                <div className="text-sm font-bold" style={{ color: V.text }}>{p.title}</div>
                <div className="text-[10px] mt-1" style={{ color: V.textDis }}>{p.target} {p.unit} · {p.days}{isRu ? 'д' : 'd'}</div>
              </button>
            ))}
          </div>
        )}

        {/* Active */}
        {active.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: V.textTer }}>{isRu ? 'Активные' : 'Active'}</p>
            {active.map(ch => {
              const pct = Math.round((ch.current / ch.target) * 100);
              const daysLeft = Math.max(0, Math.ceil((new Date(ch.deadline).getTime() - Date.now()) / 86400000));
              return (
                <div key={ch.id} className="rounded-2xl p-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold" style={{ color: V.text }}>{ch.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${V.orange}15`, color: V.orange }}>
                      {daysLeft}{isRu ? 'д' : 'd'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: V.bg3 }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${V.accent}, ${V.success})` }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: V.text }}>{ch.current}/{ch.target}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => increment(ch.id, 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: `${V.accent}15`, color: V.accent }}>+1</button>
                    <button onClick={() => increment(ch.id, 5)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>+5</button>
                    <button onClick={() => increment(ch.id, 10)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>+10</button>
                    <button onClick={() => update(challenges.filter(c => c.id !== ch.id))} className="ml-auto px-2 py-1.5 rounded-lg text-xs text-[#3A3A4A] hover:text-[#FF4444]"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: V.textTer }}>{isRu ? 'Завершено' : 'Completed'} 🏆</p>
            {completed.map(ch => (
              <div key={ch.id} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: `${V.success}08`, border: `1px solid ${V.success}20` }}>
                <Check className="w-5 h-5" style={{ color: V.success }} />
                <span className="text-sm font-bold" style={{ color: V.success }}>{ch.title}</span>
                <span className="text-[10px] ml-auto" style={{ color: V.textDis }}>{ch.target} {ch.unit}</span>
              </div>
            ))}
          </div>
        )}

        {challenges.length === 0 && !showPresets && (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: V.textDis }} />
            <p className="font-semibold" style={{ color: V.textTer }}>{isRu ? 'Нет челленджей' : 'No challenges'}</p>
            <p className="text-sm mt-1" style={{ color: V.textDis }}>{isRu ? 'Начни цель на неделю или месяц' : 'Start a weekly or monthly goal'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesView;
