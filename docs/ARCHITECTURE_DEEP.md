# Architecture Deep Dive

## Layer Model

```
┌──────────────────────────────────────────────────────────┐
│  PLATFORM LAYER                                          │
│  Electron (overlay, tray, IPC) · Capacitor (mobile)      │
├──────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                       │
│  React 19 · Components · Design System · Brand · Landing  │
├──────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                        │
│  Services (24) · Context · Zustand · Growth · Funnels     │
├──────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                             │
│  Entities · Types · Business Rules · Mappers              │
├──────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                     │
│  Repositories · Supabase · localStorage · Ingestion       │
└──────────────────────────────────────────────────────────┘
```

## System Interconnections

```
                    ┌──────────┐
                    │ VALHALLA │
                    │  Quests  │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
    │  WIDGETS  │  │ ORACLE  │  │   NEXUS   │
    │  Overlay  │  │   AI    │  │  Intel    │
    └─────┬─────┘  └────┬────┘  └─────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                    ┌────▼────┐
                    │ CONTROL │
                    │ Desktop │
                    │ Mobile  │
                    │  Sync   │
                    └─────────┘
```

## Data Flow

### Write Path
```
User Action → Service → localStorage (immediate) → Supabase (async)
```

### Read Path
```
UI renders ← Service reads ← localStorage (always available)
                                    ↑
                              Supabase sync (background)
```

### Ingestion Path
```
Source → Adapter → Pipeline (8 stages) → newsRepository → localStorage → UI
                                              ↓
                                    Supabase (async cloud sync)
```

## Module Dependency Graph

```
App.tsx
├── Navigation
├── Dashboard → DashboardHero, DisciplinePanel, XPBar
├── ReminderView (Quest CRUD)
├── CalendarView
├── WorkoutView
├── StickerBoard
├── OracleView → oracleService → Gemini API
├── NewsView → newsService → ingestionService → pipeline → adapters
├── SettingsView
├── AdminPanel
├── WidgetRenderer → widgetStore (Zustand) → widgetEngine
├── OnboardingFlow
├── GlobalSearch
├── FeedbackPanel
└── Services
    ├── storageService (localStorage CRUD)
    ├── authService → Supabase Auth
    ├── notificationService (in-app + push + escalation)
    ├── gamificationService (XP, levels, streak)
    ├── subscriptionService (feature gates)
    ├── billingService (plans, trial)
    ├── syncService (local ↔ cloud)
    ├── analyticsService (events, metrics)
    ├── growthService (activation, milestones)
    ├── retentionService (streak warnings, comeback)
    ├── referralService (invite codes)
    ├── trialService (Pro trial, urgency, discounts)
    ├── identityService (titles, loss aversion)
    ├── dailyLoopService (briefing, summary)
    ├── shareService (Canvas image cards)
    ├── paywallService (soft triggers)
    ├── pushService (device registration)
    ├── desktopBridge (Electron abstraction)
    └── logService (structured logging)
```

## State Management

| Store | Technology | Persistence |
|-------|-----------|-------------|
| Widgets | Zustand | localStorage (auto) |
| Auth | React Context + service | localStorage + Supabase session |
| Quests | useState in App.tsx | localStorage via storageService |
| News | newsService functions | localStorage |
| Gamification | service + localStorage | localStorage |
| All others | Service singletons | localStorage |

## Boundary Rules

1. **Components** never call Supabase directly
2. **Services** never render UI
3. **Repositories** are the only code that touches Supabase
4. **Mappers** convert between domain entities and DB rows
5. **Adapters** are the only code that fetches external data
6. **Pipeline stages** are pure functions (input → output)
