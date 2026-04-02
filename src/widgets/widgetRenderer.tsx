/**
 * Eclipse Valhalla — Widget Renderer
 *
 * Renders all visible widgets as floating overlays.
 * Each widget type has its own visual treatment.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWidgetStore } from './widgetStore';
import {
  WidgetState,
  PRIORITY_GLOW,
  PRIORITY_BORDER,
  ESCALATION_GLOW,
  isDesktop,
} from './widgetTypes';
import { desktop } from '../services/desktopBridge';
import { createDragContext, calculateDragPosition, DragContext } from './widgetEngine';
import {
  Swords, Timer, ShieldAlert, GripVertical,
  Lock, Unlock, X, Check, Minimize2, Maximize2,
} from 'lucide-react';

// ═══════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════

export const WidgetRenderer: React.FC = () => {
  const widgets = useWidgetStore(s => s.getVisibleWidgets());

  if (widgets.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      {widgets.map(widget => (
        <WidgetContainer key={widget.id} widget={widget} />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════
// WIDGET CONTAINER (handles drag)
// ═══════════════════════════════════════════

const WidgetContainer: React.FC<{ widget: WidgetState }> = ({ widget }) => {
  const { setPosition, bringToFront, removeWidget, toggleLock, updateWidget } = useWidgetStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragCtxRef = useRef<DragContext | null>(null);

  // ── DRAG HANDLERS ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (widget.locked) return;
    e.preventDefault();
    e.stopPropagation();

    bringToFront(widget.id);
    dragCtxRef.current = createDragContext(e.clientX, e.clientY, widget.position);
    setIsDragging(true);
  }, [widget.id, widget.locked, widget.position, bringToFront]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragCtxRef.current) return;
      const newPos = calculateDragPosition(
        e.clientX,
        e.clientY,
        dragCtxRef.current,
        widget.size,
        window.innerWidth,
        window.innerHeight
      );
      setPosition(widget.id, newPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragCtxRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, widget.id, widget.size, setPosition]);

  // ── CLOSE ──
  const handleClose = () => {
    if (widget.type === 'blocker' && !widget.blockerDismissable) return;
    removeWidget(widget.id);
  };

  // ── COMPLETE QUEST (for blockers) ──
  const handleComplete = () => {
    updateWidget(widget.id, { blockerDismissable: true });
    removeWidget(widget.id);
  };

  // ── GLOW CLASSES ──
  const escalationGlow = ESCALATION_GLOW[widget.escalationLevel] || '';
  const priorityGlow = PRIORITY_GLOW[widget.priority];
  const priorityBorder = PRIORITY_BORDER[widget.priority];

  // ── TYPE ICON ──
  const TypeIcon = widget.type === 'quest' ? Swords
    : widget.type === 'focus' ? Timer
    : ShieldAlert;

  const accentColor = widget.type === 'quest' ? '#5DAEFF'
    : widget.type === 'focus' ? '#FBBF24'
    : '#FF4444';

  return (
    <div
      className={`
        pointer-events-auto absolute
        bg-[#12121A]/95 backdrop-blur-xl
        border rounded-xl overflow-hidden
        transition-shadow duration-300
        ${priorityBorder} ${priorityGlow} ${escalationGlow}
        ${isDragging ? 'cursor-grabbing' : ''}
        ${widget.locked ? '' : 'cursor-grab'}
      `}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: isMinimized ? 200 : widget.size.w,
        height: isMinimized ? 40 : widget.size.h,
        zIndex: widget.zIndex,
        opacity: widget.opacity,
        transition: isDragging ? 'none' : 'width 200ms, height 200ms, box-shadow 300ms',
      }}
      onMouseDown={() => bringToFront(widget.id)}
      onMouseEnter={() => {
        // In overlay mode: re-enable clicks when hovering a widget
        if (desktop.isDesktop) desktop.setIgnoreMouseEvents(false);
      }}
      onMouseLeave={() => {
        // In overlay mode: enable click-through when leaving widget area
        if (desktop.isDesktop) desktop.setIgnoreMouseEvents(true, { forward: true });
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[#1E1E2E] select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        {!widget.locked && (
          <GripVertical className="w-3.5 h-3.5 text-[#3A3A4A] shrink-0" />
        )}

        {/* Type icon */}
        <TypeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />

        {/* Title */}
        <span className="text-xs font-semibold text-[#E8E8F0] truncate flex-1">
          {widget.questTitle || widget.type.toUpperCase()}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLock(widget.id); }}
            className="p-1 rounded hover:bg-[#1F1F2B] text-[#3A3A4A] hover:text-[#8888A0] transition-colors"
            title={widget.locked ? 'Unlock' : 'Lock'}
          >
            {widget.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1 rounded hover:bg-[#1F1F2B] text-[#3A3A4A] hover:text-[#8888A0] transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>

          {widget.type !== 'blocker' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="p-1 rounded hover:bg-[#8B000030] text-[#3A3A4A] hover:text-[#FF4444] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      {!isMinimized && (
        <div className="p-3 flex-1">
          {widget.type === 'quest' && <QuestWidgetBody widget={widget} />}
          {widget.type === 'focus' && <FocusWidgetBody widget={widget} />}
          {widget.type === 'blocker' && <BlockerWidgetBody widget={widget} onComplete={handleComplete} />}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// QUEST WIDGET BODY
// ═══════════════════════════════════════════

const QuestWidgetBody: React.FC<{ widget: WidgetState }> = ({ widget }) => {
  const isOverdue = widget.questDeadline && new Date(widget.questDeadline).getTime() < Date.now();

  return (
    <div className="space-y-2">
      {/* Deadline */}
      {widget.questDeadline && (
        <div className={`text-[10px] font-mono ${isOverdue ? 'text-[#FF4444]' : 'text-[#55556A]'}`}>
          {isOverdue ? 'OVERDUE' : 'DUE'}: {new Date(widget.questDeadline).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </div>
      )}

      {/* Priority badge */}
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          widget.priority === 'critical' ? 'bg-[#8B000020] text-[#FF4444] border border-[#8B000040]' :
          widget.priority === 'high' ? 'bg-[#FF444415] text-[#FF4444] border border-[#FF444430]' :
          widget.priority === 'medium' ? 'bg-[#FBBF2415] text-[#FBBF24] border border-[#FBBF2430]' :
          'bg-[#5DAEFF10] text-[#5DAEFF] border border-[#5DAEFF20]'
        }`}>
          {widget.priority}
        </span>

        {widget.escalationLevel > 0 && (
          <span className="text-[9px] font-bold text-[#FF4444] animate-pulse">
            ESCALATION LV.{widget.escalationLevel}
          </span>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// FOCUS WIDGET BODY
// ═══════════════════════════════════════════

const FocusWidgetBody: React.FC<{ widget: WidgetState }> = ({ widget }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!widget.focusStartedAt) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - widget.focusStartedAt!);
    }, 1000);
    return () => clearInterval(interval);
  }, [widget.focusStartedAt]);

  const totalMs = widget.focusDurationMs || 25 * 60 * 1000;
  const remainingMs = Math.max(0, totalMs - elapsed);
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const progress = Math.min(1, elapsed / totalMs);
  const isComplete = remainingMs <= 0;

  return (
    <div className="space-y-3 text-center">
      {/* Timer */}
      <div className={`text-3xl font-mono font-bold tracking-wider ${isComplete ? 'text-[#4ADE80]' : 'text-[#FBBF24]'}`}>
        {isComplete ? 'DONE' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: isComplete ? '#4ADE80' : '#FBBF24',
          }}
        />
      </div>

      {/* Quest title */}
      <div className="text-[10px] text-[#55556A] truncate">
        {widget.questTitle || 'Focus Session'}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// BLOCKER WIDGET BODY
// ═══════════════════════════════════════════

const BlockerWidgetBody: React.FC<{ widget: WidgetState; onComplete: () => void }> = ({ widget, onComplete }) => {
  return (
    <div className="space-y-3">
      {/* Warning message */}
      <div className="text-xs text-[#FF4444] font-medium leading-relaxed">
        {widget.blockerMessage || 'Complete the quest to dismiss this blocker.'}
      </div>

      {/* Escalation indicator */}
      {widget.escalationLevel >= 2 && (
        <div className="text-[10px] font-bold text-[#8B0000] animate-pulse uppercase tracking-wider">
          This blocker will not disappear.
        </div>
      )}

      {/* Complete button */}
      <button
        onClick={onComplete}
        className="w-full py-2 bg-[#4ADE80] hover:bg-[#3ACF70] text-[#0A0A0F] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
      >
        <Check className="w-3.5 h-3.5" />
        Mark Quest Complete
      </button>
    </div>
  );
};

export default WidgetRenderer;
