/**
 * Eclipse Valhalla — Growth Service
 *
 * Drives user activation, engagement, and habit formation.
 *
 * First Win: quest created within 60s of first session
 * Auto-suggest: contextual quest/action recommendations
 * Milestone tracking: celebrates key moments
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface Milestone {
  id: string;
  title: string;
  message: string;
  icon: string;
  achieved: boolean;
  achievedAt?: string;
}

export interface AutoSuggestion {
  type: 'quest' | 'focus' | 'nexus' | 'oracle';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════
// FIRST WIN TRACKING
// ═══════════════════════════════════════════

const GROWTH_KEY = 'eclipse_growth';

interface GrowthState {
  firstSessionAt: number;
  firstQuestCreatedAt: number | null;
  firstQuestCompletedAt: number | null;
  firstWidgetAt: number | null;
  firstOracleAt: number | null;
  firstNexusAt: number | null;
  milestonesAchieved: string[];
  totalSessions: number;
  suggestionsShown: number;
  suggestionsDismissed: number;
}

function getState(): GrowthState {
  try {
    const raw = localStorage.getItem(GROWTH_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch { return defaultState(); }
}

function saveState(s: GrowthState): void {
  localStorage.setItem(GROWTH_KEY, JSON.stringify(s));
}

function defaultState(): GrowthState {
  return {
    firstSessionAt: Date.now(),
    firstQuestCreatedAt: null,
    firstQuestCompletedAt: null,
    firstWidgetAt: null,
    firstOracleAt: null,
    firstNexusAt: null,
    milestonesAchieved: [],
    totalSessions: 0,
    suggestionsShown: 0,
    suggestionsDismissed: 0,
  };
}

// ═══════════════════════════════════════════
// ACTIVATION TRACKING
// ═══════════════════════════════════════════

export function trackFirstQuest(): void {
  const s = getState();
  if (!s.firstQuestCreatedAt) {
    s.firstQuestCreatedAt = Date.now();
    const timeToFirstQuest = s.firstQuestCreatedAt - s.firstSessionAt;
    saveState(s);
    trackEvent('first_win', { timeMs: timeToFirstQuest, type: 'quest' });
  }
}

export function trackFirstComplete(): void {
  const s = getState();
  if (!s.firstQuestCompletedAt) {
    s.firstQuestCompletedAt = Date.now();
    saveState(s);
    trackEvent('first_complete');
  }
}

export function trackFirstWidget(): void {
  const s = getState();
  if (!s.firstWidgetAt) {
    s.firstWidgetAt = Date.now();
    saveState(s);
    trackEvent('first_widget');
  }
}

export function trackFirstOracle(): void {
  const s = getState();
  if (!s.firstOracleAt) {
    s.firstOracleAt = Date.now();
    saveState(s);
    trackEvent('first_oracle');
  }
}

export function trackFirstNexus(): void {
  const s = getState();
  if (!s.firstNexusAt) {
    s.firstNexusAt = Date.now();
    saveState(s);
    trackEvent('first_nexus');
  }
}

export function trackSession(): void {
  const s = getState();
  s.totalSessions++;
  saveState(s);
}

// ═══════════════════════════════════════════
// ACTIVATION STATUS
// ═══════════════════════════════════════════

export interface ActivationStatus {
  questCreated: boolean;
  questCompleted: boolean;
  widgetUsed: boolean;
  oracleUsed: boolean;
  nexusUsed: boolean;
  activationScore: number; // 0-100
}

export function getActivationStatus(): ActivationStatus {
  const s = getState();
  const steps = [
    s.firstQuestCreatedAt !== null,
    s.firstQuestCompletedAt !== null,
    s.firstWidgetAt !== null,
    s.firstOracleAt !== null,
    s.firstNexusAt !== null,
  ];
  const completed = steps.filter(Boolean).length;

  return {
    questCreated: steps[0],
    questCompleted: steps[1],
    widgetUsed: steps[2],
    oracleUsed: steps[3],
    nexusUsed: steps[4],
    activationScore: Math.round((completed / steps.length) * 100),
  };
}

// ═══════════════════════════════════════════
// AUTO-SUGGESTIONS
// ═══════════════════════════════════════════

/**
 * Generate contextual suggestions based on user state.
 */
