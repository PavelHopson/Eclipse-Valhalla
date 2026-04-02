
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
      { id: ReminderStatus.TODO, title: 'To Do', color: 'bg-[#12121A] border-[#2A2A3C]' },
      { id: ReminderStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-[#5DAEFF10] border-[#5DAEFF30]' },
      { id: ReminderStatus.DONE, title: 'Done', color: 'bg-[#4ADE8015] border-[#4ADE8015]' }
  ];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-6xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#E8E8F0] tracking-tight font-serif">{t('tasks.title')}</h2>
          <p className="text-[#55556A] mt-1 text-sm">
            {t('tasks.subtitle_1')} <span className="font-semibold text-[#5DAEFF]">{reminders.filter(r => !r.isCompleted).length}</span> {t('tasks.subtitle_2')}
          </p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2">
            <div className="flex bg-[#12121A] p-1 rounded-lg border border-[#2A2A3C]">
                <button onClick={() => setViewType('list')} className={`p-2 rounded-md ${viewType === 'list' ? 'bg-[#12121A] shadow text-[#5DAEFF]' : 'text-[#55556A]'}`} title={t('tasks.view_list')}><LayoutList className="w-5 h-5"/></button>
                <button onClick={() => setViewType('board')} className={`p-2 rounded-md ${viewType === 'board' ? 'bg-[#12121A] shadow text-[#5DAEFF]' : 'text-[#55556A]'}`} title={t('tasks.view_board')}><Kanban className="w-5 h-5"/></button>
            </div>
            <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-[#5DAEFF] hover:bg-blue-700 text-[#E8E8F0] px-4 py-2 rounded-xl shadow-lg shadow-[#5DAEFF20] transition-all font-medium text-sm active:scale-95"
            >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('tasks.new_task')}</span>
            </button>
        </div>
      </div>

      {/* AI Smart Input */}
      <form onSubmit={handleAiSubmit} className="relative mb-6 group">
         <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${userPlan === PlanTier.FREE ? 'text-[#55556A]' : 'text-[#7A5CFF]'}`}>
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
                ? 'bg-[#12121A] text-[#55556A] cursor-pointer border-[#1E1E2E]'
                : 'bg-[#1A1A26] border-[#7A5CFF30] focus:ring-2 focus:ring-[#7A5CFF] focus:border-transparent text-[#E8E8F0]'
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
                        ? 'bg-[#E8E8F0] text-[#12121A] shadow-md'
                        : 'bg-[#1A1A26] text-[#8888A0] hover:bg-[#1F1F2B] border border-[#2A2A3C]'
                    }`}
                >
                    {getFilterLabel(f)}
                </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-[#1A1A26] rounded-2xl shadow-sm border border-[#2A2A3C] flex-1 overflow-hidden flex flex-col relative">
                {filteredReminders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[#55556A] p-8 text-center bg-[#12121A]/30">
                    <div className="w-24 h-24 bg-[#1A1A26] rounded-full flex items-center justify-center mb-4 shadow-sm border border-[#2A2A3C]">
                    <Bell className="w-10 h-10 opacity-20 text-[#55556A]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#55556A]">{t('tasks.empty_title')}</h3>
                    <p className="text-sm max-w-xs mt-2 text-[#55556A]">{t('tasks.empty_desc')}</p>
                </div>
                ) : (
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {filteredReminders.map(reminder => (
                    <div
                        key={reminder.id}
                        onClick={() => onEditReminder(reminder)}
                        className={`group p-4 rounded-xl border border-transparent hover:border-[#2A2A3C] hover:shadow-md transition-all flex items-start gap-4 cursor-pointer active:scale-[0.98] ${
                        reminder.isCompleted ? 'bg-[#12121A]/50 opacity-75' : 'bg-[#1A1A26]'
                        }`}
                    >
                        <button
                        onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id); }}
                        className={`mt-1 shrink-0 transition-colors p-1 -ml-1 ${
                            reminder.isCompleted ? 'text-green-500' : 'text-[#8888A0] hover:text-[#5DAEFF]'
                        }`}
                        >
                        {reminder.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>

                        <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-semibold text-sm md:text-base break-words ${reminder.isCompleted ? 'text-[#55556A] line-through' : 'text-[#E8E8F0]'}`}>
                            {reminder.title}
                            </h3>
                            {!reminder.isCompleted && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority}
                            </span>
                            )}
                        </div>

                        {reminder.description && (
                            <p className="text-xs md:text-sm text-[#55556A] line-clamp-2 mb-2 font-normal">{reminder.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#55556A] font-medium mt-2">
                            <span className="flex items-center gap-1.5 bg-[#12121A] px-2 py-1 rounded-md border border-[#2A2A3C]">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(reminder.dueDateTime, language)}
                            </span>

                            {reminder.repeatType !== RepeatType.NONE && (
                            <span className="flex items-center gap-1.5 text-[#5DAEFF] bg-[#5DAEFF10] px-2 py-1 rounded-md border border-[#5DAEFF30]">
                                <Clock className="w-3.5 h-3.5" />
                                {reminder.repeatType}
                            </span>
                            )}
                        </div>
                        </div>

                        <button
                        onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id); }}
                        className="p-2 text-[#55556A] hover:text-[#FF4444] hover:bg-[#FF444410] rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
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
                          <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-[#55556A] px-2 flex justify-between sticky top-0">
                              {col.title}
                              <span className="bg-[#12121A] px-2 rounded-full text-xs border border-[#2A2A3C]">
                                  {reminders.filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id).length}
                              </span>
                          </h3>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                              {reminders
                                .filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id)
                                .map(r => (
                                    <div key={r.id} className="bg-[#1A1A26] p-3 rounded-xl shadow-sm border border-[#2A2A3C] hover:shadow-md transition-all active:scale-95">
                                        <p className="font-semibold text-sm text-[#E8E8F0] mb-1 line-clamp-2">{r.title}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(r.priority)}`}>{r.priority}</span>

                                            {/* Move Controls */}
                                            <div className="flex gap-1">
                                                {col.id !== ReminderStatus.TODO && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.TODO)} className="px-2 py-1 bg-[#12121A] rounded text-[10px] font-bold text-[#8888A0]">←</button>
                                                )}
                                                {col.id === ReminderStatus.TODO && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.IN_PROGRESS)} className="px-2 py-1 bg-[#5DAEFF10] rounded text-[#5DAEFF] text-[10px] font-bold">→</button>
                                                )}
                                                {col.id === ReminderStatus.IN_PROGRESS && (
                                                    <button onClick={() => onStatusChange(r.id, ReminderStatus.DONE)} className="px-2 py-1 bg-[#4ADE8015] rounded text-[#4ADE80] text-[10px] font-bold">✓</button>
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
