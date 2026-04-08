import React, { useMemo, useState } from 'react';
import { Reminder } from '../types';
import { getDaysInMonth, isSameDay, getPriorityColor, formatDate } from '../utils';
import { ChevronLeft, ChevronRight, LayoutList, Grid3X3, ScrollText, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../i18n';

interface CalendarViewProps {
  reminders: Reminder[];
  onSelectDate: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reminders, onSelectDate }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const locale = isRU ? 'ru-RU' : 'en-US';
  const now = new Date();

  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, i + 1);
    return d.toLocaleDateString(locale, { weekday: 'short' });
  });

  const overdueCount = reminders.filter(r => !r.isCompleted && new Date(r.dueDateTime) < now).length;
  const activeCount = reminders.filter(r => !r.isCompleted).length;

  const getRemindersForDay = (date: Date) =>
    reminders.filter(r => isSameDay(new Date(r.dueDateTime), date));

  const agendaDays = useMemo(() => {
    const agenda = [];
    const today = new Date();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const tasks = getRemindersForDay(d);
      if (tasks.length > 0 || i < 4) agenda.push({ date: d, tasks });
    }
    return agenda;
  }, [reminders]);

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#121212]/96 px-4 py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-[18px] border border-[#B89B5E26] bg-[#B89B5E10] p-3 text-[#D8C18E] md:block">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#7F7A72]">{isRU ? 'Chronicle archive' : 'Chronicle archive'}</div>
              <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">
                {viewMode === 'month'
                  ? currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
                  : (isRU ? 'Летопись давления' : 'Pressure chronicle')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B4B0A7]">
                {isRU
                  ? 'Здесь день фиксируется не как дата, а как носитель долга, исполнения и просрочки.'
                  : 'Days are recorded here not as dates, but as carriers of debt, execution, and missed intent.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <ArchiveStat label={isRU ? 'Активно' : 'Active'} value={activeCount} accent="#6C8FB8" />
            <ArchiveStat label={isRU ? 'Просрочено' : 'Overdue'} value={overdueCount} accent="#A33036" />
            <div className="hidden md:block">
              <ArchiveStat label={isRU ? 'Режим' : 'Mode'} value={viewMode === 'month' ? (isRU ? 'Месяц' : 'Month') : (isRU ? 'Лента' : 'Agenda')} accent="#B89B5E" text />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex rounded-[14px] border border-white/8 bg-[#171717] p-1">
            <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${viewMode === 'month' ? 'bg-[#232323] text-[#F2F1EE]' : 'text-[#7F7A72]'}`}>
              <Grid3X3 className="h-4 w-4" />
              {isRU ? 'Сетка' : 'Grid'}
            </button>
            <button onClick={() => setViewMode('agenda')} className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${viewMode === 'agenda' ? 'bg-[#232323] text-[#F2F1EE]' : 'text-[#7F7A72]'}`}>
              <LayoutList className="h-4 w-4" />
              {isRU ? 'Лента' : 'Agenda'}
            </button>
          </div>

          {viewMode === 'month' && (
            <div className="flex items-center gap-1 rounded-[16px] border border-white/8 bg-[#171717] p-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="rounded-[10px] p-2 text-[#7F7A72] hover:bg-[#232323] hover:text-[#F2F1EE]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="rounded-[10px] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#B4B0A7] hover:bg-[#232323]">
                {isRU ? 'Сейчас' : 'Today'}
              </button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="rounded-[10px] p-2 text-[#7F7A72] hover:bg-[#232323] hover:text-[#F2F1EE]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#121212]/92 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <div className="grid grid-cols-7 border-b border-white/8 bg-[#171717]">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7F7A72]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-white/5">
              {days.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[120px] bg-[#111111]" />;

                const dayReminders = getRemindersForDay(day).sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
                const isToday = isSameDay(day, now);
                const overdueDay = dayReminders.some(r => !r.isCompleted && new Date(r.dueDateTime) < now);
                const visible = dayReminders.slice(0, 3);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={`group min-h-[132px] bg-[#171717] p-3 text-left transition-all hover:bg-[#1D1D1D] ${
                      overdueDay ? 'state-overdue' : ''
                    }`}
                    style={{ boxShadow: isToday ? 'inset 0 0 0 2px #5DAEFF' : 'none' }}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isToday ? 'bg-[#6C8FB8] text-[#0A0A0A]' : overdueDay ? 'bg-[#7A1F2414] text-[#C05A60]' : 'text-[#B4B0A7]'
                      }`}>
                        {day.getDate()}
                      </span>
                      {overdueDay && <ShieldAlert className="h-4 w-4 text-[#C05A60]" />}
                    </div>

                    <div className="mt-3 space-y-2">
                      {visible.map(rem => {
                        const time = rem.dueDateTime ? new Date(rem.dueDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        return (
                          <div key={rem.id} className={`border-l-2 pl-2 text-[10px] font-semibold leading-4 ${
                            rem.isCompleted ? 'border-[#B89B5E] text-[#7F7A72] line-through' : getPriorityColor(rem.priority)
                          }`}>
                            {time && <span className="text-[9px] opacity-60 mr-1">{time}</span>}
                            {rem.title}
                          </div>
                        );
                      })}
                      {dayReminders.length > 3 && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[#7F7A72]">
                          +{dayReminders.length - 3} {isRU ? 'ещё' : 'more'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
          <div className="space-y-8">
            {agendaDays.map((day, i) => {
              const isToday = isSameDay(day.date, now);
              const overdueDay = day.tasks.some(task => !task.isCompleted && new Date(task.dueDateTime) < now);

              return (
                <section key={i} className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="md:pt-2">
                    <div className={`text-[10px] uppercase tracking-[0.22em] ${isToday ? 'text-[#D8C18E]' : 'text-[#7F7A72]'}`}>
                      {day.date.toLocaleDateString(locale, { weekday: 'long' })}
                    </div>
                    <div className={`mt-2 font-ritual text-4xl ${isToday ? 'text-[#F2F1EE]' : 'text-[#B4B0A7]'}`}>
                      {day.date.getDate()}
                    </div>
                  </div>

                  <div className={`rounded-[24px] border p-5 ${overdueDay ? 'border-[#7A1F2435] bg-[#7A1F240C]' : 'border-white/8 bg-[#121212]/92'}`}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                        {day.tasks.length === 0 ? (isRU ? 'Тишина' : 'Quiet day') : (isRU ? 'Записи дня' : 'Day records')}
                      </div>
                      {overdueDay && <span className="rounded-full border border-[#7A1F2438] bg-[#7A1F2412] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C05A60]">{isRU ? 'долг' : 'debt'}</span>}
                    </div>

                    {day.tasks.length === 0 ? (
                      <button onClick={() => onSelectDate(day.date)} className="text-sm text-[#7F7A72] transition-colors hover:text-[#F2F1EE]">
                        {isRU ? 'День пуст. Можно назначить цель.' : 'The day is empty. You can assign a target.'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {day.tasks.map(task => {
                          const overdue = !task.isCompleted && new Date(task.dueDateTime) < now;
                          const taskTime = task.dueDateTime ? new Date(task.dueDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                          return (
                            <div key={task.id} className={`rounded-[18px] border px-4 py-3 ${overdue ? 'border-[#7A1F2435] bg-[#7A1F2410]' : 'border-white/8 bg-[#171717]'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {taskTime && (
                                    <div className={`shrink-0 rounded-lg border px-2 py-1 text-center ${overdue ? 'border-[#7A1F2438] bg-[#7A1F2416]' : 'border-white/8 bg-[#0A0A0A]'}`}>
                                      <div className={`text-sm font-bold tabular-nums ${overdue ? 'text-[#C05A60]' : 'text-[#6C8FB8]'}`}>{taskTime}</div>
                                    </div>
                                  )}
                                  <div>
                                    <div className={`text-sm font-bold ${task.isCompleted ? 'text-[#7F7A72] line-through' : overdue ? 'text-[#F4D6D8]' : 'text-[#F2F1EE]'}`}>{task.title}</div>
                                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#7F7A72]">{formatDate(task.dueDateTime, language)}</div>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.14em] ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ArchiveStat = ({
  label,
  value,
  accent,
  text = false,
}: {
  label: string;
  value: number | string;
  accent: string;
  text?: boolean;
}) => (
  <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
    <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: accent }}>{label}</div>
    <div className={`mt-2 ${text ? 'text-base' : 'text-2xl'} font-extrabold text-[#F2F1EE]`}>{value}</div>
  </div>
);

export default CalendarView;
