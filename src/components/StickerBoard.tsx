
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { generateId } from '../utils';
import { Plus, X, GripHorizontal, Minus, Maximize2, Eraser } from 'lucide-react';
import { useLanguage } from '../i18n';

interface StickerBoardProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const COLORS = [
  { id: 'yellow', bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', header: 'bg-[#fcd34d]/30' },
  { id: 'blue', bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', header: 'bg-[#7dd3fc]/30' },
  { id: 'green', bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', header: 'bg-[#86efac]/30' },
  { id: 'pink', bg: 'bg-[#fce7f3]', border: 'border-[#fbcfe8]', header: 'bg-[#f9a8d4]/30' },
  { id: 'purple', bg: 'bg-[#f3e8ff]', border: 'border-[#e9d5ff]', header: 'bg-[#d8b4fe]/30' },
];

const StickerBoard: React.FC<StickerBoardProps> = ({ notes, setNotes }) => {
  const { t } = useLanguage();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const addNote = (colorIndex = 0) => {
    const color = COLORS[colorIndex];
    const newNote: Note = {
      id: generateId(),
      content: '',
      x: 60 + Math.random() * 100,
      y: 60 + Math.random() * 100,
      width: 240,
      height: 240,
      color: `${color.bg} ${color.border}`,
      zIndex: Math.max(0, ...notes.map(n => n.zIndex)) + 1,
      isMinimized: false
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if(confirm('Clear all sticky notes?')) setNotes([]);
  }

  const toggleMinimize = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isMinimized: !n.isMinimized } : n));
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(0, ...notes.map(n => n.zIndex));
    setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
  };

  // --- DRAG LOGIC (MOUSE & TOUCH) ---

  const startDrag = (clientX: number, clientY: number, note: Note, target: Element) => {
    if (!boardRef.current) return;
    const rect = target.closest('.sticker-note')?.getBoundingClientRect();
    if (!rect) return;

    setDraggingId(note.id);
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    bringToFront(note.id);
  };

  const moveDrag = (clientX: number, clientY: number) => {
     if (!draggingId || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const x = clientX - boardRect.left - dragOffset.x;
    const y = clientY - boardRect.top - dragOffset.y;

    setNotes(prev => prev.map(n =>
      n.id === draggingId ? { ...n, x, y } : n
    ));
  };

  const endDrag = () => {
    setDraggingId(null);
  };

  // MOUSE EVENTS
  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    startDrag(e.clientX, e.clientY, note, e.target as Element);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const handleMouseUp = () => endDrag();

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffset]);

  // TOUCH EVENTS
  const handleTouchStart = (e: React.TouchEvent, note: Note) => {
      if (e.touches.length !== 1) return;
      // Prevent scrolling body while dragging note
      document.body.style.overflow = 'hidden';
      startDrag(e.touches[0].clientX, e.touches[0].clientY, note, e.target as Element);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (draggingId && e.touches.length === 1) {
          // Prevent scrolling while dragging
          e.preventDefault();
          moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
  };

  const handleTouchEnd = () => {
      document.body.style.overflow = ''; // Restore scrolling
      endDrag();
  };

  return (
    <div
        className="h-full flex flex-col relative overflow-hidden bg-[#1A1A26] touch-none"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Toolbar */}
      <div className="p-4 flex justify-between items-center bg-[#1A1A26]/90 backdrop-blur border-b border-[#2A2A3C] z-10 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-[#E8E8F0]">{t('notes.title')}</h2>
            <p className="text-xs text-[#55556A]">{t('notes.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={clearAll}
            className="p-2 text-[#55556A] hover:text-[#FF4444] hover:bg-[#FF4444]/10 rounded-lg transition-colors"
            title={t('notes.clear')}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-[#2A2A3C] mx-2"></div>
          <div className="flex gap-2">
             {COLORS.map((c, i) => (
               <button
                 key={c.id}
                 onClick={() => addNote(i)}
                 className={`w-8 h-8 rounded-full ${c.bg} border-2 ${c.border} hover:scale-110 transition-transform shadow-sm`}
                 title="Add Note"
               />
             ))}
          </div>
        </div>
      </div>

      {/* Board Area */}
      <div ref={boardRef} className="flex-1 relative overflow-hidden">
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none select-none">
            <div className="text-center">
              <div className="w-32 h-32 border-4 border-dashed border-[#55556A] rounded-2xl mx-auto mb-6 flex items-center justify-center">
                 <Plus className="w-12 h-12 text-[#55556A]" />
              </div>
              <p className="text-xl font-bold text-[#55556A]">{t('notes.empty_title')}</p>
              <p className="text-[#55556A] mt-2">{t('notes.empty_desc')}</p>
            </div>
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className={`
              sticker-note absolute rounded-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border transition-transform
              ${note.color}
              ${draggingId === note.id ? 'cursor-grabbing scale-[1.02] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] z-50' : 'cursor-grab'}
            `}
            style={{
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.isMinimized ? 42 : note.height,
              zIndex: note.zIndex,
            }}
            onMouseDown={(e) => {
                if ((e.target as Element).closest('.drag-handle')) {
                    handleMouseDown(e, note);
                } else {
                    bringToFront(note.id);
                }
            }}
            onTouchStart={(e) => {
                if ((e.target as Element).closest('.drag-handle')) {
                    handleTouchStart(e, note);
                } else {
                    bringToFront(note.id);
                }
            }}
          >
            {/* Header / Drag Handle */}
            <div className="drag-handle h-10 flex items-center justify-between px-3 shrink-0 select-none group relative touch-none">
              {/* Subtle darken overlay for header area */}
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

              <GripHorizontal className="w-4 h-4 text-black/30 relative z-10" />

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMinimize(note.id); }}
                  className="p-1 text-[#55556A] hover:text-[#E8E8F0] hover:bg-[#E8E8F0]/10 rounded"
                >
                  {note.isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
                  className="p-1 text-[#55556A] hover:text-[#FF4444] hover:bg-[#E8E8F0]/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!note.isMinimized && (
              <textarea
                className="flex-1 bg-transparent p-4 outline-none resize-none text-[#E8E8F0] font-medium leading-relaxed text-sm placeholder:text-[#3A3A4A] font-handwriting"
                value={note.content}
                onChange={(e) => updateNoteContent(note.id, e.target.value)}
                placeholder={t('notes.placeholder')}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()} // Allow typing to focus properly
                spellCheck={false}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickerBoard;
