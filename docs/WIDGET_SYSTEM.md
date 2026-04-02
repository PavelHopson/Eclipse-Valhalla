# Widget System

## Types

| Type | Purpose | Dismissable | Default Size |
|------|---------|-------------|--------------|
| Quest | Track objective + deadline | Yes | 300×140 |
| Focus | Pomodoro timer + progress | Yes | 320×200 |
| Blocker | Block until quest complete | **No** | 400×180 |

## Architecture

```
widgetStore.ts (Zustand, persisted)
  ├── CRUD: create, update, remove
  ├── Position: setPosition, setSize, bringToFront
  ├── State: toggleLock, setVisibility, setOpacity
  ├── Escalation: escalate, resetEscalation
  └── Bulk: removeByQuestId, getVisibleWidgets

widgetEngine.ts (pure functions)
  ├── Drag: createDragContext, calculateDragPosition
  ├── Snap: edge snap (12px threshold)
  ├── Boundaries: clampToViewport
  ├── Z-index: getNextZIndex
  └── Overlap: findNonOverlappingPosition

widgetManager.ts (orchestration)
  ├── spawnQuestWidget(quest)
  ├── spawnFocusWidget(quest, duration)
  ├── syncWidgetsWithQuests(quests) — every 30s
  ├── onQuestCompleted(questId) — cleanup
  └── cleanupOrphanedWidgets()

widgetRenderer.tsx (React)
  ├── WidgetRenderer — overlay layer (z-index 60)
  ├── WidgetContainer — drag handler, header, controls
  ├── QuestWidgetBody — deadline, priority badge
  ├── FocusWidgetBody — live timer, progress bar
  └── BlockerWidgetBody — warning message, complete button
```

## Escalation

| Level | Trigger | Visual Effect |
|-------|---------|--------------|
| 0 | Normal | Standard border |
| 1 | +5 min overdue | Warning glow, +20px width |
| 2 | +30 min overdue | Urgent glow, +40px width |
| 3 | +2 hours overdue | Critical pulse animation, max size |

Auto-escalation runs every 30 seconds via `syncWidgetsWithQuests()`.

## Desktop Overlay

Electron enables system-level floating:
```
setOverlayMode(true)  → always-on-top + visible on all workspaces
setClickThrough(true) → mouse passes through non-widget areas

Widget mouseEnter → setIgnoreMouseEvents(false)  // clicks work
Widget mouseLeave → setIgnoreMouseEvents(true, { forward: true })  // pass through
```

## Mobile Fallback

`MobileWidgetBoard.tsx` renders widgets as inline cards:
- No floating, no absolute positioning
- Max 5 visible, compact height (80px)
- Accent border-left by type color
