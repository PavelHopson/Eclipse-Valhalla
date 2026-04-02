// Eclipse Valhalla — Widget System Entry Point

export type { WidgetState, WidgetType, WidgetPriority, WidgetPosition, WidgetSize } from './widgetTypes';
export { DEFAULT_WIDGET_SIZES, PRIORITY_GLOW, PRIORITY_BORDER, ESCALATION_GLOW, isDesktop } from './widgetTypes';
export { useWidgetStore } from './widgetStore';
export { spawnQuestWidget, spawnFocusWidget, syncWidgetsWithQuests, onQuestCompleted, cleanupOrphanedWidgets } from './widgetManager';
export { createDragContext, calculateDragPosition, clampToViewport, findNonOverlappingPosition } from './widgetEngine';
export { WidgetRenderer } from './widgetRenderer';
