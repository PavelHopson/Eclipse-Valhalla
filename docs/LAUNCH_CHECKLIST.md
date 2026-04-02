# Launch Checklist

## Pre-Launch (Day 1-2)

### Landing
- [ ] Deploy landing page to Vercel/Netlify
- [ ] Test CTA → app flow
- [ ] Test language toggle (EN/RU)
- [ ] Mobile responsive check
- [ ] Page speed < 3s

### App
- [ ] `npm run build` → clean
- [ ] Deploy web version
- [ ] Test: new user → onboarding → first quest < 60s
- [ ] Test: quest completion → XP → streak
- [ ] Test: Oracle responds (needs Gemini key)
- [ ] Test: Nexus RSS feed works with real source
- [ ] Test: widget spawns on quest creation

### Content
- [ ] Record 30-60s demo video
- [ ] Write Product Hunt description (150 words)
- [ ] Write Reddit post (r/productivity, r/getdisciplined)
- [ ] Write Twitter thread (5-7 tweets)

---

## Launch (Day 3)

### Channels
- [ ] Post to r/productivity
- [ ] Post to r/getdisciplined
- [ ] Post to r/selfimprovement
- [ ] Twitter thread + pin
- [ ] Indie Hackers post
- [ ] Hacker News "Show HN" (evening EST)

### Post Template
```
Title: I built an app that punishes you for ignoring tasks

I got tired of to-do apps that don't care if I fail.

So I built Eclipse Valhalla — it:
- Creates floating widgets that follow you on desktop
- Escalates reminders when you procrastinate
- Uses AI to plan your day and call out weakness
- Has a discipline score that drops when you slack
- Ingests news and converts articles into tasks

Free to try. No signup needed.

[Link]

Feedback welcome.
```

---

## Post-Launch (Day 4-7)

### Monitor
- [ ] Check PMF signals: time to first quest, D1 retention
- [ ] Read all feedback (Reddit comments, in-app)
- [ ] Track: quests created, sessions, errors

### Fix Only Critical
- [ ] Broken flows (can't create quest, can't login)
- [ ] Crashes / white screens
- [ ] Confusing first 60 seconds

### Do NOT
- [ ] Add new features
- [ ] Optimize performance
- [ ] Change design
- [ ] Refactor code

---

## Success Signals

| Metric | Good | Bad |
|--------|------|-----|
| Time to first quest | < 60s | > 3 min |
| D1 return | > 30% | < 15% |
| D7 return | > 10% | 0% |
| Quests created | > 3 per user | 0-1 |
| Any payment | 1+ | 0 (after 50 users) |
| "I don't get it" feedback | < 20% | > 50% |

---

## Key Question

> What does the user get in 2 minutes that they can't get anywhere else?

Answer: **A task that physically won't let them forget it** (widget overlay + escalation + discipline score).

This is the hook. Everything else is secondary.
