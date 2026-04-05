import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { generateId } from '../utils';
import { Plus, X, GripHorizontal, Minus, Eraser, ScrollText } from 'lucide-react';
import { useLanguage } from '../i18n';

interface StickerBoardProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const COLORS = [
  { id: 'sand', bg: 'bg-[#efe3b1]', border: 'border-[#d8c189]', header: 'bg-[#d8c189]/20' },
  { id: 'ice', bg: 'bg-[#d8e6f4]', border: 'border-[#aac1d6]', header: 'bg-[#aac1d6]/20' },
  { id: 'sage', bg: 'bg-[#d8e2ce]', border: 'border-[#b1c09b]', header: 'bg-[#b1c09b]/20' },
  { id: 'ashrose', bg: 'bg-[#ead7df]', border: 'border-[#d8aebd]', header: 'bg-[#d8aebd]/20' },
  { id: 'violetdust', bg: 'bg-[#e5ddf2]', border: 'border-[#c7b3e1]', header: 'bg-[#c7b3e1]/20' },
];

const StickerBoard: React.FC<StickerBoardProps> = ({ notes, setNotes }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const addNote = (colorIndex = 0) => {
    const color = COLORS[colorIndex];
    setNotes(prev => [...prev, {
      id: generateId(),
      content: '',
      x: 72 + Math.random() * 120,
      y: 72 + Math.random() * 100,
      width: 260,
      height: 260,
      color: `${color.bg} ${color.border}`,
      zIndex: Math.max(0, ...prev.map(n => n.zIndex)) + 1,
      isMinimized: false,
    }]);
  };

  const updateNoteContent = (id: string, content: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  const removeNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));
  const clearAll = () => window.confirm(isRU ? 'Очистить все скрижали?' : 'Clear all scrolls?') && setNotes([]);
  const toggleMinimize = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isMinimized: !n.isMinimized } : n));
  const bringToFront = (id: string) => {
    const maxZ = Math.max(0, ...notes.map(n => n.zIndex));
    setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
  };

  const startDrag = (clientX: number, clientY: number, note: Note, target: Element) => {
    if (!boardRef.current) return;
    const rect = target.closest('.sticker-note')?.getBoundingClientRect();
    if (!rect) return;
    setDraggingId(note.id);
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    bringToFront(note.id);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const x = clientX - boardRect.left - dragOffset.x;
    const y = clientY - boardRect.top - dragOffset.y;
    setNotes(prev => prev.map(n => n.id === draggingId ? { ...n, x, y } : n));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const handleMouseUp = () => setDraggingId(null);
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffset]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#121212]/96 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">Stone scrolls</div>
            <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRU ? 'Каменные скрижали' : 'Stone scrolls'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B4B0A7]">
              {isRU ? 'Это не заметки. Это выгравированные команды, мысли и обеты, которые должны остаться в поле зрения.' : 'These are not sticky notes. They are engraved commands, thoughts, and vows that should remain in view.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={clearAll} className="rounded-[14px] border border-[#7A1F2430] bg-[#7A1F240D] p-3 text-[#C05A60]"><Eraser className="h-4 w-4" /></button>
            <div className="flex gap-2 rounded-[16px] border border-white/8 bg-[#171717] p-2">
              {COLORS.map((c, i) => (
                <button key={c.id} onClick={() => addNote(i)} className={`h-8 w-8 rounded-full border ${c.bg} ${c.border}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative flex-1 overflow-hidden"
        onTouchMove={(e) => {
          if (draggingId && e.touches.length === 1) {
            e.preventDefault();
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={() => {
          document.body.style.overflow = '';
          setDraggingId(null);
        }}
      >
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 0.8px, transparent 0.8px)', backgroundSize: '22px 22px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,155,94,0.05),transparent_38%)]" />

        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#B89B5E28] bg-[#B89B5E10]">
                <ScrollText className="h-10 w-10 text-[#D8C18E]" />
              </div>
              <div className="font-ritual text-3xl text-[#F2F1EE]">{isRU ? 'Высеки первую мысль.' : 'Carve the first thought.'}</div>
              <div className="mt-3 text-sm text-[#7F7A72]">{isRU ? 'Выбери цвет и создай скрижаль.' : 'Choose a color and create a scroll.'}</div>
            </div>
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className={`sticker-note absolute flex flex-col overflow-hidden rounded-[18px] border shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-transform ${note.color} ${
              draggingId === note.id ? 'scale-[1.02] cursor-grabbing z-50' : 'cursor-grab'
            }`}
            style={{ left: note.x, top: note.y, width: note.width, height: note.isMinimized ? 48 : note.height, zIndex: note.zIndex }}
            onMouseDown={(e) => {
              if ((e.target as Element).closest('.drag-handle')) startDrag(e.clientX, e.clientY, note, e.target as Element);
              else bringToFront(note.id);
            }}
            onTouchStart={(e) => {
              if ((e.target as Element).closest('.drag-handle') && e.touches.length === 1) {
                document.body.style.overflow = 'hidden';
                startDrag(e.touches[0].clientX, e.touches[0].clientY, note, e.target as Element);
              } else {
                bringToFront(note.id);
              }
            }}
          >
            <div className="drag-handle relative flex h-11 items-center justify-between px-3">
              <div className="absolute inset-0 bg-black/5" />
              <div className="relative flex items-center gap-2 text-[#5f5540]">
                <GripHorizontal className="h-4 w-4" />
              </div>
              <div className="relative flex items-center gap-1">
                <button onClick={() => toggleMinimize(note.id)} className="rounded p-1 text-[#5f5540] hover:bg-black/10">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeNote(note.id)} className="rounded p-1 text-[#5f5540] hover:bg-black/10">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {!note.isMinimized && (
              <textarea
                value={note.content}
                onChange={(e) => updateNoteContent(note.id, e.target.value)}
                placeholder={isRU ? 'Высекай мысль...' : 'Carve the thought...'}
                className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-6 text-[#3d3728] outline-none placeholder:text-[#7c7258]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickerBoard;
