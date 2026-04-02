# API Reference

Complete internal service API for Eclipse Valhalla.

---

## Auth (`authService`)

```typescript
initAuth(): Promise<AuthState>
signUp(email, password, displayName): Promise<AuthState>
signIn(email, password): Promise<AuthState>
signOut(): Promise<void>
enterGuestMode(name): AuthState
isSignedIn(): boolean
isGuest(): boolean
getCurrentUserId(): string | null
subscribeAuth(fn): () => void   // unsubscribe function
```

## Quests (`storageService`)

```typescript
api.getData<T>(key, userId): T
api.saveData<T>(key, userId, data): void
api.login(email, password): User | null
api.updateUser(id, updates): User | null
api.getAllUsers(): StoredUser[]
```

## Oracle (`oracleService`)

```typescript
sendOracleMessage(history, message, quests?): Promise<string>
oraclePlanDay(quests): Promise<string>
oracleAnalyze(quests): Promise<string>
oracleBreakdown(title, description): Promise<string>
oracleMotivate(questTitle): Promise<string>
```

## Gemini AI (`geminiService`)

```typescript
sendChatMessage(history, message): Promise<string>
generateImage(prompt, size: '1K'|'2K'|'4K'): Promise<string>  // data URL
generateSpeech(text): Promise<AudioBuffer>
```

## Nexus Feed (`newsService`)

```typescript
initNexus(userId): void
startNexusAutoRefresh(intervalMs?): void
stopNexusAutoRefresh(): void
getSources(userId): NewsSource[]
addSource(userId, {name, type, url, categories?}): NewsSource
updateSource(userId, sourceId, updates): void
removeSource(userId, sourceId): void
getItems(userId): NewsItem[]
fetchAllSources(userId): Promise<NewsItem[]>
fetchSource(userId, sourceId): Promise<NewsItem[]>
markAsRead(userId, itemId): void
saveItem(userId, itemId): void
archiveItem(userId, itemId): void
convertNewsToQuest(item, userId): QuestFromNews
generateDigest(userId): NewsDigest
getPreferences(userId): NewsPreference
savePreferences(userId, prefs): void
```

## Widgets (`widgetStore` Zustand)

```typescript
useWidgetStore.getState().createWidget(params): string  // returns ID
useWidgetStore.getState().updateWidget(id, updates): void
useWidgetStore.getState().removeWidget(id): void
useWidgetStore.getState().setPosition(id, {x, y}): void
useWidgetStore.getState().bringToFront(id): void
useWidgetStore.getState().toggleLock(id): void
useWidgetStore.getState().setVisibility(id, visible): void
useWidgetStore.getState().escalate(id): void
useWidgetStore.getState().getVisibleWidgets(): WidgetState[]
useWidgetStore.getState().getWidgetsByQuest(questId): WidgetState[]

// Manager functions
spawnQuestWidget(quest): string | null
spawnFocusWidget(quest, durationMs?): string | null
syncWidgetsWithQuests(quests): void
onQuestCompleted(questId): void
```

## Gamification (`gamificationService`)

```typescript
getDisciplineState(): DisciplineState
calculateLevel(xp): number
getNextLevelXp(level): number
onQuestComplete(quest): XPEvent
onQuestFailed(quest): XPEvent
onFocusSessionComplete(): XPEvent
updateStreak(quests): void
calculateDisciplineScore(quests): number
getStreak(): number
getFocusSessions(): number
```

## Billing (`billingService`)

```typescript
getPlans(): PlanConfig[]
getCurrentPlan(): PlanConfig
getBillingState(): BillingState
subscribe(tier, interval?): Promise<{success, error?}>
cancelSubscription(): Promise<{success}>
getUsage(): Record<string, {current, limit}>
```

## Notifications (`notificationService`)

```typescript
notifyInApp(title, message, type?, questId?): NotificationPayload
notifyPush(title, message, type?, questId?): NotificationPayload
notifyEmail(title, message, type?, questId?): NotificationPayload  // stub
notifySMS(title, message, type?, questId?): NotificationPayload    // stub
startEscalation(questId): void
stopEscalation(questId): void
processEscalations(getTitle): NotificationPayload[]
getNotifications(): NotificationPayload[]
getUnreadCount(): number
markRead(id): void
dismissNotification(id): void
```

## Desktop (`desktopBridge`)

```typescript
desktop.isDesktop: boolean
desktop.platform: string
desktop.toggleOverlayMode(enabled): Promise<any>
desktop.setClickThrough(enabled): Promise<any>
desktop.setOpacity(opacity): Promise<any>
desktop.enterFocusMode(): Promise<any>
desktop.exitFocusMode(): Promise<any>
desktop.showNotification(title, body, urgency?): Promise<any>
desktop.minimizeToTray(): Promise<any>
desktop.setAlwaysOnTop(enabled): Promise<any>
desktop.setAutoStart(enabled): Promise<{success, enabled?}>
desktop.getAppInfo(): Promise<{version, name, platform, isPackaged}>
```

## Growth (`growthService`)

```typescript
trackFirstQuest(): void
trackFirstComplete(): void
trackFirstWidget(): void
trackFirstOracle(): void
trackFirstNexus(): void
getActivationStatus(): ActivationStatus
getAutoSuggestions(opts): AutoSuggestion[]
checkMilestones(opts): Milestone[]
getAllMilestones(): Milestone[]
```

## Analytics (`analyticsService`)

```typescript
trackEvent(event, properties?): void
trackSessionStart(): void
trackQuestCreated(): void
trackQuestCompleted(): void
getUsageMetrics(): UsageMetrics
getRecentEvents(limit?): AnalyticsEvent[]
```

## Subscription (`subscriptionService`)

```typescript
canUseFeature(feature): boolean
isPro(): boolean
getUsageLimits(): UsageLimits
isWithinLimit(metric, currentValue): boolean
getFeatureList(): Array<FeatureConfig & {available}>
```
