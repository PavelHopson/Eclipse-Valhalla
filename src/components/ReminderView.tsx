import React, { useMemo, useState } from 'react';
import { Reminder, RepeatType, Priority, PlanTier, ReminderStatus } from '../types';
import { formatDate, getPriorityColor, parseSmartTask } from '../utils';
import {
  Plus, CheckCircle2, Circle, Trash2, Clock, Calendar, LayoutList, Kanban,
  Sparkles, Lock, ArrowRight, ShieldAlert, FilePenLine, Swords,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { Seal } from '../brand/Seal';

interface ReminderViewProps {
  reminders: Reminder[];
  toggleComplete: (id: string) => void;
  deleteReminder: (id: string) => void;
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onAddSmartTask: (task: Partial<Reminder>) => void;
  onStatusChange: (id: string, status: ReminderStatus) => void;
  onStartFocus: (id: string) => void;
  userPlan: PlanTier;
  onUpgrade: () => void;
}

const ReminderView: React.FC<ReminderViewProps> = ({
  reminders,
  toggleComplete,
  deleteReminder,
  onOpenCreateModal,
  onEditReminder,
  onAddSmartTask,
  onStatusChange,
  onStartFocus,
  userPlan,
  onUpgrade,
}) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [filter, setFilter] = useState<'active' | 'all' | 'completed' | 'abandoned'>('active');
  const [viewType, setViewType] = useState<'list' | 'board'>('list');
  const [aiInput, setAiInput] = useState('');

  const now = new Date();

  const sortedReminders = useMemo(() => {
    const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
    return [...reminders].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const aOverdue = !a.isCompleted && new Date(a.dueDateTime) < now;
      const bOverdue = !b.isCompleted && new Date(b.dueDateTime) < now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (pWeight[a.priority] !== pWeight[b.priority]) return pWeight[b.priority] - pWeight[a.priority];
      return new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime();
    });
  }, [reminders, now]);

  const filteredReminders = sortedReminders.filter(r => {
    const overdue = !r.isCompleted && new Date(r.dueDateTime) < now;
    if (filter === 'active') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    if (filter === 'abandoned') return overdue;
    return true;
  });

  const pendingCount = reminders.filter(r => !r.isCompleted).length;
  const overdueCount = reminders.filter(r => !r.isCompleted && new Date(r.dueDateTime) < now).length;
  const completedCount = reminders.filter(r => r.isCompleted).length;

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userPlan === PlanTier.FREE) {
      onUpgrade();
      return;
    }
    if (!aiInput.trim()) return;
    onAddSmartTask(parseSmartTask(aiInput));
    setAiInput('');
  };

  const columns = [
    { id: ReminderStatus.TODO, title: isRU ? 'Ожидают боя' : 'Waiting for battle', tone: 'border-white/8 bg-[#171717]' },
    { id: ReminderStatus.IN_PROGRESS, title: isRU ? 'В бою' : 'Engaged', tone: 'border-[#6C8FB830] bg-[#6C8FB80D]' },
    { id: ReminderStatus.DONE, title: isRU ? 'Запечатаны' : 'Sealed', tone: 'border-[#B89B5E30] bg-[#B89B5E0D]' },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col p-4 pb-24 md:p-8 md:pb-8">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#121212]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#A3303640] to-transparent" />
        <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(122,31,36,0.14),transparent_24%),radial-gradient(circle_at_20%_20%,rgba(108,143,184,0.08),transparent_28%)]" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">
                {isRU ? 'Арена исполнения' : 'Execution arena'}
              </div>
              <h1 className="mt-3 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">
                {isRU ? 'Поле боя задач' : 'Field of objectives'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B4B0A7]">
                {overdueCount > 0
                  ? isRU ? 'Просроченные цели уже стали долгом. Вход в квест должен ощущаться как начало боя.' : 'Overdue targets have already become debt. Entering a quest should feel like entering battle.'
                  : isRU ? 'Это не список задач. Это арена исполнения и выбора приоритетной цели.' : 'This is not a task list. It is an execution arena for selecting the next target.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ArenaStat label={isRU ? 'Активные цели' : 'Active objectives'} value={pendingCount} accent="#6C8FB8" />
              <ArenaStat label={isRU ? 'Брошенные' : 'Abandoned'} value={overdueCount} accent="#A33036" pulse={overdueCount > 0} />
              <ArenaStat label={isRU ? 'Запечатанные' : 'Sealed'} value={completedCount} accent="#B89B5E" />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form onSubmit={handleAiSubmit} className="relative flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7F7A72]">
                {userPlan === PlanTier.FREE ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-[#B89B5E]" />}
              </div>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={
                  userPlan === PlanTier.FREE
                    ? (isRU ? 'Тактический парсер доступен в Pro' : 'Tactical parser is available in Pro')
                    : (isRU ? 'Опиши цель естественным языком. Система превратит её в квест.' : 'Describe the objective in natural language. The system will forge a quest.')
                }
                readOnly={userPlan === PlanTier.FREE}
                onClick={() => userPlan === PlanTier.FREE && onUpgrade()}
                className={`w-full rounded-[16px] border bg-[#0F0F0F] py-4 pl-12 pr-4 text-sm outline-none transition-all ${
                  userPlan === PlanTier.FREE
                    ? 'cursor-pointer border-white/8 text-[#7F7A72]'
                    : 'border-[#B89B5E26] text-[#F2F1EE] focus:border-[#B89B5E45] focus:shadow-[0_0_0_1px_rgba(184,155,94,0.18)]'
                }`}
              />
            </form>

            <div className="flex items-center gap-2">
              <div className="flex rounded-[14px] border border-white/8 bg-[#171717] p-1">
                <button onClick={() => setViewType('list')} className={`rounded-[10px] p-2 ${viewType === 'list' ? 'bg-[#232323] text-[#F2F1EE]' : 'text-[#7F7A72]'}`}>
                  <LayoutList className="h-4 w-4" />
                </button>
                <button onClick={() => setViewType('board')} className={`rounded-[10px] p-2 ${viewType === 'board' ? 'bg-[#232323] text-[#F2F1EE]' : 'text-[#7F7A72]'}`}>
                  <Kanban className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-[14px] border border-[#B89B5E30] bg-[#B89B5E] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
              >
                <Plus className="h-4 w-4" />
                {isRU ? 'Новый поход' : 'New battle'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'active', label: isRU ? 'Активные цели' : 'Active objectives' },
          { id: 'all', label: isRU ? 'Незавершённые' : 'All signals' },
          { id: 'abandoned', label: isRU ? 'Брошенные' : 'Abandoned' },
          { id: 'completed', label: isRU ? 'Запечатанные' : 'Sealed' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as typeof filter)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
              filter === item.id ? 'border-[#B89B5E33] bg-[#B89B5E12] text-[#D8C18E]' : 'border-white/8 bg-[#171717] text-[#7F7A72] hover:text-[#B4B0A7]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {viewType === 'list' ? (
        <div className="mt-4 flex-1 overflow-hidden rounded-[24px] border border-white/8 bg-[#121212]/92 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          {filteredReminders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-white/8 bg-[#171717]">
                <Seal size={40} variant={filter === 'abandoned' ? 'broken' : 'watching'} color={filter === 'abandoned' ? '#A33036' : '#6C8FB8'} />
              </div>
              <h3 className="font-ritual text-2xl text-[#F2F1EE]">
                {filter === 'abandoned'
                  ? (isRU ? 'Долгов нет.' : 'No abandoned fronts.')
                  : (isRU ? 'Арена пуста.' : 'The arena is empty.')}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#7F7A72]">
                {filter === 'abandoned'
                  ? (isRU ? 'Ничего не просрочено. Это редкий хороший знак.' : 'Nothing is overdue. That is a rare good sign.')
                  : (isRU ? 'Добавь новую цель, чтобы день снова обрёл направление.' : 'Add a new objective so the day regains direction.')}
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-3 md:p-4">
              <div className="space-y-3">
                {filteredReminders.map(reminder => {
                  const isOverdue = !reminder.isCompleted && new Date(reminder.dueDateTime) < now;
                  return (
                    <article
                      key={reminder.id}
                      className={`group relative overflow-hidden rounded-[22px] border p-4 transition-all ${
                        reminder.isCompleted
                          ? 'border-[#B89B5E24] bg-[#B89B5E0A] opacity-75'
                          : isOverdue
                          ? 'border-[#7A1F2438] bg-[#7A1F240F] state-overdue'
                          : 'border-white/8 bg-[#171717] hover:border-white/14'
                      }`}
                    >
                      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" />
                      <div className="absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleComplete(reminder.id)}
                          className={`mt-1 shrink-0 rounded-full p-1 transition-colors ${
                            reminder.isCompleted ? 'text-[#B89B5E]' : 'text-[#7F7A72] hover:text-[#D8C18E]'
                          }`}
                        >
                          {reminder.isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7F7A72]">
                              <Swords className="h-3 w-3" />
                              {reminder.isCompleted ? (isRU ? 'Печать' : 'Sealed') : isOverdue ? (isRU ? 'Критическая цель' : 'Critical target') : (isRU ? 'Цель' : 'Target')}
                            </span>
                            {!reminder.isCompleted && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.15em] ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority}
                              </span>
                            )}
                          </div>

                          <h3 className={`text-lg font-bold ${reminder.isCompleted ? 'line-through text-[#7F7A72]' : isOverdue ? 'text-[#F4D6D8]' : 'text-[#F2F1EE]'}`}>
                            {reminder.title}
                          </h3>

                          {reminder.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#B4B0A7]">{reminder.description}</p>
                          )}

                          {reminder.subtasks && reminder.subtasks.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1 bg-[#1A1A26] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#5DAEFF] transition-all"
                                  style={{ width: `${(reminder.subtasks.filter(s => s.isCompleted).length / reminder.subtasks.length) * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-[#55556A]">
                                {reminder.subtasks.filter(s => s.isCompleted).length}/{reminder.subtasks.length}
                              </span>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/8 bg-black/20 px-3 py-1.5 text-[#B4B0A7]">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(reminder.dueDateTime, language)}
                            </span>
                            {reminder.repeatType !== RepeatType.NONE && (
                              <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#6C8FB826] bg-[#6C8FB80F] px-3 py-1.5 text-[#9AB7D4]">
                                <Clock className="h-3.5 w-3.5" />
                                {reminder.repeatType}
                              </span>
                            )}
                            {reminder.estimatedMinutes && (
                              <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/8 bg-black/20 px-3 py-1.5 text-[#B4B0A7]">
                                <Clock className="h-3.5 w-3.5" />
                                {reminder.estimatedMinutes}{isRU ? ' мин' : ' min'}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#7A1F2438] bg-[#7A1F2412] px-3 py-1.5 text-[#C05A60]">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {isRU ? 'Долг открыт' : 'Debt opened'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {!reminder.isCompleted && (
                            <button
                              onClick={() => onStartFocus(reminder.id)}
                              className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] transition-all ${
                                isOverdue
                                  ? 'border-[#7A1F2438] bg-[#A33036] text-white hover:bg-[#B13B41]'
                                  : 'border-[#6C8FB830] bg-[#6C8FB8] text-[#0A0A0A] hover:bg-[#7C9FC7]'
                              }`}
                            >
                              {isRU ? 'В бой' : 'Engage'}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEditReminder(reminder)}
                              className="rounded-[12px] border border-white/8 bg-black/20 p-2 text-[#7F7A72] transition-colors hover:text-[#F2F1EE]"
                            >
                              <FilePenLine className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteReminder(reminder.id)}
                              className="rounded-[12px] border border-[#7A1F2424] bg-[#7A1F240A] p-2 text-[#7F7A72] transition-colors hover:text-[#C05A60]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex-1 overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4 pr-4 md:min-w-0">
            {columns.map(col => (
              <section key={col.id} className={`w-[84vw] min-w-[300px] rounded-[24px] border p-4 md:w-auto md:flex-1 ${col.tone}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B4B0A7]">{col.title}</h3>
                  <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[10px] font-bold text-[#7F7A72]">
                    {reminders.filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id).length}
                  </span>
                </div>
                <div className="space-y-3"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#5DAEFF08'; }}
                  onDragLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const questId = e.dataTransfer.getData('questId');
                    if (questId) {
                      onStatusChange(questId, col.id);
                    }
                  }}
                >
                  {reminders
                    .filter(r => (r.status || (r.isCompleted ? ReminderStatus.DONE : ReminderStatus.TODO)) === col.id)
                    .map(r => (
                      <div key={r.id} className="rounded-[18px] border border-white/8 bg-[#171717] p-4 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('questId', r.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#F2F1EE]">{r.title}</div>
                            <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#7F7A72]">{formatDate(r.dueDateTime, language)}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-[0.14em] ${getPriorityColor(r.priority)}`}>{r.priority}</span>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {col.id !== ReminderStatus.TODO && (
                            <button onClick={() => onStatusChange(r.id, ReminderStatus.TODO)} className="rounded-[12px] border border-white/8 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B4B0A7]">
                              {isRU ? 'Назад' : 'Reset'}
                            </button>
                          )}
                          {col.id === ReminderStatus.TODO && (
                            <button onClick={() => onStatusChange(r.id, ReminderStatus.IN_PROGRESS)} className="rounded-[12px] border border-[#6C8FB830] bg-[#6C8FB80F] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AB7D4]">
                              {isRU ? 'В бой' : 'Engage'}
                            </button>
                          )}
                          {col.id === ReminderStatus.IN_PROGRESS && (
                            <>
                              <button onClick={() => onStartFocus(r.id)} className="rounded-[12px] border border-[#B89B5E30] bg-[#B89B5E] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0A0A0A]">
                                {isRU ? 'Фокус' : 'Focus'}
                              </button>
                              <button onClick={() => onStatusChange(r.id, ReminderStatus.DONE)} className="rounded-[12px] border border-[#B89B5E30] bg-[#B89B5E10] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#D8C18E]">
                                {isRU ? 'Запечатать' : 'Seal'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ArenaStat = ({
  label,
  value,
  accent,
  pulse = false,
}: {
  label: string;
  value: number;
  accent: string;
  pulse?: boolean;
}) => (
  <div className={`rounded-[18px] border px-4 py-3 ${pulse ? 'state-overdue' : ''}`} style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
    <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: `${accent}` }}>{label}</div>
    <div className="mt-2 text-2xl font-extrabold text-[#F2F1EE]">{value}</div>
  </div>
);

export default ReminderView;
