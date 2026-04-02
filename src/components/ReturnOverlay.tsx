/**
 * Eclipse Valhalla — Return Overlay
 *
 * Shows on app open when there's unfinished business.
 * Three scenarios:
 *   1. Morning trigger (first open of the day)
 *   2. Unfinished debt (abandoned objectives from yesterday)
 *   3. Inactivity pressure (came back after days away)
 *
 * This is NOT a welcome screen. This is a confrontation.
 */

import React from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { openTelegram } from '../services/telegramCTA';
import { Seal } from '../brand/Seal';

export interface ReturnState {
  type: 'morning' | 'debt' | 'comeback';
  streak: number;
  abandonedCount: number;
  daysAway: number;
  topAbandoned?: string; // title of most urgent abandoned quest
}

interface ReturnOverlayProps {
  state: ReturnState;
  onStartFirst: () => void;
  onDismiss: () => void;
}

const ReturnOverlay: React.FC<ReturnOverlayProps> = ({ state, onStartFirst, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[75] bg-[#050508] flex items-center justify-center ritual-enter">
      <div className="max-w-md mx-auto px-6 text-center judgment-enter">

        {/* ═══ MORNING TRIGGER ═══ */}
        {state.type === 'morning' && (
          <>
            <div className="mx-auto mb-8"><Seal size={56} variant="watching" animated /></div>
            <h1 className="text-2xl font-bold text-[#E8E8F0] mb-2">
              Day {state.streak}.
            </h1>
            <p className="text-sm text-[#55556A] mb-2">
              {state.streak > 1
                ? `${state.streak} days of discipline. Don't break it.`
                : 'The system is watching. What will you execute today?'}
            </p>
            {state.abandonedCount > 0 && (
              <p className="text-xs text-[#FF4444] mb-6">
                {state.abandonedCount} unfinished objective{state.abandonedCount > 1 ? 's' : ''} from yesterday.
              </p>
            )}
          </>
        )}

        {/* ═══ UNFINISHED DEBT ═══ */}
        {state.type === 'debt' && (
          <>
            <div className="mx-auto mb-8"><Seal size={56} variant="broken" animated /></div>
            <h1 className="text-2xl font-bold text-[#FF4444] mb-2">
              {state.abandonedCount} abandoned.
            </h1>
            <p className="text-sm text-[#55556A] mb-2">
              You left without finishing. The system remembers.
            </p>
            {state.topAbandoned && (
              <p className="text-xs text-[#8888A0] mb-6">
                Most urgent: "{state.topAbandoned}"
              </p>
            )}
          </>
        )}

        {/* ═══ COMEBACK ═══ */}
        {state.type === 'comeback' && (
          <>
            <div className="mx-auto mb-8"><Seal size={56} variant="broken" animated /></div>
            <h1 className="text-2xl font-bold text-[#E8E8F0] mb-2">
              {state.daysAway} days absent.
            </h1>
            <p className="text-sm text-[#FF4444] mb-2">
              Streak destroyed. Discipline collapsed.
            </p>
            <p className="text-xs text-[#55556A] mb-6">
              Day 1 begins now. Prove you're still here.
            </p>
          </>
        )}

        {/* CTA */}
        <button onClick={onStartFirst}
          className="w-full px-8 py-4 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#06060B] rounded-xl text-sm font-bold shadow-[0_0_30px_rgba(93,174,255,0.15)] hover:shadow-[0_0_40px_rgba(93,174,255,0.25)] transition-all flex items-center justify-center gap-2 mb-3">
          <ArrowRight className="w-5 h-5" />
          {state.abandonedCount > 0 ? 'Face your objectives' : 'Start first objective'}
        </button>

        {/* Telegram CTA for streak break / comeback */}
        {(state.type === 'comeback' || (state.type === 'debt' && state.abandonedCount >= 3)) && (
          <button onClick={() => openTelegram('streak_break', 'return_overlay')}
            className="flex items-center gap-2 mx-auto text-[10px] text-[#55556A] hover:text-[#8888A0] transition-colors mb-3">
            <MessageSquare className="w-3 h-3" />
            Need accountability? Talk to the creator.
          </button>
        )}

        <button onClick={onDismiss}
          className="text-[10px] text-[#2A2A3C] hover:text-[#3A3A4A] transition-colors">
          dismiss
        </button>
      </div>
    </div>
  );
};

export default ReturnOverlay;
