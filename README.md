<p align="center">
  <strong>◉</strong>
</p>

<h1 align="center">ECLIPSE VALHALLA</h1>

<p align="center">
  <em>The app that doesn't let you quit.</em>
</p>

<p align="center">
  <a href="https://pavelhopson.github.io/Eclipse-Valhalla/">Web App</a> &nbsp;·&nbsp;
  <a href="https://github.com/PavelHopson/Eclipse-Valhalla/releases">Download</a> &nbsp;·&nbsp;
  <a href="https://t.me/pfrfrpfr">Telegram</a>
</p>

---

## What is this

Create a task. It follows you. Ignoring it makes it worse. Completing it earns progress. AI plans your day. You get disciplined or get punished.

Eclipse Valhalla is a **personal execution system** — not a to-do app. It enforces discipline through pressure, escalation, and consequences.

---

## Try it

**Web (instant, no signup):** https://pavelhopson.github.io/Eclipse-Valhalla/

**Desktop (Windows):** [Download .exe](https://github.com/PavelHopson/Eclipse-Valhalla/releases/latest)

**Mobile:** Open the web link on your phone. Works as a web app. Native iOS/Android apps coming soon.

---

## How it works

1. **Create a quest** — type and press Enter. Takes 5 seconds.
2. **Focus Mode activates** — fullscreen timer. No distractions.
3. **Switch tabs? Caught.** — "You left. That is escape behavior."
4. **Complete it** — emotional feedback + next quest prompt.
5. **Ignore it** — notifications escalate. Discipline score drops.
6. **Come back tomorrow** — "Day 5. Don't break it." or "Streak broken."

---

## Core Systems

| System | What it does |
|--------|-------------|
| **Quests** | Create, track, complete objectives. Priority escalation. Kanban + list view. |
| **Focus Mode** | 25-min timer. Tab escape detection. No exit without completion. |
| **Discipline** | Streak tracking. Daily comparison. Weekly identity review. |
| **Oracle AI** | Plans your day. Analyzes productivity. Calls out procrastination. |
| **Nexus Feed** | RSS/Telegram/Website news. AI ranking. Convert articles to quests. |
| **Workouts** | Training routines with sets/reps. Exercise videos. Session tracking. |
| **Notifications** | Browser push. 2h/5h pressure reminders. Escalation chain. |

---

## AI Providers

Supports multiple AI providers. Configure in Settings → AI Providers.

| Provider | Chat | Image | TTS |
|----------|------|-------|-----|
| Google Gemini | ✓ | ✓ | ✓ |
| OpenAI / GPT-4 | ✓ | ✓ | — |
| Anthropic Claude | ✓ | — | — |
| Custom endpoint | ✓ | — | — |
| Ollama (local) | ✓ | — | — |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Vite 6 · Tailwind |
| State | Zustand · React Context |
| Desktop | Electron 29 |
| Mobile | Capacitor |
| Backend | Supabase (Auth, Postgres, RLS) |
| AI | Multi-provider (Gemini, OpenAI, Anthropic, custom) |

---

## Installation

### Web (recommended for testing)

Just open: https://pavelhopson.github.io/Eclipse-Valhalla/

### From source

```bash
git clone https://github.com/PavelHopson/Eclipse-Valhalla.git
cd Eclipse-Valhalla
npm install
npm run dev
```

### Desktop (Electron)

```bash
npm run electron:dev    # Development
npm run dist:win        # Build Windows installer
```

### Mobile (Capacitor)

```bash
npm run build
npx cap sync
npx cap open android    # Opens Android Studio
npx cap open ios        # Opens Xcode (macOS only)
```

### Environment (optional, for cloud features)

```bash
cp .env.example .env
```

- `VITE_SUPABASE_URL` — for cloud sync
- `VITE_SUPABASE_ANON_KEY` — for auth

AI keys are configured in the app: Settings → AI Providers.

---

## Languages

- 🇺🇸 English
- 🇷🇺 Русский

Switch in Settings → Language.

---

## Behavioral System

Eclipse Valhalla uses psychological pressure mechanics:

| Mechanic | Effect |
|----------|--------|
| Streak tracking | "Day 7. Don't break it." |
| Tab escape detection | "You left. That is escape behavior." |
| Overdue escalation | Red pulse, growing notifications |
| Morning confrontation | "3 objectives abandoned. The system remembers." |
| Identity reinforcement | "You are becoming someone who executes." |
| Anti-burnout valve | "You showed up enough today. Rest without guilt." |
| Discipline modes | Hardcore (no mercy) / Balanced (firm but calm) |

---

## Project Structure

```
eclipse-valhalla/
├── src/
│   ├── ai/            Multi-provider AI system (Gemini, OpenAI, Anthropic)
│   ├── admin/         Analytics dashboard, RBAC
│   ├── backend/       Supabase, repositories, ingestion pipeline
│   ├── brand/         Visual DNA — motifs, sigils, overlays
│   ├── components/    React components (40+)
│   ├── design/        Design system — tokens, theme, motion, states, toast
│   ├── i18n/          Translations (EN/RU, 700+ keys)
│   ├── landing/       Landing page
│   ├── mobile/        Capacitor bridge, responsive
│   ├── news/          Nexus feed service
│   ├── services/      25+ services (discipline, growth, analytics, etc.)
│   ├── widgets/       Widget system (Zustand)
│   └── App.tsx        Main app with behavioral loops
├── electron/          Desktop overlay (7 files)
├── docs/              20 documentation files
└── .github/workflows/ CI/CD (GitHub Pages + releases)
```

---

## Documentation

Full docs in `docs/`:

- [VISION.md](docs/VISION.md) — Product vision
- [PRODUCT.md](docs/PRODUCT.md) — Features & user flows
- [ARCHITECTURE_DEEP.md](docs/ARCHITECTURE_DEEP.md) — System architecture
- [INTELLIGENCE_ENGINE.md](docs/INTELLIGENCE_ENGINE.md) — Nexus pipeline
- [ORACLE_SYSTEM.md](docs/ORACLE_SYSTEM.md) — AI system
- [WIDGET_SYSTEM.md](docs/WIDGET_SYSTEM.md) — Widgets
- [DATABASE.md](docs/DATABASE.md) — Schema (14 tables)
- [API_FULL.md](docs/API_FULL.md) — Internal API (100+ functions)
- [SECURITY.md](docs/SECURITY.md) — Security model
- [SCALING.md](docs/SCALING.md) — Growth stages (100 → 100K users)
- [ROADMAP.md](docs/ROADMAP.md) — Development roadmap
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deploy guides
- [LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) — Launch plan

---

## Contact

- **Telegram:** [@pfrfrpfr](https://t.me/pfrfrpfr)
- **GitHub Issues:** [Report a bug](https://github.com/PavelHopson/Eclipse-Valhalla/issues)

---

<p align="center">
  <sub>Built with controlled fury.</sub>
</p>
