
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Reminder, Note, ViewMode, RepeatType, Priority, User, Category, Routine, WorkoutLog, PlanTier, ReminderStatus } from './types';
import { generateId, toLocalISOString } from './utils';
import { X, Loader2 } from 'lucide-react';
import { Seal } from './brand/Seal';
import { LanguageProvider, useLanguage } from './i18n';
import { api } from './services/storageService';

// Lazy-load ALL views
const Navigation = lazy(() => import('./components/Navigation'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ReminderView = lazy(() => import('./components/ReminderView'));
const StickerBoard = lazy(() => import('./components/StickerBoard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const WorkoutView = lazy(() => import('./components/WorkoutView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const AdminPanel = lazy(() => import('./admin/AdminDashboard'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const OracleView = lazy(() => import('./components/OracleView'));
const NewsView = lazy(() => import('./components/NewsView'));
const ChatView = lazy(() => import('./components/ChatView').then(m => ({ default: m.ChatView })));
const ImageView = lazy(() => import('./components/ImageView').then(m => ({ default: m.ImageView })));
const TTSView = lazy(() => import('./components/TTSView').then(m => ({ default: m.TTSView })));

const FocusMode = lazy(() => import('./components/FocusMode'));
const DashboardHero = lazy(() => import('./components/DashboardHero'));

const LoadingScreen = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-[#050508]">
    <div className="system-idle mb-4"><Seal size={40} variant="watching" /></div>
    <Loader2 className="w-4 h-4 animate-spin text-[#5DA8FF40]" />
  </div>
);

// ═══════════════════════════════════════════
// AUTO-GUEST
// ═══════════════════════════════════════════

function getOrCreateUser(): User {
  try {
    const saved = localStorage.getItem('lumina_active_session');
    if (saved) return JSON.parse(saved);
  } catch {}

  const guest: User = {
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: 'Warrior',
    email: '',
    plan: PlanTier.FREE,
    xp: 0,
    level: 1,
    theme: 'blue' as any,
    hasSeenOnboarding: true, // Skip onboarding for now to prevent loops
  };
  localStorage.setItem('lumina_active_session', JSON.stringify(guest));
  try {
    const usersRaw = localStorage.getItem('lumina_users_db');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    users.push({ ...guest, password: '' });
    localStorage.setItem('lumina_users_db', JSON.stringify(users));
  } catch {}
  return guest;
}

// ═══════════════════════════════════════════
// APP CONTENT (simplified — no loops)
// ═══════════════════════════════════════════

const AppContent: React.FC = () => {
  const { t, language } = useLanguage();
  const isRU = language === 'ru';

  const [user, setUser] = useState<User>(getOrCreateUser);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  // Modal state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalData, setModalData] = useState({ title: '', desc: '', date: '', repeat: RepeatType.NONE, priority: Priority.MEDIUM, category: Category.PERSONAL, subtasks: [] as any[] });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [focusQuestId, setFocusQuestId] = useState<string | null>(null);
  const focusQuest = reminders.find(r => r.id === focusQuestId) || null;
  const [returnMessage, setReturnMessage] = useState<string | null>(null);
  const [returnOverlay, setReturnOverlay] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [antiBurnout, setAntiBurnout] = useState<string | null>(null);
  const pendingReminders = reminders.filter(r => !r.isCompleted);
  const overdueReminders = pendingReminders.filter(r => new Date(r.dueDateTime) < new Date());

  const currentStreak = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user.id}`) || '{}');
      return s.days || 0;
    } catch {
      return 0;
    }
  }, [user.id, reminders.length]);

  const disciplineScore = useMemo(() => {
    const total = reminders.length || 1;
    const completed = reminders.filter(r => r.isCompleted).length;
    const completionRate = completed / total;
    const overduePenalty = Math.min(overdueReminders.length * 12, 36);
    const streakBonus = Math.min(currentStreak * 2, 18);
    return Math.max(12, Math.min(99, Math.round(48 + completionRate * 34 + streakBonus - overduePenalty)));
  }, [reminders, overdueReminders.length, currentStreak]);

  // Load data ONCE + track session
  useEffect(() => {
    setReminders(api.getData('reminders', user.id));
    setNotes(api.getData('notes', user.id));
    setRoutines(api.getData('routines', user.id));
    setWorkoutLogs(api.getData('workout_logs', user.id));
    setIsDataLoaded(true);

    // PMF + analytics + retention tracking
    pmfSessionStart();
    trackSessionStart();
    const retention = recordSession();
    if (retention.alerts.length > 0) {
      dispatchAlerts(retention.alerts);
    }

    // Streak + return messaging + overlay + notifications
    try {
      const streakKey = `eclipse_streak_${user.id}`;
      const streakData = JSON.parse(localStorage.getItem(streakKey) || '{}');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastShownKey = `eclipse_return_shown_${today}`;
      const alreadyShown = localStorage.getItem(lastShownKey) === 'true';

      // Count abandoned quests (created before today, not completed)
      const loadedReminders: any[] = api.getData('reminders', user.id);
      const abandonedCount = loadedReminders.filter((r: any) =>
        !r.isCompleted && r.createdAt && new Date(r.createdAt).toISOString().split('T')[0] < today
      ).length;
      const topAbandoned = loadedReminders.find((r: any) => !r.isCompleted && r.priority === 'High')?.title
        || loadedReminders.find((r: any) => !r.isCompleted)?.title;

      if (streakData.lastActiveDate === today) {
        if (streakData.days > 1) setReturnMessage(`Day ${streakData.days}. Discipline maintained.`);
      } else if (streakData.lastActiveDate === yesterday) {
        streakData.days = (streakData.days || 0) + 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
        setReturnMessage(`Day ${streakData.days}. You showed up. Continue.`);

        // Morning trigger overlay
        if (!alreadyShown) {
          setReturnOverlay({
            type: abandonedCount > 0 ? 'debt' : 'morning',
            streak: streakData.days,
            abandonedCount,
            daysAway: 0,
            topAbandoned,
          });
          localStorage.setItem(lastShownKey, 'true');
        }
      } else if (streakData.lastActiveDate) {
        const daysAway = Math.floor((Date.now() - new Date(streakData.lastActiveDate).getTime()) / 86400000);
        streakData.days = 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
        setReturnMessage(`${daysAway} days absent. Streak broken. Day 1 begins now.`);

        // Comeback overlay
        if (!alreadyShown) {
          setReturnOverlay({
            type: 'comeback',
            streak: 1,
            abandonedCount,
            daysAway,
            topAbandoned,
          });
          localStorage.setItem(lastShownKey, 'true');
        }
      } else {
        streakData.days = 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
      }

      // ═══ NOTIFICATION PRESSURE ═══
      // Request permission + schedule pressure notifications
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Record day + check weekly summary
      const completedCount = loadedReminders.filter((r: any) => r.isCompleted).length;
      const createdCount = loadedReminders.length;
      recordDay(completedCount, createdCount);

      // Weekly identity lock (shows every 7 days)
      const weekly = getWeeklySummary();
      if (weekly) setWeeklySummary(weekly);

      // Schedule inactivity pressure notifications (2-3 hours from now)
      const pendingCount = loadedReminders.filter((r: any) => !r.isCompleted).length;
      if (pendingCount > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // 2 hours: gentle pressure
        setTimeout(() => {
          if (document.hidden) {
            new Notification('Eclipse Valhalla', {
              body: `${pendingCount} objective${pendingCount > 1 ? 's' : ''} still pending. Discipline is not built later.`,
              icon: '/favicon.ico',
              tag: 'ev-pressure-1',
            });
          }
        }, 2 * 60 * 60 * 1000);

        // 5 hours: harder
        setTimeout(() => {
          if (document.hidden) {
            new Notification('Eclipse Valhalla', {
              body: 'You said you would act. You didn\'t. Still nothing done.',
              icon: '/favicon.ico',
              tag: 'ev-pressure-2',
            });
          }
        }, 5 * 60 * 60 * 1000);
      }
    } catch {}
  }, []);

  // Save reminders when they change
  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => api.saveData('reminders', user.id, reminders), 500);
    return () => clearTimeout(t);
  }, [reminders, isDataLoaded]);

  // Save notes
  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => api.saveData('notes', user.id, notes), 500);
    return () => clearTimeout(t);
  }, [notes, isDataLoaded]);

  // Save routines + workout logs
  useEffect(() => {
    if (!isDataLoaded) return;
    api.saveData('routines', user.id, routines);
    api.saveData('workout_logs', user.id, workoutLogs);
  }, [routines, workoutLogs, isDataLoaded]);

  // Keyboard shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') { setIsSearchOpen(false); setIsReminderModalOpen(false); setSelectedDay(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Handlers
  const saveReminder = useCallback((r: Partial<Reminder>) => {
    const newR: Reminder = {
      id: r.id || generateId(),
      title: r.title || 'New Quest',
      description: r.description || '',
      dueDateTime: r.dueDateTime || new Date().toISOString(),
      repeatType: r.repeatType || RepeatType.NONE,
      priority: r.priority || Priority.MEDIUM,
      category: r.category || Category.PERSONAL,
      isCompleted: false,
      status: ReminderStatus.TODO,
      createdAt: Date.now(),
      subtasks: r.subtasks || [],
    };
    if (r.id) {
      setReminders(prev => prev.map(x => x.id === r.id ? { ...x, ...r } as Reminder : x));
    } else {
      setReminders(prev => [...prev, newR]);
      pmfQuestCreated();
      trackQuestCreated();

      // Auto-start Focus Mode for quick-created quests (from dashboard input)
      if (!isReminderModalOpen) {
        setFocusQuestId(newR.id);
      }
    }
    setIsReminderModalOpen(false);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setReminders(prev => {
      const quest = prev.find(r => r.id === id);
      if (quest && !quest.isCompleted) {
        pmfQuestCompleted();
        trackQuestCompleted();
      }
      return prev.map(r =>
        r.id === id ? { ...r, isCompleted: !r.isCompleted, status: r.isCompleted ? ReminderStatus.TODO : ReminderStatus.DONE } : r
      );
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingId(null);
    setModalData({ title: '', desc: '', date: toLocalISOString(new Date()), repeat: RepeatType.NONE, priority: Priority.MEDIUM, category: Category.PERSONAL, subtasks: [] });
    setIsReminderModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#050508] font-sans text-[#EAEAF2] fixed inset-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#050508] border-b border-[#16162240] p-3 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <Seal size={26} variant="watching" />
          <span className="font-black text-[14px] text-[#EAEAF2] tracking-[0.08em] uppercase leading-none">Eclipse</span>
        </div>
      </div>

      <Suspense fallback={<LoadingScreen />}>
        <Navigation
          currentView={currentView}
          setView={setCurrentView}
          onSearchClick={() => setIsSearchOpen(true)}
          user={user}
          onUpgrade={() => setIsSubscriptionOpen(true)}
        />
      </Suspense>

      {/* Main Content */}
      <main className="flex-1 h-full relative flex flex-col min-w-0 overflow-hidden pb-[70px] md:pb-0">
        <Suspense fallback={<LoadingScreen />}>
          {currentView === 'dashboard' && (
            <div className="h-full overflow-y-auto">

              {/* ═══════════════════════════════════════════════════
                   COMMAND STAGE — the system's primary interface
                 ═══════════════════════════════════════════════════ */}

              {/* Return message (streak) */}
              {returnMessage && (
                <div className="mx-8 mt-5 px-4 py-2.5 rounded-md border"
                  style={{
                    borderColor: returnMessage.includes('broken') || returnMessage.includes('absent') ? '#E0303015' : '#3DD68C15',
                    backgroundColor: returnMessage.includes('broken') || returnMessage.includes('absent') ? '#E0303004' : '#3DD68C04',
                  }}>
                  <p className="text-[11px] font-semibold" style={{
                    color: returnMessage.includes('broken') || returnMessage.includes('absent') ? '#E03030' : '#3DD68C',
                  }}>{returnMessage}</p>
                </div>
              )}

              <div className="mx-4 mt-4 space-y-4 md:mx-6 md:mt-6 md:space-y-5">
                <Suspense fallback={null}>
                  <DashboardHero
                    user={user}
                    reminders={reminders}
                    disciplineScore={disciplineScore}
                    streak={currentStreak}
                    onStartFocus={() => {
                      const first = pendingReminders[0];
                      if (first) setFocusQuestId(first.id);
                    }}
                  />
                </Suspense>

                <Suspense fallback={null}>
                  <QuickQuestInput
                    onCreateQuest={(title) => saveReminder({ title, dueDateTime: new Date(Date.now() + 86400000).toISOString() })}
                    placeholder={isRU ? 'Назови задачу. Enter.' : 'Name the objective. Press Enter.'}
                  />
                </Suspense>
              </div>

              {/* ═══ QUEST LIST — secondary layer ═══ */}
              {pendingReminders.length > 0 && (
                <div className="mx-4 mb-4 rounded-[24px] border border-white/8 bg-[#121212]/92 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:mx-6 md:p-4">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7F7A72]">{isRU ? 'Активные квесты' : 'Active quests'}</div>
                    {overdueReminders.length > 0 && (
                      <div className="rounded-full border border-[#7A1F2433] bg-[#7A1F2412] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C05A60]">
                        {overdueReminders.length} {isRU ? 'долг' : 'overdue'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {pendingReminders.slice(0, 6).map(r => {
                      const isOverdue = new Date(r.dueDateTime) < new Date();
                      return (
                        <button key={r.id} onClick={() => setFocusQuestId(r.id)}
                          className={`group w-full flex items-center gap-4 rounded-[18px] border px-4 py-4 text-left transition-all ${
                            isOverdue
                              ? 'border-[#7A1F2430] bg-[#7A1F240D] state-overdue hover:bg-[#7A1F2412]'
                              : 'border-white/8 bg-[#171717] state-active hover:bg-[#1D1D1D]'
                          }`}>
                          <div className={`h-11 w-11 shrink-0 rounded-[14px] border flex items-center justify-center ${
                            isOverdue ? 'border-[#7A1F2438] bg-[#7A1F2416]' : 'border-[#6C8FB826] bg-[#6C8FB80F]'
                          }`}>
                            <Seal size={18} variant={isOverdue ? 'broken' : 'watching'} color={isOverdue ? '#A33036' : '#6C8FB8'} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`truncate text-[15px] font-bold ${isOverdue ? 'text-[#F4D6D8]' : 'text-[#F2F1EE]'}`}>{r.title}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7F7A72]">
                              {isOverdue ? (isRU ? 'Требует немедленного ответа' : 'Immediate response required') : (isRU ? 'Готов к входу в фокус' : 'Ready for focus entry')}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B4B0A7] transition-transform group-hover:translate-x-0.5">
                            {isRU ? 'Фокус' : 'Focus'} →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ DASHBOARD STATS (tertiary layer) ═══ */}
              <Dashboard reminders={reminders} setView={setCurrentView} user={user} />
            </div>
          )}
          {currentView === 'reminders' && <ReminderView
            reminders={reminders}
            toggleComplete={toggleComplete}
            deleteReminder={deleteReminder}
            onOpenCreateModal={handleOpenCreateModal}
            onEditReminder={(r) => { setEditingId(r.id); setModalData({title: r.title, desc: r.description, date: r.dueDateTime, repeat: r.repeatType, priority: r.priority, category: r.category, subtasks: r.subtasks || []}); setIsReminderModalOpen(true); }}
            onAddSmartTask={(r) => saveReminder(r)}
            onStatusChange={(id, status) => setReminders(prev => prev.map(r => r.id === id ? { ...r, status, isCompleted: status === ReminderStatus.DONE } : r))}
            userPlan={user.plan}
            onUpgrade={() => setIsSubscriptionOpen(true)}
          />}
          {currentView === 'stickers' && <StickerBoard notes={notes} setNotes={setNotes} />}
          {currentView === 'calendar' && <CalendarView reminders={reminders} onSelectDate={setSelectedDay} />}
          {currentView === 'workouts' && <WorkoutView routines={routines} logs={workoutLogs} setRoutines={setRoutines} setLogs={setWorkoutLogs} />}
          {currentView === 'settings' && <SettingsView
            remindersCount={reminders.length}
            notesCount={notes.length}
            user={user}
            onLogout={() => { localStorage.removeItem('lumina_active_session'); window.location.reload(); }}
            setReminders={setReminders}
            setNotes={setNotes}
            onUpdateTheme={() => {}}
            onUpgrade={() => setIsSubscriptionOpen(true)}
            onUpdateUser={(updates) => { const u = { ...user, ...updates }; setUser(u); localStorage.setItem('lumina_active_session', JSON.stringify(u)); }}
          />}
          {currentView === 'admin' && <AdminPanel />}
          {currentView === 'oracle' && <OracleView quests={reminders} />}
          {currentView === 'nexus' && <NewsView userId={user.id} onCreateQuest={(q) => saveReminder({ title: q.title, description: q.description, dueDateTime: q.dueAt })} />}
          {currentView === 'chat' && <div className="h-full p-4 md:p-6 overflow-hidden"><ChatView /></div>}
          {currentView === 'image' && <div className="h-full p-4 md:p-6 overflow-hidden"><ImageView /></div>}
          {currentView === 'tts' && <div className="h-full p-4 md:p-6 overflow-hidden"><TTSView /></div>}
        </Suspense>
      </main>

      {/* Search */}
      <Suspense fallback={null}>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} reminders={reminders} notes={notes} onNavigate={setCurrentView} />
      </Suspense>

      {/* Feedback */}
      <Suspense fallback={null}>
        <FeedbackPanel isOpen={showFeedback} onClose={() => setShowFeedback(false)} userId={user.id} />
      </Suspense>

      {/* Weekly Summary — identity lock every 7 days */}
      {weeklySummary && !returnOverlay && !focusQuest && (
        <div className="fixed inset-0 z-[73] bg-[#06060B] flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="text-[10px] text-[#7A5CFF] uppercase tracking-[0.3em] mb-4">Weekly Review</div>
            <h1 className="text-2xl font-bold text-[#EAEAF2] mb-2">{weeklySummary.activeDays}/7 days active</h1>
            <p className="text-sm text-[#8888A0] mb-2">{weeklySummary.message}</p>
            <p className="text-xs text-[#5DAEFF] italic mb-6">"{weeklySummary.identityMessage}"</p>
            <div className="flex items-center justify-center gap-6 mb-8 text-xs text-[#55556A]">
              <div><span className="text-lg font-bold text-[#EAEAF2]">{weeklySummary.totalCompleted}</span><br/>completed</div>
              <div><span className="text-lg font-bold text-[#EAEAF2]">{weeklySummary.avgPerDay}</span><br/>avg/day</div>
              <div><span className={`text-lg font-bold ${weeklySummary.trend === 'improving' ? 'text-[#4ADE80]' : weeklySummary.trend === 'declining' ? 'text-[#FF4444]' : 'text-[#8888A0]'}`}>
                {weeklySummary.trend === 'improving' ? '↑' : weeklySummary.trend === 'declining' ? '↓' : '→'}
              </span><br/>trend</div>
            </div>
            <button onClick={() => setWeeklySummary(null)}
              className="px-8 py-3 bg-[#5DAEFF] text-[#06060B] rounded-xl text-sm font-bold shadow-[0_0_25px_rgba(93,174,255,0.15)] transition-all">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Return Overlay — confrontation on app open */}
      {returnOverlay && (
        <Suspense fallback={null}>
          <ReturnOverlay
            state={returnOverlay}
            onStartFirst={() => {
              setReturnOverlay(null);
              // Find first pending quest and start Focus
              const first = reminders.find(r => !r.isCompleted);
              if (first) setFocusQuestId(first.id);
            }}
            onDismiss={() => setReturnOverlay(null)}
          />
        </Suspense>
      )}

      {/* Focus Mode — fullscreen overlay */}
      {focusQuest && (
        <Suspense fallback={null}>
          <FocusMode
            quest={focusQuest}
            pendingQuests={reminders.filter(r => !r.isCompleted)}
            onComplete={(id) => { toggleComplete(id); }}
            onStartNext={(id) => { setFocusQuestId(id); }}
            onClose={() => setFocusQuestId(null)}
          />
        </Suspense>
      )}

      {/* Quest Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-sm" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative w-full md:max-w-lg bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#EAEAF2]">{editingId ? 'Edit Quest' : 'New Quest'}</h3>
              <button onClick={() => setIsReminderModalOpen(false)}><X className="w-5 h-5 text-[#55556A]" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <input type="text" value={modalData.title} onChange={e => setModalData(p => ({...p, title: e.target.value}))} placeholder="Quest objective..." autoFocus className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-[#EAEAF2] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]" />
              <textarea value={modalData.desc} onChange={e => setModalData(p => ({...p, desc: e.target.value}))} placeholder="Details..." className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] h-20 text-sm text-[#8888A0] placeholder-[#3A3A4A] outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={modalData.date} onChange={e => setModalData(p => ({...p, date: e.target.value}))} className="px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none" />
                <select value={modalData.priority} onChange={e => setModalData(p => ({...p, priority: e.target.value as Priority}))} className="px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none">
                  {Object.values(Priority).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1E1E2E] flex justify-end gap-3">
              <button onClick={() => setIsReminderModalOpen(false)} className="px-5 py-2.5 text-[#55556A] text-sm">Cancel</button>
              <button onClick={() => saveReminder({ id: editingId || undefined, title: modalData.title, description: modalData.desc, dueDateTime: modalData.date, priority: modalData.priority, category: modalData.category })} disabled={!modalData.title} className="px-6 py-2.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-xl font-semibold text-sm disabled:opacity-30">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[Eclipse Valhalla] Fatal:', error); }
  render() {
    if (this.state.error) {
      return (
        <div style={{background:'#0A0A0F',color:'#E8E8F0',height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',padding:32}}>
          <h1 style={{fontSize:24,fontWeight:'bold',marginBottom:8}}>Eclipse Valhalla</h1>
          <p style={{color:'#FF4444',marginBottom:16}}>System error.</p>
          <p style={{color:'#55556A',fontSize:12,marginBottom:24,maxWidth:400,textAlign:'center'}}>{String(this.state.error?.message || '')}</p>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{background:'#5DAEFF',color:'#0A0A0F',border:'none',padding:'12px 24px',borderRadius:12,fontWeight:'bold',cursor:'pointer'}}>Reset & Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Import toast container
import { ToastContainer } from './design';
import { pmfSessionStart, pmfQuestCreated, pmfQuestCompleted } from './services/pmfTracker';
import { trackSessionStart, trackQuestCreated, trackQuestCompleted } from './services/analyticsService';
import { recordSession, checkCriticalQuests, dispatchAlerts } from './services/retentionService';
import { getDailyStats, getMode, setMode as setDisciplineMode } from './services/disciplineMode';
import { recordDay, getDailyComparison, getWeeklySummary, getAntiBurnoutMessage } from './services/progressionService';

// Lazy-load growth components
const QuickQuestInput = lazy(() => import('./components/QuickQuestInput'));
const FeedbackPanel = lazy(() => import('./components/FeedbackPanel'));
const AIProviderSettings = lazy(() => import('./components/AIProviderSettings'));
const ReturnOverlay = lazy(() => import('./components/ReturnOverlay'));

const App = () => (
  <AppErrorBoundary>
    <LanguageProvider>
      <AppContent />
      <ToastContainer />
    </LanguageProvider>
  </AppErrorBoundary>
);

export default App;
