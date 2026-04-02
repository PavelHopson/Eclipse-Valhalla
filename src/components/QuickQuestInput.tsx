/**
 * Eclipse Valhalla — Quick Quest Input
 *
 * Single-input quest creation. 60-second first win.
 * Press Enter → quest created + widget spawned + feedback.
 */

import React, { useState, useRef } from 'react';
import { Plus, Zap, Briefcase, Heart, User } from 'lucide-react';

type QuestTag = 'work' | 'health' | 'life';

interface QuickQuestInputProps {
  onCreateQuest: (title: string, tag?: string) => void;
  placeholder?: string;
  compact?: boolean;
}

const TAGS: { id: QuestTag; icon: any; label: string; color: string }[] = [
  { id: 'work', icon: Briefcase, label: 'Work', color: '#5DAEFF' },
  { id: 'health', icon: Heart, label: 'Health', color: '#4ADE80' },
  { id: 'life', icon: User, label: 'Life', color: '#7A5CFF' },
];

const QuickQuestInput: React.FC<QuickQuestInputProps> = ({
  onCreateQuest,
  placeholder = 'New objective... (Enter to create)',
  compact = false,
}) => {
  const [value, setValue] = useState('');
  const [flash, setFlash] = useState(false);
  const [tag, setTag] = useState<QuestTag | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const title = value.trim();
    if (!title) return;

    onCreateQuest(title, tag || undefined);
    setValue('');
    setFlash(true);
    setTimeout(() => setFlash(false), 600);

    // Refocus for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 bg-[#12121A] border rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none transition-all ${
            flash ? 'border-[#4ADE8060] shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'border-[#2A2A3C] focus:border-[#5DAEFF40]'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-3 py-2 bg-[#5DAEFF] text-[#0A0A0F] rounded-lg font-bold disabled:opacity-20 transition-opacity active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative bg-[#12121A] border rounded-xl overflow-hidden transition-all ${
      flash ? 'border-[#4ADE8050] shadow-[0_0_15px_rgba(74,222,128,0.08)]' : 'border-[#2A2A3C] focus-within:border-[#5DAEFF40]'
    }`}>
      <div className="flex items-center px-4">
        <Zap className="w-4 h-4 text-[#3A3A4A] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-3.5 bg-transparent text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none"
        />
        {value.trim() && (
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-lg text-xs font-bold active:scale-95 transition-transform"
          >
            Create
          </button>
        )}
      </div>

      {/* Quest type tags — 1 click, optional */}
      <div className="flex items-center gap-1 px-4 pb-2">
        {TAGS.map(t => {
          const Icon = t.icon;
          const active = tag === t.id;
          return (
            <button key={t.id} onClick={() => setTag(active ? null : t.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
                active ? `border` : 'text-[#3A3A4A] hover:text-[#55556A]'
              }`}
              style={active ? { color: t.color, borderColor: `${t.color}30`, backgroundColor: `${t.color}08` } : undefined}>
              <Icon className="w-2.5 h-2.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Success flash */}
      {flash && (
        <div className="absolute inset-0 bg-[#4ADE8008] pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

export default QuickQuestInput;
