/**
 * Eclipse Valhalla — Training Plan View
 * Multi-week training program with per-day editing
 */

import React, { useState, useMemo } from 'react';
import { TrainingPlan, PlanWeek, PlanDay, Routine, WorkoutLog } from '../types';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import {
  Plus, X, ChevronLeft, ChevronRight, Copy, Trash2, Edit3,
  Calendar, Dumbbell, Coffee, CheckCircle2, Clock, Flame,
  ChevronDown, ChevronUp, Play, Save,
} from 'lucide-react';

interface TrainingPlanViewProps {
  routines: Routine[];
  logs: WorkoutLog[];
  onStartWorkout: (routine: Routine) => void;
}

const V = {
  bg0: '#0A0A0F', bg1: '#0C0C14', bg2: '#12121A', bg3: '#1A1A26', bg4: '#1F1F2B',
  text: '#E8E8F0', textSec: '#8888A0', textTer: '#55556A', textDis: '#3A3A4A',
  border: '#1E1E2E', borderL: '#2A2A3C',
  accent: '#5DAEFF', orange: '#FF6B35', gold: '#D8C18E', success: '#4ADE80', danger: '#FF4444',
};

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const INTENSITY_OPTIONS = [
  { value: 'light', en: 'Light', ru: 'Лёгкая' },
  { value: 'medium', en: 'Medium', ru: 'Средняя' },
  { value: 'heavy', en: 'Heavy', ru: 'Тяжёлая' },
  { value: 'deload', en: 'Deload', ru: 'Разгрузка' },
];

const STORAGE_KEY = 'eclipse_training_plans';

