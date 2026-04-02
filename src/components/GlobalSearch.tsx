import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, StickyNote, ArrowRight, X } from 'lucide-react';
import { Reminder, Note, ViewMode } from '../types';
import { formatDate } from '../utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  notes: Note[];
  onNavigate: (view: ViewMode) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, reminders, notes, onNavigate }) => {
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-slate-100 px-4 py-3 bg-white">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-lg text-slate-700 placeholder:text-slate-400"
            />
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-slate-50/50">
            {!query && (
                <div className="p-8 text-center text-slate-400">
                    <p className="text-sm font-medium">Type to search across your workspace</p>
                    <div className="flex justify-center gap-4 mt-4 text-xs opacity-70">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Tasks</span>
                        <span className="flex items-center gap-1"><StickyNote className="w-3 h-3"/> Notes</span>
                    </div>
                </div>
            )}

            {query && !hasResults && (
                <div className="p-8 text-center text-slate-500">
                    No results found for "{query}"
                </div>
            )}

            {query && hasResults && (
                <div className="p-2 space-y-4">
                    {filteredReminders.length > 0 && (
                        <div>
                            <h3 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks</h3>
                            <div className="space-y-1">
                                {filteredReminders.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => { onNavigate('reminders'); onClose(); }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-2 h-2 rounded-full ${r.isCompleted ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                                            <span className={`truncate font-medium ${r.isCompleted ? 'line-through opacity-50' : ''}`}>{r.title}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium group-hover:text-blue-400">{formatDate(r.dueDateTime)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredNotes.length > 0 && (
                        <div>
                            <h3 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</h3>
                            <div className="space-y-1">
                                {filteredNotes.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => { onNavigate('stickers'); onClose(); }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-yellow-50 hover:text-yellow-700 flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <StickyNote className="w-4 h-4 text-slate-400 group-hover:text-yellow-500" />
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

        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
            <span><kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 font-sans shadow-sm">Enter</kbd> to select</span>
            <span><kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 font-sans shadow-sm">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
