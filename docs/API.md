# Internal API Reference

Service interfaces for Eclipse Valhalla.

---

## Auth

```typescript
import { initAuth, signUp, signIn, signOut, enterGuestMode } from './services/authService';

await initAuth()                              // Restore session
await signUp(email, password, displayName)    // Create account
await signIn(email, password)                 // Sign in
await signOut()                               // Non-destructive sign out
enterGuestMode(name)                          // Local-only mode
```

---

## Quests (via storageService)

```typescript
import { api } from './services/storageService';

api.getData('reminders', userId)              // Get quests
api.saveData('reminders', userId, quests)     // Save quests
api.login(email, password)                    // Legacy auth
api.updateUser(id, updates)                   // Update profile
```

---

## Oracle

```typescript
import { sendOracleMessage, oraclePlanDay, oracleAnalyze, oracleMotivate } from './services/oracleService';

await sendOracleMessage(history, message, quests)  // Chat with context
await oraclePlanDay(quests)                        // Day planning
await oracleAnalyze(quests)                        // Productivity analysis
await oracleMotivate(questTitle)                   // Anti-procrastination
```

---

## Nexus Feed

```typescript
import { initNexus, addSource, fetchAllSources, convertNewsToQuest } from './news';

initNexus(userId)                             // Connect to pipeline
addSource(userId, { name, type, url })        // Add RSS/Telegram/Website
await fetchAllSources(userId)                 // Trigger ingestion
convertNewsToQuest(item, userId)              // News → Quest
```

---

## Widgets

```typescript
import { useWidgetStore, spawnQuestWidget, spawnFocusWidget } from './widgets';

spawnQuestWidget(quest)                       // Create quest widget
spawnFocusWidget(quest, durationMs)           // Create focus timer
useWidgetStore.getState().removeWidget(id)    // Remove widget
useWidgetStore.getState().toggleLock(id)      // Lock/unlock position
```

---

## Gamification

```typescript
import { onQuestComplete, calculateDisciplineScore, getStreak } from './services/gamificationService';

onQuestComplete(quest)                        // +XP, streak update
calculateDisciplineScore(quests)              // 0-100 score
getStreak()                                   // Current streak days
```

---

## Billing

```typescript
import { subscribe, getCurrentPlan, getUsage } from './services/billingService';

await subscribe('pro', 'monthly')             // Upgrade
getCurrentPlan()                              // Active plan config
getUsage()                                    // Feature usage vs limits
```

---

## Desktop Bridge

```typescript
import { desktop } from './services/desktopBridge';

if (desktop.isDesktop) {
  await desktop.toggleOverlayMode(true)       // Floating widget mode
  await desktop.setAlwaysOnTop(true)          // Pin window
  await desktop.showNotification(title, body) // Native notification
  await desktop.enterFocusMode()              // Mini overlay
}
```

---

## Notifications

```typescript
import { notifyInApp, notifyPush, startEscalation } from './services/notificationService';

notifyInApp(title, message, 'critical')       // In-app toast
notifyPush(title, message, 'warning')         // Browser/native push
startEscalation(questId)                      // Begin escalation chain
```
