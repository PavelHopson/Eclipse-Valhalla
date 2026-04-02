import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'hover' | 'glow' | 'danger' | 'raised' | 'glass';
  className?: string;
  onClick?: () => void;
}

const variants: Record<string, string> = {
  base:   'bg-[#1A1A26] border border-[#2A2A3C] rounded-xl',
  hover:  'bg-[#1A1A26] border border-[#2A2A3C] rounded-xl hover:border-[#3A3A52] hover:bg-[#1F1F2B] transition-all cursor-pointer',
  glow:   'bg-[#1A1A26] border border-[#5DAEFF30] rounded-xl shadow-[0_0_20px_rgba(93,174,255,0.08)]',
  danger: 'bg-[#1A1A26] border border-[#8B000040] rounded-xl',
  raised: 'bg-[#1F1F2B] border border-[#3A3A52] rounded-xl shadow-lg',
  glass:  'bg-[#12121A]/80 backdrop-blur-xl border border-[#2A2A3C] rounded-xl',
};

export const Card: React.FC<CardProps> = ({ children, variant = 'base', className = '', onClick }) => {
  return (
    <div className={`${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
