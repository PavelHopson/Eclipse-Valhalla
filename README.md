<p align="center">
  <strong>◉</strong>
</p>

<h1 align="center">ECLIPSE VALHALLA</h1>

<p align="center">
  <em>Discipline through darkness.</em>
</p>

<p align="center">
  Personal operating system for execution, intelligence, and control.
</p>

<p align="center">
  <a href="#core-systems">Systems</a> &nbsp;·&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;·&nbsp;
  <a href="#installation">Install</a> &nbsp;·&nbsp;
  <a href="#tech-stack">Stack</a> &nbsp;·&nbsp;
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is this

Eclipse Valhalla is not a task manager.

It is a **personal command center** that connects objectives, intelligence, and discipline into a single system.

```
Signal  →  Understanding  →  Decision  →  Quest  →  Action  →  Progress
```

You define objectives. The system tracks, reminds, escalates, and enforces.
AI analyzes your world. News becomes intelligence. Intelligence becomes action.

---

## Core Systems

### ⚔️ Valhalla — Execution Engine

Quest management with discipline enforcement.
Kanban boards. Calendar. Recurring objectives.
Widgets that overlay your desktop. Blockers that cannot be dismissed.

### 🧠 Oracle — AI Advisor

Gemini-powered intelligence that plans your day,
analyzes productivity, and calls out procrastination.
Not a chatbot. A discipline system.

### 🌀 Nexus — Intelligence Feed

Backend-driven news ingestion pipeline.
RSS, Telegram, websites. AI enrichment. Ranking. Deduplication.
News becomes quests. Information becomes action.

### 🖥️ Control — Desktop Layer

Electron overlay with floating widgets.
System tray. Native notifications. Always-on-top mode.
Click-through transparency. Focus mode.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 ECLIPSE VALHALLA                 │
├──────────┬──────────┬───────────┬───────────────┤
│ VALHALLA │  ORACLE  │   NEXUS   │   CONTROL     │
│ Quests   │  AI      │  Intel    │   Desktop     │
│ Calendar │  Plan    │  Pipeline │   Overlay     │
│ Focus    │  Analyze │  Ranking  │   Tray        │
│ Widgets  │  Push    │  Digest   │   Sync        │
├──────────┴──────────┴───────────┴───────────────┤
│              SERVICE LAYER                       │
│  Auth · Billing · Sync · Notifications · Push    │
├─────────────────────────────────────────────────┤
│              BACKEND                             │
│  Supabase · Repositories · Ingestion Pipeline    │
├─────────────────────────────────────────────────┤
│              DESIGN SYSTEM                       │
│  Tokens · Theme · Motion · Brand · Sigils        │
└─────────────────────────────────────────────────┘
```

---

## Features

| Module | Capability |
|--------|-----------|
| **Quests** | CRUD, Kanban, status tracking, priority escalation, recurring |
| **Widgets** | Floating overlays, drag/snap, focus timer, blocker mode |
| **Oracle** | Day planning, productivity analysis, anti-procrastination |
| **Nexus** | RSS/Telegram/Website ingestion, AI ranking, news-to-quest |
| **Gamification** | XP, levels, streaks, discipline score, penalties |
| **Sync** | Local-first + Supabase cloud, conflict resolution |
| **Desktop** | Electron overlay, tray, native notifications, click-through |
| **Mobile** | Capacitor-ready, responsive, platform detection |
| **Auth** | Guest + cloud mode, session management, migration |
| **Billing** | Free/Pro tiers, feature gating, Stripe-ready |
| **i18n** | English + Russian, 500+ keys |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript 5.8 · Vite 6 |
| State | Zustand · React Context |
| Styling | Tailwind CSS · Custom design tokens |
| Desktop | Electron 29 · IPC · Overlay API |
| Mobile | Capacitor |
| Backend | Supabase (Auth, Postgres, RLS, Realtime) |
| AI | Google Gemini (3 Pro, 2.5 Flash TTS) |
| Ingestion | Custom pipeline (fetch → clean → normalize → enrich → dedupe → rank) |

---

## Installation

```bash
git clone https://github.com/PavelHopson/Eclipse-Valhalla.git
cd Eclipse-Valhalla
npm install
```

### Environment

```bash
cp .env.example .env
```

Set your keys:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

Gemini API key can be configured in Settings UI.

### Development

```bash
npm run dev          # Web (localhost:5173)
npm run electron:dev # Desktop (Electron + Vite)
npm run build        # Production build
```

### Database

Run `SUPABASE_SCHEMA.sql` and `SUPABASE_PHASE6_NEWS_PUSH.sql` in your Supabase SQL editor.

---

## Project Structure

```
eclipse-valhalla/
├── electron/          Desktop control layer (6 files)
├── src/
│   ├── backend/       Supabase client, repos, ingestion pipeline
│   ├── brand/         Visual DNA — motifs, sigils, overlays
│   ├── components/    React components (27)
│   ├── context/       Auth context
│   ├── design/        Design system — tokens, theme, motion
│   ├── i18n/          Translations (EN/RU)
│   ├── mobile/        Capacitor bridge, responsive hooks
│   ├── news/          Nexus feed service + types
│   ├── services/      Core services (13)
│   ├── types/         TypeScript domain types
│   ├── utils/         Utilities
│   └── widgets/       Widget system (Zustand store + renderer)
├── docs/              Architecture documentation
└── SUPABASE_SCHEMA.sql
```

---

## Roadmap

- [x] Core quest system
- [x] Design system + brand layer
- [x] Widget overlay system
- [x] Oracle AI integration
- [x] Gamification (XP, levels, streaks)
- [x] Electron desktop control
- [x] Supabase backend foundation
- [x] Auth + sync architecture
- [x] Nexus intelligence pipeline
- [x] Billing foundation
- [ ] Stripe payment integration
- [ ] Real-time Supabase sync
- [ ] Telegram bot ingestion
- [ ] Mobile app (App Store / Play Store)
- [ ] Team collaboration
- [ ] API for third-party integrations

---

## Eclipse Ecosystem

**Eclipse Valhalla** is the core product.
Future modules extend the platform:

| Module | Purpose |
|--------|---------|
| Eclipse Valhalla | Execution + discipline |
| Eclipse Nexus | Intelligence + signals |
| Eclipse Forge | AI creation tools |
| Eclipse Void | Focus + deep work |

---

<p align="center">
  <sub>Built with controlled fury.</sub>
</p>
