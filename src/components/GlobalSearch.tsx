import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, StickyNote, ArrowRight, X } from 'lucide-react';
import { Reminder, Note, ViewMode } from '../types';
import { formatDate } from '../utils';
import { useLanguage } from '../i18n';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  notes: Note[];
  onNavigate: (view: ViewMode) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, reminders, notes, onNavigate }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
    } else {
        setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredReminders = reminders.filter(r =>
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.description?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredNotes = notes.filter(n =>
    n.content.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const hasResults = filteredReminders.length > 0 || filteredNotes.length > 0;

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#1A1A26] rounded-xl shadow-2xl border border-[#2A2A3C] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[#2A2A3C] px-4 py-3 bg-[#1A1A26]">
            <Search className="w-5 h-5 text-[#55556A] mr-3" />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-lg text-[#8888A0] placeholder:text-[#55556A] bg-transparent"
            />
            <button onClick={onClose} className="p-1 hover:bg-[#1F1F2B] rounded text-[#55556A]">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-[#12121A]">
            {!query && (
                <div className="p-8 text-center text-[#55556A]">
                    <p className="text-sm font-medium">Type to search across your workspace</p>
                    <div className="flex justify-center gap-4 mt-4 text-xs opacity-70">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Tasks</span>
                        <span className="flex items-center gap-1"><StickyNote className="w-3 h-3"/> Notes</span>
                    </div>
                </div>
            )}

            {query && !hasResults && (
                <div className="p-8 text-center text-[#55556A]">
                    No results found for "{query}"
                </div>
            )}

            {query && hasResults && (
                <div className="p-2 space-y-4">
                    {filteredReminders.length > 0 && (
                        <div>
                            <h3 className="px-3 py-2 text-xs font-bold text-[#55556A] uppercase tracking-wider">{isRU ? 'Задачи' : 'Tasks'}</h3>
                            <div className="space-y-1">
                                {filteredReminders.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => { onNavigate('reminders'); onClose(); }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#1F1F2B] hover:text-[#5DAEFF] flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-2 h-2 rounded-full ${r.isCompleted ? 'bg-[#55556A]' : 'bg-[#5DAEFF]'}`}></div>
                                            <span className={`truncate font-medium ${r.isCompleted ? 'line-through opacity-50' : ''}`}>{r.title}</span>
                                        </div>
                                        <span className="text-xs text-[#55556A] font-medium group-hover:text-[#5DAEFF]">{formatDate(r.dueDateTime)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredNotes.length > 0 && (
                        <div>
                            <h3 className="px-3 py-2 text-xs font-bold text-[#55556A] uppercase tracking-wider">{isRU ? 'Заметки' : 'Notes'}</h3>
                            <div className="space-y-1">
                                {filteredNotes.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => { onNavigate('stickers'); onClose(); }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#1F1F2B] hover:text-yellow-400 flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <StickyNote className="w-4 h-4 text-[#55556A] group-hover:text-yellow-500" />
                                            <span className="truncate font-medium text-sm">{n.content || 'Empty Note'}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-yellow-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="px-4 py-2 border-t border-[#2A2A3C] bg-[#12121A] text-[10px] text-[#55556A] flex justify-between items-center">
            <span><kbd className="bg-[#1A1A26] border border-[#2A2A3C] rounded px-1 py-0.5 font-sans shadow-sm">Enter</kbd> {isRU ? 'выбрать' : 'to select'}</span>
            <span><kbd className="bg-[#1A1A26] border border-[#2A2A3C] rounded px-1 py-0.5 font-sans shadow-sm">Esc</kbd> {isRU ? 'закрыть' : 'to close'}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
