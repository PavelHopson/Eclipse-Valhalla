import React from 'react';

interface WidgetShellProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
  noPadding?: boolean;
}

/**
 * Widget — base container for dashboard widgets and future floating widgets.
 * Dark glassmorphism with subtle glow accent.
 */
export const Widget: React.FC<WidgetShellProps> = ({
  children,
  title,
  icon,
  accentColor = '#5DAEFF',
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`
        bg-[#1A1A26]/90 backdrop-blur-md
        border border-[#2A2A3C] rounded-xl
        shadow-[0_4px_24px_rgba(0,0,0,0.3)]
        overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: `0 0 1px ${accentColor}15, 0 4px 24px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E2E]">
          {icon && <span style={{ color: accentColor }} className="shrink-0">{icon}</span>}
          <span className="text-xs font-bold uppercase tracking-widest text-[#8888A0]">{title}</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
        </div>
      )}

      {/* Body */}
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
};
