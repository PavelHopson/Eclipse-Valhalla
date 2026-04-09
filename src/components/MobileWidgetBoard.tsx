/**
 * Eclipse Valhalla — Mobile Widget Board
 *
 * Inline widget display for mobile devices.
 * No floating overlays — cards within the flow.
 */

import React from 'react';
import { useWidgetStore } from '../widgets';
import { Swords, Timer, ShieldAlert, Check, X } from 'lucide-react';
import { useLanguage } from '../i18n';

const MobileWidgetBoard: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const widgets = useWidgetStore(s => s.getVisibleWidgets());
  const { removeWidget, updateWidget } = useWidgetStore();

  if (widgets.length === 0) return null;

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-[#5DAEFF]" />
        <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">{isRu ? 'Активные виджеты' : 'Active Widgets'}</span>
        <span className="text-[10px] text-[#3A3A4A] ml-auto">{widgets.length}</span>
      </div>

      {widgets.slice(0, 5).map(widget => {
        const Icon = widget.type === 'quest' ? Swords
          : widget.type === 'focus' ? Timer
          : ShieldAlert;

        const accentColor = widget.type === 'quest' ? '#5DAEFF'
          : widget.type === 'focus' ? '#FBBF24'
          : '#FF4444';

        const isOverdue = widget.questDeadline && new Date(widget.questDeadline).getTime() < Date.now();

        return (
          <div
            key={widget.id}
            className="flex items-center gap-3 px-3 py-2.5 bg-[#1A1A26] border border-[#2A2A3C] rounded-xl"
            style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: accentColor }} />

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#E8E8F0] truncate">
                {widget.questTitle || widget.type}
              </div>
              {widget.questDeadline && (
                <div className={`text-[10px] font-mono ${isOverdue ? 'text-[#FF4444]' : 'text-[#55556A]'}`}>
                  {isOverdue ? (isRu ? 'ПРОСРОЧЕНО' : 'OVERDUE') : (isRu ? 'Срок' : 'Due')}: {new Date(widget.questDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Actions */}
            {widget.type === 'blocker' ? (
              <button
                onClick={() => { updateWidget(widget.id, { blockerDismissable: true }); removeWidget(widget.id); }}
                className="p-1.5 rounded-lg bg-[#4ADE8015] text-[#4ADE80] active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => removeWidget(widget.id)}
                className="p-1.5 rounded-lg bg-[#1F1F2B] text-[#3A3A4A] active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileWidgetBoard;
