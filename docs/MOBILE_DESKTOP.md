# Mobile & Desktop

## Platform Matrix

| Feature | Web | Electron | iOS | Android |
|---------|-----|----------|-----|---------|
| Quest management | ✓ | ✓ | ✓ | ✓ |
| Widget overlay | CSS only | System-level | Inline | Inline |
| System tray | — | ✓ | — | — |
| Native notifications | Browser API | Electron API | Capacitor | Capacitor |
| Always-on-top | — | ✓ | — | — |
| Click-through | — | ✓ | — | — |
| Auto-start | — | ✓ | — | — |
| Focus mini-mode | — | ✓ | — | — |
| Haptics | — | — | ✓ | ✓ |
| Cloud sync | ✓ | ✓ | ✓ | ✓ |

## Electron Architecture

```
main.js          Entry point, lifecycle, IPC registration
windowManager.js  Overlay mode, focus mode, opacity, tray
tray.js           System tray icon, context menu
autoUpdater.js    GitHub Releases auto-update
preload.js        contextBridge → window.valhalla (15 methods)
ipc/widget.js     7 widget IPC channels
ipc/system.js     6 system IPC channels
```

### Security
- `contextIsolation: true`
- `nodeIntegration: false`
- Only `contextBridge.exposeInMainWorld` for renderer access

## Capacitor Architecture

```
mobileBridge.ts   Platform detection, Capacitor API wrappers
useMobile.ts      React hook (platform, screen size, orientation)
mobileLayout.ts   Navigation config, spacing, widget rules
mobileConfig.ts   Capability detection
```

### Mobile Navigation
Primary: Dashboard → Quests → Calendar → Oracle → Settings
Secondary (via drawer): Stickers, Workouts, Image, TTS, Admin, Nexus

## Desktop Bridge

`desktopBridge.ts` abstracts Electron APIs:
```typescript
import { desktop } from './services/desktopBridge';

if (desktop.isDesktop) {
  await desktop.toggleOverlayMode(true);
  await desktop.showNotification(title, body);
}
// On web: all methods are no-ops
```

## Build Targets

```bash
npm run dist:win     # NSIS + Portable (.exe)
npm run dist:mac     # DMG (x64 + arm64)
npm run dist:linux   # AppImage + deb
npm run mobile:build # Vite build + Capacitor sync
```
