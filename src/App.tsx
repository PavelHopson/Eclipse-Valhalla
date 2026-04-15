
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Reminder, Note, ViewMode, RepeatType, Priority, User, Category, Routine, WorkoutLog, PlanTier, ReminderStatus } from './types';
import { toLocalISOString } from './utils';
import { Seal } from './brand/Seal';
import { LanguageProvider, useLanguage } from './i18n';
import { api } from './services/storageService';
import TitleBar from './components/TitleBar';
import UpdateNotification from './components/UpdateNotification';
import { OnboardingTip } from './components/OnboardingTips';
import { ToastContainer } from './design';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import {
  QuestTemplate,
  buildDefaultQuestTemplates,
  loadQuestTemplates,
} from './constants/questTemplates';
import { useBootstrap } from './hooks/useBootstrap';
import { useAchievementToasts } from './hooks/useAchievementToasts';
import { useFeatureTracking } from './hooks/useFeatureTracking';
import { useAutosave } from './hooks/useAutosave';
import { useReminderMutations } from './hooks/useReminderMutations';
import { QuestModal, QuestModalData } from './components/QuestModal';
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

// Lazy-load growth components
const QuickQuestInput = lazy(() => import('./components/QuickQuestInput'));
const FeedbackPanel = lazy(() => import('./components/FeedbackPanel'));
const AIProviderSettings = lazy(() => import('./components/AIProviderSettings'));
const ReturnOverlay = lazy(() => import('./components/ReturnOverlay'));

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

  const defaultQuestTemplates = useMemo(() => buildDefaultQuestTemplates(isRU), [isRU]);
  const [questTemplates, setQuestTemplates] = useState<QuestTemplate[]>(() =>
    loadQuestTemplates(buildDefaultQuestTemplates(isRU)),
  );

  // Modal state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<QuestModalData>({
    title: '',
    desc: '',
    date: '',
    repeat: RepeatType.NONE,
    priority: Priority.MEDIUM,
    category: Category.PERSONAL,
    subtasks: [],
    estimatedMinutes: 0,
    tags: [],
    project: '',
  });
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

  // Achievement toast — subscription, XP credit, persistence, auto-hide
  const achievementToast = useAchievementToasts({ t, setUser });

  // Track feature usage for achievements
  useFeatureTracking({ currentView, isDataLoaded });

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

  // One-time bootstrap: load data, track session, streak, notifications,
  // pressure scheduling, overdue watcher — see src/hooks/useBootstrap.ts
  useBootstrap({
    user,
    isRussian: isRU,
    setReminders,
    setNotes,
    setRoutines,
    setWorkoutLogs,
    setIsDataLoaded,
    setReturnMessage,
    setReturnOverlay,
    setWeeklySummary,
  });

  // Debounced autosave for all user collections
  useAutosave({
    userId: user.id,
    isDataLoaded,
    reminders,
    notes,
    routines,
    workoutLogs,
    questTemplates,
  });

  // Keyboard shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') { setIsSearchOpen(false); setIsReminderModalOpen(false); setSelectedDay(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Reminder mutation handlers (create/edit, toggle complete, delete)
  const { saveReminder, toggleComplete, deleteReminder } = useReminderMutations({
    setReminders,
    setUser,
    setIsReminderModalOpen,
  });

  const handleOpenCreateModal = useCallback(() => {
    setEditingId(null);
    setModalData({
      title: '',
      desc: '',
      date: toLocalISOString(new Date()),
      repeat: RepeatType.NONE,
      priority: Priority.MEDIUM,
      category: Category.PERSONAL,
      subtasks: [],
      estimatedMinutes: 0,
      tags: [] as string[],
      project: '',
    });
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
      <QuestModal
        isOpen={isReminderModalOpen}
        editingId={editingId}
        modalData={modalData}
        setModalData={setModalData}
        questTemplates={questTemplates}
        setQuestTemplates={setQuestTemplates}
        defaultQuestTemplates={defaultQuestTemplates}
        reminders={reminders}
        onSave={saveReminder}
        onClose={() => setIsReminderModalOpen(false)}
        isRussian={isRU}
        language={language}
      />

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

const App = () => (
  <AppErrorBoundary>
    <LanguageProvider>
      <AppContent />
      <ToastContainer />
    </LanguageProvider>
  </AppErrorBoundary>
);

export default App;