export function getAutoSuggestions(opts: {
  questCount: number;
  overdueCount: number;
  streak: number;
  hasNexusSources: boolean;
  hasUsedOracle: boolean;
}): AutoSuggestion[] {
  const suggestions: AutoSuggestion[] = [];

  // No quests → suggest creating one
  if (opts.questCount === 0) {
    suggestions.push({
      type: 'quest',
      title: 'Create your first objective.',
      description: 'The system needs targets to enforce.',
      action: 'create_quest',
      priority: 'high',
    });
  }

  // Overdue quests → suggest Oracle analysis
  if (opts.overdueCount > 2) {
    suggestions.push({
      type: 'oracle',
      title: `${opts.overdueCount} overdue. Ask the Oracle.`,
      description: 'Get a battle plan to clear the backlog.',
      action: 'open_oracle',
      priority: 'high',
    });
  }

  // No Nexus → suggest adding source
  if (!opts.hasNexusSources) {
    suggestions.push({
      type: 'nexus',
      title: 'Add intelligence sources.',
      description: 'Nexus needs signals. Add RSS or Telegram channels.',
      action: 'open_nexus',
      priority: 'medium',
    });
  }

  // Streak == 0 and has quests → motivate
  if (opts.streak === 0 && opts.questCount > 0) {
    suggestions.push({
      type: 'focus',
      title: 'Start a new streak.',
      description: 'Complete one objective today to begin.',
      action: 'focus_quest',
      priority: 'high',
    });
  }

  // Never used Oracle → suggest
  if (!opts.hasUsedOracle && opts.questCount > 3) {
    suggestions.push({
      type: 'oracle',
      title: 'Try the Oracle.',
      description: 'AI that plans your day and calls out weakness.',
      action: 'open_oracle',
      priority: 'medium',
    });
  }

  return suggestions.slice(0, 3); // Max 3 at a time
}

// ═══════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════

const MILESTONE_DEFS: Omit<Milestone, 'achieved' | 'achievedAt'>[] = [
  { id: 'first_quest',   title: 'First Objective',  message: 'Quest created. The path begins.',          icon: '⚔️' },
  { id: 'first_complete', title: 'First Victory',   message: 'Objective completed. Discipline confirmed.', icon: '✓' },
  { id: 'streak_3',      title: '3-Day Streak',     message: 'Consistency emerging.',                     icon: '🔥' },
  { id: 'streak_7',      title: '7-Day Streak',     message: 'One week of discipline.',                   icon: '🔥' },
  { id: 'streak_30',     title: '30-Day Streak',    message: 'Legendary consistency.',                    icon: '⚡' },
  { id: 'level_5',       title: 'Level 5',          message: 'Rising through the ranks.',                 icon: '◉' },
  { id: 'level_10',      title: 'Level 10',         message: 'Elite tier reached.',                       icon: '◉' },
  { id: 'score_80',      title: 'Discipline 80+',   message: 'Operating at peak.',                        icon: '🛡' },
  { id: 'nexus_first',   title: 'First Signal',     message: 'Intelligence pipeline active.',             icon: '📡' },
  { id: 'quests_50',     title: '50 Quests',        message: 'Half a century of objectives.',             icon: '⚔️' },
];

/**
 * Check and record milestone achievements.
 */
export function checkMilestones(opts: {
  questsCreated: number;
  questsCompleted: number;
  streak: number;
  level: number;
  disciplineScore: number;
  hasNexusItems: boolean;
}): Milestone[] {
  const s = getState();
  const newlyAchieved: Milestone[] = [];

  const checks: Record<string, boolean> = {
    first_quest:    opts.questsCreated >= 1,
    first_complete: opts.questsCompleted >= 1,
    streak_3:       opts.streak >= 3,
    streak_7:       opts.streak >= 7,
    streak_30:      opts.streak >= 30,
    level_5:        opts.level >= 5,
    level_10:       opts.level >= 10,
    score_80:       opts.disciplineScore >= 80,
    nexus_first:    opts.hasNexusItems,
    quests_50:      opts.questsCreated >= 50,
  };

  for (const def of MILESTONE_DEFS) {
    if (checks[def.id] && !s.milestonesAchieved.includes(def.id)) {
      s.milestonesAchieved.push(def.id);
      newlyAchieved.push({ ...def, achieved: true, achievedAt: new Date().toISOString() });
      trackEvent('milestone_achieved', { id: def.id });
    }
  }

  if (newlyAchieved.length > 0) saveState(s);

  return newlyAchieved;
}

/**
 * Get all milestones with achievement status.
 */
export function getAllMilestones(): Milestone[] {
  const s = getState();
  return MILESTONE_DEFS.map(def => ({
    ...def,
    achieved: s.milestonesAchieved.includes(def.id),
  }));
}
