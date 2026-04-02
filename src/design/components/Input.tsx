/**
 * Eclipse Valhalla — Professional Input Components
 *
 * Consistent form inputs with labels, validation, and error states.
 */

import React from 'react';

// ═══════════════════════════════════════════
// TEXT INPUT
// ═══════════════════════════════════════════

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider">{label}</label>
    )}
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 bg-[#0A0A0F] border rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none transition-all ${
        error ? 'border-[#FF444440] focus:border-[#FF4444]' : 'border-[#1E1E2E] focus:border-[#5DAEFF40]'
      } ${className}`}
    />
    {error && <p className="text-[10px] text-[#FF4444]">{error}</p>}
    {hint && !error && <p className="text-[10px] text-[#3A3A4A]">{hint}</p>}
  </div>
);

// ═══════════════════════════════════════════
// TEXTAREA
// ═══════════════════════════════════════════

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider">{label}</label>
    )}
    <textarea
      {...props}
      className={`w-full px-3.5 py-2.5 bg-[#0A0A0F] border rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none resize-none transition-all ${
        error ? 'border-[#FF444440] focus:border-[#FF4444]' : 'border-[#1E1E2E] focus:border-[#5DAEFF40]'
      } ${className}`}
    />
    {error && <p className="text-[10px] text-[#FF4444]">{error}</p>}
  </div>
);

// ═══════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-[10px] font-bold text-[#55556A] uppercase tracking-wider">{label}</label>
    )}
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] outline-none focus:border-[#5DAEFF40] transition-all appearance-none ${className}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ═══════════════════════════════════════════
// TOGGLE
// ═══════════════════════════════════════════

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 px-4 py-3 bg-[#0C0C14] border border-[#1A1A2E] rounded-xl hover:border-[#2A2A3C] transition-all text-left"
  >
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-[#E8E8F0]">{label}</div>
      {description && <div className="text-[10px] text-[#3A3A4A] mt-0.5">{description}</div>}
    </div>
    <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${checked ? 'bg-[#5DAEFF]' : 'bg-[#1E1E2E]'}`}>
      <div className={`w-4.5 h-4.5 rounded-full bg-[#E8E8F0] transition-transform ${checked ? 'translate-x-[18px]' : ''}`}
        style={{ width: 18, height: 18 }} />
    </div>
  </button>
);

// ═══════════════════════════════════════════
// FORM SECTION
// ═══════════════════════════════════════════

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-[#E8E8F0]">{title}</h3>
      {description && <p className="text-[10px] text-[#3A3A4A] mt-0.5">{description}</p>}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);
