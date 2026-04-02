/**
 * Eclipse Valhalla — Sigil System
 *
 * Geometric micro-symbols that mark priority, status, and domain.
 * NOT real runes. Stylized geometric marks — cold, minimal, premium.
 *
 * Each sigil is a tiny SVG path string rendered at 12–20px.
 */

// ═══════════════════════════════════════════
// SIGIL PATHS (viewBox="0 0 16 16")
// ═══════════════════════════════════════════

export const sigilPaths = {
  // Priority sigils
  critical:  'M8 1L15 8L8 15L1 8Z',                              // Diamond
  high:      'M8 2L14 14H2Z',                                     // Triangle up
  medium:    'M3 3h10v10H3Z',                                     // Square
  low:       'M8 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z',             // Circle

  // Status sigils
  active:    'M4 8h8M8 4v8',                                      // Cross / plus
  completed: 'M3 8l4 4l6-8',                                      // Checkmark
  failed:    'M4 4l8 8M12 4l-8 8',                                // X mark
  pending:   'M8 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z M8 6v4 M8 12v0', // Circle with dot

  // Domain sigils
  quest:     'M8 1l2.5 5H15l-4 3.5 1.5 5.5L8 12l-4.5 3 1.5-5.5L1 6h4.5Z', // Star
  oracle:    'M8 2C4.5 2 2 5 2 8s2.5 6 6 6 6-2.7 6-6S11.5 2 8 2Zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z', // Eye / eclipse
  forge:     'M6 2v4L2 10v2h12v-2L10 6V2Z',                      // Anvil
  focus:     'M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M3.5 12.5l2-2M10.5 5.5l2-2', // Compass / sun
  discipline:'M8 1L1 5v6l7 4 7-4V5Z',                            // Hexagon / shield

  // Decorative
  eclipse:   'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 1.5a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1 0-9Z', // Ring
  void:      'M8 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z',               // Simple circle
  rune:      'M5 2v12M11 2v12M2 6h12M2 10h12',                   // Grid / hashtag rune
} as const;


// ═══════════════════════════════════════════
// SIGIL COLORS
// ═══════════════════════════════════════════

export const sigilColors = {
  // Priority
  critical:  '#FF4444',
  high:      '#DC2626',
  medium:    '#FBBF24',
  low:       '#5DAEFF',

  // Status
  active:    '#5DAEFF',
  completed: '#4ADE80',
  failed:    '#8B0000',
  pending:   '#55556A',

  // Domain
  quest:     '#5DAEFF',
  oracle:    '#4ADE80',
  forge:     '#7A5CFF',
  focus:     '#FBBF24',
  discipline:'#FFD700',

  // Decorative
  eclipse:   '#5DAEFF20',
  void:      '#2A2A3C',
  rune:      '#1E1E2E',
} as const;


// ═══════════════════════════════════════════
// SIGIL COMPONENT HELPER
// ═══════════════════════════════════════════

export type SigilName = keyof typeof sigilPaths;

/**
 * Get SVG props for a sigil. Use in an <svg><path d={...} /></svg>.
 */
export function getSigil(name: SigilName, size: number = 16) {
  return {
    path: sigilPaths[name],
    color: sigilColors[name] || '#55556A',
    size,
    viewBox: '0 0 16 16',
  };
}
