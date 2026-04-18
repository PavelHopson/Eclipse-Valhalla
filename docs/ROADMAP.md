# Roadmap

## Short Term (1-2 months)

### Launch
- [ ] Publish to Product Hunt
- [ ] Windows installer signed and distributed
- [ ] macOS DMG notarized
- [ ] Web version deployed (Vercel)
- [ ] Landing page live

### Core Polish
- [ ] Stripe payment integration (real billing)
- [ ] Supabase Realtime sync for quests
- [ ] IndexedDB migration for news items
- [ ] Error boundary coverage for all views
- [ ] E2E test suite (Playwright)

### User Experience
- [ ] Dashboard: wire DashboardHero + DisciplinePanel
- [ ] Morning briefing modal
- [ ] Evening summary auto-trigger
- [ ] Quick quest input on dashboard
- [ ] Activation checklist visible for new users

---

## Medium Term (3-6 months)

### Platform
- [ ] Android APK on Play Store
- [ ] iOS TestFlight beta
- [ ] Linux Snap Store / Flathub
- [ ] PWA with full offline support

### Intelligence
- [ ] Server-side ingestion (Edge Functions)
- [ ] Telegram Bot API integration (real-time channel ingestion)
- [ ] News clustering (group similar articles)
- [ ] Topic heat map (trending topics over time)
- [ ] User preference learning (read/ignore patterns)

### AI
- [ ] Oracle daily auto-briefing (no user prompt needed)
- [ ] Oracle quest auto-suggestions from Nexus
- [ ] Oracle weekly productivity report
- [ ] Voice interaction (TTS + STT loop)

### Social
- [ ] Team workspaces (shared quests)
- [ ] Accountability partners
- [ ] Public discipline leaderboards (opt-in)

### Revenue
- [ ] Annual billing ($96/year — 33% discount)
- [ ] Referral reward fulfillment (real trial extensions)
- [ ] Usage-based pricing tier (API calls)

### Career Quest (new module) — see [CAREER_QUEST.md](./CAREER_QUEST.md)
- [ ] Application tracker (Kanban: Applied → HR → Tech → Onsite → Offer)
- [ ] 8 career quest templates (apply-3, interview-prep, cv-update, learn-hour, etc.)
- [ ] Career achievements (First Application, Serial Applier, Offer Magnet)
- [ ] AI CV tailoring (reuse existing 6-provider aiService)
- [ ] AI rejection analysis + interview simulation
- [ ] Career streaks with anti-burnout (reuse existing retention system)
- [ ] Weekly digest notification (Fri 18:00)
- [ ] Export to CSV / Notion / Google Sheets

---

## Long Term (6-12 months)

### Ecosystem
- [ ] Eclipse API (third-party integrations)
- [ ] Zapier/Make.com connectors
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Email ingestion (forward emails → quests)
- [ ] Browser extension (clip articles → Nexus)

### Intelligence V2
- [ ] Custom AI models (fine-tuned on user data)
- [ ] Predictive scheduling (AI suggests optimal task timing)
- [ ] Sentiment analysis on news
- [ ] Cross-user intelligence (anonymized trend detection)

### Enterprise
- [ ] Team dashboards
- [ ] Admin controls
- [ ] SSO (SAML/OIDC)
- [ ] Audit logs
- [ ] Custom branding

### Platform Evolution
- [ ] Apple Watch companion
- [ ] Android widget (home screen)
- [ ] Windows widget (Windows 11 widget board)
- [ ] CLI tool for developers
