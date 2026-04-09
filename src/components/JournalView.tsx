import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import { Plus, X, BookOpen, ChevronDown, ChevronUp, Flame } from 'lucide-react';

interface JournalEntry { id: string; date: string; mood: number; rating: number; text: string; gratitude?: string; createdAt: string; }

const STORAGE_KEY = 'eclipse_journal';
const MOODS = ['😫', '😔', '😐', '🙂', '🔥'];
const V = { bg0:'#0A0A0F', bg2:'#12121A', bg3:'#1A1A26', text:'#E8E8F0', textSec:'#8888A0', textTer:'#55556A', textDis:'#3A3A4A', border:'#1E1E2E', borderL:'#2A2A3C', accent:'#5DAEFF', gold:'#D8C18E', success:'#4ADE80' };

function load(): JournalEntry[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(entries: JournalEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }

const JournalView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [entries, setEntries] = useState<JournalEntry[]>(load);
  const [isWriting, setIsWriting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formText, setFormText] = useState('');
  const [formMood, setFormMood] = useState(3);
  const [formRating, setFormRating] = useState(7);
  const [formGratitude, setFormGratitude] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  const update = (u: JournalEntry[]) => { setEntries(u); save(u); };

  const saveEntry = () => {
    if (!formText.trim()) return;
    const entry: JournalEntry = { id: todayEntry?.id || generateId(), date: today, mood: formMood, rating: formRating, text: formText.trim(), gratitude: formGratitude.trim() || undefined, createdAt: new Date().toISOString() };
    update(todayEntry ? entries.map(e => e.id === todayEntry.id ? entry : e) : [entry, ...entries]);
    setIsWriting(false); setFormText(''); setFormGratitude(''); setFormMood(3); setFormRating(7);
  };

  const startWriting = () => {
    if (todayEntry) { setFormText(todayEntry.text); setFormMood(todayEntry.mood); setFormRating(todayEntry.rating); setFormGratitude(todayEntry.gratitude || ''); }
    setIsWriting(true);
  };

  const avgMood = useMemo(() => entries.length ? Math.round(entries.reduce((a, e) => a + e.mood, 0) / entries.length * 10) / 10 : 0, [entries]);
  const avgRating = useMemo(() => entries.length ? Math.round(entries.reduce((a, e) => a + e.rating, 0) / entries.length * 10) / 10 : 0, [entries]);
  const streak = useMemo(() => { let s = 0; for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (entries.some(e => e.date === d.toISOString().split('T')[0])) s++; else break; } return s; }, [entries]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${V.gold}20, ${V.gold}08)`, border: `1px solid ${V.gold}30` }}>
              <BookOpen className="w-5 h-5" style={{ color: V.gold }} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold" style={{ color: V.text }}>{isRu ? 'Дневник' : 'Journal'}</h2>
              <p className="text-xs" style={{ color: V.textTer }}>{entries.length} {isRu ? 'записей' : 'entries'} · {streak}{isRu ? 'д серия' : 'd streak'}</p>
            </div>
          </div>
          <button onClick={startWriting} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: V.gold, color: V.bg0 }}>
            <Plus className="w-4 h-4" /> {todayEntry ? (isRu ? 'Изменить' : 'Edit') : (isRu ? 'Написать' : 'Write')}
          </button>
        </div>

        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
              <div className="text-xl">{MOODS[Math.round(avgMood) - 1] || '😐'}</div>
              <p className="text-[10px] font-bold uppercase mt-1" style={{ color: V.textTer }}>{isRu ? 'Настроение' : 'Mood'}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
              <div className="text-xl font-extrabold" style={{ color: V.gold }}>{avgRating}/10</div>
              <p className="text-[10px] font-bold uppercase mt-1" style={{ color: V.textTer }}>{isRu ? 'Оценка' : 'Rating'}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
              <div className="text-xl font-extrabold" style={{ color: V.success }}>{streak}</div>
              <p className="text-[10px] font-bold uppercase mt-1" style={{ color: V.textTer }}>{isRu ? 'Серия' : 'Streak'}</p>
            </div>
          </div>
        )}

        {isWriting && (
          <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: V.text }}>{isRu ? 'Запись за сегодня' : "Today's Entry"}</h3>
              <button onClick={() => setIsWriting(false)} style={{ color: V.textDis }}><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: V.textTer }}>{isRu ? 'Настроение' : 'Mood'}</label>
              <div className="flex gap-2">
                {MOODS.map((e, i) => (
                  <button key={i} onClick={() => setFormMood(i + 1)} className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${formMood === i + 1 ? 'ring-2 ring-[#D8C18E] scale-110' : ''}`} style={{ backgroundColor: formMood === i + 1 ? '#D8C18E20' : V.bg3 }}>{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: V.textTer }}>{isRu ? 'Оценка дня' : 'Day Rating'}: {formRating}/10</label>
              <input type="range" min="1" max="10" value={formRating} onChange={e => setFormRating(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(90deg, ${V.accent} ${formRating * 10}%, ${V.bg3} ${formRating * 10}%)` }} />
            </div>
            <textarea value={formText} onChange={e => setFormText(e.target.value)} placeholder={isRu ? 'Что произошло сегодня?' : 'What happened today?'} className="w-full h-32 px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} autoFocus />
            <input value={formGratitude} onChange={e => setFormGratitude(e.target.value)} placeholder={isRu ? 'За что благодарен?' : 'What are you grateful for?'} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsWriting(false)} className="px-4 py-2 text-xs" style={{ color: V.textTer }}>{isRu ? 'Отмена' : 'Cancel'}</button>
              <button onClick={saveEntry} disabled={!formText.trim()} className="px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-30" style={{ backgroundColor: V.gold, color: V.bg0 }}>{isRu ? 'Сохранить' : 'Save'}</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {entries.map(entry => {
            const isExp = expandedId === entry.id;
            const d = new Date(entry.date);
            return (
              <div key={entry.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                <button onClick={() => setExpandedId(isExp ? null : entry.id)} className="w-full px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{MOODS[entry.mood - 1]}</span>
                    <div className="text-left">
                      <div className="text-sm font-bold" style={{ color: V.text }}>{d.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <div className="text-[10px]" style={{ color: V.textDis }}>{entry.rating}/10</div>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4" style={{ color: V.textTer }} /> : <ChevronDown className="w-4 h-4" style={{ color: V.textTer }} />}
                </button>
                {isExp && (
                  <div className="px-5 pb-4 space-y-3 animate-in fade-in duration-200">
                    <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: V.textSec }}>{entry.text}</p>
                    {entry.gratitude && (
                      <div className="rounded-xl p-3" style={{ backgroundColor: `${V.gold}08`, border: `1px solid ${V.gold}20` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.gold }}>{isRu ? 'Благодарность' : 'Gratitude'}</p>
                        <p className="text-xs" style={{ color: V.textSec }}>{entry.gratitude}</p>
                      </div>
                    )}
                    <button onClick={() => update(entries.filter(e => e.id !== entry.id))} className="text-[10px] font-bold text-[#3A3A4A] hover:text-[#FF4444] transition-colors">{isRu ? 'Удалить' : 'Delete'}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {entries.length === 0 && !isWriting && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: V.textDis }} />
            <p className="font-semibold" style={{ color: V.textTer }}>{isRu ? 'Дневник пуст' : 'Empty'}</p>
            <p className="text-sm mt-1" style={{ color: V.textDis }}>{isRu ? 'Напиши, что произошло сегодня' : 'Write about your day'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalView;
