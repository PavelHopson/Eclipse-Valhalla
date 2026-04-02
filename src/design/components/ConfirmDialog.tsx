/**
 * Eclipse Valhalla — Confirm Dialog
 *
 * Professional confirmation for destructive actions.
 * Replaces browser confirm() with branded modal.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, onCancel,
}) => {
  if (!isOpen) return null;

  const colors = {
    danger:  { bg: 'bg-[#FF4444]', hover: 'hover:bg-[#E03B3B]', icon: '#FF4444', border: 'border-[#FF444420]' },
    warning: { bg: 'bg-[#FBBF24]', hover: 'hover:bg-[#E5AD1E]', icon: '#FBBF24', border: 'border-[#FBBF2420]' },
    default: { bg: 'bg-[#5DAEFF]', hover: 'hover:bg-[#4A9AEE]', icon: '#5DAEFF', border: 'border-[#5DAEFF20]' },
  }[variant];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#06060B]/85 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.border} bg-[#12121A] mb-4`}>
            <AlertTriangle className="w-5 h-5" style={{ color: colors.icon }} />
          </div>
          <h3 className="text-base font-bold text-[#E8E8F0] mb-1">{title}</h3>
          <p className="text-xs text-[#55556A] leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-[#1A1A2E]">
          <button onClick={onCancel}
            className="flex-1 py-3.5 text-xs font-medium text-[#55556A] hover:text-[#8888A0] hover:bg-[#12121A] transition-colors border-r border-[#1A1A2E]">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-3.5 text-xs font-bold text-[#E8E8F0] ${colors.bg} ${colors.hover} transition-colors`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
