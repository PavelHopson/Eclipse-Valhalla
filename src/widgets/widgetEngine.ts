/**
 * Eclipse Valhalla — Widget Engine
 *
 * Low-level widget interaction: drag, snap, boundaries, z-index.
 * Pure functions — no React, no state mutation.
 */

import { WidgetPosition, WidgetSize } from './widgetTypes';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SNAP_THRESHOLD = 12;    // px — snap to edge when within this distance
const EDGE_PADDING   = 8;     // px — minimum distance from viewport edge
const SNAP_GRID      = 0;     // 0 = no grid snap, >0 = snap to grid size

// ═══════════════════════════════════════════
// DRAG CALCULATION
// ═══════════════════════════════════════════

export interface DragContext {
  startMouseX: number;
  startMouseY: number;
  startWidgetX: number;
  startWidgetY: number;
}

/**
 * Creates a drag context when user starts dragging.
 */
export function createDragContext(
  mouseX: number,
  mouseY: number,
  widgetPosition: WidgetPosition
): DragContext {
  return {
    startMouseX: mouseX,
    startMouseY: mouseY,
    startWidgetX: widgetPosition.x,
    startWidgetY: widgetPosition.y,
  };
}

/**
 * Calculate new position during drag, with boundary clamping.
 */
export function calculateDragPosition(
  mouseX: number,
  mouseY: number,
  ctx: DragContext,
  widgetSize: WidgetSize,
  viewportWidth: number,
  viewportHeight: number
): WidgetPosition {
  const deltaX = mouseX - ctx.startMouseX;
  const deltaY = mouseY - ctx.startMouseY;

  let x = ctx.startWidgetX + deltaX;
  let y = ctx.startWidgetY + deltaY;

  // Grid snap
  if (SNAP_GRID > 0) {
    x = Math.round(x / SNAP_GRID) * SNAP_GRID;
    y = Math.round(y / SNAP_GRID) * SNAP_GRID;
  }

  // Edge snap
  x = snapToEdge(x, widgetSize.w, viewportWidth);
  y = snapToEdge(y, widgetSize.h, viewportHeight);

  // Clamp to viewport boundaries
  x = clamp(x, EDGE_PADDING, viewportWidth - widgetSize.w - EDGE_PADDING);
  y = clamp(y, EDGE_PADDING, viewportHeight - widgetSize.h - EDGE_PADDING);

  return { x, y };
}


// ═══════════════════════════════════════════
// SNAP LOGIC
// ═══════════════════════════════════════════

function snapToEdge(pos: number, size: number, viewportDim: number): number {
  // Snap to left/top edge
  if (pos < SNAP_THRESHOLD + EDGE_PADDING) {
    return EDGE_PADDING;
  }
  // Snap to right/bottom edge
  if (pos + size > viewportDim - SNAP_THRESHOLD - EDGE_PADDING) {
    return viewportDim - size - EDGE_PADDING;
  }
  return pos;
}


// ═══════════════════════════════════════════
// BOUNDARY
// ═══════════════════════════════════════════

/**
 * Ensure widget stays within viewport after a resize event.
 */
export function clampToViewport(
  position: WidgetPosition,
  size: WidgetSize,
  viewportWidth: number,
  viewportHeight: number
): WidgetPosition {
  return {
    x: clamp(position.x, EDGE_PADDING, Math.max(EDGE_PADDING, viewportWidth - size.w - EDGE_PADDING)),
    y: clamp(position.y, EDGE_PADDING, Math.max(EDGE_PADDING, viewportHeight - size.h - EDGE_PADDING)),
  };
}


// ═══════════════════════════════════════════
// Z-INDEX MANAGEMENT
// ═══════════════════════════════════════════

/**
 * Get the next z-index for bringing a widget to front.
 */
export function getNextZIndex(currentWidgets: { zIndex: number }[]): number {
  if (currentWidgets.length === 0) return 100;
  return Math.max(...currentWidgets.map(w => w.zIndex)) + 1;
}


// ═══════════════════════════════════════════
// OVERLAP DETECTION
// ═══════════════════════════════════════════

export function isOverlapping(
  a: { position: WidgetPosition; size: WidgetSize },
  b: { position: WidgetPosition; size: WidgetSize }
): boolean {
  return !(
    a.position.x + a.size.w < b.position.x ||
    b.position.x + b.size.w < a.position.x ||
    a.position.y + a.size.h < b.position.y ||
    b.position.y + b.size.h < a.position.y
  );
}

/**
 * Find a non-overlapping position for a new widget.
 */
export function findNonOverlappingPosition(
  size: WidgetSize,
  existingWidgets: { position: WidgetPosition; size: WidgetSize }[],
  viewportWidth: number,
  viewportHeight: number
): WidgetPosition {
  const candidate = { position: { x: 60, y: 60 }, size };

  for (let attempt = 0; attempt < 20; attempt++) {
    const pos: WidgetPosition = {
      x: 60 + attempt * 30,
      y: 60 + attempt * 20,
    };

    const isBlocked = existingWidgets.some(w =>
      isOverlapping({ position: pos, size }, w)
    );

    if (!isBlocked) {
      return clampToViewport(pos, size, viewportWidth, viewportHeight);
    }
  }

  // Fallback: random position
  return clampToViewport(
    {
      x: 60 + Math.random() * (viewportWidth - size.w - 120),
      y: 60 + Math.random() * (viewportHeight - size.h - 120),
    },
    size,
    viewportWidth,
    viewportHeight
  );
}


// ═══════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
