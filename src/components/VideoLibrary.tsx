/**
 * Eclipse Valhalla — Video Library
 * Personal training video collection with upload, tags, and inline playback
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import { desktop } from '../services/desktopBridge';
import {
  Plus, X, Play, Trash2, Film, Tag, Search,
  Dumbbell, Target, ArrowUp, Footprints, Flame, StretchHorizontal,
} from 'lucide-react';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface VideoItem {
  id: string;
  title: string;
  url: string;                // file:///path or YouTube URL
  category: VideoCategory;
  addedAt: string;
  duration?: string;          // e.g. "15:30"
  notes?: string;
}

type VideoCategory = 'all_body' | 'abs' | 'back' | 'legs' | 'arms' | 'stretch' | 'running' | 'other';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const V = {
  bg0: '#0A0A0F', bg1: '#0C0C14', bg2: '#12121A', bg3: '#1A1A26', bg4: '#1F1F2B',
  text: '#E8E8F0', textSec: '#8888A0', textTer: '#55556A', textDis: '#3A3A4A',
  border: '#1E1E2E', borderL: '#2A2A3C',
  accent: '#5DAEFF', orange: '#FF6B35', gold: '#D8C18E', success: '#4ADE80', danger: '#FF4444',
};

const CATEGORIES: { id: VideoCategory; icon: React.ReactNode; en: string; ru: string; color: string }[] = [
  { id: 'all_body', icon: <Dumbbell className="w-3.5 h-3.5" />, en: 'Full Body', ru: 'Всё тело', color: V.orange },
  { id: 'abs',      icon: <Target className="w-3.5 h-3.5" />,   en: 'Abs & Core', ru: 'Пресс', color: '#FF4444' },
  { id: 'back',     icon: <ArrowUp className="w-3.5 h-3.5" />,  en: 'Back & Posture', ru: 'Спина', color: '#4ADE80' },
  { id: 'legs',     icon: <Footprints className="w-3.5 h-3.5" />,en: 'Legs', ru: 'Ноги', color: '#FBBF24' },
  { id: 'arms',     icon: <Dumbbell className="w-3.5 h-3.5" />, en: 'Arms & Chest', ru: 'Руки и грудь', color: '#5DAEFF' },
  { id: 'stretch',  icon: <StretchHorizontal className="w-3.5 h-3.5" />, en: 'Stretch', ru: 'Растяжка', color: '#9B8FD8' },
  { id: 'running',  icon: <Flame className="w-3.5 h-3.5" />,    en: 'Cardio & Run', ru: 'Кардио и бег', color: '#FF6B35' },
  { id: 'other',    icon: <Film className="w-3.5 h-3.5" />,     en: 'Other', ru: 'Другое', color: V.textSec },
];

const STORAGE_KEY = 'eclipse_video_library';

function loadLibrary(): VideoItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLibrary(items: VideoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getThumbnail(url: string): string | null {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(url) || url.startsWith('file:');
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

interface VideoLibraryProps {
  onSelectVideo?: (url: string) => void;  // callback to attach video to a routine
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ onSelectVideo }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [videos, setVideos] = useState<VideoItem[]>(loadLibrary);
  const [filter, setFilter] = useState<VideoCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  // Add form
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<VideoCategory>('all_body');
  const [newDuration, setNewDuration] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = useMemo(() => {
    let list = filter === 'all' ? videos : videos.filter(v => v.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q));
    }
    return list;
  }, [videos, filter, search]);

  const update = (updated: VideoItem[]) => {
    setVideos(updated);
    saveLibrary(updated);
  };

  const addVideo = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const item: VideoItem = {
      id: generateId(),
      title: newTitle.trim(),
      url: newUrl.trim(),
      category: newCategory,
      addedAt: new Date().toISOString(),
      duration: newDuration.trim() || undefined,
      notes: newNotes.trim() || undefined,
    };
    update([item, ...videos]);
    setNewTitle('');
    setNewUrl('');
    setNewCategory('all_body');
    setNewDuration('');
    setNewNotes('');
    setIsAdding(false);
  };

  const deleteVideo = (id: string) => {
    if (!confirm(isRu ? 'Удалить видео?' : 'Delete video?')) return;
    update(videos.filter(v => v.id !== id));
  };

  const pickFile = async () => {
    if (desktop.isDesktop) {
      try {
        const result: any = await desktop.pickVideoFile();
        if (!result.canceled && result.fileUrl) {
          setNewUrl(result.fileUrl);
          if (!newTitle && result.fileUrl) {
            const name = result.fileUrl.split('/').pop()?.split('\\').pop()?.replace(/\.[^.]+$/, '') || '';
            setNewTitle(name);
          }
        }
      } catch {}
    } else {
      // Web fallback: file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setNewUrl(url);
          if (!newTitle) setNewTitle(file.name.replace(/\.[^.]+$/, ''));
        }
      };
      input.click();
    }
  };

  const getCat = (id: VideoCategory) => CATEGORIES.find(c => c.id === id)!;

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold" style={{ color: V.text }}>
            {isRu ? 'Видеотека' : 'Video Library'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: V.textTer }}>
            {videos.length} {isRu ? 'видео' : 'videos'}
          </p>
        </div>
        <button onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
          style={{ backgroundColor: V.orange, color: V.bg0, boxShadow: `0 4px 12px ${V.orange}30` }}>
          <Plus className="w-4 h-4" />
          {isRu ? 'Добавить' : 'Add Video'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: V.textDis }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={isRu ? 'Поиск видео...' : 'Search videos...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
          style={filter === 'all'
            ? { backgroundColor: V.gold, color: V.bg0 }
            : { backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.textTer }
          }>
          {isRu ? 'Все' : 'All'} ({videos.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = videos.filter(v => v.category === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setFilter(cat.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              style={filter === cat.id
                ? { backgroundColor: cat.color, color: V.bg0 }
                : { backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.textTer }
              }>
              {cat.icon}
              {isRu ? cat.ru : cat.en}
              {count > 0 && <span className="opacity-60 ml-0.5">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Add modal */}
      {isAdding && (
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold" style={{ color: V.text }}>
              {isRu ? 'Добавить видео' : 'Add Video'}
            </h4>
            <button onClick={() => setIsAdding(false)} style={{ color: V.textDis }}><X className="w-5 h-5" /></button>
          </div>

          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder={isRu ? 'Название видео' : 'Video title'}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />

          <div className="flex gap-2">
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder={isRu ? 'YouTube URL или путь к файлу' : 'YouTube URL or file path'}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
            <button onClick={pickFile}
              className="px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"
              style={{ backgroundColor: `${V.accent}15`, color: V.accent, border: `1px solid ${V.accent}20` }}>
              {isRu ? 'Файл' : 'Browse'}
            </button>
          </div>

          {/* Category selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: V.textTer }}>
              {isRu ? 'Категория' : 'Category'}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                  style={newCategory === cat.id
                    ? { backgroundColor: cat.color, color: V.bg0 }
                    : { backgroundColor: V.bg3, color: V.textTer }
                  }>
                  {cat.icon}
                  {isRu ? cat.ru : cat.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={newDuration} onChange={e => setNewDuration(e.target.value)}
              placeholder={isRu ? 'Длительность (15:30)' : 'Duration (15:30)'}
              className="px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
            <input value={newNotes} onChange={e => setNewNotes(e.target.value)}
              placeholder={isRu ? 'Заметки' : 'Notes'}
              className="px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
          </div>

          {/* Preview */}
          {newUrl && getThumbnail(newUrl) && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${V.border}` }}>
              <img src={getThumbnail(newUrl)!} alt="Preview" className="w-full h-32 object-cover" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold" style={{ color: V.textTer }}>
              {isRu ? 'Отмена' : 'Cancel'}
            </button>
            <button onClick={addVideo} disabled={!newTitle.trim() || !newUrl.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-30"
              style={{ backgroundColor: V.orange, color: V.bg0 }}>
              {isRu ? 'Добавить' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Video grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((video, i) => {
            const cat = getCat(video.category);
            const thumbnail = getThumbnail(video.url);
            const isDirect = isDirectVideo(video.url);

            return (
              <div key={video.id}
                className="rounded-2xl overflow-hidden group cursor-pointer transition-all hover:translate-y-[-2px] workout-card-enter"
                style={{ backgroundColor: V.bg3, border: `1px solid ${V.borderL}`, animationDelay: `${i * 0.05}s`, opacity: 0 }}
                onClick={() => setPlayingVideo(video)}>

                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: V.bg1 }}>
                  {thumbnail ? (
                    <img src={thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-10 h-10" style={{ color: V.textDis }} />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: V.orange, boxShadow: `0 4px 20px ${V.orange}50` }}>
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
                      {video.duration}
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold"
                    style={{ backgroundColor: `${cat.color}CC`, color: 'white' }}>
                    {cat.icon}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="text-xs font-bold leading-tight line-clamp-2" style={{ color: V.text }}>
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-medium" style={{ color: V.textDis }}>
                      {isDirect ? '📁 ' : '🌐 '}{new Date(video.addedAt).toLocaleDateString()}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteVideo(video.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: V.textDis }}
                      onMouseEnter={e => { e.currentTarget.style.color = V.danger; }}
                      onMouseLeave={e => { e.currentTarget.style.color = V.textDis; }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Film className="w-12 h-12 mx-auto mb-4" style={{ color: V.textDis }} />
          <p className="font-semibold" style={{ color: V.textTer }}>
            {isRu ? 'Нет видео' : 'No videos'}
          </p>
          <p className="text-sm mt-1" style={{ color: V.textDis }}>
            {isRu ? 'Добавь тренировочные видео с YouTube или со своего ПК' : 'Add training videos from YouTube or your PC'}
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-4xl mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base" style={{ color: V.text }}>{playingVideo.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: `${getCat(playingVideo.category).color}20`, color: getCat(playingVideo.category).color }}>
                    {getCat(playingVideo.category).icon}
                    {isRu ? getCat(playingVideo.category).ru : getCat(playingVideo.category).en}
                  </span>
                  {playingVideo.duration && (
                    <span className="text-[10px] font-mono" style={{ color: V.textDis }}>{playingVideo.duration}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setPlayingVideo(null)}
                className="p-2 rounded-xl transition-colors" style={{ color: V.textSec }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Player */}
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${V.borderL}` }}>
              {getYouTubeId(playingVideo.url) ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(playingVideo.url)}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <video src={playingVideo.url} controls autoPlay className="w-full aspect-video bg-black" />
              )}
            </div>

            {/* Notes */}
            {playingVideo.notes && (
              <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}` }}>
                <p className="text-xs" style={{ color: V.textSec }}>{playingVideo.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
