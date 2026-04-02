/**
 * Eclipse Valhalla — Universal State Components
 *
 * Consistent loading, empty, error, and success states across the product.
 * Every screen should use these instead of ad-hoc inline states.
 */

import React from 'react';
import { Loader2, Inbox, AlertTriangle, CheckCircle, RefreshCw, Plus } from 'lucide-react';

// ═══════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

export const LoadingState: React.FC<LoadingProps> = ({ message = 'Loading...', size = 'md', inline = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const textSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        <Loader2 className={`${sizes[size]} text-[#5DAEFF] animate-spin`} />
        <span className={`${textSizes[size]} text-[#55556A]`}>{message}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className={`${sizes[size]} text-[#5DAEFF] animate-spin mb-3`} />
      <p className={`${textSizes[size]} text-[#55556A]`}>{message}</p>
    </div>
  );
};

// ═══════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════

interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-12 h-12 rounded-xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center mb-4">
      {icon || <Inbox className="w-5 h-5 text-[#3A3A4A]" />}
    </div>
    <h3 className="text-sm font-semibold text-[#8888A0] mb-1">{title}</h3>
    {description && <p className="text-xs text-[#3A3A4A] max-w-xs">{description}</p>}
    {actionLabel && onAction && (
      <button onClick={onAction}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#5DAEFF10] text-[#5DAEFF] border border-[#5DAEFF25] rounded-lg text-xs font-medium hover:bg-[#5DAEFF15] transition-colors">
        <Plus className="w-3.5 h-3.5" />{actionLabel}
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════

interface ErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorProps> = ({ title = 'Something went wrong.', message, onRetry, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#FF444408] border border-[#FF444415] rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5 text-[#FF4444] shrink-0" />
        <span className="text-xs text-[#FF4444]">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-auto text-[10px] text-[#FF4444] hover:text-[#FF6666] font-medium">Retry</button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FF444408] border border-[#FF444415] flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-[#FF4444]" />
      </div>
      <h3 className="text-sm font-semibold text-[#E8E8F0] mb-1">{title}</h3>
      <p className="text-xs text-[#55556A] max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1F1F2B] border border-[#2A2A3C] rounded-lg text-xs text-[#8888A0] hover:text-[#E8E8F0] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />Retry
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// SUCCESS STATE
// ═══════════════════════════════════════════

interface SuccessProps {
  title?: string;
  message: string;
  compact?: boolean;
}

export const SuccessState: React.FC<SuccessProps> = ({ title, message, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#4ADE8008] border border-[#4ADE8015] rounded-lg">
        <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
        <span className="text-xs text-[#4ADE80]">{message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#4ADE8008] border border-[#4ADE8015] flex items-center justify-center mb-4">
        <CheckCircle className="w-5 h-5 text-[#4ADE80]" />
      </div>
      {title && <h3 className="text-sm font-semibold text-[#E8E8F0] mb-1">{title}</h3>}
      <p className="text-xs text-[#55556A] max-w-xs">{message}</p>
    </div>
  );
};
