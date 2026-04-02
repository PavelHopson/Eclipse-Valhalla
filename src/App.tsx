
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import AdBanner from './components/AdBanner';
import SubscriptionModal from './components/SubscriptionModal';
import Onboarding from './components/Onboarding';

import { Reminder, Note, ViewMode, RepeatType, Priority, User, Category, Routine, WorkoutLog, PlanTier, ReminderStatus, Theme } from './types';
import { generateId, playNotificationSound, getNextOccurrence, calculateLevel, getNextLevelXp, toLocalISOString } from './utils';
import { BellRing, X, Search, Trophy, Hammer, WifiOff, Wifi, Loader2 } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n';
import { api } from './services/storageService';
import { WidgetRenderer, syncWidgetsWithQuests, onQuestCompleted } from './widgets';
import { notifyInApp, processEscalations, startEscalation, stopEscalation } from './services/notificationService';
import { EclipseAmbient, DotGridOverlay } from './brand';
import { calculateDisciplineScore, getStreak, getFocusSessions, updateStreak, getDisciplineState, getNextLevelXp as getGamNextXp } from './services/gamificationService';

// --- LAZY LOAD HEAVY COMPONENTS ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const DashboardHero = lazy(() => import('./components/DashboardHero'));
const DisciplinePanel = lazy(() => import('./components/DisciplinePanel'));
const ReminderView = lazy(() => import('./components/ReminderView'));
const StickerBoard = lazy(() => import('./components/StickerBoard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const WorkoutView = lazy(() => import('./components/WorkoutView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));

// --- AI VIEWS ---
const OracleView = lazy(() => import('./components/OracleView'));
const NewsView = lazy(() => import('./components/NewsView'));
const MobileWidgetBoard = lazy(() => import('./components/MobileWidgetBoard'));
const ChatView = lazy(() => import('./components/ChatView').then(m => ({ default: m.ChatView })));
const ImageView = lazy(() => import('./components/ImageView').then(m => ({ default: m.ImageView })));
const TTSView = lazy(() => import('./components/TTSView').then(m => ({ default: m.TTSView })));

// --- LOADING SCREEN ---
const LoadingScreen = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-[#0A0A0F]">
    <Hammer className="w-8 h-8 animate-bounce mb-4 text-[#2A2A3C]" />
    <Loader2 className="w-5 h-5 animate-spin text-[#5DAEFF]" />
  </div>
);

