
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Reminder, Note, ViewMode, RepeatType, Priority, User, Category, Routine, WorkoutLog, PlanTier, ReminderStatus } from './types';
import { generateId, toLocalISOString } from './utils';
import { X, Hammer, Loader2 } from 'lucide-react';
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
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const OracleView = lazy(() => import('./components/OracleView'));
const NewsView = lazy(() => import('./components/NewsView'));
const ChatView = lazy(() => import('./components/ChatView').then(m => ({ default: m.ChatView })));
const ImageView = lazy(() => import('./components/ImageView').then(m => ({ default: m.ImageView })));
const TTSView = lazy(() => import('./components/TTSView').then(m => ({ default: m.TTSView })));

const LoadingScreen = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-[#0A0A0F]">
    <Hammer className="w-8 h-8 animate-bounce mb-4 text-[#2A2A3C]" />
    <Loader2 className="w-5 h-5 animate-spin text-[#5DAEFF]" />
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
  const { t } = useLanguage();

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

  // Load data ONCE
  useEffect(() => {
    setReminders(api.getData('reminders', user.id));
    setNotes(api.getData('notes', user.id));
    setRoutines(api.getData('routines', user.id));
    setWorkoutLogs(api.getData('workout_logs', user.id));
    setIsDataLoaded(true);
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
    }
    setIsReminderModalOpen(false);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, isCompleted: !r.isCompleted, status: r.isCompleted ? ReminderStatus.TODO : ReminderStatus.DONE } : r
    ));
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
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#0A0A0F] font-sans text-[#E8E8F0] fixed inset-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0A0A0F] border-b border-[#1E1E2E] p-4 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5DAEFF15] border border-[#5DAEFF30] flex items-center justify-center">
            <Hammer className="w-3.5 h-3.5 text-[#5DAEFF]" />
          </div>
          <span className="font-bold text-[#E8E8F0] tracking-widest uppercase font-serif text-xs">Eclipse</span>
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
          {currentView === 'dashboard' && <Dashboard reminders={reminders} setView={setCurrentView} user={user} />}
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
          {currentView === 'admin' && <AdminPanel reminders={reminders} notes={notes} setReminders={setReminders} setNotes={setNotes} />}
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

      {/* Quest Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative w-full md:max-w-lg bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#E8E8F0]">{editingId ? 'Edit Quest' : 'New Quest'}</h3>
              <button onClick={() => setIsReminderModalOpen(false)}><X className="w-5 h-5 text-[#55556A]" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <input type="text" value={modalData.title} onChange={e => setModalData(p => ({...p, title: e.target.value}))} placeholder="Quest objective..." autoFocus className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]" />
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

const App = () => (
  <AppErrorBoundary>
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  </AppErrorBoundary>
);

export default App;
