
import React, { useState } from 'react';
import { Reminder, RepeatType, Priority, PlanTier, ReminderStatus } from '../types';
import { formatDate, getPriorityColor, parseSmartTask } from '../utils';
import { Plus, Bell, CheckCircle2, Circle, Trash2, Clock, Calendar, Filter, ArrowUpDown, LayoutList, Kanban, Sparkles, Lock } from 'lucide-react';
import { useLanguage } from '../i18n';

interface ReminderViewProps {
  reminders: Reminder[];
  toggleComplete: (id: string) => void;
  deleteReminder: (id: string) => void;
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onAddSmartTask: (task: Partial<Reminder>) => void;
  onStatusChange: (id: string, status: ReminderStatus) => void;
  userPlan: PlanTier;
  onUpgrade: () => void;
}

const ReminderView: React.FC<ReminderViewProps> = ({
    reminders, toggleComplete, deleteReminder, onOpenCreateModal, onEditReminder, onAddSmartTask, onStatusChange, userPlan, onUpgrade
}) => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [viewType, setViewType] = useState<'list' | 'board'>('list');
  const [aiInput, setAiInput] = useState('');

  // AI Smart Input Handler
  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userPlan === PlanTier.FREE) {
        onUpgrade();
        return;
    }
    if (!aiInput.trim()) return;
    const parsed = parseSmartTask(aiInput);
    onAddSmartTask(parsed);
    setAiInput('');
  };

  // Sort: Active first, then Priority (High->Low), then Date
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
    if (pWeight[a.priority] !== pWeight[b.priority]) return pWeight[b.priority] - pWeight[a.priority];
    return new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime();
  });

  const filteredReminders = sortedReminders.filter(r => {
    if (filter === 'active') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    return true;
  });

  const getFilterLabel = (f: string) => {
      switch(f) {
          case 'active': return t('tasks.filter_active');
          case 'completed': return t('tasks.filter_completed');
          default: return t('tasks.filter_all');
      }
  };

  // --- KANBAN COLUMNS ---
  const columns = [
      { id: ReminderStatus.TODO, title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
      { id: ReminderStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' },
      { id: ReminderStatus.DONE, title: 'Done', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' }
  ];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-6xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">{t('tasks.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t('tasks.subtitle_1')} <span className="font-semibold text-blue-600 dark:text-blue-400">{reminders.filter(r => !r.isCompleted).length}</span> {t('tasks.subtitle_2')}
          </p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewType('list')} className={`p-2 rounded-md ${viewType === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} title={t('tasks.view_list')}><LayoutList className="w-5 h-5"/></button>
                <button onClick={() => setViewType('board')} className={`p-2 rounded-md ${viewType === 'board' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} title={t('tasks.view_board')}><Kanban className="w-5 h-5"/></button>
            </div>
            <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all font-medium text-sm active:scale-95"
            >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('tasks.new_task')}</span>
            </button>
        </div>
      </div>

      {/* AI Smart Input */}
      <form onSubmit={handleAiSubmit} className="relative mb-6 group">
         <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${userPlan === PlanTier.FREE ? 'text-slate-300' : 'text-indigo-500'}`}>
             {userPlan === PlanTier.FREE ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
         </div>
         <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder={userPlan === PlanTier.FREE ? t('tasks.ai_locked') : t('tasks.ai_placeholder')}
            readOnly={userPlan === PlanTier.FREE}
            onClick={() => userPlan === PlanTier.FREE && onUpgrade()}
            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border outline-none transition-all shadow-sm text-sm md:text-base ${
                userPlan === PlanTier.FREE
                ? 'bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-pointer border-slate-200 dark:border-slate-800'
                : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 dark:text-white'
            }`}
         />
      </form>

      {/* View Content */}
      {viewType === 'list' ? (
        <>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {(['active', 'all', 'completed'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold capitalize transition-all whitespace-nowrap shrink-0 ${
                    filter === f
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                    {getFilterLabel(f)}
                </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col relative">
                {filteredReminders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                    <Bell className="w-10 h-10 opacity-20 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{t('tasks.empty_title')}</h3>
                    <p className="text-sm max-w-xs mt-2 text-slate-500 dark:text-slate-500">{t('tasks.empty_desc')}</p>
                </div>
                ) : (
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {filteredReminders.map(reminder => (
                    <div
                        key={reminder.id}
                        onClick={() => onEditReminder(reminder)}
                        className={`group p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all flex items-start gap-4 cursor-pointer active:scale-[0.98] ${
                        reminder.isCompleted ? 'bg-slate-50 dark:bg-slate-900/50 opacity-75' : 'bg-white dark:bg-slate-800'
                        }`}
                    >
                        <button
                        onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id); }}
                        className={`mt-1 shrink-0 transition-colors p-1 -ml-1 ${
                            reminder.isCompleted ? 'text-green-500' : 'text-slate-300 dark:text-slate-600 hover:text-blue-500'
                        }`}
                        >
                        {reminder.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>

                        <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-semibold text-sm md:text-base break-words ${reminder.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                            {reminder.title}
                            </h3>
                            {!reminder.isCompleted && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority}
                            </span>
                            )}
                        </div>

                        {reminder.description && (
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 font-normal">{reminder.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium mt-2">
                            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(reminder.dueDateTime, language)}
                            </span>

                            {reminder.repeatType !== RepeatType.NONE && (
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/50">
                                <Clock className="w-3.5 h-3.5" />
                                {reminder.repeatType}
                            </span>
                            )}
                        </div>
                        </div>

                        <button
                        onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
                        >
                        <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </>
      ) : (
          // KANBAN BOARD - Mobile Optimized with Snap Scrolling
          <div className="flex-1 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-4 h-full min-w-max md:min-w-0 pr-4">
                  {columns.map(col => (
                      <div key={col.id} className={`flex-1 rounded-2xl border p-3 flex flex-col snap-center w-[85vw] md:w-auto md:min-w-[280px] ${col.color}`}>
                          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-slate-600 dark:text-slate-300 px-2 flex justify-between sticky top-0">
                              {col.title}
                              <span className="bg-white dark:bg-slate-900 px-2 rounded-full text-xs border border-slate-200 dark:border-slate-700">
                                  {reminders.filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id).length}
                              </span>
                          </h3>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                              {reminders
                                .filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id)
                                .map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all active:scale-95">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-white mb-1 line-clamp-2">{r.title}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(r.priority)}`}>{r.priority}</span>

                                            {/* Move Controls */}
                                            <div className="flex gap-1">
                                                {col.id !== ReminderStatus.TODO && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.TODO)} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-600">←</button>
                                                )}
                                                {col.id === ReminderStatus.TODO && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.IN_PROGRESS)} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300 text-[10px] font-bold">→</button>
                                                )}
                                                {col.id === ReminderStatus.IN_PROGRESS && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.DONE)} className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300 text-[10px] font-bold">✓</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                              }
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default ReminderView;