const AppContent: React.FC = () => {
  const { t } = useLanguage();

  // -- Auth & User --
  // Auto-guest: if no session, create instant guest so user lands directly in app
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lumina_active_session');
    if (saved) return JSON.parse(saved);

    // Auto-create guest user for instant access (no auth wall)
    const guestUser: User = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: 'Warrior',
      email: '',
      plan: PlanTier.FREE,
      xp: 0,
      level: 1,
      theme: 'blue' as any,
      hasSeenOnboarding: false,
    };
    localStorage.setItem('lumina_active_session', JSON.stringify(guestUser));

    // Also seed into users DB so storageService works
    try {
      const usersRaw = localStorage.getItem('lumina_users_db');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      users.push({ ...guestUser, password: '' });
      localStorage.setItem('lumina_users_db', JSON.stringify(users));
    } catch {}

    return guestUser;
  });

  // -- App State --
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // -- Data State --
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  const [activeToast, setActiveToast] = useState<{title: string, desc: string, icon?: any} | null>(null);
  const [levelUpToast, setLevelUpToast] = useState<number | null>(null);

  // -- Reminder Modal State --
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const DEFAULT_MODAL_DATA = {
    title: '',
    desc: '',
    date: '',
    repeat: RepeatType.NONE,
    priority: Priority.MEDIUM,
    category: Category.PERSONAL,
    subtasks: [] as {id: string, title: string, isCompleted: boolean}[]
  };

  const [modalData, setModalData] = useState(DEFAULT_MODAL_DATA);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // -- Initialization --
  useEffect(() => {
    if (user) {
      // Load data once — don't re-check user freshness to avoid loops
      if (!user.hasSeenOnboarding) {
          setShowOnboarding(true);
      }

      setReminders(api.getData('reminders', user.id));
      setNotes(api.getData('notes', user.id));
      setRoutines(api.getData('routines', user.id));
      setWorkoutLogs(api.getData('workout_logs', user.id));

      setIsDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Offline/Online Listeners --
  useEffect(() => {
      const handleOnline = () => {
          setIsOnline(true);
          setActiveToast({ title: 'Connected', desc: 'Ravens are flying again.', icon: Wifi });
      };
      const handleOffline = () => {
          setIsOnline(false);
          setActiveToast({ title: 'Offline Mode', desc: 'Running locally. Changes saved to device.', icon: WifiOff });
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // -- Persistence (Debounced Auto-Save) --
  useEffect(() => {
      if (!user || !isDataLoaded) return;
      const handler = setTimeout(() => { api.saveData('reminders', user.id, reminders); }, 500);
      return () => clearTimeout(handler);
  }, [reminders, user, isDataLoaded]);

  useEffect(() => {
      if (!user || !isDataLoaded) return;
      const handler = setTimeout(() => { api.saveData('notes', user.id, notes); }, 500);
      return () => clearTimeout(handler);
  }, [notes, user, isDataLoaded]);

  useEffect(() => {
      if (!user || !isDataLoaded) return;
      const handler = setTimeout(() => { api.saveData('routines', user.id, routines); }, 500);
      return () => clearTimeout(handler);
  }, [routines, user, isDataLoaded]);

  useEffect(() => {
      if (!user || !isDataLoaded) return;
      const handler = setTimeout(() => { api.saveData('workout_logs', user.id, workoutLogs); }, 500);
      return () => clearTimeout(handler);
  }, [workoutLogs, user, isDataLoaded]);

  // -- SAFETY NET: Save on close/reload --
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (user && isDataLoaded) {
              api.saveData('reminders', user.id, reminders);
              api.saveData('notes', user.id, notes);
              api.saveData('routines', user.id, routines);
              api.saveData('workout_logs', user.id, workoutLogs);
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, isDataLoaded, reminders, notes, routines, workoutLogs]);

  // -- Gamification Logic --
  const addXp = (amount: number) => {
      if (!user || user.plan === PlanTier.FREE) return;
      const newXp = user.xp + amount;
      const newLevel = calculateLevel(newXp);

      if (newLevel > user.level) {
          setLevelUpToast(newLevel);
          playNotificationSound();
      }

      const updated = api.updateUser(user.id, { xp: newXp, level: newLevel });
      if (updated) setUser(updated);
  };

  // -- Dark Mode --
  useEffect(() => {
    const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!user) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsReminderModalOpen(false);
        setSelectedDay(null);
        setIsSubscriptionOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // -- Notifications --
  useEffect(() => {
    if (!user) return;
    if (Notification.permission === 'default') Notification.requestPermission();
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (reminder.isCompleted) return;
        const due = new Date(reminder.dueDateTime);
        const diff = due.getTime() - now.getTime();
        if (diff <= 0 && diff > -60000) {
            if (Notification.permission === 'granted') {
               new Notification(reminder.title, { body: reminder.priority, icon: '/vite.svg' });
            }
            setActiveToast({ title: reminder.title, desc: 'Task Due!' });
            playNotificationSound();
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [reminders, user]);

  useEffect(() => {
    if (activeToast || levelUpToast) {
      const timer = setTimeout(() => { setActiveToast(null); setLevelUpToast(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, levelUpToast]);

  // -- Widget ↔ Quest Sync (every 60s, delayed start) --
  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const timeout = setTimeout(() => {
      syncWidgetsWithQuests(reminders);
    }, 5000); // Delay initial sync
    const interval = setInterval(() => {
      syncWidgetsWithQuests(reminders);
    }, 60000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded]);

  // -- Handlers --

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleUpgrade = (plan: PlanTier) => {
      if (!user) return;
      const updated = api.updateUser(user.id, { plan });
      if (updated) setUser(updated);
      setIsSubscriptionOpen(false);
      alert(`Successfully upgraded to ${plan}!`);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
      if (!user) return;
      const updated = api.updateUser(user.id, updates);
      if (updated) {
          setUser(updated);
          setActiveToast({ title: 'Profile Updated', desc: 'Your identity has been forged.' });
      }
  };

  const handleThemeChange = (theme: Theme) => {
      if (!user) return;
      const updated = api.updateUser(user.id, { theme });
      if (updated) setUser(updated);
  };

  const handleOnboardingComplete = () => {
      if (!user) return;
      const updated = api.updateUser(user.id, { hasSeenOnboarding: true });
      if (updated) setUser(updated);
      setShowOnboarding(false);
  };

  const resetForm = () => {
      setModalData(DEFAULT_MODAL_DATA);
      setEditingId(null);
  };

  const handleOpenCreateModal = () => {
      resetForm();
      setModalData(prev => ({...prev, date: toLocalISOString(new Date()) }));
      setIsReminderModalOpen(true);
  };

  const saveReminder = (r: Partial<Reminder>) => {
    if (!user) return;

    const newReminder: Reminder = {
        id: r.id || generateId(),
        title: r.title || 'New Task',
        description: r.description || '',
        dueDateTime: r.dueDateTime || new Date().toISOString(),
        repeatType: r.repeatType || RepeatType.NONE,
        priority: r.priority || Priority.MEDIUM,
        category: r.category || Category.PERSONAL,
        isCompleted: false,
        status: ReminderStatus.TODO,
        createdAt: Date.now(),
        subtasks: r.subtasks || []
    };

    if (r.id) {
        setReminders(prev => prev.map(x => x.id === r.id ? { ...x, ...r } as Reminder : x));
    } else {
        setReminders(prev => [...prev, newReminder]);
    }
    setIsReminderModalOpen(false);
  };

  const toggleComplete = (id: string) => {
    // Clean up widgets + escalation for completed quest
    onQuestCompleted(id);
    stopEscalation(id);

    setReminders(prev => {
        const task = prev.find(r => r.id === id);
        if (!task) return prev;

        const isNowComplete = !task.isCompleted;

        if (isNowComplete) addXp(50);

        if (isNowComplete && task.repeatType !== RepeatType.NONE) {
            const nextDate = getNextOccurrence(new Date(task.dueDateTime), task.repeatType);
            const nextTask: Reminder = {
                ...task,
                id: generateId(),
                dueDateTime: nextDate.toISOString(),
                isCompleted: false,
                status: ReminderStatus.TODO,
                createdAt: Date.now(),
                subtasks: task.subtasks?.map(s => ({...s, isCompleted: false}))
            };
            return [...prev.map(r => r.id === id ? { ...r, isCompleted: true, status: ReminderStatus.DONE } : r), nextTask];
        }
        return prev.map(r => r.id === id ? { ...r, isCompleted: isNowComplete, status: isNowComplete ? ReminderStatus.DONE : ReminderStatus.TODO } : r);
    });
  };

  const changeStatus = (id: string, status: ReminderStatus) => {
      setReminders(prev => prev.map(r => {
          if (r.id === id) {
              const isCompleted = status === ReminderStatus.DONE;
              if (isCompleted && !r.isCompleted) addXp(50);
              return { ...r, status, isCompleted };
          }
          return r;
      }));
  };

  const deleteReminder = (id: string) => {
      if(confirm('Delete task?')) setReminders(prev => prev.filter(r => r.id !== id));
  };

  // --- Gamification State (memoized to prevent infinite loops) ---
  const disciplineScore = useMemo(() => {
    if (!user || reminders.length === 0) return 50;
    const total = reminders.length;
    const completed = reminders.filter(q => q.isCompleted).length;
    const overdue = reminders.filter(q => !q.isCompleted && new Date(q.dueDateTime) < new Date()).length;
    const rate = total > 0 ? completed / total : 0;
    return Math.max(0, Math.min(100, Math.round(rate * 60 + (1 - (overdue / Math.max(total, 1))) * 20 + 20)));
  }, [reminders, user?.id]);
  const streak = useMemo(() => getStreak(), [user?.id]);
  const focusSessions = useMemo(() => getFocusSessions(), [user?.id]);
  const gamState = useMemo(() => getDisciplineState(), [user?.id]);

  // --- Render ---

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#0A0A0F] font-sans text-[#E8E8F0] fixed inset-0">
      {/* Brand Atmosphere */}
      <EclipseAmbient variant="cold" intensity={0.8} />
      <DotGridOverlay opacity={0.3} />

      {/* Mobile Header */}
      <div className="md:hidden bg-[#0A0A0F] border-b border-[#1E1E2E] p-4 pt-safe flex justify-between items-center shrink-0 z-20">
          <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5DAEFF15] border border-[#5DAEFF30] flex items-center justify-center">
                  <Hammer className="w-3.5 h-3.5 text-[#5DAEFF]" />
              </div>
              <span className="font-bold text-[#E8E8F0] tracking-widest uppercase font-serif text-xs">Eclipse</span>
          </div>
          <div className="flex gap-2">
              {!isOnline && <div className="p-2 bg-[#1A1A26] rounded-full text-[#55556A]"><WifiOff className="w-4 h-4" /></div>}
              <button onClick={() => setIsSearchOpen(true)} className="p-2 bg-[#12121A] text-[#55556A] rounded-lg hover:bg-[#1A1A26] border border-[#1E1E2E]"><Search className="w-4 h-4" /></button>
          </div>
      </div>

      <Navigation
        currentView={currentView}
        setView={setCurrentView}
        onSearchClick={() => setIsSearchOpen(true)}
        user={user}
        onUpgrade={() => setIsSubscriptionOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 h-full relative flex flex-col min-w-0 overflow-hidden pb-[70px] md:pb-0">
        <Suspense fallback={<LoadingScreen />}>
            {currentView === 'dashboard' && <Dashboard reminders={reminders} setView={setCurrentView} user={user} />}
            {currentView === 'reminders' && <ReminderView
                reminders={reminders}
                toggleComplete={toggleComplete}
                deleteReminder={deleteReminder}
                onOpenCreateModal={handleOpenCreateModal}
                onEditReminder={(r) => { setEditingId(r.id); setModalData({...r} as any); setIsReminderModalOpen(true); }}
                onAddSmartTask={(r) => saveReminder(r)}
                onStatusChange={changeStatus}
                userPlan={user.plan}
                onUpgrade={() => setIsSubscriptionOpen(true)}
            />}
            {currentView === 'stickers' && <StickerBoard notes={notes} setNotes={setNotes} />}
            {currentView === 'calendar' && <CalendarView reminders={reminders} onSelectDate={(d) => { setSelectedDay(d); }} />}
            {currentView === 'workouts' && <WorkoutView routines={routines} logs={workoutLogs} setRoutines={setRoutines} setLogs={setWorkoutLogs} />}
            {currentView === 'settings' && <SettingsView
                remindersCount={reminders.length}
                notesCount={notes.length}
                user={user}
                onLogout={() => setUser(null)}
                setReminders={setReminders}
                setNotes={setNotes}
                onUpdateTheme={handleThemeChange}
                onUpgrade={() => setIsSubscriptionOpen(true)}
                onUpdateUser={handleUpdateUser}
            />}
            {currentView === 'admin' && <AdminPanel reminders={reminders} notes={notes} setReminders={setReminders} setNotes={setNotes} />}

            {/* Oracle AI */}
            {currentView === 'oracle' && <OracleView quests={reminders} />}

            {/* Nexus Intelligence Feed */}
            {currentView === 'nexus' && user && (
              <NewsView
                userId={user.id}
                onCreateQuest={(quest) => {
                  saveReminder({
                    title: quest.title,
                    description: quest.description,
                    dueDateTime: quest.dueAt,
                    priority: quest.priority === 'high' ? Priority.HIGH : quest.priority === 'medium' ? Priority.MEDIUM : Priority.LOW,
                    category: Category.EDUCATION,
                  });
                }}
              />
            )}

            {/* Forge: AI Tools */}
            {currentView === 'chat' && (
              <div className="h-full p-4 md:p-6 overflow-hidden">
                <ChatView />
              </div>
            )}
            {currentView === 'image' && (
              <div className="h-full p-4 md:p-6 overflow-hidden">
                <ImageView />
              </div>
            )}
            {currentView === 'tts' && (
              <div className="h-full p-4 md:p-6 overflow-hidden">
                <TTSView />
              </div>
            )}
        </Suspense>
      </main>

      {/* Overlays */}
      <Suspense fallback={null}>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} reminders={reminders} notes={notes} onNavigate={setCurrentView} />
      </Suspense>

      {/* Create Quest Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative w-full md:max-w-lg bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300 pb-safe">
            <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0E0E16]/50">
              <h3 className="text-lg font-bold text-[#E8E8F0]">{editingId ? t('tasks.modal_title') : t('tasks.modal_title')}</h3>
              <button onClick={() => setIsReminderModalOpen(false)} className="p-1 rounded-lg hover:bg-[#1F1F2B]"><X className="w-5 h-5 text-[#55556A]" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div><label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider mb-1.5">{t('tasks.modal_name')}</label><input type="text" value={modalData.title} onChange={(e) => setModalData(p => ({...p, title: e.target.value}))} className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] outline-none font-medium text-lg text-[#E8E8F0] placeholder-[#3A3A4A] focus:border-[#5DAEFF40]" autoFocus placeholder="Quest objective..." /></div>
              <div><label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider mb-1.5">{t('tasks.modal_details')}</label><textarea value={modalData.desc} onChange={(e) => setModalData(p => ({...p, desc: e.target.value}))} className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] h-24 resize-none text-sm text-[#8888A0] placeholder-[#3A3A4A] focus:border-[#5DAEFF40] outline-none" placeholder="Strategy notes..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider mb-1.5">{t('tasks.modal_date')}</label><input type="datetime-local" value={modalData.date} onChange={(e) => setModalData(p => ({...p, date: e.target.value}))} className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]" /></div>
                <div><label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider mb-1.5">{t('tasks.modal_priority')}</label><select value={modalData.priority} onChange={(e) => setModalData(p => ({...p, priority: e.target.value as Priority}))} className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]">{Object.values(Priority).map(v => <option key={v} value={v}>{v}</option>)}</select></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#0E0E16]/50 border-t border-[#1E1E2E] flex justify-end gap-3">
              <button onClick={() => setIsReminderModalOpen(false)} className="px-5 py-2.5 text-[#55556A] hover:text-[#8888A0] font-medium text-sm transition-colors">{t('tasks.modal_cancel')}</button>
              <button onClick={() => saveReminder({id: editingId || undefined, ...modalData})} disabled={!modalData.title} className="px-6 py-2.5 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] rounded-xl font-semibold text-sm shadow-[0_0_15px_rgba(93,174,255,0.2)] disabled:opacity-30">{t('tasks.modal_save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
         <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center">
             <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
             <div className="relative w-full md:max-w-md bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-4 pb-safe">
                <div className="p-4 border-b border-[#1E1E2E] bg-[#0E0E16]/50 flex justify-between items-center">
                    <h3 className="font-bold text-[#E8E8F0]">{selectedDay.toLocaleDateString()}</h3>
                    <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-[#1F1F2B]"><X className="w-5 h-5 text-[#55556A]" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {reminders.filter(r => new Date(r.dueDateTime).toDateString() === selectedDay.toDateString()).map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 border border-[#2A2A3C] rounded-xl bg-[#1A1A26]">
                            <div className={`w-2 h-2 rounded-full ${r.isCompleted ? 'bg-[#3A3A4A]' : 'bg-[#5DAEFF]'}`}></div>
                            <p className="font-medium text-sm text-[#E8E8F0]">{r.title}</p>
                        </div>
                    ))}
                    {reminders.filter(r => new Date(r.dueDateTime).toDateString() === selectedDay.toDateString()).length === 0 && (
                        <p className="text-center text-[#55556A] italic py-4">No quests this day.</p>
                    )}
                </div>
                <div className="p-4 border-t border-[#1E1E2E]">
                    <button
                        onClick={() => {
                            resetForm();
                            setModalData(prev => ({...prev, date: toLocalISOString(selectedDay) }));
                            setIsReminderModalOpen(true);
                            setSelectedDay(null);
                        }}
                        className="w-full py-3 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] rounded-xl font-semibold text-sm shadow-[0_0_15px_rgba(93,174,255,0.2)]"
                    >
                        {t('tasks.new_task')}
                    </button>
                </div>
             </div>
         </div>
      )}

      {/* Subscription Modal */}
      {isSubscriptionOpen && user && (
          <SubscriptionModal currentPlan={user.plan} onSelectPlan={handleUpgrade} onClose={() => setIsSubscriptionOpen(false)} />
      )}

      {/* Onboarding */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Ad Banner */}
      {user?.plan === PlanTier.FREE && <AdBanner onUpgrade={() => setIsSubscriptionOpen(true)} onClose={() => {}} />}

      {/* Notification Toast */}
      {activeToast && (
        <div className="fixed top-4 md:top-auto md:bottom-8 right-4 left-4 md:left-auto bg-[#1A1A26] border border-[#2A2A3C] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 max-w-sm z-[100] flex items-start gap-3 cursor-pointer animate-in slide-in-from-top-2 md:slide-in-from-bottom-2" onClick={() => { if (activeToast.title !== 'Offline Mode' && activeToast.title !== 'Connected') setCurrentView('reminders'); setActiveToast(null); }}>
          <div className="p-2.5 bg-[#5DAEFF10] border border-[#5DAEFF30] rounded-lg text-[#5DAEFF]">
             {activeToast.icon ? React.createElement(activeToast.icon, { className: "w-5 h-5" }) : <BellRing className="w-5 h-5" />}
          </div>
          <div><h4 className="font-bold text-[#E8E8F0] text-sm">{activeToast.title}</h4><p className="text-xs text-[#55556A]">{activeToast.desc}</p></div>
        </div>
      )}

      {/* Level Up Toast */}
      {levelUpToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#FFD700] text-[#0A0A0F] px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,215,0,0.3)] z-[100] font-bold flex items-center gap-2 animate-bounce whitespace-nowrap">
              <Trophy className="w-5 h-5" />
              {t('game.toast_levelup')} {levelUpToast}!
          </div>
      )}

      {/* Widget Overlay */}
      <WidgetRenderer />
    </div>
  );
};

const App = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
