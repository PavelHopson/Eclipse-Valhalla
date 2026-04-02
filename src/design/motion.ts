/**
 * Eclipse Valhalla — Motion System
 *
 * Movement language: heavy, controlled, deliberate.
 * No bounce. No playfulness. Weight and precision.
 */

// ═══════════════════════════════════════════
// DURATIONS
// ═══════════════════════════════════════════

export const duration = {
  instant:  '100ms',
  fast:     '150ms',
  default:  '250ms',
  medium:   '350ms',
  slow:     '500ms',
  dramatic: '700ms',
} as const;

// ═══════════════════════════════════════════
// EASING CURVES
// ═══════════════════════════════════════════

export const easing = {
  /** Standard — smooth deceleration */
  default:    'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Enter — element appearing */
  enter:      'cubic-bezier(0, 0, 0.2, 1)',
  /** Exit — element leaving */
  exit:       'cubic-bezier(0.4, 0, 1, 1)',
  /** Heavy — controlled, weighted feel */
  heavy:      'cubic-bezier(0.7, 0, 0.3, 1)',
  /** Sharp — precise snap */
  sharp:      'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// ═══════════════════════════════════════════
// COMPOSED TRANSITIONS
// ═══════════════════════════════════════════

export const transition = {
  /** Hover state changes */
  hover:        `${duration.fast} ${easing.default}`,
  /** Color/opacity micro-transitions */
  color:        `color ${duration.fast} ${easing.default}, background-color ${duration.fast} ${easing.default}, border-color ${duration.fast} ${easing.default}`,
  /** Element appearing (cards, panels) */
  appear:       `opacity ${duration.default} ${easing.enter}, transform ${duration.default} ${easing.enter}`,
  /** Element disappearing */
  disappear:    `opacity ${duration.fast} ${easing.exit}, transform ${duration.fast} ${easing.exit}`,
  /** Modal opening */
  modal:        `opacity ${duration.medium} ${easing.enter}, transform ${duration.medium} ${easing.heavy}`,
  /** Widget movement */
  widget:       `box-shadow ${duration.default} ${easing.default}`,
  /** Quest completion */
  complete:     `opacity ${duration.slow} ${easing.exit}, transform ${duration.slow} ${easing.heavy}, filter ${duration.slow} ${easing.exit}`,
  /** Toast sliding in */
  toast:        `transform ${duration.default} ${easing.enter}, opacity ${duration.fast} ${easing.enter}`,
  /** Glow pulse */
  glow:         `box-shadow ${duration.dramatic} ${easing.default}`,
  /** Size changes */
  size:         `width ${duration.medium} ${easing.heavy}, height ${duration.medium} ${easing.heavy}`,
} as const;

// ═══════════════════════════════════════════
// TAILWIND UTILITY CLASSES
// ═══════════════════════════════════════════

export const motion = {
  /** Fade in from below (cards, panels) */
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
  /** Fade in from above (toasts) */
  fadeInDown: 'animate-in fade-in slide-in-from-top-2 duration-200',
  /** Fade in place */
  fadeIn: 'animate-in fade-in duration-200',
  /** Scale in (modals) */
  scaleIn: 'animate-in fade-in zoom-in-95 duration-300',
  /** Slide in from bottom (mobile modals) */
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  /** Quest completion — dissolve */
  dissolve: 'transition-all duration-500 opacity-0 scale-95 blur-sm',
  /** Hover lift */
  hoverLift: 'transition-transform duration-150 hover:-translate-y-0.5',
  /** Active press */
  activePress: 'active:scale-[0.98] transition-transform duration-100',
  /** Subtle pulse for critical items */
  criticalPulse: 'animate-pulse',
} as const;

// ═══════════════════════════════════════════
// CSS KEYFRAMES (inject into global styles)
// ═══════════════════════════════════════════

export const keyframes = `
  @keyframes eclipse-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(93, 174, 255, 0.05); }
    50% { box-shadow: 0 0 40px rgba(93, 174, 255, 0.12); }
  }

  @keyframes void-breathe {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  @keyframes quest-complete {
    0% { opacity: 1; transform: scale(1); filter: blur(0); }
    50% { opacity: 0.5; transform: scale(0.98); filter: blur(1px); }
    100% { opacity: 0; transform: scale(0.95); filter: blur(4px); }
  }

  @keyframes critical-glow {
    0%, 100% { box-shadow: 0 0 15px rgba(139, 0, 0, 0.15); }
    50% { box-shadow: 0 0 30px rgba(139, 0, 0, 0.3); }
  }

  @keyframes sigil-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
