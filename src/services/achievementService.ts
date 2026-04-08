/**
 * Eclipse Valhalla — Achievement System
 *
 * Tracks warrior milestones across quests, focus, streaks, and mastery.
 * Persists to localStorage, fires unlock events.
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type AchievementCategory = 'combat' | 'discipline' | 'mastery' | 'endurance' | 'intelligence';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  /** Current progress value */
  current: number;
  /** Target value to unlock */
  target: number;
  /** Unlocked timestamp (null if locked) */
  unlockedAt: string | null;
  /** XP reward on unlock */
  xpReward: number;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  target: number;
  xpReward: number;
}

// ═══════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS (30+)
// ═══════════════════════════════════════════

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // ── COMBAT (quests) ──
  { id: 'first_blood',       category: 'combat', tier: 'bronze',    icon: '⚔️', target: 1,   xpReward: 10 },
  { id: 'warrior_path',      category: 'combat', tier: 'bronze',    icon: '🗡️', target: 5,   xpReward: 25 },
  { id: 'battle_hardened',   category: 'combat', tier: 'silver',    icon: '🛡️', target: 25,  xpReward: 50 },
  { id: 'war_machine',       category: 'combat', tier: 'gold',      icon: '⚒️', target: 100, xpReward: 150 },
  { id: 'legend_of_valhalla',category: 'combat', tier: 'legendary', icon: '👑', target: 500, xpReward: 500 },
  { id: 'daily_conqueror',   category: 'combat', tier: 'bronze',    icon: '🌅', target: 5,   xpReward: 30 },
  { id: 'daily_dominator',   category: 'combat', tier: 'silver',    icon: '☀️', target: 10,  xpReward: 75 },

  // ── DISCIPLINE (streaks) ──
  { id: 'first_flame',       category: 'discipline', tier: 'bronze',    icon: '🔥', target: 3,   xpReward: 15 },
  { id: 'steady_flame',      category: 'discipline', tier: 'silver',    icon: '🔥', target: 7,   xpReward: 40 },
  { id: 'eternal_flame',     category: 'discipline', tier: 'gold',      icon: '🔥', target: 30,  xpReward: 200 },
  { id: 'undying_fire',      category: 'discipline', tier: 'legendary', icon: '💎', target: 100, xpReward: 500 },
  { id: 'no_escape',         category: 'discipline', tier: 'silver',    icon: '🔒', target: 10,  xpReward: 60 },
  { id: 'iron_will',         category: 'discipline', tier: 'gold',      icon: '⛓️', target: 50,  xpReward: 150 },

  // ── ENDURANCE (focus sessions) ──
  { id: 'first_trance',      category: 'endurance', tier: 'bronze',    icon: '🎯', target: 1,   xpReward: 10 },
  { id: 'deep_focus',        category: 'endurance', tier: 'bronze',    icon: '🧠', target: 5,   xpReward: 25 },
  { id: 'flow_state',        category: 'endurance', tier: 'silver',    icon: '⚡', target: 25,  xpReward: 75 },
  { id: 'zen_master',        category: 'endurance', tier: 'gold',      icon: '🧘', target: 100, xpReward: 200 },
  { id: 'hour_warrior',      category: 'endurance', tier: 'silver',    icon: '⏱️', target: 60,  xpReward: 50 },
  { id: 'marathon_mind',     category: 'endurance', tier: 'gold',      icon: '🏔️', target: 300, xpReward: 150 },

  // ── INTELLIGENCE (AI usage) ──
  { id: 'first_counsel',     category: 'intelligence', tier: 'bronze',    icon: '🔮', target: 1,   xpReward: 10 },
  { id: 'seer_student',      category: 'intelligence', tier: 'bronze',    icon: '📚', target: 10,  xpReward: 25 },
  { id: 'oracle_adept',      category: 'intelligence', tier: 'silver',    icon: '✨', target: 50,  xpReward: 75 },
  { id: 'mind_architect',    category: 'intelligence', tier: 'gold',      icon: '🏛️', target: 200, xpReward: 200 },

  // ── MASTERY (features used) ──
  { id: 'explorer',          category: 'mastery', tier: 'bronze',    icon: '🧭', target: 3,   xpReward: 15 },
  { id: 'completionist',     category: 'mastery', tier: 'silver',    icon: '🗺️', target: 6,   xpReward: 50 },
  { id: 'note_keeper',       category: 'mastery', tier: 'bronze',    icon: '📝', target: 5,   xpReward: 15 },
  { id: 'lore_master',       category: 'mastery', tier: 'silver',    icon: '📖', target: 25,  xpReward: 50 },
  { id: 'news_reader',       category: 'mastery', tier: 'bronze',    icon: '🦅', target: 10,  xpReward: 15 },
  { id: 'workout_warrior',   category: 'mastery', tier: 'silver',    icon: '💪', target: 10,  xpReward: 50 },
  { id: 'forge_master',      category: 'mastery', tier: 'gold',      icon: '🔨', target: 10,  xpReward: 75 },
  { id: 'polyglot',          category: 'mastery', tier: 'bronze',    icon: '🌐', target: 1,   xpReward: 10 },
];

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const STORAGE_KEY = 'eclipse_achievements';
const STATS_KEY = 'eclipse_achievement_stats';

export interface AchievementStats {
  questsCompleted: number;
  questsCompletedToday: number;
  maxStreak: number;
  currentStreak: number;
  focusSessions: number;
  focusMinutes: number;
  sessionsWithoutEscape: number;
  aiChats: number;
  notesCreated: number;
  newsRead: number;
  workoutsCompleted: number;
  imagesGenerated: number;
  featuresUsed: Set<string> | string[];
  languageSwitched: boolean;
  lastQuestDate: string;
}

