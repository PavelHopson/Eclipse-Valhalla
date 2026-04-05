/**
 * Eclipse Valhalla - Dashboard Hero
 *
 * Pressure-first command surface.
 */

import React from 'react';
import { User, Reminder } from '../types';
import { useLanguage } from '../i18n';
import { Seal } from '../brand/Seal';
import { AlertTriangle, Flame, Swords, Timer, ArrowRight } from 'lucide-react';

interface DashboardHeroProps {
  user: User;
  reminders: Reminder[];
  disciplineScore: number;
  streak: number;
  onStartFocus: () => void;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({
  user,
  reminders,
  disciplineScore,
  streak,
  onStartFocus,
}) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';

  const now = new Date();
  const active = reminders.filter(r => !r.isCompleted);
  const overdue = active.filter(r => new Date(r.dueDateTime) < now);
  const nextQuest = overdue[0] || active[0] || null;
  const completedToday = reminders.filter(
    r => r.isCompleted && new Date(r.createdAt).toDateString() === now.toDateString()
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#121212]/96 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% -10%, rgba(108, 143, 184, 0.18), transparent 34%),
            radial-gradient(circle at 85% 15%, rgba(184, 155, 94, 0.08), transparent 24%),
            linear-gradient(135deg, rgba(255,255,255,0.02), transparent 40%)
          `,
        }}
      />
      <div className="absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-[#6C8FB833] to-transparent" />
      <div className="absolute left-8 top-8 hidden h-32 w-32 rounded-full border border-white/5 md:block sigil-drift" />
      <div className="absolute right-10 top-10 hidden h-16 w-16 rounded-full border border-[#B89B5E22] md:block" />

      <div className="relative grid gap-8 px-6 py-7 md:grid-cols-[1.3fr_0.7fr] md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">
                {isRU ? 'Командный контур' : 'Command loop'}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[#F2F1EE]">
                <Seal size={24} variant={overdue.length > 0 ? 'broken' : 'watching'} color={overdue.length > 0 ? '#A33036' : '#B89B5E'} />
                <span className="font-ritual text-lg md:text-xl">
                  {active.length === 0
                    ? isRU ? 'Система ждёт приказа' : 'The system awaits an order'
                    : overdue.length > 0
                    ? isRU ? 'Долг уже открыт' : 'Debt is already open'
                    : isRU ? 'Давление держится' : 'Pressure is holding'}
                </span>
              </div>
            </div>
            <div className="rounded-full border border-[#6C8FB82A] bg-[#6C8FB810] px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase tracking-[0.24em] text-[#7F7A72]">
                {isRU ? 'Дисциплина' : 'Discipline'}
              </div>
              <div className="text-lg font-extrabold text-[#F2F1EE]">{disciplineScore}</div>
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-ritual text-[34px] leading-[1.04] text-[#F2F1EE] md:text-[48px]">
              {active.length === 0
                ? isRU ? 'Назови следующую цель.' : 'Name the next objective.'
                : overdue.length > 0
                ? isRU ? 'Действуй, пока день не записан как провал.' : 'Act before this day is recorded as failure.'
                : isRU ? 'Система не просит. Система ожидает исполнения.' : 'The system does not ask. It expects execution.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#B4B0A7] md:text-[15px]">
              {nextQuest
                ? isRU
                  ? `Следующий удар: ${nextQuest.title}. Решение уже принято. Осталось исполнение.`
                  : `Next pressure point: ${nextQuest.title}. The decision already exists. Only execution remains.`
                : isRU
                ? `Пустой контур опасен. Добавь квест, чтобы день получил направление и вес.`
                : `An empty loop is dangerous. Add a quest so the day has direction and weight.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              icon={<Swords className="h-4 w-4 text-[#9AB7D4]" />}
              label={isRU ? 'Активно' : 'Active'}
              value={String(active.length)}
            />
            <Stat
              icon={<AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? 'text-[#C05A60]' : 'text-[#7F7A72]'}`} />}
              label={isRU ? 'Просрочено' : 'Overdue'}
              value={String(overdue.length)}
              danger={overdue.length > 0}
            />
            <Stat
              icon={<Flame className="h-4 w-4 text-[#D8C18E]" />}
              label={isRU ? 'Серия' : 'Streak'}
              value={`${streak}d`}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#B89B5E2A] bg-[#B89B5E10]">
              <Timer className="h-5 w-5 text-[#D8C18E]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                {isRU ? 'Следующий режим' : 'Next state'}
              </div>
              <div className="mt-1 font-semibold text-[#F2F1EE]">
                {nextQuest
                  ? isRU ? 'Фокус-контур' : 'Focus seal'
                  : isRU ? 'Новый квест' : 'New quest'}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-l border-[#6C8FB82E] pl-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                {isRU ? 'Носитель давления' : 'Pressure carrier'}
              </div>
              <div className="mt-2 text-sm leading-6 text-[#F2F1EE]">
                {nextQuest?.title || (isRU ? `${user.name}, система ждёт первого приказа.` : `${user.name}, the system is waiting for the first command.`)}
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/6 pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                  {isRU ? 'Закрыто сегодня' : 'Closed today'}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-[#F2F1EE]">{completedToday}</div>
              </div>
              <button
                onClick={onStartFocus}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#B89B5E30] bg-[#B89B5E] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
              >
                {isRU ? 'Войти в фокус' : 'Enter focus'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) => (
  <div
    className={`rounded-[18px] border px-4 py-3 ${
      danger ? 'border-[#7A1F2433] bg-[#7A1F240D]' : 'border-white/8 bg-white/[0.02]'
    }`}
  >
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
      {icon}
      {label}
    </div>
    <div className="mt-2 text-2xl font-extrabold text-[#F2F1EE]">{value}</div>
  </div>
);

export default DashboardHero;
