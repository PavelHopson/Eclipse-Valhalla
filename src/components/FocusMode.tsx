/**
 * Eclipse Valhalla — Focus Mode
 *
 * Minimal execution screen. One quest. One timer. One button.
 * No distractions. No options. Just do it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../types';
import { X, Check, Pause, Play, RotateCcw } from 'lucide-react';

interface FocusModeProps {
  quest: Reminder;
  onComplete: (questId: string) => void;
  onClose: () => void;
}

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds

const FocusMode: React.FC<FocusModeProps> = ({ quest, onComplete, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer
  useEffect(() => {
    if (!isRunning || isCompleted) return;
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
  }, [isRunning, isCompleted]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - (secondsLeft / FOCUS_DURATION);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    setIsRunning(false);
    onComplete(quest.id);

    // Auto-close after 2s
    setTimeout(() => onClose(), 2000);
  }, [quest.id, onComplete, onClose]);

  const handleReset = () => {
    setSecondsLeft(FOCUS_DURATION);
    setIsRunning(true);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#06060B] flex flex-col items-center justify-center">
      {/* Close button — small, corner */}
      <button onClick={onClose}
        className="absolute top-4 right-4 p-2 text-[#2A2A3C] hover:text-[#55556A] transition-colors">
        <X className="w-5 h-5" />
      </button>

      {/* Completion state */}
      {isCompleted ? (
        <div className="text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-[#4ADE8010] border border-[#4ADE8025] flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#4ADE80]" />
          </div>
          <h2 className="text-2xl font-bold text-[#E8E8F0] mb-2">Objective completed.</h2>
          <p className="text-sm text-[#55556A]">Discipline maintained.</p>
        </div>
      ) : (
        <>
          {/* Quest title */}
          <div className="text-center mb-12 px-6">
            <div className="text-[10px] text-[#3A3A4A] uppercase tracking-[0.3em] mb-3">Current Objective</div>
            <h1 className="text-xl md:text-2xl font-bold text-[#E8E8F0] max-w-lg leading-tight">
              {quest.title}
            </h1>
          </div>

          {/* Timer — massive, central */}
          <div className="relative mb-12">
            {/* Progress ring */}
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1A1A2E" strokeWidth="3" />
              <circle cx="100" cy="100" r="90" fill="none" stroke={secondsLeft === 0 ? '#4ADE80' : '#5DAEFF'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
                className="transition-all duration-1000" />
            </svg>

            {/* Time display */}
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
            {/* Pause/Play */}
            <button onClick={() => setIsRunning(!isRunning)}
              className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center text-[#55556A] hover:text-[#8888A0] hover:border-[#2A2A3C] transition-all">
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* DONE — the main action */}
            <button onClick={handleComplete}
              className="px-10 py-4 bg-[#4ADE80] hover:bg-[#3ACF70] text-[#06060B] rounded-xl text-base font-bold shadow-[0_0_30px_rgba(74,222,128,0.15)] hover:shadow-[0_0_40px_rgba(74,222,128,0.25)] transition-all flex items-center gap-2">
              <Check className="w-5 h-5" />
              Done
            </button>

            {/* Reset */}
            <button onClick={handleReset}
              className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center text-[#55556A] hover:text-[#8888A0] hover:border-[#2A2A3C] transition-all">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Pressure text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#2A2A3C]">
              {secondsLeft === 0 ? 'Time is up. Finish or admit failure.' : 'Do not leave. Do not switch tabs. Execute.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FocusMode;
