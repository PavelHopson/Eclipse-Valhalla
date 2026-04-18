import React, { Suspense, lazy } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Seal } from '../brand/Seal';
import {
  Note,
  Priority,
  Reminder,
  ReminderStatus,
  Routine,
  User,
  ViewMode,
  WorkoutLog,
} from '../types';
import { OnboardingTip } from '../components/OnboardingTips';
import type { QuestModalData } from '../components/QuestModal';

const Dashboard = lazy(() => import('../components/Dashboard'));
const ReminderView = lazy(() => import('../components/ReminderView'));
const StickerBoard = lazy(() => import('../components/StickerBoard'));
const CalendarView = lazy(() => import('../components/CalendarView'));
const WorkoutView = lazy(() => import('../components/WorkoutView'));
const SettingsView = lazy(() => import('../components/SettingsView'));
const AdminPanel = lazy(() => import('../admin/AdminDashboard'));
const OracleView = lazy(() => import('../components/OracleView'));
const NewsView = lazy(() => import('../components/NewsView'));
const ChatView = lazy(() =>
  import('../components/ChatView').then((m) => ({ default: m.ChatView })),
);
const ImageView = lazy(() =>
  import('../components/ImageView').then((m) => ({ default: m.ImageView })),
);
const TTSView = lazy(() =>
  import('../components/TTSView').then((m) => ({ default: m.TTSView })),
);

const DashboardHero = lazy(() => import('../components/DashboardHero'));
const AchievementsPanel = lazy(() => import('../components/AchievementsPanel'));
const HabitsView = lazy(() => import('../components/HabitsView'));
const JournalView = lazy(() => import('../components/JournalView'));
const BodyTracker = lazy(() => import('../components/BodyTracker'));
const ChallengesView = lazy(() => import('../components/ChallengesView'));
const AnalyticsView = lazy(() => import('../components/AnalyticsView'));
const CareersView = lazy(() => import('../components/CareersView'));
const QuickQuestInput = lazy(() => import('../components/QuickQuestInput'));

const SESSION_STORAGE_KEY = 'lumina_active_session';

interface AppRouterProps {
  currentView: ViewMode;
  setCurrentView: Dispatch<SetStateAction<ViewMode>>;

  user: User;
  setUser: Dispatch<SetStateAction<User>>;

  reminders: Reminder[];
  setReminders: Dispatch<SetStateAction<Reminder[]>>;
  pendingReminders: Reminder[];
  overdueReminders: Reminder[];

  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;

  routines: Routine[];
  setRoutines: Dispatch<SetStateAction<Routine[]>>;

  workoutLogs: WorkoutLog[];
  setWorkoutLogs: Dispatch<SetStateAction<WorkoutLog[]>>;

  currentStreak: number;
  disciplineScore: number;
  returnMessage: string | null;

  saveReminder: (partial: Partial<Reminder>) => void;
  toggleComplete: (id: string) => void;
  deleteReminder: (id: string) => void;

  handleOpenCreateModal: () => void;
  setFocusQuestId: Dispatch<SetStateAction<string | null>>;
  setIsSubscriptionOpen: Dispatch<SetStateAction<boolean>>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setModalData: Dispatch<SetStateAction<QuestModalData>>;
  setIsReminderModalOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedDay: Dispatch<SetStateAction<Date | null>>;

  isRussian: boolean;
}

function returnMessageColors(message: string): { border: string; bg: string; text: string } {
  const isBroken = message.includes('broken') || message.includes('absent');
  return isBroken
    ? { border: '#E0303015', bg: '#E0303004', text: '#E03030' }
    : { border: '#3DD68C15', bg: '#3DD68C04', text: '#3DD68C' };
}

