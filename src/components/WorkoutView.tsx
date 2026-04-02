
import React, { useState, useEffect, useRef } from 'react';
import { Routine, WorkoutLog, ExerciseTemplate, WorkoutExerciseResult, WorkoutSetResult } from '../types';
import { useLanguage } from '../i18n';
import { generateId, formatDate, playNotificationSound } from '../utils';
import { Plus, Dumbbell, Play, Clock, CheckCircle2, X, Save, History, ChevronRight, RotateCcw, Trash2, Compass, Copy, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WorkoutViewProps {
  routines: Routine[];
  logs: WorkoutLog[];
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  setLogs: React.Dispatch<React.SetStateAction<WorkoutLog[]>>;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ routines, logs, setRoutines, setLogs }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'routines' | 'active' | 'history' | 'explore' | 'stats'>('routines');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Routine Creation State
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newExercises, setNewExercises] = useState<ExerciseTemplate[]>([]);

  // Active Workout State
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  // Stores current input data for the session: exerciseIndex -> sets[]
  const [sessionData, setSessionData] = useState<WorkoutExerciseResult[]>([]);

  // Rest Timer State
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // -- RECOMMENDED WORKOUTS --
  const RECOMMENDED_WORKOUTS = [
    {
        nameKey: 'workout.rec_fullbody',
        descKey: 'workout.rec_fullbody_desc',
        exercises: [
            { nameKey: 'workout.ex_squats', sets: 3, reps: '15' },
            { nameKey: 'workout.ex_pushups', sets: 3, reps: '12' },
            { nameKey: 'workout.ex_lunges', sets: 3, reps: '10/leg' },
            { nameKey: 'workout.ex_plank', sets: 3, reps: '45s' },
            { nameKey: 'workout.ex_jacks', sets: 3, reps: '50' }
        ]
    },
    {
        nameKey: 'workout.rec_morning',
        descKey: 'workout.rec_morning_desc',
        exercises: [
            { nameKey: 'workout.ex_neck', sets: 2, reps: '30s' },
            { nameKey: 'workout.ex_catcow', sets: 2, reps: '10' },
            { nameKey: 'workout.ex_childpose', sets: 2, reps: '45s' },
            { nameKey: 'workout.ex_shoulder', sets: 2, reps: '20' }
        ]
    },
    {
        nameKey: 'workout.rec_upper',
        descKey: 'workout.rec_upper_desc',
        exercises: [
            { nameKey: 'workout.ex_press', sets: 3, reps: '12' },
            { nameKey: 'workout.ex_curls', sets: 3, reps: '12' },
            { nameKey: 'workout.ex_rows', sets: 3, reps: '12' },
            { nameKey: 'workout.ex_tricep', sets: 3, reps: '15' },
            { nameKey: 'workout.ex_lateral', sets: 3, reps: '15' }
        ]
    },
    {
        nameKey: 'workout.rec_hiit',
        descKey: 'workout.rec_hiit_desc',
        exercises: [
            { nameKey: 'workout.ex_highknees', sets: 4, reps: '30s' },
            { nameKey: 'workout.ex_climbers', sets: 4, reps: '30s' },
            { nameKey: 'workout.ex_burpees', sets: 4, reps: '10' },
            { nameKey: 'workout.ex_jumpsquats', sets: 4, reps: '15' }
        ]
    }
  ];

  // -- EFFECTS --

  // Active Session Timer
  useEffect(() => {
    let interval: any;
    if (activeRoutine && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, sessionStartTime]);

  // Rest Timer
  useEffect(() => {
    let interval: any;
    if (isResting) {
      interval = setInterval(() => {
        setRestTimer(prev => prev + 1);
      }, 1000);
    } else {
        setRestTimer(0);
    }
    return () => clearInterval(interval);
  }, [isResting]);

  // -- HANDLERS --

  const handleCreateRoutine = () => {
    if (!newRoutineName) return;
    const routine: Routine = {
      id: generateId(),
      name: newRoutineName,
      exercises: newExercises
    };
    setRoutines(prev => [...prev, routine]);
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewExercises([]);
  };

  const handleAddExerciseToRoutine = () => {
    setNewExercises(prev => [...prev, {
      id: generateId(),
      name: '',
      targetSets: 3,
      targetReps: '10'
    }]);
  };

  const updateExerciseInRoutine = (index: number, field: keyof ExerciseTemplate, value: any) => {
    const updated = [...newExercises];
    updated[index] = { ...updated[index], [field]: value };
    setNewExercises(updated);
  };

  const handleImportRoutine = (rec: typeof RECOMMENDED_WORKOUTS[0]) => {
      const routine: Routine = {
          id: generateId(),
          name: t(rec.nameKey),
          exercises: rec.exercises.map(ex => ({
              id: generateId(),
              name: t(ex.nameKey), // Translate at the moment of import
              targetSets: ex.sets,
              targetReps: ex.reps
          }))
      };
      setRoutines(prev => [...prev, routine]);
      setActiveTab('routines');
  };

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setSessionStartTime(Date.now());
    setActiveTab('active');

    // Initialize session data structure
    const initialData: WorkoutExerciseResult[] = routine.exercises.map(ex => ({
      exerciseName: ex.name,
      sets: Array(ex.targetSets).fill(null).map(() => ({ weight: 0, reps: 0, completed: false }))
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
        // Play sound
        playNotificationSound();
    }
  };

  const updateSetData = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const newData = [...sessionData];
    newData[exerciseIndex].sets[setIndex] = {
        ...newData[exerciseIndex].sets[setIndex],
        [field]: value
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
      exercises: sessionData
    };

    setLogs(prev => [log, ...prev]);
    setActiveRoutine(null);
    setSessionStartTime(null);
    setSessionDuration(0);
    setActiveTab('history');
    setIsResting(false);
  };

  const cancelWorkout = () => {
    if(confirm('Are you sure? Current progress will be lost.')) {
        setActiveRoutine(null);
        setSessionStartTime(null);
        setSessionDuration(0);
        setActiveTab('routines');
        setIsResting(false);
    }
  };

  const deleteRoutine = (id: string) => {
      if(confirm('Delete this routine?')) {
          setRoutines(prev => prev.filter(r => r.id !== id));
      }
  }

  // -- ANALYTICS --
  const chartData = logs.slice().reverse().map(log => {
      const totalVolume = log.exercises.reduce((acc, ex) => {
          return acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0);
      }, 0);
      return {
          date: new Date(log.date).toLocaleDateString(),
          volume: totalVolume
      };
  });

  // -- RENDER --

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const NavButton = ({ id, label, active }: { id: typeof activeTab, label: string, active: boolean }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${active ? 'bg-[#1A1A26] shadow text-[#E8E8F0]' : 'text-[#55556A] hover:text-[#8888A0]'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-5xl mx-auto w-full overflow-y-auto pb-24 md:pb-8 text-[#E8E8F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-[#E8E8F0] flex items-center gap-2">
                <Dumbbell className="w-8 h-8 text-[#5DAEFF]" />
                {t('workout.title')}
            </h2>
            <p className="text-[#55556A]">{t('workout.subtitle')}</p>
        </div>
        {activeRoutine ? (
             <div className="bg-[#FF444410] text-[#FF4444] px-4 py-2 rounded-xl font-bold border border-[#FF444430] animate-pulse">
                 {formatDuration(sessionDuration)}
             </div>
        ) : (
             <div className="flex bg-[#12121A] p-1 rounded-xl overflow-x-auto max-w-full">
                 <NavButton id="routines" label={t('workout.tab_routines')} active={activeTab === 'routines'} />
                 <NavButton id="explore" label={t('workout.tab_explore')} active={activeTab === 'explore'} />
                 <NavButton id="stats" label={t('workout.tab_stats')} active={activeTab === 'stats'} />
                 <NavButton id="history" label={t('workout.tab_history')} active={activeTab === 'history'} />
             </div>
        )}
      </div>

      {/* Active Workout Interface */}
      {activeTab === 'active' && activeRoutine ? (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#5DAEFF] text-[#12121A] p-4 rounded-2xl shadow-lg mb-6 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">{activeRoutine.name}</h3>
                    <p className="text-[#12121A]/70 text-xs">{t('workout.active_title')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={finishWorkout} className="bg-[#12121A] text-[#5DAEFF] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#1A1A26] transition-colors">
                        {t('workout.finish')}
                    </button>
                    <button onClick={cancelWorkout} className="bg-[#5DAEFF]/80 text-[#12121A] px-3 py-2 rounded-lg font-bold text-sm hover:bg-[#5DAEFF]/60 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isResting && (
                <div className="mb-6 bg-[#FBBF2410] border border-[#FBBF2430] p-4 rounded-xl flex items-center justify-between animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#FBBF2420] p-2 rounded-full text-[#FBBF24]">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider">{t('workout.rest_timer')}</p>
                            <p className="text-2xl font-mono font-bold text-[#FBBF24]">{formatDuration(restTimer)}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsResting(false)} className="text-[#FBBF24] hover:bg-[#FBBF2420] px-4 py-2 rounded-lg font-bold text-sm">
                        Skip Rest
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {sessionData.map((exercise, exIdx) => (
                    <div key={exIdx} className="bg-[#1A1A26] rounded-2xl border border-[#2A2A3C] overflow-hidden shadow-sm">
                        <div className="bg-[#12121A] px-4 py-3 border-b border-[#2A2A3C] flex justify-between items-center">
                            <h4 className="font-bold text-[#E8E8F0]">{exercise.exerciseName}</h4>
                            <button onClick={() => addSet(exIdx)} className="text-xs font-bold text-[#5DAEFF] hover:underline">
                                + {t('workout.add_set')}
                            </button>
                        </div>
                        <div className="p-2">
                            {exercise.sets.map((set, setIdx) => (
                                <div key={setIdx} className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${set.completed ? 'bg-[#4ADE8010]' : ''}`}>
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#12121A] rounded-full text-xs font-bold text-[#55556A]">
                                        {setIdx + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-[#12121A] border border-[#2A2A3C] rounded px-2 py-1 text-center font-mono font-medium focus:ring-2 focus:ring-[#5DAEFF] outline-none text-[#E8E8F0]"
                                                onChange={(e) => updateSetData(exIdx, setIdx, 'weight', Number(e.target.value))}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#55556A]">{t('workout.lbs')}</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-[#12121A] border border-[#2A2A3C] rounded px-2 py-1 text-center font-mono font-medium focus:ring-2 focus:ring-[#5DAEFF] outline-none text-[#E8E8F0]"
                                                onChange={(e) => updateSetData(exIdx, setIdx, 'reps', Number(e.target.value))}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#55556A]">{t('workout.reps')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${set.completed ? 'bg-[#4ADE80] text-[#12121A] shadow-lg shadow-[#4ADE80]/30' : 'bg-[#12121A] text-[#55556A] hover:bg-[#1F1F2B]'}`}
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      ) : activeTab === 'routines' ? (
        <div className="space-y-4">
             <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-4 border-2 border-dashed border-[#2A2A3C] rounded-2xl flex flex-col items-center justify-center text-[#55556A] hover:text-[#5DAEFF] hover:border-[#5DAEFF] hover:bg-[#5DAEFF10] transition-all group"
             >
                 <div className="w-12 h-12 rounded-full bg-[#12121A] group-hover:bg-[#5DAEFF20] flex items-center justify-center mb-2 transition-colors">
                     <Plus className="w-6 h-6" />
                 </div>
                 <span className="font-bold">{t('workout.create_routine')}</span>
             </button>

             {routines.length === 0 && (
                 <div className="text-center text-[#55556A] py-8">
                     {t('workout.empty_routines')}
                 </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {routines.map(routine => (
                     <div key={routine.id} className="bg-[#1A1A26] rounded-2xl shadow-sm border border-[#2A2A3C] p-6 hover:shadow-md transition-all relative group">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h3 className="font-bold text-lg text-[#E8E8F0]">{routine.name}</h3>
                                 <p className="text-sm text-[#55556A]">{routine.exercises.length} {t('workout.exercises')}</p>
                             </div>
                             <button
                                onClick={() => deleteRoutine(routine.id)}
                                className="text-[#55556A] hover:text-[#FF4444] transition-colors"
                             >
                                 <Trash2 className="w-5 h-5" />
                             </button>
                         </div>
                         <div className="space-y-1 mb-6">
                             {routine.exercises.slice(0, 3).map((ex, i) => (
                                 <div key={i} className="text-xs text-[#8888A0] flex justify-between">
                                     <span>{ex.name}</span>
                                     <span className="font-mono opacity-70">{ex.targetSets} x {ex.targetReps}</span>
                                 </div>
                             ))}
                             {routine.exercises.length > 3 && (
                                 <div className="text-xs text-[#55556A] italic">+ {routine.exercises.length - 3} more</div>
                             )}
                         </div>
                         <button
                            onClick={() => startWorkout(routine)}
                            className="w-full py-3 bg-[#5DAEFF] hover:bg-[#5DAEFF]/80 text-[#12121A] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#5DAEFF]/20 transition-transform active:scale-95"
                         >
                             <Play className="w-4 h-4" />
                             {t('workout.start')}
                         </button>
                     </div>
                 ))}
             </div>
        </div>
      ) : activeTab === 'stats' ? (
          <div className="space-y-6 animate-in fade-in">
               {/* Stats Header */}
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#1A1A26] p-6 rounded-2xl border border-[#2A2A3C] flex items-center gap-4">
                       <div className="bg-[#5DAEFF20] p-4 rounded-full text-[#5DAEFF]">
                           <Dumbbell className="w-6 h-6" />
                       </div>
                       <div>
                           <p className="text-xs text-[#55556A] font-bold uppercase">{t('workout.stats_workouts')}</p>
                           <p className="text-3xl font-bold text-[#E8E8F0]">{logs.length}</p>
                       </div>
                   </div>
                   <div className="bg-[#1A1A26] p-6 rounded-2xl border border-[#2A2A3C] flex items-center gap-4">
                       <div className="bg-[#5DAEFF20] p-4 rounded-full text-[#5DAEFF]">
                           <BarChart3 className="w-6 h-6" />
                       </div>
                       <div>
                           <p className="text-xs text-[#55556A] font-bold uppercase">{t('workout.stats_volume')}</p>
                           <p className="text-3xl font-bold text-[#E8E8F0]">
                               {Math.round(chartData.reduce((a, b) => a + b.volume, 0) / 1000)}k <span className="text-sm text-[#55556A] font-medium">lbs</span>
                           </p>
                       </div>
                   </div>
               </div>

               {/* Chart */}
               <div className="bg-[#1A1A26] p-6 rounded-2xl border border-[#2A2A3C] h-[400px]">
                    <h3 className="font-bold text-[#E8E8F0] mb-6">{t('workout.stats_volume')} (Last Sessions)</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3C" vertical={false} />
                                <XAxis dataKey="date" stroke="#55556A" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#55556A" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#12121A', border: '1px solid #2A2A3C', borderRadius: '8px', color: '#E8E8F0' }}
                                    itemStyle={{ color: '#E8E8F0' }}
                                />
                                <Line type="monotone" dataKey="volume" stroke="#5DAEFF" strokeWidth={3} dot={{ r: 4, fill: '#5DAEFF', strokeWidth: 2, stroke: '#12121A' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[#55556A] flex-col gap-2">
                            <BarChart3 className="w-12 h-12 opacity-20" />
                            <p>Complete more battles to see your runes of power.</p>
                        </div>
                    )}
               </div>
          </div>
      ) : activeTab === 'explore' ? (
          <div className="animate-in fade-in duration-300">
              <div className="bg-[#12121A] rounded-2xl p-6 text-[#E8E8F0] mb-6 relative overflow-hidden border border-[#2A2A3C]">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-[#5DAEFF] rounded-full -mr-10 -mt-10 blur-3xl opacity-20"></div>
                   <div className="relative z-10">
                       <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                           <Compass className="w-5 h-5" />
                           {t('workout.explore_title')}
                       </h3>
                       <p className="text-[#8888A0] text-sm">{t('workout.explore_subtitle')}</p>
                   </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RECOMMENDED_WORKOUTS.map((rec, i) => (
                      <div key={i} className="bg-[#1A1A26] rounded-2xl border border-[#2A2A3C] p-5 hover:shadow-md transition-all flex flex-col">
                          <div className="mb-4">
                              <h4 className="font-bold text-lg text-[#E8E8F0]">{t(rec.nameKey)}</h4>
                              <p className="text-xs text-[#55556A] mt-1 h-8 line-clamp-2">{t(rec.descKey)}</p>
                          </div>
                          <div className="space-y-2 mb-6 flex-1">
                              {rec.exercises.slice(0,3).map((ex, k) => (
                                  <div key={k} className="flex justify-between text-xs py-1 border-b border-[#2A2A3C]/50 last:border-0">
                                      <span className="text-[#8888A0]">{t(ex.nameKey)}</span>
                                      <span className="font-mono text-[#55556A]">{ex.sets} x {ex.reps}</span>
                                  </div>
                              ))}
                              {rec.exercises.length > 3 && (
                                  <div className="text-[10px] text-[#55556A] italic">
                                      + {rec.exercises.length - 3} more exercises...
                                  </div>
                              )}
                          </div>
                          <button
                            onClick={() => handleImportRoutine(rec)}
                            className="w-full py-2.5 bg-[#5DAEFF15] text-[#5DAEFF] hover:bg-[#5DAEFF25] rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                              <Copy className="w-4 h-4" />
                              {t('workout.import')}
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      ) : (
        <div className="space-y-4">
            {logs.length === 0 && (
                <div className="text-center py-12 text-[#55556A]">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{t('workout.log_empty')}</p>
                </div>
            )}
            {logs.map(log => (
                <div key={log.id} className="bg-[#1A1A26] rounded-xl border border-[#2A2A3C] p-4 shadow-sm flex items-center gap-4">
                    <div className="bg-[#4ADE8020] p-3 rounded-xl text-[#4ADE80]">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-[#E8E8F0]">{log.routineName}</h4>
                        <p className="text-xs text-[#55556A]">{formatDate(log.date)} • {formatDuration(log.durationSeconds)}</p>
                    </div>
                    <div className="text-right">
                         <span className="text-2xl font-bold text-[#E8E8F0]">{log.exercises.length}</span>
                         <p className="text-[10px] text-[#55556A] uppercase font-bold">Exercises</p>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Create Routine Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[#12121A]/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A26] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-[#2A2A3C] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[#E8E8F0]">{t('workout.modal_new_routine')}</h3>
                    <button onClick={() => setIsCreateModalOpen(false)}><X className="w-6 h-6 text-[#55556A]" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[#55556A] uppercase mb-1.5">{t('workout.modal_routine_name')}</label>
                        <input
                            type="text"
                            value={newRoutineName}
                            onChange={(e) => setNewRoutineName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#12121A] border border-[#2A2A3C] rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-[#5DAEFF] text-[#E8E8F0]"
                            placeholder="e.g. Leg Day"
                        />
                    </div>

                    <div className="space-y-3">
                        {newExercises.map((ex, i) => (
                            <div key={ex.id} className="flex gap-2 items-center bg-[#12121A] p-2 rounded-xl border border-[#2A2A3C]">
                                <div className="w-6 h-6 flex items-center justify-center text-xs font-bold text-[#55556A] bg-[#1A1A26] rounded-full shadow-sm shrink-0">{i + 1}</div>
                                <input
                                    className="flex-1 bg-transparent outline-none font-medium text-sm text-[#E8E8F0]"
                                    placeholder="Exercise Name"
                                    value={ex.name}
                                    onChange={(e) => updateExerciseInRoutine(i, 'name', e.target.value)}
                                />
                                <input
                                    className="w-12 bg-[#1A1A26] border border-[#2A2A3C] rounded px-1 py-0.5 text-center text-sm font-mono outline-none text-[#E8E8F0]"
                                    value={ex.targetSets}
                                    onChange={(e) => updateExerciseInRoutine(i, 'targetSets', Number(e.target.value))}
                                />
                                <span className="text-xs text-[#55556A]">sets</span>
                                <input
                                    className="w-16 bg-[#1A1A26] border border-[#2A2A3C] rounded px-1 py-0.5 text-center text-sm font-mono outline-none text-[#E8E8F0]"
                                    value={ex.targetReps}
                                    onChange={(e) => updateExerciseInRoutine(i, 'targetReps', e.target.value)}
                                />
                                <span className="text-xs text-[#55556A]">reps</span>
                            </div>
                        ))}
                        <button
                            onClick={handleAddExerciseToRoutine}
                            className="w-full py-2 border border-dashed border-[#2A2A3C] rounded-xl text-sm font-bold text-[#55556A] hover:bg-[#1F1F2B] transition-colors"
                        >
                            + {t('workout.modal_add_exercise')}
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t border-[#2A2A3C] bg-[#12121A] flex justify-end gap-3">
                    <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-[#55556A] font-bold text-sm">{t('workout.cancel')}</button>
                    <button onClick={handleCreateRoutine} disabled={!newRoutineName} className="px-6 py-2 bg-[#5DAEFF] text-[#12121A] rounded-xl font-bold text-sm shadow-lg hover:bg-[#5DAEFF]/80 disabled:opacity-50">
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
