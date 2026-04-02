/**
 * Eclipse Valhalla — Quest Mapper
 *
 * Maps between domain Quest entity and Supabase row format.
 */

import type { Quest, QuestSubtask, QuestStatus, QuestPriority, QuestCategory, QuestRepeat } from '../schema/entities';
import type { Database } from '../schema/database.types';

type QuestRow = Database['public']['Tables']['quests']['Row'];
type QuestInsert = Database['public']['Tables']['quests']['Insert'];

export function fromRow(row: QuestRow): Quest {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    status: row.status as QuestStatus,
    priority: row.priority as QuestPriority,
    category: (row.category || 'personal') as QuestCategory,
    repeat: (row.repeat || 'none') as QuestRepeat,
    dueAt: row.due_at,
    completedAt: row.completed_at || undefined,
    archivedAt: row.archived_at || undefined,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks as QuestSubtask[] : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInsert(quest: Quest): QuestInsert {
  return {
    id: quest.id,
    user_id: quest.userId,
    title: quest.title,
    description: quest.description,
    status: quest.status,
    priority: quest.priority,
    category: quest.category,
    repeat: quest.repeat,
    due_at: quest.dueAt,
    completed_at: quest.completedAt || null,
    archived_at: quest.archivedAt || null,
    subtasks: quest.subtasks as any,
  };
}

/**
 * Map legacy Reminder type to Quest entity.
 */
export function fromLegacyReminder(r: any, userId: string): Quest {
  const statusMap: Record<string, QuestStatus> = {
    'todo': 'pending',
    'in_progress': 'active',
    'done': 'completed',
  };
  const priorityMap: Record<string, QuestPriority> = {
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
  };
  const categoryMap: Record<string, QuestCategory> = {
    'Work': 'work', 'Personal': 'personal', 'Health': 'health',
    'Shopping': 'shopping', 'Finance': 'finance', 'Education': 'education',
  };
  const repeatMap: Record<string, QuestRepeat> = {
    'None': 'none', 'Daily': 'daily', 'Weekly': 'weekly', 'Monthly': 'monthly',
  };

  return {
    id: r.id,
    userId,
    title: r.title || '',
    description: r.description || '',
    status: statusMap[r.status] || (r.isCompleted ? 'completed' : 'pending'),
    priority: priorityMap[r.priority] || 'medium',
    category: categoryMap[r.category] || 'personal',
    repeat: repeatMap[r.repeatType] || 'none',
    dueAt: r.dueDateTime || new Date().toISOString(),
    completedAt: r.isCompleted ? new Date(r.createdAt).toISOString() : undefined,
    subtasks: (r.subtasks || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      completed: s.isCompleted,
    })),
    createdAt: new Date(r.createdAt || Date.now()).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
