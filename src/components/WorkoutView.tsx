
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routine, WorkoutLog, ExerciseTemplate, WorkoutExerciseResult, WorkoutSetResult } from '../types';
import { useLanguage } from '../i18n';
import { generateId, formatDate, playNotificationSound } from '../utils';
import {
  Plus, Dumbbell, Play, Clock, CheckCircle2, X, Save, History,
  ChevronRight, RotateCcw, Trash2, Compass, Copy, BarChart3,
  Pause, Timer, TrendingUp, Award, Flame, ChevronDown, ChevronUp,
  Edit3, Target, Zap, Activity
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/* ────────────────────────────────────────────────────────────
   Eclipse Valhalla Design Tokens
   ──────────────────────────────────────────────────────────── */
const V = {
  bg0: '#0A0A0F',
  bg1: '#0C0C14',
  bg2: '#12121A',
  bg3: '#1A1A26',
  bg4: '#1F1F2B',
  text: '#E8E8F0',
  textSecondary: '#8888A0',
  textTertiary: '#55556A',
  textDisabled: '#3A3A4A',
  border: '#1E1E2E',
  borderLight: '#2A2A3C',
  accent: '#5DAEFF',
  success: '#4ADE80',
  danger: '#FF4444',
  orange: '#FF6B35',
  yellow: '#FBBF24',
} as const;

/* ────────────────────────────────────────────────────────────
   Props
   ──────────────────────────────────────────────────────────── */
interface WorkoutViewProps {
  routines: Routine[];
  logs: WorkoutLog[];
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  setLogs: React.Dispatch<React.SetStateAction<WorkoutLog[]>>;
}

/* ────────────────────────────────────────────────────────────
   Recommended Workouts Data
   ──────────────────────────────────────────────────────────── */
const RECOMMENDED_WORKOUTS = [
  {
    nameKey: 'workout.rec_fullbody',
    descKey: 'workout.rec_fullbody_desc',
    icon: Flame,
    gradient: 'from-[#FF6B35] to-[#FF4444]',
    exercises: [
      { nameKey: 'workout.ex_squats', sets: 3, reps: '15' },
      { nameKey: 'workout.ex_pushups', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_lunges', sets: 3, reps: '10/leg' },
      { nameKey: 'workout.ex_plank', sets: 3, reps: '45s' },
      { nameKey: 'workout.ex_jacks', sets: 3, reps: '50' },
    ],
  },
  {
    nameKey: 'workout.rec_morning',
    descKey: 'workout.rec_morning_desc',
    icon: Zap,
    gradient: 'from-[#FBBF24] to-[#FF6B35]',
    exercises: [
      { nameKey: 'workout.ex_neck', sets: 2, reps: '30s' },
      { nameKey: 'workout.ex_catcow', sets: 2, reps: '10' },
      { nameKey: 'workout.ex_childpose', sets: 2, reps: '45s' },
      { nameKey: 'workout.ex_shoulder', sets: 2, reps: '20' },
    ],
  },
  {
    nameKey: 'workout.rec_upper',
    descKey: 'workout.rec_upper_desc',
    icon: Dumbbell,
    gradient: 'from-[#5DAEFF] to-[#4ADE80]',
    exercises: [
      { nameKey: 'workout.ex_press', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_curls', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_rows', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_tricep', sets: 3, reps: '15' },
      { nameKey: 'workout.ex_lateral', sets: 3, reps: '15' },
    ],
  },
  {
    nameKey: 'workout.rec_hiit',
    descKey: 'workout.rec_hiit_desc',
    icon: Activity,
    gradient: 'from-[#FF4444] to-[#FBBF24]',
    exercises: [
      { nameKey: 'workout.ex_highknees', sets: 4, reps: '30s' },
      { nameKey: 'workout.ex_climbers', sets: 4, reps: '30s' },
      { nameKey: 'workout.ex_burpees', sets: 4, reps: '10' },
      { nameKey: 'workout.ex_jumpsquats', sets: 4, reps: '15' },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   Utility
   ──────────────────────────────────────────────────────────── */
const formatDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDurationLong = (sec: number, ru: boolean): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (ru) return `${m} ${m === 1 ? 'min' : 'min'} ${s}s`;
  return `${m}m ${s}s`;
};

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
const WorkoutView: React.FC<WorkoutViewProps> = ({ routines, logs, setRoutines, setLogs }) => {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  // Tab state
  const [activeTab, setActiveTab] = useState<'routines' | 'active' | 'history' | 'explore' | 'stats'>('routines');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Routine creation
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newExercises, setNewExercises] = useState<ExerciseTemplate[]>([]);

  // Active workout
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState<WorkoutExerciseResult[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  // Rest timer
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restPreset] = useState(90); // seconds

  // History expanded
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  /* ── Effects ──────────────────────────────────────────────── */

  // Session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeRoutine && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, sessionStartTime]);

  // Rest timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting) {
      interval = setInterval(() => {
        setRestTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRestTimer(0);
    }
    return () => clearInterval(interval);
  }, [isResting]);

  /* ── Handlers ─────────────────────────────────────────────── */

  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) return;
    const routine: Routine = {
      id: generateId(),
      name: newRoutineName.trim(),
      exercises: newExercises.filter(e => e.name.trim()),
    };
    setRoutines(prev => [...prev, routine]);
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewExercises([]);
  };

  const handleAddExerciseToRoutine = () => {
    setNewExercises(prev => [
      ...prev,
      { id: generateId(), name: '', targetSets: 3, targetReps: '10' },
    ]);
  };

  const updateExerciseInRoutine = (index: number, field: keyof ExerciseTemplate, value: any) => {
    const updated = [...newExercises];
    updated[index] = { ...updated[index], [field]: value };
    setNewExercises(updated);
  };

  const removeExerciseFromRoutine = (index: number) => {
    setNewExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleImportRoutine = (rec: typeof RECOMMENDED_WORKOUTS[0]) => {
    const routine: Routine = {
      id: generateId(),
      name: t(rec.nameKey),
      exercises: rec.exercises.map(ex => ({
        id: generateId(),
        name: t(ex.nameKey),
        targetSets: ex.sets,
        targetReps: ex.reps,
      })),
    };
    setRoutines(prev => [...prev, routine]);
    setActiveTab('routines');
  };

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setSessionStartTime(Date.now());
    setActiveTab('active');
    setExpandedExercise(0);
    const initialData: WorkoutExerciseResult[] = routine.exercises.map(ex => ({
      exerciseName: ex.name,
      sets: Array(ex.targetSets).fill(null).map(() => ({ weight: 0, reps: 0, completed: false })),
    }));
    setSessionData(initialData);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newData = [...sessionData];
    const isCompleting = !newData[exerciseIndex].sets[setIndex].completed;
    newData[exerciseIndex].sets[setIndex].completed = isCompleting;
    setSessionData(newData);
    if (isCompleting) {
      setIsResting(true);
      playNotificationSound();
    }
  };

  const updateSetData = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const newData = [...sessionData];
    newData[exerciseIndex].sets[setIndex] = {
      ...newData[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setSessionData(newData);
  };

  const addSet = (exerciseIndex: number) => {
    const newData = [...sessionData];
    newData[exerciseIndex].sets.push({ weight: 0, reps: 0, completed: false });
    setSessionData(newData);
  };

  const finishWorkout = () => {
    if (!activeRoutine || !sessionStartTime) return;
    const log: WorkoutLog = {
      id: generateId(),
      routineName: activeRoutine.name,
      date: new Date().toISOString(),
      durationSeconds: sessionDuration,
      exercises: sessionData,
    };
    setLogs(prev => [log, ...prev]);
    setActiveRoutine(null);
    setSessionStartTime(null);
    setSessionDuration(0);
    setActiveTab('history');
    setIsResting(false);
  };

  const cancelWorkout = () => {
    if (confirm(isRu ? 'Вы уверены? Прогресс будет потерян.' : 'Are you sure? Current progress will be lost.')) {
      setActiveRoutine(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      setActiveTab('routines');
      setIsResting(false);
    }
  };

  const deleteRoutine = (id: string) => {
    if (confirm(isRu ? 'Удалить эту программу?' : 'Delete this routine?')) {
      setRoutines(prev => prev.filter(r => r.id !== id));
    }
  };

  /* ── Analytics ─────────────────────────────────────────────── */

  const chartData = useMemo(() =>
    logs.slice().reverse().map(log => {
      const totalVolume = log.exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
      return { date: new Date(log.date).toLocaleDateString(), volume: totalVolume };
    }), [logs]);

  const totalVolume = useMemo(() => chartData.reduce((a, b) => a + b.volume, 0), [chartData]);

  const totalSets = useMemo(() =>
    logs.reduce((acc, log) =>
      acc + log.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0), 0
    ), [logs]);

  const avgDuration = useMemo(() => {
    if (logs.length === 0) return 0;
    return Math.round(logs.reduce((a, l) => a + l.durationSeconds, 0) / logs.length);
  }, [logs]);

  // Progress in active session
  const sessionProgress = useMemo(() => {
    if (sessionData.length === 0) return 0;
    const total = sessionData.reduce((a, ex) => a + ex.sets.length, 0);
    const done = sessionData.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [sessionData]);

  /* ── Tab bar items ─────────────────────────────────────────── */

  const tabs = [
    { id: 'routines' as const, label: t('workout.tab_routines'), icon: Dumbbell },
    { id: 'explore' as const, label: t('workout.tab_explore'), icon: Compass },
    { id: 'stats' as const, label: t('workout.tab_stats'), icon: BarChart3 },
    { id: 'history' as const, label: t('workout.tab_history'), icon: History },
  ];

  /* ── Custom Tooltip for Recharts ──────────────────────────── */

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border px-3 py-2 shadow-xl"
        style={{ backgroundColor: V.bg2, borderColor: V.borderLight }}>
        <p className="text-xs font-medium" style={{ color: V.textSecondary }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: V.accent }}>
          {payload[0].value.toLocaleString()} {isRu ? 'кг' : 'lbs'}
        </p>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col w-full overflow-y-auto" style={{ backgroundColor: V.bg0 }}>
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 pt-6 pb-28 md:pb-8 flex flex-col flex-1">

        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${V.accent}20, ${V.accent}08)`, border: `1px solid ${V.accent}30` }}>
              <Dumbbell className="w-6 h-6" style={{ color: V.accent }} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: V.text }}>
                {t('workout.title')}
              </h2>
              <p className="text-sm" style={{ color: V.textTertiary }}>{t('workout.subtitle')}</p>
            </div>
          </div>

          {activeRoutine ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-lg font-bold"
                style={{ backgroundColor: `${V.accent}12`, color: V.accent, border: `1px solid ${V.accent}30` }}>
                <Timer className="w-5 h-5" />
                {formatDuration(sessionDuration)}
              </div>
            </div>
          ) : (
            <div className="flex rounded-xl p-1 gap-0.5 overflow-x-auto max-w-full" style={{ backgroundColor: V.bg2 }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap"
                    style={{
                      backgroundColor: isActive ? V.bg3 : 'transparent',
                      color: isActive ? V.text : V.textTertiary,
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Active Workout ─────────────────────────────────── */}
        {activeTab === 'active' && activeRoutine ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Top bar */}
            <div className="rounded-2xl p-5 mb-6 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${V.accent}, ${V.accent}CC)` }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
              <div className="relative flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(10,10,15,0.5)' }}>
                    {isRu ? 'Активная тренировка' : 'Active Workout'}
                  </p>
                  <h3 className="font-bold text-xl mt-0.5" style={{ color: V.bg0 }}>{activeRoutine.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(10,10,15,0.15)', color: V.bg0 }}>
                      {sessionProgress}% {isRu ? 'завершено' : 'complete'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={finishWorkout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: V.bg0, color: V.accent }}>
                    <Save className="w-4 h-4" />
                    {t('workout.finish')}
                  </button>
                  <button onClick={cancelWorkout}
                    className="px-3 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'rgba(10,10,15,0.2)', color: V.bg0 }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${sessionProgress}%`, backgroundColor: V.bg0 }} />
              </div>
            </div>

            {/* Rest timer */}
            {isResting && (
              <div className="mb-6 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95"
                style={{ backgroundColor: `${V.yellow}08`, border: `1px solid ${V.yellow}20` }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${V.yellow}15` }}>
                    <Clock className="w-7 h-7" style={{ color: V.yellow }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: V.yellow }}>
                      {t('workout.rest_timer')}
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-tight" style={{ color: V.yellow }}>
                      {formatDuration(restTimer)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsResting(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${V.yellow}15`, color: V.yellow }}>
                  {isRu ? 'Пропустить' : 'Skip Rest'}
                </button>
              </div>
            )}

            {/* Exercises */}
            <div className="space-y-4">
              {sessionData.map((exercise, exIdx) => {
                const completedSets = exercise.sets.filter(s => s.completed).length;
                const totalSetsEx = exercise.sets.length;
                const isExpanded = expandedExercise === exIdx;
                const allDone = completedSets === totalSetsEx;

                return (
                  <div key={exIdx} className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      backgroundColor: V.bg3,
                      border: `1px solid ${allDone ? V.success + '30' : V.borderLight}`,
                    }}>
                    {/* Exercise header */}
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                      className="w-full px-5 py-4 flex items-center gap-3 transition-colors"
                      style={{ backgroundColor: V.bg2 }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                        style={{
                          backgroundColor: allDone ? `${V.success}15` : `${V.accent}10`,
                          color: allDone ? V.success : V.accent,
                        }}>
                        {allDone ? <CheckCircle2 className="w-5 h-5" /> : exIdx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-base" style={{ color: V.text }}>{exercise.exerciseName}</h4>
                        <p className="text-xs mt-0.5" style={{ color: V.textTertiary }}>
                          {completedSets}/{totalSetsEx} {isRu ? 'подходов' : 'sets'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Mini progress */}
                        <div className="flex gap-1">
                          {exercise.sets.map((s, i) => (
                            <div key={i} className="w-2 h-2 rounded-full transition-colors"
                              style={{ backgroundColor: s.completed ? V.success : V.bg4 }} />
                          ))}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" style={{ color: V.textTertiary }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: V.textTertiary }} />
                        )}
                      </div>
                    </button>

                    {/* Sets */}
                    {isExpanded && (
                      <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Column headers */}
                        <div className="flex items-center gap-2 px-2 pb-1"
                          style={{ borderBottom: `1px solid ${V.border}` }}>
                          <div className="w-8 text-center text-[10px] font-bold uppercase"
                            style={{ color: V.textTertiary }}>
                            {isRu ? '#' : 'Set'}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div className="text-[10px] font-bold uppercase text-center"
                              style={{ color: V.textTertiary }}>
                              {isRu ? 'Вес' : 'Weight'}
                            </div>
                            <div className="text-[10px] font-bold uppercase text-center"
                              style={{ color: V.textTertiary }}>
                              {isRu ? 'Повторы' : 'Reps'}
                            </div>
                          </div>
                          <div className="w-11" />
                        </div>

                        {exercise.sets.map((set, setIdx) => (
                          <div key={setIdx}
                            className="flex items-center gap-2 px-2 py-2 rounded-xl transition-all"
                            style={{
                              backgroundColor: set.completed ? `${V.success}06` : 'transparent',
                            }}>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: set.completed ? `${V.success}15` : V.bg2,
                                color: set.completed ? V.success : V.textTertiary,
                              }}>
                              {setIdx + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={set.weight || ''}
                                  className="w-full rounded-lg px-3 py-2 text-center font-mono font-semibold text-sm outline-none transition-all"
                                  style={{
                                    backgroundColor: V.bg2,
                                    border: `1px solid ${V.borderLight}`,
                                    color: V.text,
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = V.accent;
                                    e.target.style.boxShadow = `0 0 0 3px ${V.accent}20`;
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = V.borderLight;
                                    e.target.style.boxShadow = 'none';
                                  }}
                                  onChange={(e) => updateSetData(exIdx, setIdx, 'weight', Number(e.target.value))}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium pointer-events-none"
                                  style={{ color: V.textDisabled }}>
                                  {isRu ? 'кг' : t('workout.lbs')}
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={set.reps || ''}
                                  className="w-full rounded-lg px-3 py-2 text-center font-mono font-semibold text-sm outline-none transition-all"
                                  style={{
                                    backgroundColor: V.bg2,
                                    border: `1px solid ${V.borderLight}`,
                                    color: V.text,
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = V.accent;
                                    e.target.style.boxShadow = `0 0 0 3px ${V.accent}20`;
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = V.borderLight;
                                    e.target.style.boxShadow = 'none';
                                  }}
                                  onChange={(e) => updateSetData(exIdx, setIdx, 'reps', Number(e.target.value))}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium pointer-events-none"
                                  style={{ color: V.textDisabled }}>
                                  {t('workout.reps')}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleSetComplete(exIdx, setIdx)}
                              className="w-11 h-11 flex items-center justify-center rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95"
                              style={{
                                backgroundColor: set.completed ? V.success : V.bg2,
                                color: set.completed ? V.bg0 : V.textTertiary,
                                boxShadow: set.completed ? `0 4px 12px ${V.success}30` : 'none',
                              }}>
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}

                        <button onClick={() => addSet(exIdx)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                          style={{
                            border: `1px dashed ${V.borderLight}`,
                            color: V.textTertiary,
                            backgroundColor: 'transparent',
                          }}>
                          + {t('workout.add_set')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        /* ─── Routines Tab ──────────────────────────────────── */
        ) : activeTab === 'routines' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Create button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group hover:scale-[1.005] active:scale-[0.995]"
              style={{
                border: `2px dashed ${V.borderLight}`,
                color: V.textTertiary,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = V.accent;
                e.currentTarget.style.color = V.accent;
                e.currentTarget.style.backgroundColor = `${V.accent}06`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = V.borderLight;
                e.currentTarget.style.color = V.textTertiary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: V.bg2 }}>
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm">{t('workout.create_routine')}</span>
            </button>

            {/* Empty state */}
            {routines.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ backgroundColor: V.bg2 }}>
                  <Dumbbell className="w-10 h-10" style={{ color: V.textDisabled }} />
                </div>
                <div>
                  <p className="font-semibold text-base" style={{ color: V.textTertiary }}>
                    {isRu ? 'Нет программ тренировок' : 'No routines yet'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: V.textDisabled }}>
                    {isRu
                      ? 'Создайте свою первую программу или выберите из рекомендуемых'
                      : 'Create your first routine or browse recommended workouts'}
                  </p>
                </div>
              </div>
            )}

            {/* Routine cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routines.map(routine => {
                const lastLog = logs.find(l => l.routineName === routine.name);
                return (
                  <div key={routine.id} className="rounded-2xl overflow-hidden transition-all hover:translate-y-[-1px]"
                    style={{ backgroundColor: V.bg3, border: `1px solid ${V.borderLight}` }}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg" style={{ color: V.text }}>{routine.name}</h3>
                          <p className="text-sm mt-0.5" style={{ color: V.textTertiary }}>
                            {routine.exercises.length} {isRu ? 'упражнений' : 'exercises'}
                          </p>
                        </div>
                        <button onClick={() => deleteRoutine(routine.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: V.textDisabled }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = V.danger; e.currentTarget.style.backgroundColor = `${V.danger}10`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = V.textDisabled; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Exercise preview list */}
                      <div className="space-y-1.5 mb-5">
                        {routine.exercises.slice(0, 4).map((ex, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2" style={{ color: V.textSecondary }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: V.accent + '60' }} />
                              {ex.name}
                            </span>
                            <span className="font-mono" style={{ color: V.textDisabled }}>
                              {ex.targetSets} x {ex.targetReps}
                            </span>
                          </div>
                        ))}
                        {routine.exercises.length > 4 && (
                          <p className="text-xs italic pl-4" style={{ color: V.textDisabled }}>
                            + {routine.exercises.length - 4} {isRu ? 'ещё' : 'more'}
                          </p>
                        )}
                      </div>

                      {/* Last performed */}
                      {lastLog && (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium mb-4 px-2 py-1 rounded-lg"
                          style={{ backgroundColor: V.bg2, color: V.textDisabled }}>
                          <Clock className="w-3 h-3" />
                          {isRu ? 'Последняя:' : 'Last:'} {formatDate(lastLog.date)}
                        </div>
                      )}
                    </div>

                    {/* Start button */}
                    <button onClick={() => startWorkout(routine)}
                      className="w-full py-3.5 font-bold flex items-center justify-center gap-2 text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{
                        backgroundColor: V.accent,
                        color: V.bg0,
                        boxShadow: `0 4px 16px ${V.accent}25`,
                      }}>
                      <Play className="w-4 h-4" />
                      {t('workout.start')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        /* ─── Stats Tab ─────────────────────────────────────── */
        ) : activeTab === 'stats' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: isRu ? 'Тренировок' : 'Workouts',
                  value: logs.length.toString(),
                  icon: Dumbbell,
                  color: V.accent,
                },
                {
                  label: isRu ? 'Общий объём' : 'Total Volume',
                  value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toString(),
                  suffix: isRu ? 'кг' : 'lbs',
                  icon: TrendingUp,
                  color: V.success,
                },
                {
                  label: isRu ? 'Подходов' : 'Total Sets',
                  value: totalSets.toString(),
                  icon: Target,
                  color: V.orange,
                },
                {
                  label: isRu ? 'Сред. время' : 'Avg Duration',
                  value: formatDuration(avgDuration),
                  icon: Clock,
                  color: V.yellow,
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="rounded-2xl p-4 md:p-5"
                    style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}12` }}>
                        <Icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: V.text }}>
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-xs font-medium ml-1" style={{ color: V.textTertiary }}>{stat.suffix}</span>
                      )}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-1"
                      style={{ color: V.textTertiary }}>
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Volume chart */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}` }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base" style={{ color: V.text }}>
                    {isRu ? 'Объём по тренировкам' : 'Volume Over Time'}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: V.textTertiary }}>
                    {isRu ? 'Последние сессии' : 'Recent sessions'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>
                  <Activity className="w-3.5 h-3.5" />
                  {isRu ? 'кг' : 'lbs'}
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={V.accent} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={V.accent} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={V.border} vertical={false} />
                      <XAxis dataKey="date" stroke={V.textDisabled} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={V.textDisabled} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="volume" stroke={V.accent} strokeWidth={2.5}
                        fill="url(#volumeGradient)" dot={{ r: 4, fill: V.accent, strokeWidth: 2, stroke: V.bg2 }}
                        activeDot={{ r: 6, stroke: V.accent, strokeWidth: 2, fill: V.bg0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center flex-col gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: V.bg2 }}>
                    <BarChart3 className="w-8 h-8" style={{ color: V.textDisabled }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: V.textTertiary }}>
                    {isRu ? 'Завершите тренировки, чтобы увидеть статистику' : 'Complete workouts to see your stats'}
                  </p>
                </div>
              )}
            </div>
          </div>

        /* ─── Explore Tab ───────────────────────────────────── */
        ) : activeTab === 'explore' ? (
          <div className="animate-in fade-in duration-300 space-y-6">
            {/* Hero */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderLight}` }}>
              <div className="absolute top-0 right-0 w-60 h-60 rounded-full -mr-20 -mt-20 blur-3xl"
                style={{ backgroundColor: V.accent, opacity: 0.08 }} />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full -ml-10 -mb-10 blur-3xl"
                style={{ backgroundColor: V.success, opacity: 0.05 }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-5 h-5" style={{ color: V.accent }} />
                  <h3 className="text-xl font-bold" style={{ color: V.text }}>
                    {t('workout.explore_title')}
                  </h3>
                </div>
                <p className="text-sm" style={{ color: V.textSecondary }}>{t('workout.explore_subtitle')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECOMMENDED_WORKOUTS.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:translate-y-[-1px]"
                    style={{ backgroundColor: V.bg3, border: `1px solid ${V.borderLight}` }}>
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${rec.gradient}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-base" style={{ color: V.text }}>{t(rec.nameKey)}</h4>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: V.textTertiary }}>
                            {t(rec.descKey)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rec.exercises.slice(0, 3).map((ex, k) => (
                          <div key={k} className="flex justify-between text-xs py-1.5"
                            style={{ borderBottom: `1px solid ${V.border}` }}>
                            <span style={{ color: V.textSecondary }}>{t(ex.nameKey)}</span>
                            <span className="font-mono" style={{ color: V.textDisabled }}>
                              {ex.sets} x {ex.reps}
                            </span>
                          </div>
                        ))}
                        {rec.exercises.length > 3 && (
                          <p className="text-[10px] italic" style={{ color: V.textDisabled }}>
                            + {rec.exercises.length - 3} {isRu ? 'ещё' : 'more'}...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <button onClick={() => handleImportRoutine(rec)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          backgroundColor: `${V.accent}10`,
                          color: V.accent,
                          border: `1px solid ${V.accent}20`,
                        }}>
                        <Copy className="w-4 h-4" />
                        {t('workout.import')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        /* ─── History Tab ───────────────────────────────────── */
        ) : (
          <div className="space-y-3 animate-in fade-in duration-300">
            {logs.length === 0 && (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ backgroundColor: V.bg2 }}>
                  <History className="w-10 h-10" style={{ color: V.textDisabled }} />
                </div>
                <div>
                  <p className="font-semibold text-base" style={{ color: V.textTertiary }}>
                    {isRu ? 'Нет записей' : 'No workouts logged'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: V.textDisabled }}>
                    {isRu ? 'Завершите тренировку, чтобы она появилась здесь' : 'Complete a workout to see it here'}
                  </p>
                </div>
              </div>
            )}

            {logs.map(log => {
              const isExpanded = expandedLog === log.id;
              const logVolume = log.exercises.reduce((acc, ex) =>
                acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
              const logSets = log.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0);

              return (
                <div key={log.id} className="rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}` }}>
                  <button
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="w-full p-4 flex items-center gap-4 transition-colors text-left"
                    style={{ backgroundColor: isExpanded ? V.bg2 : 'transparent' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${V.success}10` }}>
                      <CheckCircle2 className="w-6 h-6" style={{ color: V.success }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate" style={{ color: V.text }}>{log.routineName}</h4>
                      <p className="text-xs mt-0.5" style={{ color: V.textTertiary }}>
                        {formatDate(log.date)} &middot; {formatDuration(log.durationSeconds)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-lg font-bold" style={{ color: V.text }}>{log.exercises.length}</span>
                          <p className="text-[10px] font-bold uppercase" style={{ color: V.textDisabled }}>
                            {isRu ? 'упр.' : 'ex.'}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" style={{ color: V.textTertiary }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: V.textTertiary }} />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Summary chips */}
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>
                          {logSets} {isRu ? 'подходов' : 'sets'}
                        </span>
                        {logVolume > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: `${V.success}10`, color: V.success }}>
                            {logVolume.toLocaleString()} {isRu ? 'кг' : 'lbs'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {log.exercises.map((ex, i) => (
                          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: V.bg2 }}>
                            <p className="text-xs font-bold mb-1.5" style={{ color: V.text }}>
                              {ex.exerciseName}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.sets.map((s, si) => (
                                <span key={si} className="text-[10px] font-mono px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: s.completed ? `${V.success}10` : `${V.danger}10`,
                                    color: s.completed ? V.success : V.danger,
                                  }}>
                                  {s.weight}{isRu ? 'кг' : 'lb'} x {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Create Routine Modal ─────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            style={{ backgroundColor: V.bg3, border: `1px solid ${V.borderLight}` }}>

            {/* Modal header */}
            <div className="px-6 py-4 flex justify-between items-center"
              style={{ borderBottom: `1px solid ${V.border}` }}>
              <h3 className="font-bold text-lg" style={{ color: V.text }}>
                {t('workout.modal_new_routine')}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: V.textTertiary }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = V.bg4; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1">
              {/* Routine name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: V.textTertiary }}>
                  {t('workout.modal_routine_name')}
                </label>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder={isRu ? 'например, День ног' : 'e.g. Leg Day'}
                  className="w-full px-4 py-3 rounded-xl font-bold text-base outline-none transition-all"
                  style={{
                    backgroundColor: V.bg2,
                    border: `1px solid ${V.borderLight}`,
                    color: V.text,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = V.accent; e.target.style.boxShadow = `0 0 0 3px ${V.accent}15`; }}
                  onBlur={(e) => { e.target.style.borderColor = V.borderLight; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Exercises */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Упражнения' : 'Exercises'}
                </label>
                <div className="space-y-2">
                  {newExercises.map((ex, i) => (
                    <div key={ex.id} className="flex gap-2 items-center p-3 rounded-xl"
                      style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                      <div className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg shrink-0"
                        style={{ backgroundColor: V.bg3, color: V.textTertiary }}>
                        {i + 1}
                      </div>
                      <input
                        className="flex-1 bg-transparent outline-none font-medium text-sm min-w-0"
                        style={{ color: V.text }}
                        placeholder={isRu ? 'Название упражнения' : 'Exercise name'}
                        value={ex.name}
                        onChange={(e) => updateExerciseInRoutine(i, 'name', e.target.value)}
                      />
                      <input
                        className="w-12 rounded-lg px-2 py-1 text-center text-sm font-mono outline-none"
                        style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }}
                        value={ex.targetSets}
                        onChange={(e) => updateExerciseInRoutine(i, 'targetSets', Number(e.target.value))}
                      />
                      <span className="text-[10px] shrink-0" style={{ color: V.textDisabled }}>
                        {isRu ? 'п.' : 'sets'}
                      </span>
                      <input
                        className="w-14 rounded-lg px-2 py-1 text-center text-sm font-mono outline-none"
                        style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }}
                        value={ex.targetReps}
                        onChange={(e) => updateExerciseInRoutine(i, 'targetReps', e.target.value)}
                      />
                      <span className="text-[10px] shrink-0" style={{ color: V.textDisabled }}>
                        {isRu ? 'п.' : 'reps'}
                      </span>
                      <button onClick={() => removeExerciseFromRoutine(i)}
                        className="p-1 rounded transition-colors shrink-0"
                        style={{ color: V.textDisabled }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = V.danger; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = V.textDisabled; }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button onClick={handleAddExerciseToRoutine}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      border: `1px dashed ${V.borderLight}`,
                      color: V.textTertiary,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = V.bg4; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    + {t('workout.modal_add_exercise')}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 flex justify-end gap-3"
              style={{ borderTop: `1px solid ${V.border}`, backgroundColor: V.bg2 }}>
              <button onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                style={{ color: V.textTertiary }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = V.bg4; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                {t('workout.cancel')}
              </button>
              <button onClick={handleCreateRoutine}
                disabled={!newRoutineName.trim()}
                className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: V.accent,
                  color: V.bg0,
                  boxShadow: `0 4px 12px ${V.accent}25`,
                }}>
                {t('workout.modal_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutView;