const DEFAULT_STATS: AchievementStats = {
  questsCompleted: 0,
  questsCompletedToday: 0,
  maxStreak: 0,
  currentStreak: 0,
  focusSessions: 0,
  focusMinutes: 0,
  sessionsWithoutEscape: 0,
  aiChats: 0,
  notesCreated: 0,
  newsRead: 0,
  workoutsCompleted: 0,
  imagesGenerated: 0,
  featuresUsed: [],
  languageSwitched: false,
  lastQuestDate: '',
};

function getStats(): AchievementStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_STATS };
}

function saveStats(stats: AchievementStats): void {
  const toSave = { ...stats, featuresUsed: Array.from(stats.featuresUsed) };
  localStorage.setItem(STATS_KEY, JSON.stringify(toSave));
}

function getAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    current: 0,
    unlockedAt: null,
  }));
}

function saveAchievements(achievements: Achievement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
}

// ═══════════════════════════════════════════
// TRACKING
// ═══════════════════════════════════════════

type UnlockCallback = (achievement: Achievement) => void;
let _onUnlock: UnlockCallback | null = null;

export function onAchievementUnlock(cb: UnlockCallback): void {
  _onUnlock = cb;
}

function checkAndUnlock(achievements: Achievement[], stats: AchievementStats): Achievement[] {
  const mapping: Record<string, number> = {
    // Combat
    first_blood: stats.questsCompleted,
    warrior_path: stats.questsCompleted,
    battle_hardened: stats.questsCompleted,
    war_machine: stats.questsCompleted,
    legend_of_valhalla: stats.questsCompleted,
    daily_conqueror: stats.questsCompletedToday,
    daily_dominator: stats.questsCompletedToday,
    // Discipline
    first_flame: stats.currentStreak,
    steady_flame: stats.currentStreak,
    eternal_flame: stats.currentStreak,
    undying_fire: stats.currentStreak,
    no_escape: stats.sessionsWithoutEscape,
    iron_will: stats.sessionsWithoutEscape,
    // Endurance
    first_trance: stats.focusSessions,
    deep_focus: stats.focusSessions,
    flow_state: stats.focusSessions,
    zen_master: stats.focusSessions,
    hour_warrior: stats.focusMinutes,
    marathon_mind: stats.focusMinutes,
    // Intelligence
    first_counsel: stats.aiChats,
    seer_student: stats.aiChats,
    oracle_adept: stats.aiChats,
    mind_architect: stats.aiChats,
    // Mastery
    explorer: Array.from(stats.featuresUsed).length,
    completionist: Array.from(stats.featuresUsed).length,
    note_keeper: stats.notesCreated,
    lore_master: stats.notesCreated,
    news_reader: stats.newsRead,
    workout_warrior: stats.workoutsCompleted,
    forge_master: stats.imagesGenerated,
    polyglot: stats.languageSwitched ? 1 : 0,
  };

  let changed = false;
  for (const a of achievements) {
    const value = mapping[a.id];
    if (value !== undefined) {
      a.current = value;
      if (!a.unlockedAt && value >= a.target) {
        a.unlockedAt = new Date().toISOString();
        changed = true;
        if (_onUnlock) _onUnlock(a);
        // Check for new rewards
        try {
          import('./rewardsService').then(({ checkRewards }) => {
            const unlockedIds = achievements.filter(x => x.unlockedAt).map(x => x.id);
            checkRewards(unlockedIds);
          }).catch(() => {});
        } catch {}
      }
    }
  }

  if (changed) saveAchievements(achievements);
  return achievements;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export function trackEvent(event: string, value?: number): void {
  const stats = getStats();

  switch (event) {
    case 'quest_complete':
      stats.questsCompleted++;
      stats.questsCompletedToday++;
      stats.lastQuestDate = new Date().toISOString().split('T')[0];
      break;
    case 'focus_complete':
      stats.focusSessions++;
      if (value) stats.focusMinutes += value;
      break;
    case 'focus_no_escape':
      stats.sessionsWithoutEscape++;
      break;
    case 'streak_update':
      if (value !== undefined) {
        stats.currentStreak = value;
        if (value > stats.maxStreak) stats.maxStreak = value;
      }
      break;
    case 'ai_chat':
      stats.aiChats++;
      break;
    case 'note_create':
      stats.notesCreated++;
      break;
    case 'news_read':
      stats.newsRead++;
      break;
    case 'workout_complete':
      stats.workoutsCompleted++;
      break;
    case 'image_generate':
      stats.imagesGenerated++;
      break;
    case 'feature_use':
      if (value !== undefined || typeof event === 'string') {
        const features = new Set(Array.from(stats.featuresUsed));
        features.add(String(value));
        stats.featuresUsed = Array.from(features);
      }
      break;
    case 'language_switch':
      stats.languageSwitched = true;
      break;
    case 'daily_reset':
      stats.questsCompletedToday = 0;
      break;
  }

  saveStats(stats);
  const achievements = getAchievements();
  checkAndUnlock(achievements, stats);
}

export function getAllAchievements(): Achievement[] {
  const stats = getStats();
  const achievements = getAchievements();
  return checkAndUnlock(achievements, stats);
}

export function getUnlockedCount(): number {
  return getAchievements().filter(a => a.unlockedAt).length;
}

export function getTotalCount(): number {
  return ACHIEVEMENT_DEFS.length;
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return getAllAchievements().filter(a => a.category === category);
}

export function getRecentUnlocks(limit: number = 5): Achievement[] {
  return getAllAchievements()
    .filter(a => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, limit);
}

export function getNextToUnlock(): Achievement[] {
  return getAllAchievements()
    .filter(a => !a.unlockedAt && a.current > 0)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))
    .slice(0, 5);
}
