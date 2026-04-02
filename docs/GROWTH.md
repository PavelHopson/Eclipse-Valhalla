# Growth

## Acquisition Channels

| Channel | Strategy | Priority |
|---------|----------|----------|
| Product Hunt | Launch post with demo video | High |
| Reddit | r/productivity, r/selfimprovement, r/getdisciplined | High |
| Twitter/X | Thread: "I built a discipline OS" | High |
| Hacker News | Show HN post | Medium |
| YouTube | Demo video, "building in public" series | Medium |
| SEO | Landing page optimization, blog content | Long-term |
| Referrals | In-app invite system with Pro trial rewards | Ongoing |

## Activation Funnel

```
Visit → Download/Signup → Onboarding → First Quest → First Complete → Day 1 → Day 7
```

Tracked via `funnelService.ts`. Each step fires an analytics event.

## Retention Mechanics

### Daily Hooks
| Trigger | Mechanic |
|---------|----------|
| Morning | Oracle briefing notification |
| Overdue | Widget escalation + push notification |
| Streak risk | Loss aversion messaging |
| Evening | Day summary modal |
| Inactivity | Comeback prompt after 3 days |

### Weekly Hooks
| Trigger | Mechanic |
|---------|----------|
| Weekly summary | Discipline trend |
| Milestone | Achievement toast + share prompt |
| Streak 7 | Celebration + identity reinforcement |

## Viral Loops

1. **Milestone sharing**: Streak/level/score → Canvas image card → Web Share API
2. **Referral invites**: Invite code → +3 days Pro per accepted invite
3. **Content hooks**: "You are losing discipline." — shareable pressure messages
4. **Identity statements**: "The Disciplined. Level 8. 21-day streak." — profile badges

## Conversion (Free → Pro)

### Triggers
| Moment | Paywall |
|--------|---------|
| Oracle message limit | "Full Oracle requires Pro" |
| Image generation | "Image Forge requires Pro" |
| Widget limit (4th) | "Pro unlocks unlimited widgets" |
| Nexus source limit (6th) | "Pro unlocks unlimited sources" |
| Trial expiring | Countdown urgency messaging |
| Trial expired | "Features locked. Upgrade to continue." |

### Discount Strategy
- 30% off at trial day 5
- 30% off at trial expiry
- 30% off on comeback (3+ days inactive)
- One discount per user (tracked)

## Key Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Activation rate | >60% (onboarding complete) | funnelService |
| Day 1 retention | >40% | cohortService |
| Day 7 retention | >25% | cohortService |
| Free → Pro conversion | >5% | funnelService |
| Referral rate | >10% share invite | referralService |
| Sessions/week | >4 for engaged users | analyticsService |
