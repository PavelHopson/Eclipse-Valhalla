/**
 * Eclipse Valhalla — Onboarding Step Shell
 *
 * Reusable container for each onboarding step.
 */

import React from 'react';

interface OnboardingStepProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  children, step, totalSteps, title, subtitle, icon, accentColor = '#5DAEFF',
}) => {
  const progress = ((step) / totalSteps) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-0.5 bg-[#1E1E2E] w-full shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: accentColor }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto w-full">
        {/* Icon */}
        {icon && (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border"
            style={{ backgroundColor: `${accentColor}08`, borderColor: `${accentColor}25` }}
          >
            {icon}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-[#E8E8F0] text-center mb-1 tracking-wide">{title}</h2>
        {subtitle && <p className="text-sm text-[#55556A] text-center mb-8">{subtitle}</p>}

        {/* Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
