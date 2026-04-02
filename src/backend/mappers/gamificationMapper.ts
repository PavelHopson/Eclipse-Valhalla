/**
 * Eclipse Valhalla — Gamification Mapper
 */

import type { GamificationProfile } from '../schema/entities';
import type { Database } from '../schema/database.types';

type GamRow = Database['public']['Tables']['gamification_profiles']['Row'];

export function fromRow(row: GamRow): GamificationProfile {
  return {
    userId: row.user_id,
    xp: row.xp,
    level: row.level,
    streakDays: row.streak_days,
    disciplineScore: row.discipline_score,
    totalCompleted: row.total_completed,
    totalFailed: row.total_failed,
    focusSessions: row.focus_sessions,
    updatedAt: row.updated_at,
  };
}

export function toRow(profile: GamificationProfile): GamRow {
  return {
    user_id: profile.userId,
    xp: profile.xp,
    level: profile.level,
    streak_days: profile.streakDays,
    discipline_score: profile.disciplineScore,
    total_completed: profile.totalCompleted,
    total_failed: profile.totalFailed,
    focus_sessions: profile.focusSessions,
    updated_at: profile.updatedAt,
  };
}
