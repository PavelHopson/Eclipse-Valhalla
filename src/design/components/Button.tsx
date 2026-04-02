import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'oracle';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:   'bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] font-semibold shadow-[0_0_15px_rgba(93,174,255,0.2)] hover:shadow-[0_0_25px_rgba(93,174,255,0.3)]',
  secondary: 'bg-[#7A5CFF] hover:bg-[#6B4DEE] text-white font-semibold shadow-[0_0_15px_rgba(122,92,255,0.2)]',
  ghost:     'bg-transparent hover:bg-[#1F1F2B] text-[#8888A0] hover:text-[#E8E8F0] border border-[#2A2A3C] hover:border-[#3A3A52]',
  danger:    'bg-[#8B0000] hover:bg-[#A00000] text-white font-semibold shadow-[0_0_15px_rgba(139,0,0,0.2)]',
  oracle:    'bg-[#4ADE80] hover:bg-[#3ACF70] text-[#0A0A0F] font-semibold shadow-[0_0_15px_rgba(74,222,128,0.2)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 active:scale-[0.97]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `.trim()}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