function getPlans(): TrainingPlan[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function savePlans(plans: TrainingPlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ routines, logs, onStartWorkout }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const DAYS = isRu ? DAYS_RU : DAYS_EN;

  const [plans, setPlans] = useState<TrainingPlan[]>(getPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => plans.find(p => p.isActive)?.id || plans[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newWeeks, setNewWeeks] = useState(4);
  const [newDesc, setNewDesc] = useState('');

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId) || null, [plans, selectedPlanId]);

  const updatePlans = (updated: TrainingPlan[]) => {
    setPlans(updated);
    savePlans(updated);
  };

  const createPlan = () => {
    if (!newName.trim()) return;
    const emptyWeek = (weekNum: number): PlanWeek => ({
      weekNumber: weekNum,
      days: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, label: i >= 5 ? (isRu ? 'Отдых' : 'Rest') : '' })),
      intensityLabel: 'medium',
    });

    const plan: TrainingPlan = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      totalWeeks: newWeeks,
      weeks: Array.from({ length: newWeeks }, (_, i) => emptyWeek(i + 1)),
      currentWeek: 1,
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isActive: plans.length === 0,
    };

    updatePlans([...plans, plan]);
    setSelectedPlanId(plan.id);
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
    setNewWeeks(4);
  };

  const deletePlan = (id: string) => {
    if (!confirm(isRu ? 'Удалить этот план?' : 'Delete this plan?')) return;
    const updated = plans.filter(p => p.id !== id);
    updatePlans(updated);
    if (selectedPlanId === id) setSelectedPlanId(updated[0]?.id || null);
  };

  const setActivePlan = (id: string) => {
    updatePlans(plans.map(p => ({ ...p, isActive: p.id === id })));
  };

  const updateDay = (weekIdx: number, dayIdx: number, updates: Partial<PlanDay>) => {
    if (!selectedPlan) return;
    const updated = plans.map(p => {
      if (p.id !== selectedPlan.id) return p;
      const weeks = [...p.weeks];
      weeks[weekIdx] = {
        ...weeks[weekIdx],
        days: weeks[weekIdx].days.map((d, i) => i === dayIdx ? { ...d, ...updates } : d),
      };
      return { ...p, weeks };
    });
    updatePlans(updated);
  };

  const updateWeekIntensity = (weekIdx: number, intensity: string) => {
    if (!selectedPlan) return;
    const updated = plans.map(p => {
      if (p.id !== selectedPlan.id) return p;
      const weeks = [...p.weeks];
      weeks[weekIdx] = { ...weeks[weekIdx], intensityLabel: intensity };
      return { ...p, weeks };
    });
    updatePlans(updated);
  };

  const copyWeek = (fromIdx: number) => {
    if (!selectedPlan) return;
    const updated = plans.map(p => {
      if (p.id !== selectedPlan.id) return p;
      const weeks = [...p.weeks];
      const copy: PlanWeek = {
        ...JSON.parse(JSON.stringify(weeks[fromIdx])),
        weekNumber: weeks.length + 1,
      };
      return { ...p, weeks: [...weeks, copy], totalWeeks: weeks.length + 1 };
    });
    updatePlans(updated);
  };

  const advanceWeek = (direction: 1 | -1) => {
    if (!selectedPlan) return;
    const updated = plans.map(p => {
      if (p.id !== selectedPlan.id) return p;
      const next = Math.max(1, Math.min(p.totalWeeks, p.currentWeek + direction));
      return { ...p, currentWeek: next };
    });
    updatePlans(updated);
  };

  const getRoutineById = (id?: string) => routines.find(r => r.id === id);

  // Check if a day was completed this week
  const isDayDone = (weekNum: number, dayIdx: number, routineId?: string): boolean => {
    if (!routineId || !selectedPlan?.startDate) return false;
    const planStart = new Date(selectedPlan.startDate);
    const weekStart = new Date(planStart);
    weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIdx);
    const routine = getRoutineById(routineId);
    if (!routine) return false;
    return logs.some(l => {
      const logDate = new Date(l.date);
      return logDate.toDateString() === dayDate.toDateString() && l.routineName === routine.name;
    });
  };

  // ══════════════════════ RENDER ══════════════════════

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Plan selector + Create */}
      <div className="flex items-center gap-3 flex-wrap">
        {plans.map(p => (
          <button key={p.id} onClick={() => setSelectedPlanId(p.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedPlanId === p.id ? 'text-[#0A0A0A]' : ''
            }`}
            style={selectedPlanId === p.id
              ? { background: `linear-gradient(135deg, ${V.gold}, ${V.gold}CC)`, boxShadow: `0 4px 12px ${V.gold}30` }
              : { backgroundColor: V.bg3, border: `1px solid ${V.borderL}`, color: V.textSec }
            }>
            {p.isActive && <Flame className="w-3 h-3 inline mr-1.5" />}
            {p.name}
            <span className="ml-1.5 opacity-60">{p.totalWeeks}{isRu ? 'н' : 'w'}</span>
          </button>
        ))}
        <button onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ border: `1px dashed ${V.borderL}`, color: V.textTer }}>
          <Plus className="w-3.5 h-3.5" />
          {isRu ? 'Новый план' : 'New Plan'}
        </button>
      </div>

      {/* Create modal */}
      {isCreating && (
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
          <h3 className="font-bold text-base" style={{ color: V.text }}>
            {isRu ? 'Создать тренировочный план' : 'Create Training Plan'}
          </h3>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={isRu ? 'Название плана' : 'Plan name'}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder={isRu ? 'Описание (опционально)' : 'Description (optional)'}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: V.textTer }}>
              {isRu ? 'Количество недель' : 'Number of weeks'}
            </label>
            <div className="flex gap-2">
              {[2, 4, 6, 8, 12].map(w => (
                <button key={w} onClick={() => setNewWeeks(w)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={newWeeks === w
                    ? { backgroundColor: V.accent, color: V.bg0 }
                    : { backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.textTer }
                  }>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold" style={{ color: V.textTer }}>
              {isRu ? 'Отмена' : 'Cancel'}
            </button>
            <button onClick={createPlan} disabled={!newName.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-30"
              style={{ backgroundColor: V.accent, color: V.bg0 }}>
              {isRu ? 'Создать' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Selected plan */}
      {selectedPlan && (
        <>
          {/* Plan header */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
            <div className="absolute top-0 right-0 w-60 h-60 -mr-20 -mt-10 rounded-full blur-3xl pointer-events-none"
              style={{ background: `radial-gradient(circle, ${V.gold}10, transparent 70%)` }} />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold" style={{ color: V.text }}>{selectedPlan.name}</h3>
                {selectedPlan.description && (
                  <p className="text-xs mt-1" style={{ color: V.textTer }}>{selectedPlan.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                    style={{ backgroundColor: `${V.gold}15`, color: V.gold }}>
                    {isRu ? 'Неделя' : 'Week'} {selectedPlan.currentWeek} / {selectedPlan.totalWeeks}
                  </span>
                  {!selectedPlan.isActive && (
                    <button onClick={() => setActivePlan(selectedPlan.id)}
                      className="text-[10px] font-bold text-[#5DAEFF] hover:underline">
                      {isRu ? 'Сделать активным' : 'Set Active'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => advanceWeek(-1)} disabled={selectedPlan.currentWeek <= 1}
                  className="p-2 rounded-lg disabled:opacity-20 transition-all" style={{ color: V.textSec }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => advanceWeek(1)} disabled={selectedPlan.currentWeek >= selectedPlan.totalWeeks}
                  className="p-2 rounded-lg disabled:opacity-20 transition-all" style={{ color: V.textSec }}>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => deletePlan(selectedPlan.id)}
                  className="p-2 rounded-lg transition-colors" style={{ color: V.textDis }}
                  onMouseEnter={e => { e.currentTarget.style.color = V.danger; }}
                  onMouseLeave={e => { e.currentTarget.style.color = V.textDis; }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weeks */}
          <div className="space-y-4">
            {selectedPlan.weeks.map((week, wIdx) => {
              const isCurrent = week.weekNumber === selectedPlan.currentWeek;
              const isEditing = editingWeek === wIdx;
              const intensity = INTENSITY_OPTIONS.find(i => i.value === week.intensityLabel);
              const completedDays = week.days.filter(d => d.routineId && isDayDone(week.weekNumber, d.dayIndex, d.routineId)).length;
              const totalTrainingDays = week.days.filter(d => d.routineId).length;

              return (
                <div key={wIdx}
                  className={`rounded-2xl overflow-hidden transition-all ${isCurrent ? 'ring-2' : ''}`}
                  style={{
                    backgroundColor: V.bg2,
                    border: `1px solid ${isCurrent ? V.gold + '50' : V.border}`,
                    boxShadow: isCurrent ? `0 0 0 2px ${V.gold}30` : 'none',
                  }}>

                  {/* Week header */}
                  <button onClick={() => setEditingWeek(isEditing ? null : wIdx)}
                    className="w-full px-5 py-3 flex items-center justify-between"
                    style={{ backgroundColor: isCurrent ? `${V.gold}08` : 'transparent' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold" style={{ color: isCurrent ? V.gold : V.text }}>
                        {isRu ? 'Неделя' : 'Week'} {week.weekNumber}
                      </span>
                      {intensity && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: week.intensityLabel === 'heavy' ? `${V.danger}15` :
                              week.intensityLabel === 'deload' ? `${V.success}15` :
                              week.intensityLabel === 'light' ? `${V.accent}15` : `${V.orange}15`,
                            color: week.intensityLabel === 'heavy' ? V.danger :
                              week.intensityLabel === 'deload' ? V.success :
                              week.intensityLabel === 'light' ? V.accent : V.orange,
                          }}>
                          {isRu ? intensity.ru : intensity.en}
                        </span>
                      )}
                      {totalTrainingDays > 0 && (
                        <span className="text-[10px] font-mono" style={{ color: V.textDis }}>
                          {completedDays}/{totalTrainingDays}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); copyWeek(wIdx); }}
                        className="p-1.5 rounded-lg" style={{ color: V.textDis }} title={isRu ? 'Копировать' : 'Copy'}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {isEditing ? <ChevronUp className="w-4 h-4" style={{ color: V.textTer }} /> : <ChevronDown className="w-4 h-4" style={{ color: V.textTer }} />}
                    </div>
                  </button>

                  {/* Week days (expanded) */}
                  {isEditing && (
                    <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Intensity selector */}
                      <div className="flex gap-1.5">
                        {INTENSITY_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => updateWeekIntensity(wIdx, opt.value)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              week.intensityLabel === opt.value ? 'text-[#0A0A0A]' : ''
                            }`}
                            style={week.intensityLabel === opt.value
                              ? { backgroundColor: opt.value === 'heavy' ? V.danger : opt.value === 'deload' ? V.success : opt.value === 'light' ? V.accent : V.orange }
                              : { backgroundColor: V.bg3, color: V.textDis }
                            }>
                            {isRu ? opt.ru : opt.en}
                          </button>
                        ))}
                      </div>

                      {/* Day cards */}
                      <div className="grid grid-cols-7 gap-2">
                        {week.days.map((day, dIdx) => {
                          const routine = getRoutineById(day.routineId);
                          const done = day.routineId ? isDayDone(week.weekNumber, dIdx, day.routineId) : false;
                          const isRest = !day.routineId;

                          return (
                            <div key={dIdx} className="rounded-xl p-2.5 text-center transition-all"
                              style={{
                                backgroundColor: done ? `${V.success}10` : isRest ? V.bg3 : `${V.orange}08`,
                                border: `1px solid ${done ? V.success + '30' : isRest ? V.border : V.orange + '20'}`,
                              }}>
                              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: V.textTer }}>
                                {DAYS[dIdx]}
                              </p>

                              {/* Routine selector */}
                              <select
                                value={day.routineId || ''}
                                onChange={e => updateDay(wIdx, dIdx, {
                                  routineId: e.target.value || undefined,
                                  label: e.target.value ? routines.find(r => r.id === e.target.value)?.name : isRu ? 'Отдых' : 'Rest',
                                })}
                                className="w-full text-[9px] py-1.5 rounded-lg outline-none text-center truncate"
                                style={{ backgroundColor: V.bg0, border: `1px solid ${V.border}`, color: V.textSec }}>
                                <option value="">{isRu ? 'Отдых' : 'Rest'}</option>
                                {routines.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>

                              {/* Status */}
                              <div className="mt-2">
                                {done ? (
                                  <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: V.success }} />
                                ) : routine && isCurrent ? (
                                  <button onClick={() => onStartWorkout(routine)}
                                    className="p-1 rounded-lg mx-auto block" style={{ color: V.orange }}>
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                ) : isRest ? (
                                  <Coffee className="w-3.5 h-3.5 mx-auto" style={{ color: V.textDis }} />
                                ) : (
                                  <Dumbbell className="w-3.5 h-3.5 mx-auto" style={{ color: V.textDis }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compact day preview (collapsed) */}
                  {!isEditing && (
                    <div className="px-5 pb-3 flex gap-1.5">
                      {week.days.map((day, dIdx) => {
                        const done = day.routineId ? isDayDone(week.weekNumber, dIdx, day.routineId) : false;
                        return (
                          <div key={dIdx}
                            className="flex-1 h-2 rounded-full"
                            style={{
                              backgroundColor: done ? V.success : day.routineId ? `${V.orange}30` : V.bg3,
                            }}
                            title={`${DAYS[dIdx]}: ${day.label || (day.routineId ? getRoutineById(day.routineId)?.name : (isRu ? 'Отдых' : 'Rest'))}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {plans.length === 0 && !isCreating && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: V.textDis }} />
          <p className="font-semibold" style={{ color: V.textTer }}>
            {isRu ? 'Нет тренировочных планов' : 'No training plans'}
          </p>
          <p className="text-sm mt-1" style={{ color: V.textDis }}>
            {isRu ? 'Создай план на несколько недель с прогрессией нагрузки' : 'Create a multi-week plan with load progression'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingPlanView;
