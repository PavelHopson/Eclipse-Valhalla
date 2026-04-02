/**
 * Eclipse Valhalla — Widget Store (Zustand)
 *
 * Central state management for all active widgets.
 * Persists to localStorage for session continuity.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WidgetState,
  WidgetType,
  WidgetPosition,
  WidgetSize,
  WidgetPriority,
  DEFAULT_WIDGET_SIZES,
} from './widgetTypes';

// ═══════════════════════════════════════════
// STORE INTERFACE
// ═══════════════════════════════════════════

interface WidgetStoreState {
  widgets: WidgetState[];
  nextZIndex: number;

  // CRUD
  createWidget: (params: CreateWidgetParams) => string;
  updateWidget: (id: string, updates: Partial<WidgetState>) => void;
  removeWidget: (id: string) => void;

  // Position & Layout
  setPosition: (id: string, position: WidgetPosition) => void;
  setSize: (id: string, size: WidgetSize) => void;
  bringToFront: (id: string) => void;

  // Toggle
  toggleLock: (id: string) => void;
  setVisibility: (id: string, visible: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;

  // Escalation
  escalate: (id: string) => void;
  resetEscalation: (id: string) => void;

  // Bulk
  removeByQuestId: (questId: string) => void;
  getWidgetsByQuest: (questId: string) => WidgetState[];
  getVisibleWidgets: () => WidgetState[];
  clearAll: () => void;
}

interface CreateWidgetParams {
  type: WidgetType;
  priority?: WidgetPriority;
  position?: WidgetPosition;
  size?: WidgetSize;
  questId?: string;
  questTitle?: string;
  questDeadline?: string;
  blockerMessage?: string;
  focusDurationMs?: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const generateId = () => `w_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

const getDefaultPosition = (): WidgetPosition => ({
  x: 60 + Math.random() * 200,
  y: 60 + Math.random() * 150,
});

// ═══════════════════════════════════════════
// ZUSTAND STORE
// ═══════════════════════════════════════════

export const useWidgetStore = create<WidgetStoreState>()(
  persist(
    (set, get) => ({
      widgets: [],
      nextZIndex: 100,

      // ── CREATE ──
      createWidget: (params) => {
        const id = generateId();
        const now = Date.now();

        const widget: WidgetState = {
          id,
          type: params.type,
          position: params.position || getDefaultPosition(),
          size: params.size || DEFAULT_WIDGET_SIZES[params.type],
          locked: false,
          opacity: 1,
          visible: true,
          priority: params.priority || 'medium',
          zIndex: get().nextZIndex,
          questId: params.questId,
          questTitle: params.questTitle,
          questDeadline: params.questDeadline,
          focusDurationMs: params.focusDurationMs,
          focusStartedAt: params.type === 'focus' ? now : undefined,
          blockerMessage: params.blockerMessage,
          blockerDismissable: params.type !== 'blocker', // blockers can't be dismissed
          escalationLevel: 0,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          widgets: [...state.widgets, widget],
          nextZIndex: state.nextZIndex + 1,
        }));

        return id;
      },

      // ── UPDATE ──
      updateWidget: (id, updates) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
          ),
        }));
      },

      // ── REMOVE ──
      removeWidget: (id) => {
        const widget = get().widgets.find(w => w.id === id);
        // Blockers can only be removed if quest is complete (handled by manager)
        if (widget?.type === 'blocker' && !widget.blockerDismissable) return;

        set(state => ({
          widgets: state.widgets.filter(w => w.id !== id),
        }));
      },

      // ── POSITION ──
      setPosition: (id, position) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id && !w.locked
              ? { ...w, position, updatedAt: Date.now() }
              : w
          ),
        }));
      },

      // ── SIZE ──
      setSize: (id, size) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, size, updatedAt: Date.now() } : w
          ),
        }));
      },

      // ── Z-INDEX ──
      bringToFront: (id) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, zIndex: state.nextZIndex } : w
          ),
          nextZIndex: state.nextZIndex + 1,
        }));
      },

      // ── LOCK ──
      toggleLock: (id) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, locked: !w.locked, updatedAt: Date.now() } : w
          ),
        }));
      },

      // ── VISIBILITY ──
      setVisibility: (id, visible) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, visible, updatedAt: Date.now() } : w
          ),
        }));
      },

      // ── OPACITY ──
      setOpacity: (id, opacity) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id ? { ...w, opacity: Math.max(0.2, Math.min(1, opacity)), updatedAt: Date.now() } : w
          ),
        }));
      },

      // ── ESCALATION ──
      escalate: (id) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id
              ? {
                  ...w,
                  escalationLevel: Math.min(3, w.escalationLevel + 1),
                  lastEscalatedAt: Date.now(),
                  updatedAt: Date.now(),
                  // Auto-increase size on escalation
                  size: {
                    w: Math.min(600, w.size.w + 20),
                    h: Math.min(400, w.size.h + 10),
                  },
                }
              : w
          ),
        }));
      },

      resetEscalation: (id) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === id
              ? { ...w, escalationLevel: 0, lastEscalatedAt: undefined, updatedAt: Date.now() }
              : w
          ),
        }));
      },

      // ── BULK OPERATIONS ──
      removeByQuestId: (questId) => {
        set(state => ({
          widgets: state.widgets.filter(w => w.questId !== questId),
        }));
      },

      getWidgetsByQuest: (questId) => {
        return get().widgets.filter(w => w.questId === questId);
      },

      getVisibleWidgets: () => {
        return get().widgets.filter(w => w.visible);
      },

      clearAll: () => {
        set({ widgets: [], nextZIndex: 100 });
      },
    }),
    {
      name: 'eclipse-valhalla-widgets',
      // Only persist essential fields
      partialize: (state) => ({
        widgets: state.widgets,
        nextZIndex: state.nextZIndex,
      }),
    }
  )
);
