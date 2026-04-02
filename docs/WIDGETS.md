# Widget System

Floating overlays for discipline enforcement.

---

## Types

| Widget | Purpose | Dismissable |
|--------|---------|-------------|
| Quest | Track objective with deadline | Yes |
| Focus | Pomodoro timer with progress | Yes |
| Blocker | Cannot be closed until quest is complete | **No** |

---

## Architecture

```
widgetStore (Zustand)    State management, persisted to localStorage
widgetEngine             Drag, snap, z-index, viewport boundaries
widgetManager            Orchestration: auto-spawn, sync with quests, escalation
widgetRenderer           React overlay layer, per-widget type rendering
```

---

## Escalation

When a quest is overdue, its widget escalates:

| Level | Trigger | Effect |
|-------|---------|--------|
| 0 | Normal | Standard appearance |
| 1 | +5 min overdue | Warning glow, slight size increase |
| 2 | +30 min overdue | Urgent glow, larger |
| 3 | +2 hours overdue | Critical pulse animation, maximum size |

---

## Desktop Overlay

On Electron: widgets float above all windows.
Click-through: non-widget areas pass mouse events to underlying apps.

```
onMouseEnter widget → setIgnoreMouseEvents(false)
onMouseLeave widget → setIgnoreMouseEvents(true, { forward: true })
```

---

## Mobile Fallback

On mobile: `MobileWidgetBoard` renders widgets as inline cards.
No floating overlays. No system-level control.
