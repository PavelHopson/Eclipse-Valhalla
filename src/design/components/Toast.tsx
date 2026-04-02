/**
 * Eclipse Valhalla — Toast Notification System
 *
 * Lightweight, stackable, auto-dismiss notifications.
 * Replaces ad-hoc toast state in App.tsx.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Flame } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'xp';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

// ═══════════════════════════════════════════
// GLOBAL TOAST STATE
// ═══════════════════════════════════════════

let _toasts: ToastItem[] = [];
let _listeners: Set<() => void> = new Set();

function notify() { _listeners.forEach(fn => fn()); }

export function showToast(toast: Omit<ToastItem, 'id'>): string {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`;
  _toasts = [..._toasts, { ...toast, id }];
  if (_toasts.length > 5) _toasts = _toasts.slice(-5);
  notify();

  // Auto-dismiss
  setTimeout(() => { dismissToast(id); }, toast.duration || 4000);

  return id;
}

export function dismissToast(id: string): void {
  _toasts = _toasts.filter(t => t.id !== id);
  notify();
}

// Convenience shortcuts
export const toast = {
  success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => showToast({ type: 'error', title, message, duration: 6000 }),
  warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  xp: (title: string, message?: string) => showToast({ type: 'xp', title, message }),
};

// ═══════════════════════════════════════════
// TOAST CONTAINER (render in App)
// ═══════════════════════════════════════════

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const update = () => setToasts([..._toasts]);
    _listeners.add(update);
    return () => { _listeners.delete(update); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════
// TOAST CARD
// ═══════════════════════════════════════════

const ICONS: Record<ToastType, any> = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  xp: Flame,
};

const COLORS: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: { icon: '#4ADE80', border: '#4ADE8020', bg: '#4ADE8006' },
  error:   { icon: '#FF4444', border: '#FF444420', bg: '#FF444406' },
  warning: { icon: '#FBBF24', border: '#FBBF2420', bg: '#FBBF2406' },
  info:    { icon: '#5DAEFF', border: '#5DAEFF20', bg: '#5DAEFF06' },
  xp:      { icon: '#FFD700', border: '#FFD70020', bg: '#FFD70006' },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast: t, onDismiss }) => {
  const Icon = ICONS[t.type];
  const color = COLORS[t.type];

  return (
    <div className="pointer-events-auto bg-[#0C0C14] border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3.5 flex items-start gap-3 animate-in slide-in-from-right-2 duration-200"
      style={{ borderColor: color.border, backgroundColor: `#0C0C14` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}>
        <Icon className="w-4 h-4" style={{ color: color.icon }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-[#E8E8F0]">{t.title}</h4>
        {t.message && <p className="text-[10px] text-[#55556A] mt-0.5 leading-relaxed">{t.message}</p>}
      </div>
      <button onClick={onDismiss} className="p-0.5 text-[#3A3A4A] hover:text-[#55556A] shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
