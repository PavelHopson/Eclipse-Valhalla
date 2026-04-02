/**
 * Eclipse Valhalla — Focus Mode
 *
 * One quest. One timer. No escape.
 *
 * Post-completion: emotional hit + next quest prompt.
 * Tab escape: detected and punished.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../types';
import { X, Check, Pause, Play, RotateCcw, ArrowRight, Coffee } from 'lucide-react';
import { Seal } from '../brand/Seal';
import { getCompletionMessage, getIdentityMessage, getEscapeMessage, recordDailyCompletion, recordDailyEscape, getDailyStats, getProgressMessage } from '../services/disciplineMode';
import { shouldShowCTA, getCTAConfig, openTelegram } from '../services/telegramCTA';
import { getCompletionVoice, shouldBeSilent } from '../services/systemVoice';
import { MessageSquare } from 'lucide-react';

interface FocusModeProps {
  quest: Reminder;
  pendingQuests: Reminder[];
  onComplete: (questId: string) => void;
  onStartNext: (questId: string) => void;
  onClose: () => void;
}

const FOCUS_DURATION = 25 * 60;

const FocusMode: React.FC<FocusModeProps> = ({ quest, pendingQuests, onComplete, onStartNext, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState<'focus' | 'completed' | 'escaped'>('focus');
  const [escapeCount, setEscapeCount] = useState(0);
  const [completionMsg] = useState(() => getCompletionMessage());
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<string | null>(null);
  const [systemVoice] = useState(() => shouldBeSilent() ? null : getCompletionVoice(false));

  const nextQuests = pendingQuests.filter(q => q.id !== quest.id).slice(0, 3);

  // Timer
  useEffect(() => {
    if (!isRunning || phase !== 'focus') return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { setIsRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, phase]);

  // ═══ TAB ESCAPE DETECTION ═══
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

    // Record daily stats + get identity/progress messages
    const stats = recordDailyCompletion();
    setIdentityMsg(getIdentityMessage(stats.completed));
    setDailyProgress(getProgressMessage(stats.completed));
  }, [quest.id, onComplete]);

  const handleReturnFromEscape = () => {
    setPhase('focus');
    setIsRunning(true);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - (secondsLeft / FOCUS_DURATION);

  // ═══ ESCAPE STATE ═══
  if (phase === 'escaped') {
    return (
      <div className="fixed inset-0 z-[80] bg-[#050508] flex flex-col items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <div className="text-6xl mb-6 opacity-30">⚠</div>
          <h2 className="text-2xl font-bold text-[#FF4444] mb-3">You left.</h2>
          <p className="text-sm text-[#55556A] mb-2">
            {getEscapeMessage()}
          </p>
          <p className="text-xs text-[#3A3A4A] mb-8">
            Escape count this session: {escapeCount}
          </p>
          <button onClick={handleReturnFromEscape}
            className="px-8 py-4 bg-[#5DAEFF] text-[#06060B] rounded-xl text-sm font-bold shadow-[0_0_30px_rgba(93,174,255,0.15)] hover:shadow-[0_0_40px_rgba(93,174,255,0.25)] transition-all mb-3">
            Return to objective
          </button>

          {escapeCount >= 3 && (
            <button onClick={() => openTelegram('escape_repeat', 'focus_escape')}
              className="flex items-center gap-2 mx-auto text-[10px] text-[#55556A] hover:text-[#8888A0] transition-colors">
              <MessageSquare className="w-3 h-3" />
              This pattern needs intervention. Talk to creator.
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══ COMPLETION STATE (HOLD + EMOTION + NEXT) ═══
  if (phase === 'completed') {
    return (
      <div className="fixed inset-0 z-[80] bg-[#050508] flex flex-col items-center justify-center ritual-enter">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#2A2A3C] hover:text-[#55556A]">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center px-6 max-w-md">
          {/* The Seal — completion confirmed */}
          <div className="impact-done mx-auto mb-8">
            <Seal size={80} variant="complete" animated />
          </div>

          {/* Emotional message */}
          <h2 className="text-xl md:text-2xl font-bold text-[#EAEAF2] mb-2">{completionMsg.line1}</h2>
          <p className="text-sm text-[#3DD68C] font-medium mb-2">{completionMsg.line2}</p>

          {/* System voice — cold acknowledgment (or silence) */}
          {systemVoice && <p className="text-[10px] text-[#3D3D52] font-mono mb-3">{systemVoice}</p>}

          {/* Identity reinforcement (30% chance, after 2+ completions) */}
          {identityMsg && (
            <p className="text-xs text-[#5DAEFF] italic mb-3">"{identityMsg}"</p>
          )}

          {/* Daily progress */}
          {dailyProgress && (
            <p className="text-[10px] text-[#55556A] mb-6">{dailyProgress}</p>
          )}

          {/* Escape penalty note */}
          {escapeCount > 0 && !identityMsg && (
            <p className="text-[10px] text-[#FF4444] mb-6">
              You escaped {escapeCount} time{escapeCount > 1 ? 's' : ''} during this session. Work on that.
            </p>
          )}

          {/* NEXT QUEST PROMPT — the compulsion */}
          {nextQuests.length > 0 ? (
            <div className="space-y-3 mb-6">
              <p className="text-[10px] text-[#3A3A4A] uppercase tracking-[0.2em]">Next objective</p>
              {nextQuests.slice(0, 1).map(q => (
                <button key={q.id} onClick={() => onStartNext(q.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#06060B] rounded-xl font-bold text-sm shadow-[0_0_30px_rgba(93,174,255,0.15)] transition-all">
                  <ArrowRight className="w-5 h-5" />
                  {q.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#3A3A4A] mb-6">All objectives cleared.</p>
          )}

          {/* Contextual Telegram CTA (after success streak) */}
          {(() => {
            const stats = getDailyStats();
            if (stats.completed >= 3) {
              return (
                <button onClick={() => openTelegram('success_streak', 'focus_done')}
                  className="flex items-center gap-2 mx-auto text-[10px] text-[#5DAEFF] hover:text-[#4A9AEE] transition-colors mb-3">
                  <MessageSquare className="w-3 h-3" />
                  Executing consistently? Get advanced guidance.
                </button>
              );
            }
            return null;
          })()}

          {/* Rest option — deliberately smaller */}
          <button onClick={onClose}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-xs text-[#3A3A4A] hover:text-[#55556A] transition-colors">
            <Coffee className="w-3.5 h-3.5" />
            Rest
          </button>
        </div>
      </div>
    );
  }

  // ═══ FOCUS STATE ═══
  return (
    <div className="fixed inset-0 z-[80] bg-[#050508] flex flex-col items-center justify-center ritual-enter">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#3D3D52] hover:text-[#5E5E78]">
        <X className="w-5 h-5" />
      </button>

      {/* Quest title */}
      <div className="text-center mb-12 px-6">
        {/* The Seal — watching during focus */}
        <div className="mx-auto mb-4 system-idle"><Seal size={24} variant="watching" /></div>
        <div className="text-[9px] text-[#3D3D52] uppercase tracking-[0.35em] mb-3 font-medium">Current Objective</div>
        <h1 className="text-xl md:text-2xl font-bold text-[#E8E8F0] max-w-lg leading-tight">{quest.title}</h1>
      </div>

      {/* Timer — ritual ring */}
      <div className="relative mb-12 ring-pulse">
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#14141F" strokeWidth="2" />
          <circle cx="100" cy="100" r="90" fill="none"
            stroke={secondsLeft === 0 ? '#3DD68C' : '#5DA8FF'}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-[#E8E8F0] tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-[#3A3A4A] uppercase tracking-widest mt-2">
            {secondsLeft === 0 ? 'Time up' : isRunning ? 'Focused' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={() => setIsRunning(!isRunning)}
          className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center text-[#55556A] hover:text-[#8888A0] hover:border-[#2A2A3C] transition-all">
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button onClick={handleComplete}
          className="px-10 py-4 bg-[#4ADE80] hover:bg-[#3ACF70] text-[#06060B] rounded-xl text-base font-bold shadow-[0_0_30px_rgba(74,222,128,0.15)] hover:shadow-[0_0_40px_rgba(74,222,128,0.25)] transition-all flex items-center gap-2">
          <Check className="w-5 h-5" />Done
        </button>

        <button onClick={() => { setSecondsLeft(FOCUS_DURATION); setIsRunning(true); }}
          className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center text-[#55556A] hover:text-[#8888A0] hover:border-[#2A2A3C] transition-all">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Pressure */}
      <p className="mt-8 text-xs text-[#2A2A3C]">
        {secondsLeft === 0 ? 'Time is up. Finish or admit failure.' : 'Do not leave. Do not switch tabs. Execute.'}
      </p>
      {escapeCount > 0 && (
        <p className="mt-2 text-[10px] text-[#FF4444]">Escape attempts: {escapeCount}</p>
      )}
    </div>
  );
};

export default FocusMode;
