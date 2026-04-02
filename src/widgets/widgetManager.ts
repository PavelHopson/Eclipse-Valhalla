/**
 * Eclipse Valhalla — Widget Manager
 *
 * Orchestration layer:
 * - Spawns widgets based on quest deadlines
 * - Syncs widget state with quest state
 * - Handles escalation when quests are ignored
 * - Cleanup on quest completion
 */

import { Reminder, Priority } from '../types';
import { useWidgetStore } from './widgetStore';
import { WidgetPriority, WidgetType, DEFAULT_WIDGET_SIZES } from './widgetTypes';
import { findNonOverlappingPosition } from './widgetEngine';

// ═══════════════════════════════════════════
// PRIORITY MAPPING
// ═══════════════════════════════════════════

const QUEST_TO_WIDGET_PRIORITY: Record<string, WidgetPriority> = {
  [Priority.HIGH]:   'high',
  [Priority.MEDIUM]: 'medium',
  [Priority.LOW]:    'low',
};

// ═══════════════════════════════════════════
// ESCALATION THRESHOLDS (ms)
// ═══════════════════════════════════════════

const ESCALATION_INTERVALS = [
  5 * 60 * 1000,   // Level 1: after 5 minutes overdue
  30 * 60 * 1000,  // Level 2: after 30 minutes overdue
  2 * 60 * 60 * 1000, // Level 3: after 2 hours overdue
];

// ═══════════════════════════════════════════
// SPAWN WIDGET FOR QUEST
// ═══════════════════════════════════════════

/**
 * Create a widget for a quest. Prevents duplicates.
 */
export function spawnQuestWidget(quest: Reminder, type: WidgetType = 'quest'): string | null {
  const store = useWidgetStore.getState();

  // Don't duplicate
  const existing = store.getWidgetsByQuest(quest.id);
  if (existing.length > 0) return existing[0].id;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const size = DEFAULT_WIDGET_SIZES[type];
  const existingWidgets = store.getVisibleWidgets().map(w => ({
    position: w.position,
    size: w.size,
  }));

  const position = findNonOverlappingPosition(size, existingWidgets, viewportW, viewportH);

  const priority = QUEST_TO_WIDGET_PRIORITY[quest.priority] || 'medium';

  return store.createWidget({
    type,
    priority,
    position,
    questId: quest.id,
    questTitle: quest.title,
    questDeadline: quest.dueDateTime,
    blockerMessage: type === 'blocker'
      ? `Complete "${quest.title}" to dismiss this blocker.`
      : undefined,
  });
}

// ═══════════════════════════════════════════
// SPAWN FOCUS WIDGET
// ═══════════════════════════════════════════

export function spawnFocusWidget(quest: Reminder, durationMs: number = 25 * 60 * 1000): string | null {
  const store = useWidgetStore.getState();

  // Remove existing focus widgets
  const focusWidgets = store.widgets.filter(w => w.type === 'focus');
  focusWidgets.forEach(w => store.removeWidget(w.id));

  return store.createWidget({
    type: 'focus',
    priority: 'high',
    questId: quest.id,
    questTitle: quest.title,
    questDeadline: quest.dueDateTime,
    focusDurationMs: durationMs,
  });
}

// ═══════════════════════════════════════════
// SYNC WIDGETS WITH QUESTS
// ═══════════════════════════════════════════

/**
 * Run this periodically. Checks quest state and:
 * - Removes widgets for completed quests
 * - Spawns widgets for high-priority/overdue quests
 * - Escalates widgets for ignored quests
 */
export function syncWidgetsWithQuests(quests: Reminder[]): void {
  const store = useWidgetStore.getState();
  const now = Date.now();

  // 1. Remove widgets for completed quests
  const completedQuestIds = new Set(
    quests.filter(q => q.isCompleted).map(q => q.id)
  );

  store.widgets.forEach(widget => {
    if (widget.questId && completedQuestIds.has(widget.questId)) {
      // Force-allow removal even for blockers
      store.updateWidget(widget.id, { blockerDismissable: true });
      store.removeWidget(widget.id);
    }
  });

  // 2. Auto-spawn widgets for overdue high-priority quests
  const overdueHighPriority = quests.filter(q =>
    !q.isCompleted &&
    q.priority === Priority.HIGH &&
    new Date(q.dueDateTime).getTime() < now
  );

  overdueHighPriority.forEach(quest => {
    const existing = store.getWidgetsByQuest(quest.id);
    if (existing.length === 0) {
      spawnQuestWidget(quest);
    }
  });

  // 3. Escalate overdue widget
  store.widgets.forEach(widget => {
    if (!widget.questId || !widget.questDeadline) return;

    const deadline = new Date(widget.questDeadline).getTime();
    if (deadline >= now) return; // Not overdue

    const overdueMs = now - deadline;
    const targetLevel = ESCALATION_INTERVALS.reduce(
      (level, threshold, idx) => (overdueMs >= threshold ? idx + 1 : level),
      0
    );

    if (targetLevel > widget.escalationLevel) {
      store.escalate(widget.id);
    }
  });
}

// ═══════════════════════════════════════════
// HANDLE QUEST COMPLETION
// ═══════════════════════════════════════════

export function onQuestCompleted(questId: string): void {
  const store = useWidgetStore.getState();
  // Mark all quest widgets as dismissable and remove
  store.widgets
    .filter(w => w.questId === questId)
    .forEach(w => {
      store.updateWidget(w.id, { blockerDismissable: true });
      store.removeWidget(w.id);
    });
}

// ═══════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════

/**
 * Remove all widgets that have no valid quest binding.
 */
export function cleanupOrphanedWidgets(questIds: Set<string>): void {
  const store = useWidgetStore.getState();
  store.widgets.forEach(widget => {
    if (widget.questId && !questIds.has(widget.questId)) {
      store.updateWidget(widget.id, { blockerDismissable: true });
      store.removeWidget(widget.id);
    }
  });
}
