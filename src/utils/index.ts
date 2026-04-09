
import { Priority, RepeatType, Category, Theme } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getGreetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting.morning';
  if (hour < 18) return 'greeting.afternoon';
  return 'greeting.evening';
};

export const playNotificationSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.value = 440;
  gain.gain.value = 0.1;

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
  setTimeout(() => osc.stop(), 800);
};

/** Play a success/completion sound */
export function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    // Rising tone — success feel
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}

/** Play achievement unlock sound — dramatic fanfare */
export function playAchievementSound() {
  try {
    const ctx = new AudioContext();
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  } catch {}
}

/** Play a tick sound for timer */
export function playTickSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

export const formatDate = (isoString: string, locale: 'en' | 'ru' = 'en'): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const locales = locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(locales, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const toLocalISOString = (date: Date): string => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const getDaysInMonth = (year: number, month: number, mondayStart = false): (Date | null)[] => {
  const date = new Date(year, month, 1);
  const days: (Date | null)[] = [];
  const rawDay = date.getDay();
  const firstDayIndex = mondayStart ? (rawDay + 6) % 7 : rawDay;
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.HIGH: return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400';
    case Priority.MEDIUM: return 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400';
    case Priority.LOW: return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400';
    default: return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
  }
};

export const getCategoryColor = (category: Category) => {
  switch (category) {
    case Category.WORK: return 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/50 dark:text-purple-400';
    case Category.PERSONAL: return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400';
    case Category.HEALTH: return 'text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400';
    case Category.SHOPPING: return 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400';
    case Category.FINANCE: return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400';
    case Category.EDUCATION: return 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/50 dark:text-indigo-400';
    default: return 'text-slate-600 bg-slate-50 border-slate-100';
  }
};

export const getNextOccurrence = (date: Date, repeatType: RepeatType): Date => {
  const nextDate = new Date(date);
  switch (repeatType) {
    case RepeatType.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case RepeatType.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case RepeatType.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case RepeatType.NONE:
    default:
      break;
  }
  return nextDate;
};

// --- THEMES ---
export const THEME_COLORS: Record<Theme, { primary: string, hover: string, light: string, gradient: string }> = {
  blue: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', gradient: 'from-blue-600 to-slate-900' },
  purple: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', gradient: 'from-purple-600 to-slate-900' },
  emerald: { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50', gradient: 'from-emerald-600 to-slate-900' },
  rose: { primary: 'bg-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', gradient: 'from-rose-600 to-slate-900' }
};

// --- GAMIFICATION ---
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 10000];

export const calculateLevel = (xp: number) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const getNextLevelXp = (level: number) => {
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
};

// --- AI PARSER (Simulated NLP) ---
export const parseSmartTask = (input: string) => {
  const lower = input.toLowerCase();
  const result = {
    title: input,
    priority: Priority.MEDIUM,
    date: new Date(),
    category: Category.PERSONAL
  };

  if (lower.includes('!high') || lower.includes('!important') || lower.includes('!важно')) {
    result.priority = Priority.HIGH;
    result.title = result.title.replace(/!high|!important|!важно/gi, '');
  } else if (lower.includes('!low') || lower.includes('!низко')) {
    result.priority = Priority.LOW;
    result.title = result.title.replace(/!low|!низко/gi, '');
  }

  if (lower.includes('tomorrow') || lower.includes('завтра')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    result.date = d;
    result.title = result.title.replace(/tomorrow|завтра/gi, '');
  } else if (lower.includes('tonight') || lower.includes('вечером')) {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    result.date = d;
    result.title = result.title.replace(/tonight|вечером/gi, '');
  } else if (lower.includes('next week') || lower.includes('на след неделе')) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    result.date = d;
    result.title = result.title.replace(/next week|на след неделе/gi, '');
  }

  result.title = result.title.trim().replace(/\s+/g, ' ');

  return result;
};
