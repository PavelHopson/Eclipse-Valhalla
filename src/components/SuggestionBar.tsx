/**
 * Eclipse Valhalla — Suggestion Bar
 *
 * Contextual auto-suggestions that appear when relevant.
 * "3 overdue. Ask the Oracle." "Add intelligence sources."
 */

import React from 'react';
import { AutoSuggestion } from '../services/growthService';
import { Swords, Sparkles, Rss, Target, ChevronRight, X } from 'lucide-react';

interface SuggestionBarProps {
  suggestions: AutoSuggestion[];
  onAction: (action: string) => void;
  onDismiss: (index: number) => void;
}

const ICONS: Record<string, any> = {
  quest: Swords,
  oracle: Sparkles,
  nexus: Rss,
  focus: Target,
};

const COLORS: Record<string, string> = {
  quest: '#5DAEFF',
  oracle: '#4ADE80',
  nexus: '#7A5CFF',
  focus: '#FBBF24',
};

const SuggestionBar: React.FC<SuggestionBarProps> = ({ suggestions, onAction, onDismiss }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2 px-1">
      {suggestions.map((s, i) => {
        const Icon = ICONS[s.type] || Target;
        const color = COLORS[s.type] || '#5DAEFF';

        return (
          <div
            key={`${s.action}_${i}`}
            className="flex items-center gap-3 px-3 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-xl hover:border-[#2A2A3C] transition-all group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#E8E8F0] truncate">{s.title}</div>
              <div className="text-[10px] text-[#3A3A4A] truncate">{s.description}</div>
            </div>

            <button
              onClick={() => onAction(s.action)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors shrink-0"
              style={{ color, backgroundColor: `${color}08`, border: `1px solid ${color}20` }}
            >
              Go <ChevronRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => onDismiss(i)}
              className="p-1 text-[#2A2A3C] hover:text-[#55556A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SuggestionBar;
