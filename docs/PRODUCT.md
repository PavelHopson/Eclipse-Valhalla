# Product

## Core Loop

```
Morning: Oracle briefing → review quests → plan day
Day:     Execute quests → widgets enforce → Nexus delivers signals
Evening: Summary → streak update → discipline score
```

## Features

### Quest System
- Create, edit, complete, delete objectives
- Priority levels: low, medium, high, critical
- Categories: work, personal, health, shopping, finance, education
- Kanban board + list view
- Recurring quests (daily/weekly/monthly)
- Smart parsing: "Deploy API tomorrow !high" → structured quest

### Widget Overlay
- Floating desktop widgets (quest tracker, focus timer, blocker)
- Drag, snap, lock, minimize
- Escalation: grows and glows when quest is overdue
- Blocker: cannot be dismissed until quest is complete
- Mobile fallback: inline widget board

### Oracle AI
- Day planning: "Plan my day" → prioritized schedule
- Productivity analysis: completion rates, patterns, recommendations
- Anti-procrastination: "Push me" → targeted motivation
- Quest breakdown: split complex objectives into sub-steps
- Context-aware: knows your active quests and overdue items

### Nexus Intelligence
- Add RSS, Telegram, website sources
- 8-stage backend pipeline: fetch → clean → normalize → content → enrich → dedupe → rank
- AI enrichment: summary, tags, category, importance score
- News → Quest: convert any article into an objective
- Intel Digest: daily summary of top signals

### Gamification
- XP for completions (+50 base, +30 high-priority on-time)
- Penalties for overdue (-25 normal, -50 critical)
- Levels 1-13 (0 → 10,000 XP)
- Streak tracking with loss aversion messaging
- Discipline Score 0-100 (weighted: completion 60%, overdue 20%, streak, focus)
- Focus session XP (+20 per session)

### Notifications
- In-app toasts with severity levels
- Browser push notifications
- Electron native notifications
- Escalation chain: in-app → push → email → SMS (5min → 30min → 2h)

### Sync
- Local-first: UI always fast
- Cloud sync via Supabase (when signed in)
- Conflict resolution: newest-wins strategy
- Non-destructive sign-out (local data preserved)

## User Flows

### New User (0 → Activated)
1. Land on app / download
2. Onboarding: choose focus → create quests → enable widgets → discover Nexus → meet Oracle
3. Activation checklist guides first actions
4. First quest completed → milestone toast + share prompt

### Daily User
1. Open app → morning briefing
2. Dashboard: discipline score, active quests, streak, suggestions
3. Execute quests → XP → level progression
4. Nexus delivers ranked intelligence
5. Evening summary → streak feedback

### Power User
1. Desktop overlay: widgets always visible
2. Oracle plans day automatically
3. Nexus auto-ingests from 20+ sources
4. Focus mode: mini window, single quest
5. Referral: invite others, extend Pro trial

## Subscription Tiers

| | Free | Pro ($12/mo) |
|---|---|---|
| Quests | 50 | Unlimited |
| Widgets | 3 | Unlimited |
| Oracle | 10 msgs/day | Unlimited |
| Nexus sources | 5 | Unlimited |
| AI summaries | — | ✓ |
| Image Forge | — | ✓ |
| Cloud sync | — | ✓ |
| Custom themes | — | ✓ |
