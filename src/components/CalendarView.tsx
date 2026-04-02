
import React, { useState } from 'react';
import { Reminder, Priority } from '../types';
import { getDaysInMonth, isSameDay, getPriorityColor, formatDate } from '../utils';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutList, Grid } from 'lucide-react';
import { useLanguage } from '../i18n';

interface CalendarViewProps {
  reminders: Reminder[];
  onSelectDate: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reminders, onSelectDate }) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  // Localized weekdays
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, i + 1); // Start from a Sunday
    return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' });
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getRemindersForDay = (date: Date) => {
    return reminders.filter(r => {
      const rDate = new Date(r.dueDateTime);
      return isSameDay(rDate, date);
    });
  };

  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  // Get upcoming days for agenda
  const getAgendaDays = () => {
      const agenda = [];
      const today = new Date();
      for(let i=0; i<14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const tasks = getRemindersForDay(d);
          if (tasks.length > 0 || i < 3) { // Show at least next 3 days even if empty
              agenda.push({ date: d, tasks });
          }
      }
      return agenda;
  }

  return (
    <div className="flex flex-col h-full bg-[#1A1A26] pb-20 md:pb-0">
      {/* Header Toolbar */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#2A2A3C] flex justify-between items-center bg-[#1A1A26] sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 bg-[#12121A] rounded-lg text-[#5DAEFF] hidden md:block">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#E8E8F0] leading-none capitalize font-serif">
              {viewMode === 'month'
                ? currentDate.toLocaleDateString(locale, { month: 'long' })
                : t('calendar.mode_agenda')
              }
            </h2>
            <span className="text-[#55556A] font-medium text-sm">
              {currentDate.getFullYear()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
             {/* View Switcher */}
            <div className="flex bg-[#12121A] p-1 rounded-lg border border-[#2A2A3C]">
                <button onClick={() => setViewMode('month')} className={`p-1.5 rounded-md ${viewMode === 'month' ? 'bg-[#1A1A26] shadow text-[#5DAEFF]' : 'text-[#55556A]'}`} title={t('calendar.mode_month')}><Grid className="w-4 h-4"/></button>
                <button onClick={() => setViewMode('agenda')} className={`p-1.5 rounded-md ${viewMode === 'agenda' ? 'bg-[#1A1A26] shadow text-[#5DAEFF]' : 'text-[#55556A]'}`} title={t('calendar.mode_agenda')}><LayoutList className="w-4 h-4"/></button>
            </div>

            {viewMode === 'month' && (
                <div className="flex items-center gap-1 bg-[#1A1A26] p-1 rounded-xl border border-[#2A2A3C]">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-[#1F1F2B] hover:shadow-sm rounded-lg text-[#55556A] transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-bold text-[#8888A0] hover:bg-[#1F1F2B] hover:shadow-sm rounded-lg transition-all"
                >
                    {t('calendar.today')}
                </button>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-[#1F1F2B] hover:shadow-sm rounded-lg text-[#55556A] transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                </div>
            )}
        </div>
      </div>

      {/* Calendar Grid (Month) */}
      {viewMode === 'month' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-[#2A2A3C] bg-[#12121A] shrink-0">
            {weekDays.map(day => (
                <div key={day} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-[#55556A] uppercase tracking-wider">
                {day}
                </div>
            ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 auto-rows-[minmax(80px,1fr)] md:auto-rows-fr bg-[#12121A] gap-px border-b border-[#2A2A3C]">
            {days.map((day, index) => {
                // Padding days
                if (!day) return <div key={`empty-${index}`} className="bg-[#12121A]/50" />;

                const dayReminders = getRemindersForDay(day);
                const isToday = isSameDay(day, new Date());
                const sortedReminders = dayReminders.sort((a, b) => {
                    // Completed last
                    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
                    return 0;
                });

                const displayReminders = sortedReminders.slice(0, 4);
                const remaining = sortedReminders.length - 4;

                return (
                <div
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={`
                    bg-[#1A1A26] relative group transition-colors hover:bg-[#1F1F2B] cursor-pointer flex flex-col p-1 md:p-2
                    `}
                >
                    {/* Date Number */}
                    <div className="flex justify-between items-start mb-1">
                    <span className={`
                        text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full
                        ${isToday
                        ? 'bg-[#5DAEFF] text-[#12121A] shadow-md shadow-[#5DAEFF]/20 font-bold'
                        : 'text-[#8888A0]'
                        }
                    `}>
                        {day.getDate()}
                    </span>

                    <button className="opacity-0 group-hover:opacity-100 text-[#55556A] hover:text-[#5DAEFF] transition-colors p-1 hidden md:block">
                        <Plus className="w-4 h-4" />
                    </button>
                    </div>

                    {/* Events Stack */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {displayReminders.map(rem => {
                        const priorityStyle = getPriorityColor(rem.priority);
                        const isCompleted = rem.isCompleted;

                        return (
                        <div
                            key={rem.id}
                            className={`
                            px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-semibold truncate border-l-[2px] md:border-l-[3px] transition-all shadow-sm
                            ${isCompleted
                                ? 'bg-[#12121A] text-[#55556A] border-[#2A2A3C] line-through decoration-[#55556A]'
                                : `${priorityStyle} border-l-current`
                            }
                            `}
                        >
                            {rem.title}
                        </div>
                        );
                    })}
                    {remaining > 0 && (
                        <div className="text-[8px] md:text-[10px] font-bold text-[#55556A] px-1 md:px-2">
                        + {remaining} {t('calendar.more')}
                        </div>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      ) : (
          // Agenda View
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {getAgendaDays().map((day, i) => (
                  <div key={i} className="flex gap-6 animate-in slide-in-from-bottom-4" style={{animationDelay: `${i * 50}ms`}}>
                       <div className="w-16 text-right shrink-0">
                           <p className={`text-sm font-bold uppercase ${isSameDay(day.date, new Date()) ? 'text-[#5DAEFF]' : 'text-[#55556A]'}`}>
                               {day.date.toLocaleDateString(locale, { weekday: 'short' })}
                           </p>
                           <p className={`text-2xl font-serif font-bold ${isSameDay(day.date, new Date()) ? 'text-[#5DAEFF]' : 'text-[#E8E8F0]'}`}>
                               {day.date.getDate()}
                           </p>
                       </div>
                       <div className="flex-1 border-l-2 border-[#2A2A3C] pl-6 pb-6">
                           {day.tasks.length === 0 ? (
                               <button onClick={() => onSelectDate(day.date)} className="text-sm text-[#55556A] italic hover:text-[#5DAEFF] transition-colors flex items-center gap-2 group">
                                   <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                   No quests planned.
                               </button>
                           ) : (
                               <div className="space-y-3">
                                   {day.tasks.map(task => (
                                       <div key={task.id} className={`bg-[#1A1A26] p-3 rounded-xl border border-[#2A2A3C] shadow-sm flex items-center gap-3 ${task.isCompleted ? 'opacity-60' : ''}`}>
                                           <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority).split(' ')[0]}`}></div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${task.isCompleted ? 'line-through text-[#55556A]' : 'text-[#E8E8F0]'}`}>{task.title}</p>
                                                <p className="text-xs text-[#55556A]">{formatDate(task.dueDateTime, language)}</p>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default CalendarView;