export function AppRouter(props: AppRouterProps): React.ReactElement {
  const {
    currentView,
    setCurrentView,
    user,
    setUser,
    reminders,
    setReminders,
    pendingReminders,
    overdueReminders,
    notes,
    setNotes,
    routines,
    setRoutines,
    workoutLogs,
    setWorkoutLogs,
    currentStreak,
    disciplineScore,
    returnMessage,
    saveReminder,
    toggleComplete,
    deleteReminder,
    handleOpenCreateModal,
    setFocusQuestId,
    setIsSubscriptionOpen,
    setEditingId,
    setModalData,
    setIsReminderModalOpen,
    setSelectedDay,
    isRussian,
  } = props;

  if (currentView === 'dashboard') {
    const returnColors = returnMessage ? returnMessageColors(returnMessage) : null;

    return (
      <div className="h-full overflow-y-auto">
        {returnMessage && returnColors && (
          <div
            className="mx-8 mt-5 px-4 py-2.5 rounded-md border"
            style={{ borderColor: returnColors.border, backgroundColor: returnColors.bg }}
          >
            <p className="text-[11px] font-semibold" style={{ color: returnColors.text }}>
              {returnMessage}
            </p>
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
              onCreateQuest={(title) =>
                saveReminder({
                  title,
                  dueDateTime: new Date(Date.now() + 86400000).toISOString(),
                })
              }
              placeholder={isRussian ? 'Назови цель. Нажми Enter.' : 'Name the objective. Press Enter.'}
            />
          </Suspense>
        </div>

        {pendingReminders.length > 0 && (
          <div className="mx-4 mb-4 rounded-[24px] border border-white/8 bg-[#121212]/92 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] md:mx-6 md:p-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7F7A72]">
                {isRussian ? 'Активные квесты' : 'Active quests'}
              </div>
              {overdueReminders.length > 0 && (
                <div className="rounded-full border border-[#7A1F2433] bg-[#7A1F2412] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C05A60]">
                  {overdueReminders.length} {isRussian ? 'долг' : 'overdue'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {pendingReminders.slice(0, 6).map((r) => {
                const isOverdue = new Date(r.dueDateTime) < new Date();
                return (
                  <button
                    key={r.id}
                    onClick={() => setFocusQuestId(r.id)}
                    className={`group w-full flex items-center gap-4 rounded-[18px] border px-4 py-4 text-left transition-all ${
                      isOverdue
                        ? 'border-[#7A1F2430] bg-[#7A1F240D] state-overdue hover:bg-[#7A1F2412]'
                        : 'border-white/8 bg-[#171717] state-active hover:bg-[#1D1D1D]'
                    }`}
                  >
                    <div
                      className={`h-11 w-11 shrink-0 rounded-[14px] border flex items-center justify-center ${
                        isOverdue
                          ? 'border-[#7A1F2438] bg-[#7A1F2416]'
                          : 'border-[#6C8FB826] bg-[#6C8FB80F]'
                      }`}
                    >
                      <Seal
                        size={18}
                        variant={isOverdue ? 'broken' : 'watching'}
                        color={isOverdue ? '#A33036' : '#6C8FB8'}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-[15px] font-bold ${
                          isOverdue ? 'text-[#F4D6D8]' : 'text-[#F2F1EE]'
                        }`}
                      >
                        {r.title}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7F7A72]">
                        {isOverdue
                          ? isRussian
                            ? 'Требует немедленного ответа'
                            : 'Immediate response required'
                          : isRussian
                            ? 'Готов к входу в фокус'
                            : 'Ready for focus entry'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B4B0A7] transition-transform group-hover:translate-x-0.5">
                      {isRussian ? 'Фокус' : 'Focus'} →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Dashboard reminders={reminders} setView={setCurrentView} user={user} />
      </div>
    );
  }

  if (currentView === 'reminders') {
    return (
      <>
        <OnboardingTip section="reminders" />
        <ReminderView
          reminders={reminders}
          toggleComplete={toggleComplete}
          deleteReminder={deleteReminder}
          onOpenCreateModal={handleOpenCreateModal}
          onEditReminder={(r) => {
            setEditingId(r.id);
            setModalData({
              title: r.title,
              desc: r.description,
              date: r.dueDateTime,
              repeat: r.repeatType,
              priority: r.priority,
              category: r.category,
              subtasks: r.subtasks || [],
              estimatedMinutes: r.estimatedMinutes || 0,
              tags: (r as unknown as { tags?: string[] }).tags || [],
              project: (r as unknown as { project?: string }).project || '',
            });
            setIsReminderModalOpen(true);
          }}
          onAddSmartTask={(r) => saveReminder(r)}
          onStatusChange={(id, status) =>
            setReminders((prev) =>
              prev.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      status,
                      isCompleted: status === ReminderStatus.DONE,
                      completedAt: status === ReminderStatus.DONE ? Date.now() : undefined,
                    }
                  : r,
              ),
            )
          }
          onStartFocus={(id) => setFocusQuestId(id)}
          userPlan={user.plan}
          onUpgrade={() => setIsSubscriptionOpen(true)}
        />
      </>
    );
  }

  if (currentView === 'stickers') return <StickerBoard notes={notes} setNotes={setNotes} />;
  if (currentView === 'calendar')
    return <CalendarView reminders={reminders} onSelectDate={setSelectedDay} />;

  if (currentView === 'workouts') {
    return (
      <>
        <OnboardingTip section="workouts" />
        <WorkoutView
          routines={routines}
          logs={workoutLogs}
          setRoutines={setRoutines}
          setLogs={setWorkoutLogs}
        />
      </>
    );
  }

  if (currentView === 'settings') {
    return (
      <>
        <OnboardingTip section="settings" />
        <SettingsView
          remindersCount={reminders.length}
          notesCount={notes.length}
          user={user}
          onLogout={() => {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            window.location.reload();
          }}
          setReminders={setReminders}
          setNotes={setNotes}
          onUpdateTheme={() => {}}
          onUpgrade={() => setIsSubscriptionOpen(true)}
          onUpdateUser={(updates) => {
            const u = { ...user, ...updates };
            setUser(u);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(u));
          }}
        />
      </>
    );
  }

  if (currentView === 'admin') return <AdminPanel />;

  if (currentView === 'oracle') {
    return (
      <>
        <OnboardingTip section="oracle" />
        <OracleView quests={reminders} />
      </>
    );
  }

  if (currentView === 'nexus') {
    return (
      <>
        <OnboardingTip section="nexus" />
        <NewsView
          userId={user.id}
          onCreateQuest={(q) =>
            saveReminder({
              title: q.title,
              description: q.description,
              dueDateTime: q.dueAt,
              priority:
                q.priority === 'high'
                  ? Priority.HIGH
                  : q.priority === 'low'
                    ? Priority.LOW
                    : Priority.MEDIUM,
            })
          }
        />
      </>
    );
  }

  if (currentView === 'chat')
    return (
      <div className="h-full p-4 md:p-6 overflow-hidden">
        <ChatView />
      </div>
    );
  if (currentView === 'image')
    return (
      <div className="h-full p-4 md:p-6 overflow-hidden">
        <ImageView />
      </div>
    );
  if (currentView === 'tts')
    return (
      <div className="h-full p-4 md:p-6 overflow-hidden">
        <TTSView />
      </div>
    );

  if (currentView === 'achievements') {
    return (
      <>
        <OnboardingTip section="achievements" />
        <AchievementsPanel isOpen={true} onClose={() => setCurrentView('dashboard')} />
      </>
    );
  }

  if (currentView === 'analytics') {
    return (
      <AnalyticsView
        reminders={reminders}
        workoutLogs={workoutLogs}
        streak={currentStreak}
        level={user.level || 1}
        xp={user.xp || 0}
      />
    );
  }

  if (currentView === 'habits') return <HabitsView />;
  if (currentView === 'journal') return <JournalView />;
  if (currentView === 'body') return <BodyTracker />;
  if (currentView === 'challenges') return <ChallengesView />;
  if (currentView === 'careers') return <CareersView />;

  // Unknown view — render nothing
  return <></>;
}
