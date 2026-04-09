
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Reminder, Note, ViewMode, RepeatType, Priority, User, Category, Routine, WorkoutLog, PlanTier, ReminderStatus } from './types';
import { generateId, toLocalISOString } from './utils';
import { X, Loader2 } from 'lucide-react';
import { Seal } from './brand/Seal';
import { LanguageProvider, useLanguage } from './i18n';
import { api } from './services/storageService';
import TitleBar from './components/TitleBar';
import UpdateNotification from './components/UpdateNotification';
import './services/backupService'; // Auto-backup on load
import './services/themeService';  // Apply saved theme on load

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
const AchievementsPanel = lazy(() => import('./components/AchievementsPanel'));
const HabitsView = lazy(() => import('./components/HabitsView'));
const JournalView = lazy(() => import('./components/JournalView'));
const BodyTracker = lazy(() => import('./components/BodyTracker'));
const ChallengesView = lazy(() => import('./components/ChallengesView'));
const FeatureGuide = lazy(() => import('./components/OnboardingTips').then(m => ({ default: m.FeatureGuide })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));

import { OnboardingTip } from './components/OnboardingTips';

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
    hasSeenOnboarding: true,
  };
  localStorage.setItem('lumina_active_session', JSON.stringify(guest));
  try {
    const usersRaw = localStorage.getItem('lumina_users_db');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    users.push(guest);
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Quest templates
  const DEFAULT_TEMPLATES = [
    { id: 'tmpl_morning', title: isRU ? 'Утренняя рутина' : 'Morning Routine', desc: isRU ? 'Зарядка, душ, завтрак' : 'Exercise, shower, breakfast', priority: 'Medium', category: 'Health', repeat: 'daily' },
    { id: 'tmpl_workout', title: isRU ? 'Тренировка' : 'Workout', desc: '', priority: 'High', category: 'Health', repeat: 'none' },
    { id: 'tmpl_read', title: isRU ? 'Чтение 30 минут' : 'Read 30 minutes', desc: isRU ? 'Книга или статьи по специальности' : 'Book or professional articles', priority: 'Low', category: 'Education', repeat: 'daily' },
    { id: 'tmpl_water', title: isRU ? 'Выпить 2л воды' : 'Drink 2L water', desc: '', priority: 'Medium', category: 'Health', repeat: 'daily' },
    { id: 'tmpl_report', title: isRU ? 'Отчёт по работе' : 'Work report', desc: '', priority: 'High', category: 'Work', repeat: 'weekly' },
    { id: 'tmpl_clean', title: isRU ? 'Уборка' : 'Cleaning', desc: '', priority: 'Low', category: 'Personal', repeat: 'weekly' },
    { id: 'tmpl_plan', title: isRU ? 'Планирование недели' : 'Weekly planning', desc: isRU ? 'Цели, приоритеты, дедлайны' : 'Goals, priorities, deadlines', priority: 'High', category: 'Work', repeat: 'weekly' },
    { id: 'tmpl_budget', title: isRU ? 'Проверить бюджет' : 'Check budget', desc: '', priority: 'Medium', category: 'Finance', repeat: 'monthly' },
  ];

  const [questTemplates, setQuestTemplates] = useState<any[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('eclipse_quest_templates') || '[]');
      if (saved.length > 0) return saved;
      return DEFAULT_TEMPLATES;
    } catch { return DEFAULT_TEMPLATES; }
  });

  // Modal state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalData, setModalData] = useState({ title: '', desc: '', date: '', repeat: RepeatType.NONE, priority: Priority.MEDIUM, category: Category.PERSONAL, subtasks: [] as {id: string; title: string; isCompleted: boolean}[], estimatedMinutes: 0, tags: [] as string[], project: '' });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // BUG 1 FIX: When a calendar day is clicked, open quest creation modal with that date
  useEffect(() => {
    if (selectedDay) {
      setModalData(prev => ({ ...prev, date: toLocalISOString(selectedDay), title: '' }));
      setIsReminderModalOpen(true);
      setSelectedDay(null);
    }
  }, [selectedDay]);

  const [showFeedback, setShowFeedback] = useState(false);
  const [focusQuestId, setFocusQuestId] = useState<string | null>(null);
  const focusQuest = reminders.find(r => r.id === focusQuestId) || null;
  const [returnMessage, setReturnMessage] = useState<string | null>(null);
  const [returnOverlay, setReturnOverlay] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [antiBurnout, setAntiBurnout] = useState<string | null>(null);

  // Achievement toast
  const [achievementToast, setAchievementToast] = useState<{ text: string; xp: number } | null>(null);

  useEffect(() => {
    import('./services/achievementService').then(({ onAchievementUnlock }) => {
      onAchievementUnlock((achievement) => {
        const name = t(`achievements.${achievement.id}`);
        setAchievementToast({ text: name, xp: achievement.xpReward });
        import('./utils').then(({ playAchievementSound }) => playAchievementSound()).catch(() => {});

        // Auto-add XP from achievement
        setUser(prev => {
          const newXp = (prev.xp || 0) + achievement.xpReward;
          const newLevel = Math.floor(newXp / 100) + 1;
          const updatedUser = { ...prev, xp: newXp, level: newLevel };
          api.updateUser(prev.id, { xp: newXp, level: newLevel });
          localStorage.setItem('lumina_active_session', JSON.stringify(updatedUser));
          return updatedUser;
        });

        setTimeout(() => setAchievementToast(null), 4000);
      });
    }).catch(() => {});
  }, []);

  // Track feature usage for achievements
  useEffect(() => {
    if (!isDataLoaded) return;
    const featureMap: Record<string, string> = {
      dashboard: 'dashboard', reminders: 'quests', workouts: 'workouts',
      oracle: 'oracle', nexus: 'news', stickers: 'notes', calendar: 'calendar',
      achievements: 'achievements', image: 'image', tts: 'tts',
    };
    const feature = featureMap[currentView];
    if (feature) {
      import('./services/achievementService').then(({ trackEvent }) => {
        trackEvent('feature_use', feature as any);
      }).catch(() => {});
    }
  }, [currentView, isDataLoaded]);

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
    let notifInterval: ReturnType<typeof setInterval> | undefined;

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
        if (streakData.days > 1) setReturnMessage(`Day ${streakData.days}. ${isRU ? 'Дисциплина сохранена.' : 'Discipline maintained.'}`);
      } else if (streakData.lastActiveDate === yesterday) {
        streakData.days = (streakData.days || 0) + 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
        setReturnMessage(`Day ${streakData.days}. ${isRU ? 'Ты пришёл. Продолжай.' : 'You showed up. Continue.'}`);

        // Morning trigger overlay — only show if there's actual debt
        if (!alreadyShown && abandonedCount > 0) {
          setReturnOverlay({
            type: 'debt',
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
        setReturnMessage(`${daysAway} ${isRU ? 'дней отсутствия. Стрик сломан. День 1.' : 'days absent. Streak broken. Day 1 begins now.'}`);

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

      // Achievement: track streak
      import('./services/achievementService').then(({ trackEvent }) => {
        trackEvent('streak_update', streakData.days || 0);
      }).catch(() => {});

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
              body: isRU ? `${pendingCount} в ожидании. Дисциплина не строится потом.` : `${pendingCount} objective${pendingCount > 1 ? 's' : ''} still pending. Discipline is not built later.`,
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

      // Check for overdue quests every 5 minutes
      notifInterval = setInterval(() => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        const now = new Date();
        const loaded: any[] = api.getData('reminders', user.id);
        const justOverdue = loaded.filter((r: any) =>
          !r.isCompleted && r.dueDateTime &&
          new Date(r.dueDateTime) < now &&
          new Date(r.dueDateTime) > new Date(now.getTime() - 10 * 60000) // overdue in last 10 min
        );
        if (justOverdue.length > 0) {
          new Notification('Eclipse Valhalla', {
            body: justOverdue.length === 1
              ? `⚠️ ${justOverdue[0].title} — просрочено`
              : `⚠️ ${justOverdue.length} квестов просрочено`,
            icon: undefined,
            silent: false,
          });
        }
      }, 5 * 60 * 1000); // every 5 minutes

    } catch {}

    // Cleanup overdue notification interval
    return () => {
      if (notifInterval) clearInterval(notifInterval);
    };
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

  // Save quest templates
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('eclipse_quest_templates', JSON.stringify(questTemplates));
  }, [questTemplates, isDataLoaded]);

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
      estimatedMinutes: r.estimatedMinutes,
    };
    if (r.id) {
      setReminders(prev => prev.map(x => x.id === r.id ? { ...x, ...r } as Reminder : x));
    } else {
      setReminders(prev => [...prev, newR]);
      pmfQuestCreated();
      trackQuestCreated();

      // Quick-created quests no longer auto-start Focus Mode
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
      const updated = prev.map(r =>
        r.id === id ? { ...r, isCompleted: !r.isCompleted, completedAt: !r.isCompleted ? Date.now() : undefined, status: r.isCompleted ? ReminderStatus.TODO : ReminderStatus.DONE } : r
      );
      // Achievement tracking
      const updatedQuest = updated.find(r => r.id === id);
      if (updatedQuest?.isCompleted) {
        import('./services/achievementService').then(({ trackEvent }) => {
          trackEvent('quest_complete');
        }).catch(() => {});
        import('./utils').then(({ playSuccessSound }) => playSuccessSound()).catch(() => {});
      }

      // Update XP
      if (updatedQuest && updatedQuest.isCompleted) {
        const xpGain = updatedQuest.priority === 'High' ? 30 : updatedQuest.priority === 'Medium' ? 20 : 10;
        setUser(prev => {
          const newXp = (prev.xp || 0) + xpGain;
          const newLevel = Math.floor(newXp / 100) + 1;
          const updatedUser = { ...prev, xp: newXp, level: newLevel };
          api.updateUser(prev.id, { xp: newXp, level: newLevel });
          localStorage.setItem('lumina_active_session', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

      // Auto-repeat
      if (updatedQuest && updatedQuest.isCompleted && updatedQuest.repeatType && updatedQuest.repeatType !== RepeatType.NONE) {
        const nextDate = new Date(updatedQuest.dueDateTime);
        if (updatedQuest.repeatType === RepeatType.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        else if (updatedQuest.repeatType === RepeatType.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        else if (updatedQuest.repeatType === RepeatType.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);

        const repeatedQuest = {
          ...updatedQuest,
          id: generateId(),
          isCompleted: false,
          completedAt: undefined,
          status: ReminderStatus.TODO,
          dueDateTime: nextDate.toISOString(),
          createdAt: Date.now(),
        };
        setTimeout(() => {
          setReminders(prev => [...prev, repeatedQuest]);
        }, 500);
      }

      return updated;
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingId(null);
    setModalData({ title: '', desc: '', date: toLocalISOString(new Date()), repeat: RepeatType.NONE, priority: Priority.MEDIUM, category: Category.PERSONAL, subtasks: [], estimatedMinutes: 0, tags: [] as string[], project: '' });
    setIsReminderModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050508] font-sans text-[#EAEAF2] fixed inset-0">
      {/* Custom Title Bar (frameless window) */}
      <TitleBar />
      <UpdateNotification />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
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
          onHelpOpen={() => setIsGuideOpen(true)}
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

              <OnboardingTip section="dashboard" />

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
                    placeholder={isRU ? 'Назови цель. Нажми Enter.' : 'Name the objective. Press Enter.'}
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
          {currentView === 'reminders' && <><OnboardingTip section="reminders" /><ReminderView
            reminders={reminders}
            toggleComplete={toggleComplete}
            deleteReminder={deleteReminder}
            onOpenCreateModal={handleOpenCreateModal}
            onEditReminder={(r) => { setEditingId(r.id); setModalData({title: r.title, desc: r.description, date: r.dueDateTime, repeat: r.repeatType, priority: r.priority, category: r.category, subtasks: r.subtasks || [], estimatedMinutes: r.estimatedMinutes || 0, tags: (r as any).tags || [], project: (r as any).project || ''}); setIsReminderModalOpen(true); }}
            onAddSmartTask={(r) => saveReminder(r)}
            onStatusChange={(id, status) => setReminders(prev => prev.map(r => r.id === id ? { ...r, status, isCompleted: status === ReminderStatus.DONE, completedAt: status === ReminderStatus.DONE ? Date.now() : undefined } : r))}
            onStartFocus={(id) => setFocusQuestId(id)}
            userPlan={user.plan}
            onUpgrade={() => setIsSubscriptionOpen(true)}
          /></>}
          {currentView === 'stickers' && <StickerBoard notes={notes} setNotes={setNotes} />}
          {currentView === 'calendar' && <CalendarView reminders={reminders} onSelectDate={setSelectedDay} />}
          {currentView === 'workouts' && <><OnboardingTip section="workouts" /><WorkoutView routines={routines} logs={workoutLogs} setRoutines={setRoutines} setLogs={setWorkoutLogs} /></>}
          {currentView === 'settings' && <><OnboardingTip section="settings" /><SettingsView
            remindersCount={reminders.length}
            notesCount={notes.length}
            user={user}
            onLogout={() => { localStorage.removeItem('lumina_active_session'); window.location.reload(); }}
            setReminders={setReminders}
            setNotes={setNotes}
            onUpdateTheme={() => {}}
            onUpgrade={() => setIsSubscriptionOpen(true)}
            onUpdateUser={(updates) => { const u = { ...user, ...updates }; setUser(u); localStorage.setItem('lumina_active_session', JSON.stringify(u)); }}
          /></>}
          {currentView === 'admin' && <AdminPanel />}
          {currentView === 'oracle' && <><OnboardingTip section="oracle" /><OracleView quests={reminders} /></>}
          {currentView === 'nexus' && <><OnboardingTip section="nexus" /><NewsView userId={user.id} onCreateQuest={(q) => saveReminder({ title: q.title, description: q.description, dueDateTime: q.dueAt, priority: q.priority === 'high' ? Priority.HIGH : q.priority === 'low' ? Priority.LOW : Priority.MEDIUM })} /></>}
          {currentView === 'chat' && <div className="h-full p-4 md:p-6 overflow-hidden"><ChatView /></div>}
          {currentView === 'image' && <div className="h-full p-4 md:p-6 overflow-hidden"><ImageView /></div>}
          {currentView === 'tts' && <div className="h-full p-4 md:p-6 overflow-hidden"><TTSView /></div>}
          {currentView === 'achievements' && <><OnboardingTip section="achievements" /><AchievementsPanel isOpen={true} onClose={() => setCurrentView('dashboard')} /></>}
          {currentView === 'analytics' && <AnalyticsView reminders={reminders} workoutLogs={workoutLogs} streak={currentStreak} level={user.level || 1} xp={user.xp || 0} />}
          {currentView === 'habits' && <HabitsView />}
          {currentView === 'journal' && <JournalView />}
          {currentView === 'body' && <BodyTracker />}
          {currentView === 'challenges' && <ChallengesView />}
        </Suspense>
      </main>

      {/* Search */}
      <Suspense fallback={null}>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} reminders={reminders} notes={notes} onNavigate={setCurrentView} />
      </Suspense>

      {/* Feature Guide */}
      <Suspense fallback={null}>
        <FeatureGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </Suspense>

      {/* Feedback */}
      <Suspense fallback={null}>
        <FeedbackPanel isOpen={showFeedback} onClose={() => setShowFeedback(false)} userId={user.id} />
      </Suspense>

      {/* Weekly Summary — identity lock every 7 days */}
      {weeklySummary && !returnOverlay && !focusQuest && (
        <div className="fixed inset-0 z-[73] bg-[#06060B] flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="text-[10px] text-[#7A5CFF] uppercase tracking-[0.3em] mb-4">{isRU ? 'Обзор недели' : 'Weekly Review'}</div>
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
              {isRU ? 'Продолжить' : 'Continue'}
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
              // Re-focus the main content after overlay dismissal
              setTimeout(() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) input.focus();
              }, 100);
            }}
            onDismiss={() => {
              setReturnOverlay(null);
              // Re-focus the main content after overlay dismissal
              setTimeout(() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) input.focus();
              }, 100);
            }}
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
        <div key="reminder-modal" className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-sm" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative w-full md:max-w-lg bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#EAEAF2]">{editingId ? (isRU ? 'Редактировать' : 'Edit Quest') : (isRU ? 'Новый квест' : 'New Quest')}</h3>
              <button onClick={() => setIsReminderModalOpen(false)}><X className="w-5 h-5 text-[#55556A]" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {questTemplates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#55556A]">
                      {isRU ? 'Шаблоны' : 'Templates'}
                    </label>
                    <button type="button" onClick={() => setQuestTemplates(DEFAULT_TEMPLATES)}
                      className="text-[9px] font-bold text-[#3A3A4A] hover:text-[#55556A] transition-colors uppercase tracking-wider">
                      {isRU ? 'Сбросить' : 'Reset'}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {questTemplates.map((tmpl: any) => (
                      <button key={tmpl.id} type="button" onClick={() => {
                        setModalData(prev => ({ ...prev, title: tmpl.title, desc: tmpl.desc || '', priority: tmpl.priority, category: tmpl.category, repeat: tmpl.repeat }));
                      }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#5DAEFF] bg-[#5DAEFF10] border border-[#5DAEFF20] hover:bg-[#5DAEFF15] transition-colors">
                        {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input type="text" value={modalData.title} onChange={e => setModalData(p => ({...p, title: e.target.value}))} placeholder={isRU ? 'Цель квеста...' : 'Quest objective...'} autoFocus onFocus={(e) => { e.target.style.borderColor = '#5DAEFF40'; }} onBlur={(e) => { e.target.style.borderColor = '#2A2A3C'; }} className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-[#EAEAF2] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]" />
              <textarea value={modalData.desc} onChange={e => setModalData(p => ({...p, desc: e.target.value}))} placeholder={isRU ? 'Детали...' : 'Details...'} className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] h-20 text-sm text-[#8888A0] placeholder-[#3A3A4A] outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                    {language === 'ru' ? 'Дата и время' : 'Date & Time'}
                  </label>
                  <input type="datetime-local" value={modalData.date} onChange={e => setModalData(p => ({...p, date: e.target.value}))} className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                    {language === 'ru' ? 'Приоритет' : 'Priority'}
                  </label>
                  <select value={modalData.priority} onChange={e => setModalData(p => ({...p, priority: e.target.value as Priority}))} className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]">
                    {Object.values(Priority).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                    {language === 'ru' ? 'Категория' : 'Category'}
                  </label>
                  <select value={modalData.category} onChange={e => setModalData(p => ({...p, category: e.target.value as Category}))} className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]">
                    {Object.values(Category).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                    {isRU ? 'Повтор' : 'Repeat'}
                  </label>
                  <select value={modalData.repeat || 'none'} onChange={e => setModalData(p => ({...p, repeat: e.target.value as RepeatType}))}
                    className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]">
                    <option value="None">{isRU ? 'Без повтора' : 'No repeat'}</option>
                    <option value="Daily">{isRU ? 'Ежедневно' : 'Daily'}</option>
                    <option value="Weekly">{isRU ? 'Еженедельно' : 'Weekly'}</option>
                    <option value="Monthly">{isRU ? 'Ежемесячно' : 'Monthly'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                    {isRU ? 'Оценка времени (мин)' : 'Time estimate (min)'}
                  </label>
                  <input type="number" min="0" step="5" value={modalData.estimatedMinutes || ''}
                    onChange={e => setModalData(p => ({...p, estimatedMinutes: parseInt(e.target.value) || 0}))}
                    placeholder="30"
                    className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                  {isRU ? 'Подзадачи' : 'Subtasks'}
                </label>
                <div className="space-y-2 mb-2">
                  {(modalData.subtasks || []).map((sub, i) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <input type="text" value={sub.title}
                        onChange={e => {
                          const updated = [...(modalData.subtasks || [])];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setModalData(p => ({...p, subtasks: updated}));
                        }}
                        className="flex-1 px-3 py-2 bg-[#0E0E16] rounded-lg border border-[#2A2A3C] text-sm text-[#8888A0] outline-none"
                        placeholder={isRU ? 'Подзадача...' : 'Subtask...'}
                      />
                      <button type="button" onClick={() => {
                        const updated = (modalData.subtasks || []).filter((_, j) => j !== i);
                        setModalData(p => ({...p, subtasks: updated}));
                      }} className="p-1.5 rounded text-[#55556A] hover:text-[#FF4444]">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => {
                  const newSub = { id: `sub_${Date.now()}`, title: '', isCompleted: false };
                  setModalData(p => ({...p, subtasks: [...(p.subtasks || []), newSub]}));
                }} className="text-xs font-bold text-[#5DAEFF] hover:text-[#7DBEFF] transition-colors">
                  + {isRU ? 'Добавить подзадачу' : 'Add subtask'}
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">{isRU ? 'Теги' : 'Tags'}</label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {(modalData.tags || []).map((tag: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF20]">
                      #{tag}
                      <button type="button" onClick={() => setModalData(p => ({...p, tags: (p.tags || []).filter((_: string, j: number) => j !== i)}))} className="text-[#5DAEFF60] hover:text-[#5DAEFF]">×</button>
                    </span>
                  ))}
                </div>
                <input placeholder={isRU ? 'Добавить тег (Enter)' : 'Add tag (Enter)'}
                  className="w-full px-3 py-2 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim().replace('#', '');
                      if (val && !(modalData.tags || []).includes(val)) { setModalData(p => ({...p, tags: [...(p.tags || []), val]})); (e.target as HTMLInputElement).value = ''; }
                    }
                  }} />
              </div>

              {/* Project */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">{isRU ? 'Проект' : 'Project'}</label>
                <input list="project-list" value={modalData.project || ''} onChange={e => setModalData(p => ({...p, project: e.target.value}))}
                  placeholder={isRU ? 'Без проекта' : 'No project'}
                  className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]" />
                <datalist id="project-list">
                  {Array.from(new Set(reminders.filter(r => (r as any).project).map(r => (r as any).project))).map((p: any) => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1E1E2E] flex justify-end gap-3">
              <button onClick={() => setIsReminderModalOpen(false)} className="px-5 py-2.5 text-[#55556A] text-sm">{isRU ? 'Отмена' : 'Cancel'}</button>
              <button onClick={() => saveReminder({ id: editingId || undefined, title: modalData.title, description: modalData.desc, dueDateTime: modalData.date, priority: modalData.priority, category: modalData.category, repeatType: modalData.repeat || RepeatType.NONE, subtasks: modalData.subtasks?.filter(s => s.title.trim()), estimatedMinutes: modalData.estimatedMinutes || undefined, tags: modalData.tags?.filter((t: string) => t.trim()), project: modalData.project?.trim() || undefined })} disabled={!modalData.title} className="px-6 py-2.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-xl font-semibold text-sm disabled:opacity-30">{isRU ? 'Сохранить' : 'Save'}</button>
              <button type="button" onClick={() => {
                if (!modalData.title) return;
                const template = { id: `tmpl_${Date.now()}`, title: modalData.title, desc: modalData.desc, priority: modalData.priority, category: modalData.category, repeat: modalData.repeat };
                setQuestTemplates(prev => [...prev, template]);
              }}
                className="px-4 py-2 text-[10px] font-bold text-[#D8C18E] hover:text-[#F2F1EE] transition-colors uppercase tracking-wider">
                {isRU ? '💾 Как шаблон' : '💾 As Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Toast + Confetti */}
      {achievementToast && (
        <>
          {/* Confetti particles */}
          <div className="fixed inset-0 z-[199] pointer-events-none overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  backgroundColor: ['#D8C18E', '#5DAEFF', '#FF6B35', '#4ADE80', '#FF4444', '#9B8FD8'][i % 6],
                  animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }} />
            ))}
          </div>
          <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
              style={{ backgroundColor: '#1A1A26', border: '1px solid #D8C18E40', boxShadow: '0 8px 32px rgba(184,155,94,0.2)' }}>
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs font-bold text-[#D8C18E] uppercase tracking-wider">{isRU ? 'Достижение открыто!' : 'Achievement Unlocked!'}</p>
                <p className="text-sm font-semibold text-[#F2F1EE]">{achievementToast.text}</p>
              </div>
              <span className="text-xs font-bold text-[#D8C18E] bg-[#D8C18E15] px-2 py-1 rounded-lg">+{achievementToast.xp} XP</span>
            </div>
          </div>
        </>
      )}
    </div>
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
          <p style={{color:'#FF4444',marginBottom:16}}>{navigator.language?.startsWith('ru') ? 'Ошибка системы.' : 'System error.'}</p>
          <p style={{color:'#55556A',fontSize:12,marginBottom:24,maxWidth:400,textAlign:'center'}}>{String(this.state.error?.message || '')}</p>
          <button onClick={() => {
            // Only clear Valhalla-specific data
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('eclipse_') || key.startsWith('lumina_') || key.startsWith('reminders_') || key.startsWith('notes_') || key.startsWith('routines_') || key.startsWith('workout_'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            window.location.href = '/';
          }} style={{background:'#5DAEFF',color:'#0A0A0F',border:'none',padding:'12px 24px',borderRadius:12,fontWeight:'bold',cursor:'pointer'}}>{navigator.language?.startsWith('ru') ? 'Сброс и перезагрузка' : 'Reset & Reload'}</button>
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
