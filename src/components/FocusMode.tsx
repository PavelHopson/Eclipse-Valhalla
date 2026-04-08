/**
 * Eclipse Valhalla - Focus Mode
 *
 * Fullscreen pressure chamber.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../types';
import { X, Check, Pause, Play, RotateCcw, ArrowRight, Coffee, MessageSquare } from 'lucide-react';
import { Seal } from '../brand/Seal';
import { useLanguage } from '../i18n';
import { getCompletionMessage, getIdentityMessage, getEscapeMessage, recordDailyCompletion, recordDailyEscape, getDailyStats, getProgressMessage } from '../services/disciplineMode';
import { openTelegram } from '../services/telegramCTA';
import { getCompletionVoice, shouldBeSilent } from '../services/systemVoice';

interface FocusModeProps {
  quest: Reminder;
  pendingQuests: Reminder[];
  onComplete: (questId: string) => void;
  onStartNext: (questId: string) => void;
  onClose: () => void;
}

const FOCUS_DURATION = 25 * 60;

const FocusMode: React.FC<FocusModeProps> = ({ quest, pendingQuests, onComplete, onStartNext, onClose }) => {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState<'focus' | 'completed' | 'escaped'>('focus');
  const [escapeCount, setEscapeCount] = useState(0);
  const [completionMsg] = useState(() => getCompletionMessage());
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<string | null>(null);
  const [systemVoice] = useState(() => shouldBeSilent() ? null : getCompletionVoice(false));

  const nextQuests = pendingQuests.filter(q => q.id !== quest.id).slice(0, 3);

  useEffect(() => {
    if (!isRunning || phase !== 'focus') return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, phase]);

  useEffect(() => {
    if (phase !== 'focus') return;

    const handleVisibility = () => {
      if (document.hidden && isRunning) {
        setEscapeCount(prev => prev + 1);
        recordDailyEscape();
        setPhase('escaped');
        setIsRunning(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, isRunning]);

  const handleComplete = useCallback(() => {
    setPhase('completed');
    setIsRunning(false);
    onComplete(quest.id);

    const stats = recordDailyCompletion();
    setIdentityMsg(getIdentityMessage(stats.completed));
    setDailyProgress(getProgressMessage(stats.completed));

    // Achievement tracking
    import('../services/achievementService').then(({ trackEvent }) => {
      trackEvent('focus_complete', Math.round(FOCUS_DURATION / 60));
      if (escapeCount === 0) trackEvent('focus_no_escape');
    }).catch(() => {});
  }, [quest.id, onComplete, escapeCount]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / FOCUS_DURATION;

  if (phase === 'escaped') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0A0A] ritual-enter">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(122,31,36,0.22),transparent_38%)]" />
        <div className="relative w-full max-w-xl px-6">
          <div className="rounded-[28px] border border-[#7A1F2438] bg-[#121212]/96 p-8 text-center shadow-[0_26px_90px_rgba(0,0,0,0.55)] judgment-enter">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#7A1F2433] bg-[#7A1F2410]">
              <Seal size={42} variant="broken" color="#A33036" animated />
            </div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">Return breach</div>
            <h2 className="mt-4 font-ritual text-3xl text-[#F2F1EE]">You stepped away.</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#B4B0A7]">{getEscapeMessage()}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#C05A60]">Escapes this session: {escapeCount}</p>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => {
                  setPhase('focus');
                  setIsRunning(true);
                }}
                className="w-full rounded-[16px] border border-[#B89B5E30] bg-[#B89B5E] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
              >
                {t('focus.return')}
              </button>

              {escapeCount >= 3 && (
                <button
                  onClick={() => openTelegram('escape_repeat', 'focus_escape')}
                  className="mx-auto inline-flex items-center gap-2 text-[11px] font-semibold text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t('focus.intervention')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A0A0A] ritual-enter">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,155,94,0.20),transparent_32%)]" />
        <button onClick={onClose} className="absolute right-5 top-5 p-2 text-[#5F5A54] transition-colors hover:text-[#B4B0A7]">
          <X className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-2xl px-6">
          <div className="rounded-[32px] border border-[#B89B5E33] bg-[#121212]/96 p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.58)]">
            <div className="impact-done mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#B89B5E30] bg-[#B89B5E10]">
              <Seal size={56} variant="complete" color="#B89B5E" animated />
            </div>

            <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">{t('focus.completion')}</div>
            <h2 className="mt-4 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{completionMsg.line1}</h2>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#D8C18E]">{completionMsg.line2}</p>

            {systemVoice && <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#5F5A54]">{systemVoice}</p>}
            {identityMsg && <p className="mt-4 text-sm italic text-[#D8C18E]">"{identityMsg}"</p>}
            {dailyProgress && <p className="mt-3 text-sm text-[#B4B0A7]">{dailyProgress}</p>}
            {escapeCount > 0 && !identityMsg && (
              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#C05A60]">
                {t('focus.escapes')}: {escapeCount}
              </p>
            )}

            <div className="mt-8 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 text-left">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#7F7A72]">{t('focus.identity')}</div>
              <p className="mt-3 text-sm leading-6 text-[#F2F1EE]">
                {t('focus.identity_desc')}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {nextQuests.length > 0 ? (
                <button
                  onClick={() => onStartNext(nextQuests[0].id)}
                  className="mx-auto inline-flex w-full max-w-lg items-center justify-center gap-2 rounded-[16px] border border-[#6C8FB833] bg-[#6C8FB8] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#7C9FC7]"
                >
                  {t('focus.next_objective')}: {nextQuests[0].title}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <p className="text-sm text-[#B4B0A7]">{t('focus.all_sealed')}</p>
              )}

              {(() => {
                const stats = getDailyStats();
                if (stats.completed >= 3) {
                  return (
                    <button
                      onClick={() => openTelegram('success_streak', 'focus_done')}
                      className="mx-auto inline-flex items-center gap-2 text-[11px] font-semibold text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t('focus.consistency')}
                    </button>
                  );
                }
                return null;
              })()}

              <button onClick={onClose} className="mx-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#7F7A72] transition-colors hover:text-[#B4B0A7]">
                <Coffee className="h-3.5 w-3.5" />
                {t('focus.exit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#0A0A0A] ritual-enter">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,143,184,0.10),transparent_34%)]" />
      <div className="absolute left-1/2 top-1/2 h-[68vh] w-[68vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      <div className="absolute left-1/2 top-1/2 h-[56vh] w-[56vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6C8FB81F]" />

      <button onClick={onClose} className="absolute right-5 top-5 z-10 p-2 text-[#5F5A54] transition-colors hover:text-[#B4B0A7]">
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#B89B5E26] bg-[#B89B5E0D] system-idle">
            <Seal size={24} variant="watching" color="#B89B5E" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.34em] text-[#7F7A72]">{t('focus.mode')}</div>
          <h1 className="mx-auto mt-5 max-w-3xl font-ritual text-[30px] leading-[1.1] text-[#F2F1EE] md:text-[42px]">
            {quest.title}
          </h1>
          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[#B4B0A7]">
            {t('focus.no_drift')}
          </p>
        </div>

        <div className="relative mb-10 ring-pulse">
          <svg className="h-72 w-72 -rotate-90 md:h-80 md:w-80" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(184,155,94,0.10)" strokeWidth="1" />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={secondsLeft === 0 ? '#B89B5E' : '#6C8FB8'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#7F7A72]">
              {secondsLeft === 0 ? (isRu ? 'Предел' : 'Threshold') : isRunning ? (isRu ? 'Заблокирован' : 'Locked') : (isRu ? 'Пауза' : 'Paused')}
            </div>
            <div className="mt-4 font-mono text-6xl font-bold tracking-[0.08em] text-[#F2F1EE]">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.02] text-[#B4B0A7] transition-all hover:border-white/16 hover:text-[#F2F1EE]"
          >
            {isRunning ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={handleComplete}
            className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-[16px] border border-[#B89B5E30] bg-[#B89B5E] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A]"
          >
            <Check className="h-4.5 w-4.5" />
            {t('focus.seal')}
          </button>

          <button
            onClick={() => {
              setSecondsLeft(FOCUS_DURATION);
              setIsRunning(true);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.02] text-[#B4B0A7] transition-all hover:border-white/16 hover:text-[#F2F1EE]"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-8 max-w-xl text-[11px] uppercase tracking-[0.18em] text-[#7F7A72]">
          {secondsLeft === 0 ? (isRu ? 'Окно открыто. Заверши это или признай провал.' : 'The window is open. Finish it now or name the failure.') : (isRu ? 'Камера остаётся запечатанной до завершения.' : 'The chamber remains sealed until execution is complete.')}
        </div>
        {escapeCount > 0 && <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#C05A60]">{isRu ? 'Попытки выхода: ' : 'Escape attempts: '}{escapeCount}</div>}
      </div>
    </div>
  );
};

export default FocusMode;
