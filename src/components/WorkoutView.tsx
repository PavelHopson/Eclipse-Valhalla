
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routine, WorkoutLog, ExerciseTemplate, WorkoutExerciseResult, WorkoutSetResult } from '../types';
import { useLanguage } from '../i18n';
import { desktop } from '../services/desktopBridge';
import { generateId, formatDate, playNotificationSound } from '../utils';
import {
  Plus, Dumbbell, Play, Clock, CheckCircle2, X, Save, History,
  ChevronRight, RotateCcw, Trash2, Compass, Copy, BarChart3,
  Pause, Timer, TrendingUp, Award, Flame, ChevronDown, ChevronUp,
  Edit3, Target, Zap, Activity, Video, Calendar, Film,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import TrainingPlanView from './TrainingPlanView';
import VideoLibrary from './VideoLibrary';

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

interface VideoPlaybackState {
  title: string;
  url: string;
  mode: 'youtube' | 'direct';
}

/* ────────────────────────────────────────────────────────────
   Recommended Workouts Data
   ──────────────────────────────────────────────────────────── */
// Exercise video database — YouTube embed IDs
const EXERCISE_VIDEOS: Record<string, string> = {
  'workout.ex_squats': 'aclHkVaku9U',
  'workout.ex_pushups': 'IODxDxX7oi4',
  'workout.ex_lunges': 'QOVaHwm-Q6U',
  'workout.ex_plank': 'ASdvN_XEl_c',
  'workout.ex_jacks': 'CWpmIW6l-YA',
  'workout.ex_neck': 'tpbjXalYmSQ',
  'workout.ex_catcow': 'kqnua4rHVVA',
  'workout.ex_childpose': 'eqVMAPM00DM',
  'workout.ex_shoulder': 'lOCse3urMFA',
  'workout.ex_press': 'qEwKCR5JCog',
  'workout.ex_curls': 'ykJmrZ5v0Oo',
  'workout.ex_rows': 'pYcpY20QaE8',
  'workout.ex_tricep': '_gsUck-7M74',
  'workout.ex_lateral': '3VcKaXpzqRo',
  'workout.ex_highknees': 'tx5rgpDAJRI',
  'workout.ex_climbers': 'nmwgirgXLYM',
  'workout.ex_burpees': 'dZgVxmf6jkA',
  'workout.ex_jumpsquats': 'A-cFYGvaYcg',
  // Bodyweight
  'workout.ex_dips': 'yN6Q1UI_xkE',           // Tricep dips on chair
  'workout.ex_pike_pushups': 'sposDXWEB9Q',     // Pike pushups (shoulders)
  'workout.ex_wall_sit': 'y-wV4Lz6wJU',        // Wall sit
  'workout.ex_crunches': 'Xyd_fa5zoEU',         // Crunches
  'workout.ex_leg_raises': 'JB2oyawG9KI',       // Leg raises
  'workout.ex_superman': 'z6PJMT2y8GQ',         // Superman back
  'workout.ex_glute_bridge': 'OUgsJ8-Vi0E',     // Glute bridge
  'workout.ex_diamond_pushups': 'J0DnG1_S92I',  // Diamond pushups
  'workout.ex_step_ups': 'dQqApCGd5Cw',         // Step ups on chair
  'workout.ex_mountain_climbers': 'nmwgirgXLYM', // Same as climbers
  // Running
  'workout.ex_warmup_jog': 'dSfx4Nt4cHU',       // Easy warm-up jog
  'workout.ex_sprint_intervals': 'R0mMyV0pOYs',  // Sprint intervals
  'workout.ex_cooldown_walk': 'njeZ29umqVE',     // Cool-down walk + stretch
  // Morning Ritual
  'workout.ex_bird_dog': 'wiFNA3sqjCA',          // Bird Dog
  'workout.ex_static_hold': 'ASdvN_XEl_c',       // Static hold (like plank variation)
  // Daily challenges
  'workout.ex_plank_2min': 'ASdvN_XEl_c',        // 2-min plank hold
  'workout.ex_wall_sit_hold': 'y-wV4Lz6wJU',     // Wall sit hold
  // Legs power
  'workout.ex_squats_power': 'aclHkVaku9U',
  'workout.ex_squats_slow': 'aclHkVaku9U',
  'workout.ex_calf_raises': 'gwLzBJksFhY',
  // Street/compound
  'workout.ex_pullups': 'eGo4IYlbE5g',
  'workout.ex_horizontal_row': 'hXTc1mDnZCg',
  'workout.ex_dip_bars': 'dX_nSOOJIsE',
  'workout.ex_decline_pushups': '4dF1DOWzf20',
  'workout.ex_bulgarian_split': 'gGMcjOwnnHU',
  'workout.ex_single_leg_rdl': 'BvLiRMX-yTk',
};

const RECOMMENDED_WORKOUTS = [
  {
    nameKey: 'workout.rec_ritual',
    descKey: 'workout.rec_ritual_desc',
    icon: Zap,
    gradient: 'from-[#D8C18E] to-[#B89B5E]',
    category: 'bodyweight',
    featured: true,
    exercises: [
      { nameKey: 'workout.ex_pushups', sets: 2, reps: '30s', timed: true, timedSec: 30, descKey: 'workout.desc_pushups' },
      { nameKey: 'workout.ex_squats', sets: 2, reps: '30s', timed: true, timedSec: 30, descKey: 'workout.desc_squats' },
      { nameKey: 'workout.ex_bird_dog', sets: 2, reps: '30s', timed: true, timedSec: 30, descKey: 'workout.desc_bird_dog' },
      { nameKey: 'workout.ex_static_hold', sets: 2, reps: '30s', timed: true, timedSec: 30, descKey: 'workout.desc_static' },
      { nameKey: 'workout.ex_plank', sets: 2, reps: '30s', timed: true, timedSec: 30, descKey: 'workout.desc_plank' },
    ],
  },
  {
    nameKey: 'workout.rec_plank_daily',
    descKey: 'workout.rec_plank_daily_desc',
    icon: Target,
    gradient: 'from-[#FF4444] to-[#D8C18E]',
    category: 'bodyweight',
    featured: true,
    exercises: [
      { nameKey: 'workout.ex_plank_2min', sets: 1, reps: '2 min', timed: true, timedSec: 120, descKey: 'workout.desc_plank_long' },
    ],
  },
  {
    nameKey: 'workout.rec_wallsit_daily',
    descKey: 'workout.rec_wallsit_daily_desc',
    icon: Award,
    gradient: 'from-[#5DAEFF] to-[#8878C8]',
    category: 'bodyweight',
    featured: true,
    exercises: [
      { nameKey: 'workout.ex_wall_sit_hold', sets: 1, reps: '1-2 min', timed: true, timedSec: 90, descKey: 'workout.desc_wallsit' },
    ],
  },
  {
    nameKey: 'workout.rec_street_compound',
    descKey: 'workout.rec_street_compound_desc',
    icon: Award,
    gradient: 'from-[#4ADE80] to-[#5DAEFF]',
    category: 'bodyweight',
    featured: true,
    exercises: [
      { nameKey: 'workout.ex_pullups', sets: 4, reps: '8-12' },
      { nameKey: 'workout.ex_horizontal_row', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_dip_bars', sets: 4, reps: '10-15' },
      { nameKey: 'workout.ex_decline_pushups', sets: 3, reps: '12-15' },
      { nameKey: 'workout.ex_bulgarian_split', sets: 3, reps: '10/leg' },
      { nameKey: 'workout.ex_single_leg_rdl', sets: 3, reps: '10/leg' },
    ],
  },
  {
    nameKey: 'workout.rec_legs_power',
    descKey: 'workout.rec_legs_power_desc',
    icon: Flame,
    gradient: 'from-[#FF4444] to-[#FF6B35]',
    category: 'bodyweight',
    featured: true,
    exercises: [
      { nameKey: 'workout.ex_squats_power', sets: 4, reps: '25' },
      { nameKey: 'workout.ex_squats_slow', sets: 3, reps: '20 (2s вниз, 1s вверх)' },
      { nameKey: 'workout.ex_glute_bridge', sets: 4, reps: '15' },
      { nameKey: 'workout.ex_calf_raises', sets: 4, reps: '25' },
    ],
  },
  {
    nameKey: 'workout.rec_fullbody',
    descKey: 'workout.rec_fullbody_desc',
    icon: Flame,
    gradient: 'from-[#FF6B35] to-[#FF4444]',
    category: 'bodyweight',
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
    category: 'stretch',
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
    category: 'weights',
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
    category: 'bodyweight',
    exercises: [
      { nameKey: 'workout.ex_highknees', sets: 4, reps: '30s' },
      { nameKey: 'workout.ex_climbers', sets: 4, reps: '30s' },
      { nameKey: 'workout.ex_burpees', sets: 4, reps: '10' },
      { nameKey: 'workout.ex_jumpsquats', sets: 4, reps: '15' },
    ],
  },
  // === BODYWEIGHT / HOME ===
  {
    nameKey: 'workout.rec_abs_core',
    descKey: 'workout.rec_abs_core_desc',
    icon: Target,
    gradient: 'from-[#FF6B35] to-[#FBBF24]',
    category: 'bodyweight',
    exercises: [
      { nameKey: 'workout.ex_crunches', sets: 3, reps: '20' },
      { nameKey: 'workout.ex_leg_raises', sets: 3, reps: '15' },
      { nameKey: 'workout.ex_plank', sets: 3, reps: '60s' },
      { nameKey: 'workout.ex_mountain_climbers', sets: 3, reps: '30s' },
      { nameKey: 'workout.ex_superman', sets: 3, reps: '15' },
    ],
  },
  {
    nameKey: 'workout.rec_push_pull',
    descKey: 'workout.rec_push_pull_desc',
    icon: TrendingUp,
    gradient: 'from-[#4ADE80] to-[#5DAEFF]',
    category: 'bodyweight',
    exercises: [
      { nameKey: 'workout.ex_pushups', sets: 4, reps: '15' },
      { nameKey: 'workout.ex_diamond_pushups', sets: 3, reps: '10' },
      { nameKey: 'workout.ex_pike_pushups', sets: 3, reps: '10' },
      { nameKey: 'workout.ex_dips', sets: 3, reps: '12' },
      { nameKey: 'workout.ex_glute_bridge', sets: 3, reps: '20' },
    ],
  },
  {
    nameKey: 'workout.rec_legs_home',
    descKey: 'workout.rec_legs_home_desc',
    icon: Flame,
    gradient: 'from-[#FF4444] to-[#FF6B35]',
    category: 'bodyweight',
    exercises: [
      { nameKey: 'workout.ex_squats', sets: 4, reps: '20' },
      { nameKey: 'workout.ex_lunges', sets: 3, reps: '12/leg' },
      { nameKey: 'workout.ex_wall_sit', sets: 3, reps: '45s' },
      { nameKey: 'workout.ex_step_ups', sets: 3, reps: '10/leg' },
      { nameKey: 'workout.ex_jumpsquats', sets: 3, reps: '15' },
      { nameKey: 'workout.ex_glute_bridge', sets: 3, reps: '20' },
    ],
  },
  {
    nameKey: 'workout.rec_full_no_equip',
    descKey: 'workout.rec_full_no_equip_desc',
    icon: Award,
    gradient: 'from-[#9B8FD8] to-[#5DAEFF]',
    category: 'bodyweight',
    exercises: [
      { nameKey: 'workout.ex_jacks', sets: 1, reps: '50' },
      { nameKey: 'workout.ex_squats', sets: 3, reps: '20' },
      { nameKey: 'workout.ex_pushups', sets: 3, reps: '15' },
      { nameKey: 'workout.ex_lunges', sets: 3, reps: '10/leg' },
      { nameKey: 'workout.ex_crunches', sets: 3, reps: '20' },
      { nameKey: 'workout.ex_plank', sets: 2, reps: '60s' },
      { nameKey: 'workout.ex_burpees', sets: 3, reps: '10' },
    ],
  },
  // === RUNNING ===
  {
    nameKey: 'workout.rec_run_beginner',
    descKey: 'workout.rec_run_beginner_desc',
    icon: Activity,
    gradient: 'from-[#5DAEFF] to-[#4ADE80]',
    category: 'running',
    exercises: [
      { nameKey: 'workout.ex_warmup_jog', sets: 1, reps: '5 min' },
      { nameKey: 'workout.ex_highknees', sets: 3, reps: '30s' },
      { nameKey: 'workout.ex_sprint_intervals', sets: 5, reps: '30s run / 60s walk' },
      { nameKey: 'workout.ex_cooldown_walk', sets: 1, reps: '5 min' },
    ],
  },
  {
    nameKey: 'workout.rec_run_endurance',
    descKey: 'workout.rec_run_endurance_desc',
    icon: TrendingUp,
    gradient: 'from-[#FBBF24] to-[#4ADE80]',
    category: 'running',
    exercises: [
      { nameKey: 'workout.ex_warmup_jog', sets: 1, reps: '10 min' },
      { nameKey: 'workout.ex_sprint_intervals', sets: 8, reps: '1 min run / 30s rest' },
      { nameKey: 'workout.ex_highknees', sets: 2, reps: '30s' },
      { nameKey: 'workout.ex_cooldown_walk', sets: 1, reps: '10 min' },
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

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv'];

const extractYouTubeVideoId = (input: string): string | null => {
  const value = input.trim();
  if (!value) return null;

  if (/^[\w-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) return null;

    if (host === 'youtu.be') {
      const shortId = url.pathname.split('/').filter(Boolean)[0];
      return shortId || null;
    }

    const queryId = url.searchParams.get('v');
    if (queryId) return queryId;

    const segments = url.pathname.split('/').filter(Boolean);
    const embedIndex = segments.findIndex(segment => segment === 'embed' || segment === 'shorts' || segment === 'live');
    if (embedIndex >= 0 && segments[embedIndex + 1]) {
      return segments[embedIndex + 1];
    }
  } catch {
    return null;
  }

  return null;
};

const isDirectVideoUrl = (input: string): boolean => {
  const normalized = input.trim().toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some(extension => normalized.includes(extension));
};

const normalizeVideoSource = (input?: string | null): Omit<VideoPlaybackState, 'title'> | null => {
  const value = input?.trim();
  if (!value) return null;

  const youtubeId = extractYouTubeVideoId(value);
  if (youtubeId) {
    return {
      mode: 'youtube',
      url: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
    };
  }

  if (value.startsWith('file:///') || isDirectVideoUrl(value)) {
    return {
      mode: 'direct',
      url: value,
    };
  }

  if (/^[a-zA-Z]:\\/.test(value)) {
    return {
      mode: 'direct',
      url: `file:///${value.replace(/\\/g, '/')}`,
    };
  }

  return null;
};

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
const WorkoutView: React.FC<WorkoutViewProps> = ({ routines, logs, setRoutines, setLogs }) => {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  // Tab state
  const [activeTab, setActiveTab] = useState<'routines' | 'active' | 'history' | 'explore' | 'stats' | 'plans' | 'videos'>('routines');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Routine creation
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newExercises, setNewExercises] = useState<ExerciseTemplate[]>([]);
  const [newRoutineVideo, setNewRoutineVideo] = useState('');
  const [newRoutineRest, setNewRoutineRest] = useState(90);
  const [newWeekdays, setNewWeekdays] = useState<number[]>([]);
  const [newDayLabel, setNewDayLabel] = useState('');

  // Active workout
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState<WorkoutExerciseResult[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [videoPlayback, setVideoPlayback] = useState<VideoPlaybackState | null>(null);

  // Rest timer
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restPreset, setRestPreset] = useState(() => activeRoutine?.restSeconds || 90);
  const REST_OPTIONS = [30, 45, 60, 90, 120, 180];

  // Exercise timer (for plank, etc.)
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [isExerciseTimerRunning, setIsExerciseTimerRunning] = useState(false);
  const [exerciseTimerTarget, setExerciseTimerTarget] = useState(0);

  // Auto-flow mode: run through all exercises with rest automatically
  const [autoFlowActive, setAutoFlowActive] = useState(false);
  const autoFlowRef = useRef<{ exIdx: number; roundIdx: number; phase: 'work' | 'rest' } | null>(null);
  const [autoFlowPos, setAutoFlowPos] = useState<{ exIdx: number; roundIdx: number } | null>(null);

  // Personal records
  const [newPR, setNewPR] = useState<{ exercise: string; weight: number } | null>(null);

  // History expanded
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Explore filter
  const [exploreFilter, setExploreFilter] = useState('all');

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

  // Rest timer (countdown)
  const restStartRef = useRef(false);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && !restStartRef.current) {
      restStartRef.current = true;
      setRestTimer(restPreset);
    }
    if (isResting) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            restStartRef.current = false;
            playNotificationSound();
            // Auto-flow: advance to next round/exercise
            if (autoFlowRef.current && autoFlowRef.current.phase === 'rest' && activeRoutine) {
              const { exIdx, roundIdx } = autoFlowRef.current;
              const curEx = activeRoutine.exercises[exIdx];
              let nextEx = exIdx;
              let nextRound = roundIdx + 1;
              if (!curEx || nextRound >= curEx.targetSets) {
                nextEx = exIdx + 1;
                nextRound = 0;
              }
              if (nextEx >= activeRoutine.exercises.length) {
                autoFlowRef.current = null;
                setAutoFlowActive(false);
                setAutoFlowPos(null);
              } else {
                autoFlowRef.current = { exIdx: nextEx, roundIdx: nextRound, phase: 'work' };
                setAutoFlowPos({ exIdx: nextEx, roundIdx: nextRound });
                setExpandedExercise(nextEx);
                const nx = activeRoutine.exercises[nextEx];
                const dur = nx.timedDuration || 45;
                setExerciseTimer(0);
                setExerciseTimerTarget(dur);
                setIsExerciseTimerRunning(true);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      restStartRef.current = false;
    }
    return () => clearInterval(interval);
  }, [isResting, activeRoutine]);

  // Exercise timer (count up for timed exercises)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isExerciseTimerRunning) {
      interval = setInterval(() => {
        setExerciseTimer(prev => {
          if (exerciseTimerTarget > 0 && prev >= exerciseTimerTarget) {
            setIsExerciseTimerRunning(false);
            playNotificationSound();
            // Auto-flow: mark current set complete, then start rest
            if (autoFlowRef.current && activeRoutine) {
              const { exIdx, roundIdx } = autoFlowRef.current;
              setSessionData(prevData => {
                const next = prevData.map((ex, i) => {
                  if (i !== exIdx) return ex;
                  return { ...ex, sets: ex.sets.map((s, j) => j === roundIdx ? { ...s, completed: true } : s) };
                });
                return next;
              });
              const ex = activeRoutine.exercises[exIdx];
              const isLastRound = !ex || roundIdx + 1 >= ex.targetSets;
              const isLastEx = exIdx + 1 >= activeRoutine.exercises.length;
              if (isLastRound && isLastEx) {
                autoFlowRef.current = null;
                setAutoFlowActive(false);
                setAutoFlowPos(null);
              } else {
                autoFlowRef.current = { exIdx, roundIdx, phase: 'rest' };
                setIsResting(true);
              }
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExerciseTimerRunning, exerciseTimerTarget, activeRoutine]);

  // Session persistence — save to localStorage on change
  useEffect(() => {
    if (activeRoutine && sessionData.length > 0) {
      try {
        localStorage.setItem('eclipse_active_workout', JSON.stringify({
          routine: activeRoutine,
          startTime: sessionStartTime,
          data: sessionData,
          restPreset,
        }));
      } catch {}
    }
  }, [sessionData, activeRoutine, sessionStartTime, restPreset]);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eclipse_active_workout');
      if (saved && !activeRoutine) {
        const { routine, startTime, data, restPreset: savedRest } = JSON.parse(saved);
        if (routine && data) {
          setActiveRoutine(routine);
          setSessionStartTime(startTime);
          setSessionData(data);
          if (savedRest) setRestPreset(savedRest);
          setActiveTab('active');
        }
      }
    } catch {}
  }, []);

  /* ── Handlers ─────────────────────────────────────────────── */

  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) return;
    const routine: Routine = {
      id: generateId(),
      name: newRoutineName.trim(),
      exercises: newExercises.filter(e => e.name.trim()),
      routineVideoUrl: newRoutineVideo.trim() || undefined,
      restSeconds: newRoutineRest,
      weekdays: newWeekdays.length > 0 ? newWeekdays : undefined,
      dayLabel: newDayLabel.trim() || undefined,
    };
    setRoutines(prev => [...prev, routine]);
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewExercises([]);
    setNewRoutineVideo('');
    setNewRoutineRest(90);
    setNewWeekdays([]);
    setNewDayLabel('');
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

  const pickVideoForExercise = async (index: number) => {
    const picked = await desktop.pickVideoFile();
    if (!picked.canceled && 'fileUrl' in picked && picked.fileUrl) {
      updateExerciseInRoutine(index, 'videoUrl', picked.fileUrl);
    }
  };

  const resolveExerciseVideo = useCallback((exerciseName: string, customUrl?: string) => {
    const customVideo = normalizeVideoSource(customUrl);
    if (customVideo) {
      return {
        ...customVideo,
        title: exerciseName,
      };
    }

    const videoKey = Object.keys(EXERCISE_VIDEOS).find(key =>
      t(key).toLowerCase() === exerciseName.toLowerCase()
    );

    if (!videoKey) {
      return null;
    }

    return {
      title: exerciseName,
      mode: 'youtube' as const,
      url: `https://www.youtube.com/embed/${EXERCISE_VIDEOS[videoKey]}?rel=0&modestbranding=1`,
    };
  }, [t]);

  const openExerciseVideo = useCallback((exerciseName: string, customUrl?: string) => {
    const video = resolveExerciseVideo(exerciseName, customUrl);
    if (video) {
      setVideoPlayback(video);
    }
  }, [resolveExerciseVideo]);

  const handleImportRoutine = (rec: typeof RECOMMENDED_WORKOUTS[0]) => {
    const routine: Routine = {
      id: generateId(),
      name: t(rec.nameKey),
      exercises: rec.exercises.map(ex => ({
        id: generateId(),
        name: t(ex.nameKey),
        targetSets: ex.sets,
        targetReps: ex.reps,
        isTimedExercise: (ex as any).timed || false,
        timedDuration: (ex as any).timedSec || undefined,
        videoUrl: EXERCISE_VIDEOS[ex.nameKey] ? `https://youtube.com/watch?v=${EXERCISE_VIDEOS[ex.nameKey]}` : undefined,
      })),
      // Auto-assign daily programs to all weekdays
      weekdays: (rec as any).featured ? [0,1,2,3,4,5,6] : undefined,
      restSeconds: 60,
    };
    setRoutines(prev => [...prev, routine]);
    setActiveTab('routines');
  };

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setSessionStartTime(Date.now());
    setActiveTab('active');
    setExpandedExercise(0);
    if (routine.restSeconds) setRestPreset(routine.restSeconds);
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

    // Check for personal records
    checkPersonalRecords(sessionData);

    // Track achievement
    import('../services/achievementService').then(({ trackEvent }) => {
      trackEvent('workout_complete');
      trackEvent('feature_use', 'workouts' as unknown as number);
      // Morning Ritual achievement
      if (activeRoutine.name.includes('Ритуал') || activeRoutine.name.includes('Ritual') || activeRoutine.name.includes('ritual')) {
        trackEvent('morning_ritual');
      }
      // Plank challenge
      if (activeRoutine.name.includes('Планка') || activeRoutine.name.includes('Plank') || activeRoutine.name.includes('plank')) {
        trackEvent('plank_complete');
      }
      // Wall Sit challenge
      if (activeRoutine.name.includes('Стульчик') || activeRoutine.name.includes('Wall Sit') || activeRoutine.name.includes('wall sit')) {
        trackEvent('wallsit_complete');
      }
      // Street compound
      if (activeRoutine.name.includes('Уличн') || activeRoutine.name.includes('Street') || activeRoutine.name.includes('Compound')) {
        trackEvent('street_compound');
      }
    }).catch(() => {});

    // Save active session state
    try { localStorage.removeItem('eclipse_active_workout'); } catch {}

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

  // PR check
  const checkPersonalRecords = (data: WorkoutExerciseResult[]) => {
    try {
      const prs: Record<string, { maxWeight: number; maxReps: number; date: string }> =
        JSON.parse(localStorage.getItem('eclipse_prs') || '{}');

      for (const ex of data) {
        for (const set of ex.sets) {
          if (!set.completed || set.weight <= 0) continue;
          const current = prs[ex.exerciseName];
          if (!current || set.weight > current.maxWeight) {
            prs[ex.exerciseName] = { maxWeight: set.weight, maxReps: set.reps, date: new Date().toISOString() };
            setNewPR({ exercise: ex.exerciseName, weight: set.weight });
            setTimeout(() => setNewPR(null), 4000);
          }
        }
      }
      localStorage.setItem('eclipse_prs', JSON.stringify(prs));
    } catch {}
  };

  const startExerciseTimer = (durationSec: number) => {
    setExerciseTimer(0);
    setExerciseTimerTarget(durationSec);
    setIsExerciseTimerRunning(true);
  };

  const stopExerciseTimer = () => {
    setIsExerciseTimerRunning(false);
    setExerciseTimer(0);
  };

  const startAutoFlow = () => {
    if (!activeRoutine || activeRoutine.exercises.length === 0) return;
    autoFlowRef.current = { exIdx: 0, roundIdx: 0, phase: 'work' };
    setAutoFlowActive(true);
    setAutoFlowPos({ exIdx: 0, roundIdx: 0 });
    setExpandedExercise(0);
    setIsResting(false);
    const first = activeRoutine.exercises[0];
    const dur = first.timedDuration || 45;
    setExerciseTimer(0);
    setExerciseTimerTarget(dur);
    setIsExerciseTimerRunning(true);
  };

  const stopAutoFlow = () => {
    autoFlowRef.current = null;
    setAutoFlowActive(false);
    setAutoFlowPos(null);
    setIsExerciseTimerRunning(false);
    setIsResting(false);
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

  // Calorie estimation (~5 cal/min for strength training, adjusted by volume)
  const estimateCalories = (log: WorkoutLog): number => {
    const minutes = log.durationSeconds / 60;
    const baseCal = minutes * 5;
    const volumeBonus = log.exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps * 0.01 : 0), 0), 0);
    return Math.round(baseCal + volumeBonus);
  };

  const totalCalories = useMemo(() =>
    logs.reduce((acc, log) => acc + estimateCalories(log), 0), [logs]);

  const sessionCalories = useMemo(() => {
    if (!activeRoutine) return 0;
    const minutes = sessionDuration / 60;
    const baseCal = minutes * 5;
    const volumeBonus = sessionData.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps * 0.01 : 0), 0), 0);
    return Math.round(baseCal + volumeBonus);
  }, [sessionDuration, sessionData, activeRoutine]);

  // Progress in active session
  const sessionProgress = useMemo(() => {
    if (sessionData.length === 0) return 0;
    const total = sessionData.reduce((a, ex) => a + ex.sets.length, 0);
    const done = sessionData.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [sessionData]);

  /* ── Tab bar items ─────────────────────────────────────────── */

  const tabs = [
    ...(activeRoutine ? [{ id: 'active' as const, label: isRu ? 'Бой' : 'Fight', icon: Play }] : []),
    { id: 'routines' as const, label: t('workout.tab_routines'), icon: Dumbbell },
    { id: 'plans' as const, label: isRu ? 'Планы' : 'Plans', icon: Calendar },
    { id: 'videos' as const, label: isRu ? 'Видео' : 'Videos', icon: Film },
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
        <div className="relative mb-8 rounded-3xl overflow-hidden"
          style={{ background: `linear-gradient(145deg, ${V.bg2}, ${V.bg1})`, border: `1px solid ${V.border}` }}>
          {/* Ambient orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 -mr-20 -mt-20 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.08), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-60 h-60 -ml-10 -mb-10 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(93,174,255,0.06), transparent 70%)' }} />

          <div className="relative px-6 py-6 md:px-8 md:py-7">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative workout-shimmer"
                  style={{ background: `linear-gradient(135deg, ${V.orange}30, ${V.orange}10)`, border: `1px solid ${V.orange}30` }}>
                  <Dumbbell className="w-7 h-7" style={{ color: V.orange }} />
                  {activeRoutine && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#4ADE80] workout-pulse-ring" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: V.text, letterSpacing: '-0.02em' }}>
                    {t('workout.title')}
                  </h2>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] mt-0.5" style={{ color: V.textTertiary }}>
                    {t('workout.subtitle')}
                  </p>
                </div>
              </div>

              {/* Tab pills */}
              <div className="flex gap-1.5 p-1 rounded-2xl" style={{ backgroundColor: `${V.bg0}80` }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${V.orange}, ${V.orange}CC)`,
                        color: V.bg0,
                        boxShadow: `0 4px 16px ${V.orange}30`,
                        transform: 'scale(1.02)',
                      } : {
                        color: V.textTertiary,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = V.text; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = V.textTertiary; }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
                    <span className="workout-heartbeat inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(10,10,15,0.2)', color: V.bg0 }}>
                      <Timer className="w-3 h-3" />
                      {formatDuration(sessionDuration)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(10,10,15,0.15)', color: V.bg0 }}>
                      {sessionProgress}% {isRu ? 'завершено' : 'complete'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(10,10,15,0.15)', color: V.bg0 }}>
                      🔥 {sessionCalories} {isRu ? 'ккал' : 'cal'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={autoFlowActive ? stopAutoFlow : startAutoFlow}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: autoFlowActive
                        ? 'linear-gradient(135deg, #FF4444, #FF6B35)'
                        : 'linear-gradient(135deg, #D8C18E, #B89B5E)',
                      color: '#0A0A0F',
                    }}>
                    {autoFlowActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {autoFlowActive ? (isRu ? 'Стоп авто' : 'Stop Auto') : (isRu ? 'Авто-режим' : 'Auto Mode')}
                  </button>
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
              <div className="workout-progress-glow mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${sessionProgress}%`, backgroundColor: V.bg0 }} />
              </div>
            </div>

            {/* Rest timer (countdown) */}
            {isResting && (
              <div className="mb-6 rounded-2xl p-4 animate-in zoom-in-95"
                style={{ backgroundColor: `${V.yellow}08`, border: `1px solid ${V.yellow}20` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                      style={{ backgroundColor: `${V.yellow}15` }}>
                      <Clock className="w-7 h-7" style={{ color: V.yellow }} />
                      {/* Circular progress */}
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke={`${V.yellow}20`} strokeWidth="2" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke={V.yellow} strokeWidth="2.5"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (restTimer / restPreset)}`}
                          strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
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
                    {isRu ? 'Пропустить' : 'Skip'}
                  </button>
                </div>
                {/* Rest duration presets */}
                <div className="flex gap-1.5 mt-3">
                  {REST_OPTIONS.map(sec => (
                    <button key={sec} onClick={() => { setRestPreset(sec); setRestTimer(sec); }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        restPreset === sec ? 'text-[#0A0A0A]' : 'text-[#7F7A72] hover:text-[#B4B0A7]'
                      }`}
                      style={restPreset === sec
                        ? { backgroundColor: V.yellow }
                        : { backgroundColor: `${V.yellow}10` }
                      }
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-flow status banner */}
            {autoFlowActive && autoFlowPos && activeRoutine && (
              <div className="mb-4 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #D8C18E12, #B89B5E08)', border: '1px solid #D8C18E30' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#D8C18E15' }}>
                  <Zap className="w-6 h-6" style={{ color: '#D8C18E' }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#D8C18E' }}>
                    {isRu ? 'Авто-режим' : 'Auto Mode'} · {isResting ? (isRu ? 'передышка' : 'rest') : (isRu ? 'работа' : 'work')}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: V.text }}>
                    {activeRoutine.exercises[autoFlowPos.exIdx]?.name} — {isRu ? 'круг' : 'round'} {autoFlowPos.roundIdx + 1}/{activeRoutine.exercises[autoFlowPos.exIdx]?.targetSets}
                  </p>
                  {(() => {
                    const cur = activeRoutine.exercises[autoFlowPos.exIdx];
                    const totalRounds = cur?.targetSets || 0;
                    let nextExIdx = autoFlowPos.exIdx;
                    let nextRound = autoFlowPos.roundIdx + 1;
                    if (nextRound >= totalRounds) { nextExIdx++; nextRound = 0; }
                    const nextEx = activeRoutine.exercises[nextExIdx];
                    if (!nextEx) return <p className="text-[10px] mt-0.5" style={{ color: V.textTertiary }}>{isRu ? 'Последнее упражнение!' : 'Last exercise!'}</p>;
                    return (
                      <p className="text-[10px] mt-0.5" style={{ color: V.textTertiary }}>
                        {isRu ? 'Далее:' : 'Next:'} {nextEx.name} · {isRu ? 'круг' : 'round'} {nextRound + 1}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* PR notification */}
            {newPR && (
              <div className="mb-4 rounded-2xl p-4 flex items-center gap-3 animate-in zoom-in-95"
                style={{ backgroundColor: '#D8C18E12', border: '1px solid #D8C18E30' }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#D8C18E]">
                    {isRu ? 'Новый рекорд!' : 'New Personal Record!'}
                  </p>
                  <p className="text-sm font-semibold text-[#F2F1EE]">
                    {newPR.exercise}: {newPR.weight} {isRu ? 'кг' : 'kg'}
                  </p>
                </div>
              </div>
            )}

            {/* Routine video player */}
            {activeRoutine?.routineVideoUrl && (() => {
              const video = resolveExerciseVideo('', activeRoutine.routineVideoUrl);
              if (!video) return null;
              return (
                <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${V.borderLight}` }}>
                  <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: V.bg2 }}>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" style={{ color: V.accent }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: V.textTertiary }}>
                        {isRu ? 'Видео тренировки' : 'Workout Video'}
                      </span>
                    </div>
                    <button onClick={() => setVideoPlayback(video)} className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                      style={{ backgroundColor: `${V.accent}15`, color: V.accent }}>
                      {isRu ? 'На весь экран' : 'Fullscreen'}
                    </button>
                  </div>
                  <div className="aspect-video bg-black">
                    {video.mode === 'youtube' ? (
                      <iframe src={`https://www.youtube.com/embed/${video.url}?rel=0`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video src={video.url} controls className="w-full h-full" />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Exercise timer (for plank etc.) */}
            {isExerciseTimerRunning && (
              <div className="mb-4 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95"
                style={{ backgroundColor: `${V.accent}08`, border: `1px solid ${V.accent}20` }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${V.accent}15` }}>
                    <Timer className="w-6 h-6" style={{ color: V.accent }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: V.accent }}>
                      {isRu ? 'Таймер упражнения' : 'Exercise Timer'}
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-tight" style={{ color: V.accent }}>
                      {formatDuration(exerciseTimer)}
                      {exerciseTimerTarget > 0 && <span className="text-lg text-[#5F5A54]"> / {formatDuration(exerciseTimerTarget)}</span>}
                    </p>
                  </div>
                </div>
                <button onClick={stopExerciseTimer}
                  className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ backgroundColor: `${V.accent}15`, color: V.accent }}>
                  {isRu ? 'Стоп' : 'Stop'}
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
                        {/* Video button */}
                        {(() => {
                          const customVideoUrl = activeRoutine?.exercises[exIdx]?.videoUrl;
                          const hasVideo = !!resolveExerciseVideo(exercise.exerciseName, customVideoUrl);
                          if (!hasVideo) {
                            return null;
                          }

                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openExerciseVideo(exercise.exerciseName, customVideoUrl);
                              }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          );
                        })()}
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

                    {/* Timed exercise: show timer + description */}
                    {isExpanded && activeRoutine?.exercises[exIdx]?.isTimedExercise && (
                      <div className="px-5 py-4 space-y-3 animate-in fade-in duration-200" style={{ borderBottom: `1px solid ${V.border}` }}>
                        {/* Description */}
                        <p className="text-xs leading-5 italic" style={{ color: V.textSecondary }}>
                          {(() => {
                            // Try common description keys
                            const name = exercise.exerciseName.toLowerCase();
                            if (name.includes('отжимани') || name.includes('push')) return t('workout.desc_pushups');
                            if (name.includes('присед') || name.includes('squat')) return t('workout.desc_squats');
                            if (name.includes('bird') || name.includes('четверен')) return t('workout.desc_bird_dog');
                            if (name.includes('статик') || name.includes('static') || name.includes('удерж')) return t('workout.desc_static');
                            if (name.includes('планк') || name.includes('plank')) return t('workout.desc_plank');
                            if (name.includes('стульч') || name.includes('wall sit')) return t('workout.desc_wallsit');
                            return isRu ? 'Удерживай позицию с правильной формой. Дыши ровно.' : 'Hold the position with proper form. Breathe steadily.';
                          })()}
                        </p>
                        {/* Timer button */}
                        <button onClick={() => startExerciseTimer(activeRoutine.exercises[exIdx].timedDuration || 30)}
                          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                          style={{ background: 'linear-gradient(135deg, #D8C18E, #B89B5E)', color: '#0A0A0F' }}>
                          <Timer className="w-4 h-4" />
                          {isRu ? `Старт таймер ${activeRoutine.exercises[exIdx].timedDuration || 30}с` : `Start ${activeRoutine.exercises[exIdx].timedDuration || 30}s Timer`}
                        </button>

                        {/* Complete buttons for each round */}
                        <div className="flex gap-2">
                          {exercise.sets.map((set, setIdx) => (
                            <button key={setIdx} onClick={() => toggleSetComplete(exIdx, setIdx)}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                              style={set.completed
                                ? { backgroundColor: '#4ADE8020', color: '#4ADE80', border: '1px solid #4ADE8030' }
                                : { backgroundColor: '#1A1A26', color: '#7F7A72', border: '1px solid #2A2A3C' }
                              }>
                              {set.completed ? '✅' : ''} {isRu ? `Круг ${setIdx + 1}` : `Round ${setIdx + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sets — hidden for timed exercises */}
                    {isExpanded && !activeRoutine?.exercises[exIdx]?.isTimedExercise && (
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

            {/* ── Today's Workout ─────────────────────────────── */}
            {(() => {
              const today = new Date().getDay(); // 0=Sun
              const todayRoutine = routines.find(r => r.weekdays?.includes(today));
              if (!todayRoutine) return null;
              const WEEKDAY_SHORT = isRu
                ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return (
                <div className="rounded-3xl overflow-hidden relative workout-shimmer"
                  style={{ background: `linear-gradient(135deg, ${V.orange}18, ${V.bg2})`, border: `1px solid ${V.orange}30` }}>
                  <div className="absolute top-0 right-0 w-60 h-60 -mr-20 -mt-10 rounded-full blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${V.orange}15, transparent 70%)` }} />
                  <div className="relative px-6 py-5 md:px-8 md:py-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#4ADE80] workout-pulse-ring" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.3em]" style={{ color: V.orange }}>
                        {isRu ? 'Тренировка сегодня' : "Today's Workout"} · {WEEKDAY_SHORT[today]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: V.text }}>
                          {todayRoutine.dayLabel || todayRoutine.name}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: V.textTertiary }}>
                          {todayRoutine.exercises.length} {isRu ? 'упражнений' : 'exercises'}
                          {todayRoutine.routineVideoUrl && <span> · 🎬 {isRu ? 'Видео' : 'Video'}</span>}
                        </p>
                      </div>
                      <button onClick={() => startWorkout(todayRoutine)}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-sm transition-all hover:scale-105 active:scale-95 workout-heartbeat"
                        style={{ background: `linear-gradient(135deg, ${V.orange}, ${V.orange}CC)`, color: V.bg0, boxShadow: `0 4px 20px ${V.orange}40` }}>
                        <Play className="w-5 h-5" />
                        {isRu ? 'Начать' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Weekly Schedule Strip ───────────────────────── */}
            {routines.some(r => r.weekdays && r.weekdays.length > 0) && (() => {
              const DAYS = isRu
                ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              // Map: JS day (0=Sun) → index in DAYS array (0=Mon)
              const dayIndexMap = [6, 0, 1, 2, 3, 4, 5]; // Sun=6, Mon=0, ...
              const todayIdx = dayIndexMap[new Date().getDay()];

              return (
                <div className="rounded-2xl p-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] mb-3" style={{ color: V.textTertiary }}>
                    {isRu ? 'Расписание недели' : 'Weekly Schedule'}
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((day, idx) => {
                      // Convert display index back to JS day: Mon=1, Tue=2, ... Sun=0
                      const jsDay = idx === 6 ? 0 : idx + 1;
                      const routine = routines.find(r => r.weekdays?.includes(jsDay));
                      const isToday = idx === todayIdx;
                      // Only mark done for TODAY's actual day, not all days
                      const isDone = isToday && logs.some(l => {
                        const logDate = new Date(l.date);
                        return logDate.toDateString() === new Date().toDateString() && l.routineName === routine?.name;
                      });

                      return (
                        <div key={idx}
                          className="rounded-xl p-2 text-center transition-all"
                          style={{
                            backgroundColor: routine ? (isDone ? `${V.success}10` : `${V.orange}08`) : V.bg3,
                            border: `1px solid ${isToday ? V.orange + '60' : routine ? V.orange + '20' : V.border}`,
                            boxShadow: isToday ? `0 0 0 2px ${V.orange}40` : 'none',
                          }}>
                          <p className={`text-[10px] font-bold uppercase ${isToday ? '' : ''}`}
                            style={{ color: isToday ? V.orange : V.textTertiary }}>
                            {day}
                          </p>
                          {routine ? (
                            <>
                              <div className="mt-1.5 mb-1">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: V.success }} />
                                ) : routine.routineVideoUrl ? (
                                  <Video className="w-4 h-4 mx-auto" style={{ color: V.orange }} />
                                ) : (
                                  <Dumbbell className="w-4 h-4 mx-auto" style={{ color: V.orange }} />
                                )}
                              </div>
                              <p className="text-[9px] font-semibold leading-tight truncate"
                                style={{ color: isDone ? V.success : V.textSecondary }}>
                                {routine.dayLabel || routine.name}
                              </p>
                            </>
                          ) : (
                            <p className="text-[9px] mt-2 mb-1" style={{ color: V.textDisabled }}>
                              {isRu ? 'Отдых' : 'Rest'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
              {routines.map((routine, i) => {
                const lastLog = logs.find(l => l.routineName === routine.name);
                return (
                  <div key={routine.id} className="workout-card-enter rounded-2xl overflow-hidden transition-all hover:translate-y-[-1px]"
                    style={{ backgroundColor: V.bg3, border: `1px solid ${V.borderLight}`, animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg" style={{ color: V.text }}>
                            {routine.dayLabel && <span className="text-[10px] font-extrabold uppercase tracking-wider mr-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${V.orange}15`, color: V.orange }}>{routine.dayLabel}</span>}
                            {routine.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm" style={{ color: V.textTertiary }}>
                              {routine.exercises.length} {isRu ? 'упражнений' : 'exercises'}
                            </span>
                            {routine.routineVideoUrl && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${V.accent}10`, color: V.accent }}>
                                <Video className="w-3 h-3" /> Video
                              </span>
                            )}
                            {routine.weekdays && routine.weekdays.length > 0 && (
                              <span className="text-[10px] font-mono" style={{ color: V.textDisabled }}>
                                {routine.weekdays.map(d => (isRu ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] : ['Su','Mo','Tu','We','Th','Fr','Sa'])[d]).join(' · ')}
                              </span>
                            )}
                          </div>
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

                    {/* Watch Video button */}
                    {routine.routineVideoUrl && (
                      <button onClick={() => {
                        const video = resolveExerciseVideo('', routine.routineVideoUrl!);
                        if (video) setVideoPlayback(video);
                      }}
                        className="w-full py-3 font-bold flex items-center justify-center gap-2 text-sm transition-all"
                        style={{ backgroundColor: 'rgba(93,174,255,0.1)', color: '#5DAEFF', borderBottom: '1px solid #1E1E2E' }}>
                        <Video className="w-4 h-4" />
                        {isRu ? 'Смотреть видео' : 'Watch Video'}
                      </button>
                    )}

                    {/* Assign to calendar */}
                    {!routine.weekdays?.length && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        // Assign to all weekdays (Mon-Fri)
                        setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, weekdays: [1,2,3,4,5] } : r));
                      }}
                        className="w-full py-2.5 font-bold flex items-center justify-center gap-2 text-xs transition-all"
                        style={{ backgroundColor: `${V.orange}10`, color: V.orange, borderBottom: `1px solid ${V.border}` }}>
                        📅 {isRu ? 'Назначить на Пн-Пт' : 'Assign Mon-Fri'}
                      </button>
                    )}

                    {/* Start button */}
                    <button onClick={() => startWorkout(routine)}
                      className="w-full py-3.5 font-bold flex items-center justify-center gap-2 text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #FF6B35, #FF4444)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 16px rgba(255,107,53,0.25)',
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
                {
                  label: isRu ? 'СОЖЖЕНО ККАЛ' : 'CALORIES BURNED',
                  value: totalCalories > 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories.toString(),
                  icon: Flame,
                  color: V.orange,
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

            {/* Export CSV */}
            {logs.length > 0 && (
              <button onClick={() => {
                const rows = ['Date,Routine,Duration(min),Exercises,Volume(kg),Calories'];
                logs.forEach(log => {
                  const dur = Math.round(log.durationSeconds / 60);
                  const vol = log.exercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
                  const cal = estimateCalories(log);
                  rows.push(`${new Date(log.date).toLocaleDateString()},${log.routineName},${dur},${log.exercises.length},${vol},${cal}`);
                });
                const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `valhalla-workouts-${new Date().toISOString().split('T')[0]}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}
                className="w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
                style={{ backgroundColor: `${V.accent}10`, color: V.accent, border: `1px solid ${V.accent}20` }}>
                📊 {isRu ? 'Экспорт CSV' : 'Export CSV'}
              </button>
            )}

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

        /* ─── Videos Tab ────────────────────────────────────── */
        ) : activeTab === 'videos' ? (
          <VideoLibrary />

        /* ─── Plans Tab ─────────────────────────────────────── */
        ) : activeTab === 'plans' ? (
          <TrainingPlanView routines={routines} logs={logs} onStartWorkout={startWorkout} />

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

            {/* Category filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { id: 'all', label: isRu ? 'Все' : 'All' },
                { id: 'bodyweight', label: isRu ? 'Своим весом' : 'Bodyweight' },
                { id: 'running', label: isRu ? 'Бег' : 'Running' },
                { id: 'stretch', label: isRu ? 'Растяжка' : 'Stretch' },
                { id: 'weights', label: isRu ? 'С весами' : 'Weights' },
              ].map(cat => (
                <button key={cat.id} onClick={() => setExploreFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    exploreFilter === cat.id ? 'text-[#0A0A0A]' : ''
                  }`}
                  style={exploreFilter === cat.id
                    ? { backgroundColor: V.orange, boxShadow: `0 2px 8px ${V.orange}30` }
                    : { backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.textTertiary }
                  }>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECOMMENDED_WORKOUTS.filter(rec => exploreFilter === 'all' || rec.category === exploreFilter).map((rec, i) => {
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

              {/* Routine-level video (covers all exercises) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Видео тренировки (одно на все упражнения)' : 'Routine Video (covers all exercises)'}
                </label>
                <input
                  type="text"
                  value={newRoutineVideo}
                  onChange={(e) => setNewRoutineVideo(e.target.value)}
                  placeholder={isRu ? 'YouTube ссылка на видео всей тренировки' : 'YouTube URL for full routine video'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderLight}`, color: V.text }}
                  onFocus={(e) => { e.target.style.borderColor = V.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = V.borderLight; }}
                />
                <p className="text-[10px] mt-1.5" style={{ color: V.textDisabled }}>
                  {isRu ? 'Если видео содержит несколько упражнений — укажите его здесь, а для каждого упражнения можно добавить таймкод.' : 'If a single video contains all exercises, add it here. Then add timestamps per exercise.'}
                </p>
              </div>

              {/* Rest timer config */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Время отдыха между подходами' : 'Rest time between sets'}
                </label>
                <div className="flex gap-2">
                  {REST_OPTIONS.map(sec => (
                    <button key={sec} type="button"
                      onClick={() => setNewRoutineRest(sec)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 ${
                        newRoutineRest === sec ? 'text-[#0A0A0A]' : ''
                      }`}
                      style={newRoutineRest === sec
                        ? { backgroundColor: V.accent, boxShadow: `0 2px 8px ${V.accent}30` }
                        : { backgroundColor: V.bg2, border: `1px solid ${V.border}`, color: V.textTertiary }
                      }
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Day label */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Метка дня (опционально)' : 'Day label (optional)'}
                </label>
                <input
                  type="text"
                  value={newDayLabel}
                  onChange={(e) => setNewDayLabel(e.target.value)}
                  placeholder={isRu ? 'например: День A, Push, Верх тела' : 'e.g. Day A, Push, Upper Body'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderLight}`, color: V.text }}
                  onFocus={(e) => { e.target.style.borderColor = V.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = V.borderLight; }}
                />
              </div>

              {/* Weekday picker */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Дни недели' : 'Schedule days'}
                </label>
                <div className="flex gap-1.5">
                  {(isRu ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map((day, idx) => {
                    const jsDay = idx === 6 ? 0 : idx + 1; // Mon=1..Sat=6, Sun=0
                    const isSelected = newWeekdays.includes(jsDay);
                    return (
                      <button key={idx} type="button"
                        onClick={() => setNewWeekdays(prev =>
                          isSelected ? prev.filter(d => d !== jsDay) : [...prev, jsDay]
                        )}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={isSelected
                          ? { backgroundColor: V.orange, color: V.bg0, boxShadow: `0 2px 8px ${V.orange}30` }
                          : { backgroundColor: V.bg2, border: `1px solid ${V.border}`, color: V.textTertiary }
                        }
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: V.textDisabled }}>
                  {isRu ? 'Выберите дни, когда выполнять эту тренировку' : 'Select which days to perform this workout'}
                </p>
              </div>

              {/* Exercises */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: V.textTertiary }}>
                  {isRu ? 'Упражнения' : 'Exercises'}
                </label>
                <div className="space-y-2">
                  {newExercises.map((ex, i) => (
                    <div key={ex.id} className="p-3 rounded-xl space-y-3"
                      style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                      <div className="flex gap-2 items-center">
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

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: V.textDisabled }}>
                          {isRu ? 'Видео упражнения' : 'Exercise video'}
                        </label>
                        <div className="flex flex-col md:flex-row gap-2">
                          <input
                            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                            style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }}
                            placeholder={isRu ? 'YouTube ссылка или file:///video.mp4' : 'YouTube URL or file:///video.mp4'}
                            value={ex.videoUrl || ''}
                            onChange={(e) => updateExerciseInRoutine(i, 'videoUrl', e.target.value)}
                          />
                          {desktop.isDesktop && (
                            <button
                              type="button"
                              onClick={() => pickVideoForExercise(i)}
                              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                              style={{
                                backgroundColor: `${V.accent}10`,
                                color: V.accent,
                                border: `1px solid ${V.accent}20`,
                              }}>
                              {isRu ? 'Файл с ПК' : 'Pick file'}
                            </button>
                          )}
                          {!!ex.videoUrl && (
                            <button
                              type="button"
                              onClick={() => updateExerciseInRoutine(i, 'videoUrl', '')}
                              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                              style={{
                                backgroundColor: `${V.danger}10`,
                                color: V.danger,
                                border: `1px solid ${V.danger}20`,
                              }}>
                              {isRu ? 'Очистить' : 'Clear'}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: V.textDisabled }}>
                          {isRu
                            ? 'Поддерживаются YouTube-ссылки и локальные видеофайлы с компьютера.'
                            : 'Supports YouTube links and local video files from your computer.'}
                        </p>
                      </div>
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
      {/* ═══════════════════════════════════════════
           VIDEO MODAL
         ═══════════════════════════════════════════ */}
      {videoPlayback && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-[#06060B]/90 backdrop-blur-sm" onClick={() => setVideoPlayback(null)} />
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A2E]">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" style={{ color: V.accent }} />
                  <span className="text-sm font-bold" style={{ color: V.text }}>{videoPlayback.title}</span>
                </div>
                <button onClick={() => setVideoPlayback(null)} className="p-1.5 rounded-lg hover:bg-[#1F1F2B] transition-colors">
                  <X className="w-4 h-4" style={{ color: V.textTertiary }} />
                </button>
              </div>
              <div className="aspect-video">
                {videoPlayback.mode === 'youtube' ? (
                  <iframe
                    src={videoPlayback.url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={videoPlayback.title}
                  />
                ) : (
                  <video
                    src={videoPlayback.url}
                    className="w-full h-full bg-black"
                    controls
                    playsInline
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutView;
