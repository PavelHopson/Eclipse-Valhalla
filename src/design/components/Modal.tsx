import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeMap: Record<string, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className={`relative w-full ${sizeMap[size]} bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300`}>
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0E0E16]/50">
            <h3 className="text-lg font-bold text-[#E8E8F0] tracking-wide">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1F1F2B] text-[#55556A] hover:text-[#8888A0] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#1E1E2E] bg-[#0E0E16]/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
