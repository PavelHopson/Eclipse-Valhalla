/**
 * Eclipse Valhalla — Rewards System
 * Unlockable rewards for milestones: themes, titles, badges
 */

export type RewardType = 'title' | 'theme' | 'badge' | 'feature';

export interface Reward {
  id: string;
  type: RewardType;
  icon: string;
  requirement: string;    // achievement ID or milestone
  unlockedAt: string | null;
}

const REWARDS: Reward[] = [
  // Titles
  { id: 'title_initiate', type: 'title', icon: '⚔️', requirement: 'first_blood', unlockedAt: null },
  { id: 'title_warrior', type: 'title', icon: '🗡️', requirement: 'warrior_path', unlockedAt: null },
  { id: 'title_veteran', type: 'title', icon: '🛡️', requirement: 'battle_hardened', unlockedAt: null },
  { id: 'title_legend', type: 'title', icon: '👑', requirement: 'legend_of_valhalla', unlockedAt: null },
  { id: 'title_disciplined', type: 'title', icon: '🔥', requirement: 'eternal_flame', unlockedAt: null },
  { id: 'title_zen', type: 'title', icon: '🧘', requirement: 'zen_master', unlockedAt: null },
  { id: 'title_oracle', type: 'title', icon: '🔮', requirement: 'oracle_adept', unlockedAt: null },
  // Themes
  { id: 'theme_blood', type: 'theme', icon: '🩸', requirement: 'war_machine', unlockedAt: null },
  { id: 'theme_gold', type: 'theme', icon: '✨', requirement: 'eternal_flame', unlockedAt: null },
  { id: 'theme_void', type: 'theme', icon: '🌑', requirement: 'zen_master', unlockedAt: null },
  // Badges
  { id: 'badge_iron', type: 'badge', icon: '⛓️', requirement: 'iron_will', unlockedAt: null },
  { id: 'badge_marathon', type: 'badge', icon: '🏔️', requirement: 'marathon_mind', unlockedAt: null },
  { id: 'badge_architect', type: 'badge', icon: '🏛️', requirement: 'mind_architect', unlockedAt: null },
  { id: 'badge_complete', type: 'badge', icon: '🗺️', requirement: 'completionist', unlockedAt: null },
  // Features
  { id: 'feature_custom_sounds', type: 'feature', icon: '🔔', requirement: 'deep_focus', unlockedAt: null },
  { id: 'feature_stats_export', type: 'feature', icon: '📊', requirement: 'workout_warrior', unlockedAt: null },
];

const STORAGE_KEY = 'eclipse_rewards';

function getRewards(): Reward[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return REWARDS.map(r => ({ ...r }));
}

function saveRewards(rewards: Reward[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
}

export function checkRewards(unlockedAchievementIds: string[]): Reward | null {
  const rewards = getRewards();
  let newReward: Reward | null = null;

  for (const reward of rewards) {
    if (!reward.unlockedAt && unlockedAchievementIds.includes(reward.requirement)) {
      reward.unlockedAt = new Date().toISOString();
      if (!newReward) newReward = reward;
    }
  }

  saveRewards(rewards);
  return newReward;
}

export function getAllRewards(): Reward[] {
  return getRewards();
}

export function getUnlockedRewards(): Reward[] {
  return getRewards().filter(r => r.unlockedAt);
}

export function getActiveTitle(): Reward | null {
  try {
    const id = localStorage.getItem('eclipse_active_title');
    if (id) return getRewards().find(r => r.id === id) || null;
  } catch {}
  return null;
}

export function setActiveTitle(rewardId: string): void {
  localStorage.setItem('eclipse_active_title', rewardId);
}
