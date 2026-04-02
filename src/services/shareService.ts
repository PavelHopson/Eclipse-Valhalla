/**
 * Eclipse Valhalla — Share Service
 *
 * Generate shareable content: streak cards, discipline scores, insights.
 * Uses Canvas API to create image cards.
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface ShareCard {
  title: string;
  value: string;
  subtitle: string;
  accent: string;
}

// ═══════════════════════════════════════════
// GENERATE SHARE IMAGE
// ═══════════════════════════════════════════

/**
 * Generate a shareable image card via Canvas API.
 * Returns a data URL (PNG).
 */
export async function generateShareImage(card: ShareCard): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0A0A0F';
  ctx.fillRect(0, 0, 600, 340);

  // Subtle gradient
  const grad = ctx.createRadialGradient(300, 100, 50, 300, 170, 300);
  grad.addColorStop(0, `${card.accent}10`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 340);

  // Border
  ctx.strokeStyle = '#2A2A3C';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 599, 339);

  // Top accent line
  ctx.fillStyle = card.accent;
  ctx.fillRect(0, 0, 600, 2);

  // Brand
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.fillStyle = '#3A3A4A';
  ctx.textAlign = 'left';
  ctx.fillText('ECLIPSE VALHALLA', 30, 40);

  // Title
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillStyle = '#55556A';
  ctx.fillText(card.title, 30, 130);

  // Value
  ctx.font = 'bold 64px Inter, sans-serif';
  ctx.fillStyle = card.accent;
  ctx.fillText(card.value, 30, 210);

  // Subtitle
  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillStyle = '#8888A0';
  ctx.fillText(card.subtitle, 30, 250);

  // Watermark
  ctx.font = '500 10px Inter, sans-serif';
  ctx.fillStyle = '#1E1E2E';
  ctx.textAlign = 'right';
  ctx.fillText('eclipse-valhalla.app', 570, 320);

  return canvas.toDataURL('image/png');
}

// ═══════════════════════════════════════════
// PRESET CARDS
// ═══════════════════════════════════════════

export function createStreakCard(streak: number): ShareCard {
  return {
    title: 'DISCIPLINE STREAK',
    value: `${streak} days`,
    subtitle: streak >= 30 ? 'Legendary consistency.' : streak >= 7 ? 'Momentum building.' : 'Every day counts.',
    accent: '#FF6B35',
  };
}

export function createDisciplineCard(score: number): ShareCard {
  return {
    title: 'DISCIPLINE SCORE',
    value: `${score}`,
    subtitle: score >= 80 ? 'Operating at peak.' : score >= 50 ? 'Maintaining control.' : 'Room for improvement.',
    accent: score >= 80 ? '#4ADE80' : score >= 50 ? '#FBBF24' : '#FF4444',
  };
}

export function createLevelCard(level: number, xp: number): ShareCard {
  return {
    title: 'GLORY RANK',
    value: `Level ${level}`,
    subtitle: `${xp} XP earned through discipline.`,
    accent: level >= 10 ? '#FFD700' : level >= 5 ? '#7A5CFF' : '#5DAEFF',
  };
}

// ═══════════════════════════════════════════
// SHARE API
// ═══════════════════════════════════════════

/**
 * Share via Web Share API or download fallback.
 */
export async function shareCard(card: ShareCard): Promise<void> {
  const imageUrl = await generateShareImage(card);

  // Try Web Share API (mobile)
  if (typeof navigator.share === 'function') {
    try {
      const blob = await fetch(imageUrl).then(r => r.blob());
      const file = new File([blob], 'eclipse-valhalla.png', { type: 'image/png' });
      await navigator.share({
        title: `Eclipse Valhalla — ${card.title}`,
        text: `${card.value} — ${card.subtitle}`,
        files: [file],
      });
      return;
    } catch {
      // Fallback to download
    }
  }

  // Fallback: download
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = `eclipse-valhalla-${card.title.toLowerCase().replace(/\s+/g, '-')}.png`;
  a.click();
}
