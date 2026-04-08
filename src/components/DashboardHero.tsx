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
  const { t } = useLanguage();

  const now = new Date();
  const active = reminders.filter(r => !r.isCompleted);
  const overdue = active.filter(r => new Date(r.dueDateTime) < now);
  const nextQuest = overdue[0] || active[0] || null;
  const completedToday = reminders.filter(
    r => r.isCompleted && (r.dueDateTime ? new Date(r.dueDateTime).toDateString() === now.toDateString() : new Date(r.createdAt).toDateString() === now.toDateString())
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
                {t('hero.command_loop')}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[#F2F1EE]">
                <Seal size={24} variant={overdue.length > 0 ? 'broken' : 'watching'} color={overdue.length > 0 ? '#A33036' : '#B89B5E'} />
                <span className="font-ritual text-lg md:text-xl">
                  {active.length === 0
                    ? t('hero.system_awaits')
                    : overdue.length > 0
                    ? t('hero.debt_open')
                    : t('hero.pressure_holds')}
                </span>
              </div>
            </div>
            <div className="rounded-full border border-[#6C8FB82A] bg-[#6C8FB810] px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase tracking-[0.24em] text-[#7F7A72]">
                {t('hero.discipline')}
              </div>
              <div className="text-lg font-extrabold text-[#F2F1EE]">{disciplineScore}</div>
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-ritual text-[34px] leading-[1.04] text-[#F2F1EE] md:text-[48px]">
              {active.length === 0
                ? t('hero.name_objective')
                : overdue.length > 0
                ? t('hero.act_before_fail')
                : t('hero.system_expects')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#B4B0A7] md:text-[15px]">
              {nextQuest
                ? `${t('hero.next_pressure')}: ${nextQuest.title}. ${t('hero.decision_exists')}`
                : t('hero.empty_dangerous')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              icon={<Swords className="h-4 w-4 text-[#9AB7D4]" />}
              label={t('hero.active')}
              value={String(active.length)}
            />
            <Stat
              icon={<AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? 'text-[#C05A60]' : 'text-[#7F7A72]'}`} />}
              label={t('hero.overdue')}
              value={String(overdue.length)}
              danger={overdue.length > 0}
            />
            <Stat
              icon={<Flame className="h-4 w-4 text-[#D8C18E]" />}
              label={t('hero.streak')}
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
                {t('hero.next_state')}
              </div>
              <div className="mt-1 font-semibold text-[#F2F1EE]">
                {nextQuest
                  ? t('hero.enter_focus')
                  : t('hero.new_quest')}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-l border-[#6C8FB82E] pl-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                {t('hero.pressure_carrier')}
              </div>
              <div className="mt-2 text-sm leading-6 text-[#F2F1EE]">
                {nextQuest?.title || t('hero.system_waiting')}
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/6 pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">
                  {t('hero.closed_today')}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-[#F2F1EE]">{completedToday}</div>
              </div>
              <button
                onClick={onStartFocus}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#B89B5E30] bg-[#B89B5E] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
              >
                {t('hero.enter_focus')}
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
