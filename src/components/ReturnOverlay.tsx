/**
 * Eclipse Valhalla - Return Overlay
 *
 * Re-entry is confrontation, not comfort.
 */

import React from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { openTelegram } from '../services/telegramCTA';
import { Seal } from '../brand/Seal';
import { useLanguage } from '../i18n';

export interface ReturnState {
  type: 'morning' | 'debt' | 'comeback';
  streak: number;
  abandonedCount: number;
  daysAway: number;
  topAbandoned?: string;
}

interface ReturnOverlayProps {
  state: ReturnState;
  onStartFirst: () => void;
  onDismiss: () => void;
}

const ReturnOverlay: React.FC<ReturnOverlayProps> = ({ state, onStartFirst, onDismiss }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title =
    state.type === 'morning' ? (isRu ? `День ${state.streak}.` : `Day ${state.streak}.`) :
    state.type === 'debt' ? (isRu ? `${state.abandonedCount} брошено.` : `${state.abandonedCount} abandoned.`) :
    (isRu ? `${state.daysAway} дней отсутствия.` : `${state.daysAway} days absent.`);

  const body =
    state.type === 'morning'
      ? state.streak > 1
        ? (isRu ? `${state.streak} дней непрерывности на кону. Докажи.` : `${state.streak} days of continuity are on the line. Show proof.`)
        : (isRu ? 'Система открыла новый день. Установи контроль.' : 'The system has opened a new day. Establish control immediately.')
      : state.type === 'debt'
      ? (isRu ? 'Ты ушёл без завершения. Запись осталась открытой.' : 'You left without closure. The record stayed open.')
      : (isRu ? 'Цикл рухнул, пока тебя не было.' : 'The loop collapsed while you were gone. Discipline does not restart on its own.');

  const detail =
    state.type === 'morning'
      ? state.abandonedCount > 0
        ? (isRu ? `${state.abandonedCount} незавершённых целей ещё ждут.` : `${state.abandonedCount} unfinished objective${state.abandonedCount > 1 ? 's' : ''} are still waiting.`)
        : (isRu ? 'Оправданий пока нет.' : 'No excuses have been written yet.')
      : state.type === 'debt'
      ? state.topAbandoned
        ? (isRu ? `Срочнее всего: ${state.topAbandoned}` : `Most urgent: ${state.topAbandoned}`)
        : (isRu ? 'Старое давление ещё активно.' : 'Old pressure is still active.')
      : (isRu ? 'День 1 начинается когда ты действуешь.' : 'Day 1 begins only when you act.');

  const variant = state.type === 'morning' ? 'watching' : 'broken';
  const accent = state.type === 'morning' ? '#B89B5E' : '#A33036';

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#0A0A0A]/96 px-6 ritual-enter">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,143,184,0.10),transparent_32%)]" />

      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-[#121212]/96 p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.58)] judgment-enter">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute left-8 top-8 hidden h-24 w-24 rounded-full border border-white/5 md:block" />
        <div className="absolute right-8 top-8 hidden h-10 w-10 rounded-full border border-[#B89B5E24] md:block" />

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border bg-black/20" style={{ borderColor: `${accent}33` }}>
          <Seal size={40} variant={variant} color={accent} animated />
        </div>

        <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">{isRu ? 'Протокол возврата' : 'Return protocol'}</div>
        <h1 className="mt-4 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#B4B0A7]">{body}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>{detail}</p>

        <div className="mt-8 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 text-left">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">{isRu ? 'Ожидание системы' : 'System expectation'}</div>
          <p className="mt-3 text-sm leading-6 text-[#F2F1EE]">
            {isRu ? 'Возврат важен только если станет действием.' : 'Re-entry only matters if it becomes action in the next minute.'}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={onStartFirst}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#B89B5E30] bg-[#B89B5E] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
          >
            {state.abandonedCount > 0 ? (isRu ? 'К целям' : 'Face the objectives') : (isRu ? 'Начать первую цель' : 'Start first objective')}
            <ArrowRight className="h-4 w-4" />
          </button>

          {(state.type === 'comeback' || (state.type === 'debt' && state.abandonedCount >= 3)) && (
            <button
              onClick={() => openTelegram('streak_break', 'return_overlay')}
              className="mx-auto inline-flex items-center gap-2 text-[11px] font-semibold text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {isRu ? 'Нужна подотчётность' : 'Need accountability pressure'}
            </button>
          )}

          <button onClick={onDismiss} className="text-[11px] uppercase tracking-[0.16em] text-[#5F5A54] transition-colors hover:text-[#B4B0A7]">
            {isRu ? 'Закрыть' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnOverlay;
