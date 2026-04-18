# ADR 0002 — Capacitor over React Native for mobile

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Project lead

## Context

Eclipse Valhalla already runs as:

- a **web app** (Vite + React 19, dev on `:5173`, prod build in `dist/`)
- an **Electron desktop app** for Windows / macOS / Linux — see the
  `dist:win`, `dist:mac`, `dist:linux` scripts and the `electron-builder`
  config in `package.json` (NSIS installer + portable for Windows, DMG
  for macOS, AppImage + deb for Linux)

The next platform was mobile. The product needs to be on phones because
the widget system, habits, focus sessions, and oracle prompts are most
valuable when the user has the app in their pocket during the day — not
just at a desk.

Key constraints:

- **One codebase.** The whole value proposition of this product depends
  on feature parity across web / desktop / mobile. Splitting into a
  separate mobile codebase would double the engineering cost and
  guarantee the platforms drift.
- **Reuse the UI.** We already have a polished React 19 + Tailwind 3
  design system (the "Eclipse Valhalla Design System" documented in
  `docs/ECLIPSE_VALHALLA_DESIGN_SYSTEM.md`). Throwing it away and rebuilding
  it in a different component library would be unacceptable.
- **Ship iOS and Android, not just one.** Product needs both stores.
- **Small team (one person).** We cannot maintain three UI stacks.
- **Limited native API surface.** Valhalla does not need deep native
  integrations. It needs: secure storage, notifications (planned),
  haptics (optional), file share (optional), and a WebView that renders
  the existing app. No camera, no AR, no complex hardware.
- **Budget for native: zero.** No Swift / Kotlin engineers on the team.

## Decision

We use **[Capacitor](https://capacitorjs.com/) 8.x** to wrap the existing
React web build as a native iOS and Android app.

This is visible in `package.json`:

```json
"dependencies": {
  "@capacitor/android": "latest",
  "@capacitor/core": "latest",
  "@capacitor/ios": "^8.3.0",
  ...
},
"devDependencies": {
  "@capacitor/cli": "latest",
  ...
},
"scripts": {
  "android:sync": "npx cap sync android",
  "android:open": "npx cap open android",
  "ios:sync": "npx cap sync ios",
  "ios:open": "npx cap open ios",
  "mobile:build": "npm run build && npx cap sync"
}
```

The same `dist/` produced by `vite build` becomes the web app, feeds
Electron's renderer process, and is copied into the iOS / Android
projects by `cap sync`.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| **React Native** | Native components (true `UIView` / `android.view.View`), best-in-class perf for pure-native UI, large ecosystem | Requires rewriting every screen in RN components (no HTML/CSS reuse), bridge complexity, Metro bundler is separate from Vite, RN version upgrades are historically painful, Tailwind story is second-class (nativewind is a workaround) | Kills the "one UI codebase" principle. We would maintain Valhalla's design system twice — once in Tailwind for web/Electron, once in StyleSheet/nativewind for RN. |
| **Flutter** | Single codebase, excellent perf, consistent rendering across platforms | Dart, not TypeScript. Would throw away the entire existing React 19 codebase and the design system. | Full rewrite. Not viable for a product already in v4.5. |
| **Expo (managed RN)** | Better RN DX, OTA updates, managed build pipeline | Inherits every React Native trade-off above, adds EAS lock-in, still requires RN component rewrite | Same core problem as RN: rewrites the UI. |
| **Separate native apps (Swift + Kotlin)** | Best possible native feel, platform-idiomatic | Three UI codebases (web/Electron, iOS, Android), triple the bug surface, requires platform specialists we do not have | Impossible at our team size. |
| **PWA only (no native wrapper)** | Literally zero work, just deploy the web app | No App Store / Play Store listing (iOS PWA install is discoverable by roughly nobody), no reliable background notifications on iOS, limited native storage guarantees, users perceive it as "a website" | We want store presence and the option of native APIs later. PWA alone is a ceiling we can already see. |
| **Ionic Framework (full)** | Built on top of Capacitor, provides mobile-styled UI components | We already have our own design system | We want Capacitor's native bridge, not Ionic's UI kit. Taking just Capacitor gets us exactly that. |

## Consequences

### Positive

- **Literal code reuse.** 100% of the React + Tailwind UI ships on
  mobile unchanged. Bug fixed once = fixed on web, desktop, and mobile.
- **Design system parity by construction.** There is no "mobile variant"
  of any component. The same `.tsx` files render everywhere.
- **Shipping speed.** Going from "works on web" to "installable APK" is
  `npm run mobile:build && npm run android:open` → build in Android
  Studio. Roughly one afternoon the first time, minutes after that.
- **Native APIs on demand.** When we need secure storage, notifications,
  or haptics, we add the specific Capacitor plugin (`@capacitor/preferences`,
  `@capacitor/local-notifications`, `@capacitor/haptics`) — not a whole
  toolchain migration.
- **Cheap to maintain.** Capacitor upgrades are handled as normal npm
  deps. Native project files (`ios/`, `android/`) rarely need touching.
- **Electron + Capacitor share the same mental model.** Both are "web
  app wrapped in a native shell with a bridge to native APIs". The team
  already thinks this way.

### Negative

- **WebView performance ceiling.** Capacitor renders through WKWebView
  (iOS) / Android WebView. A complex widget-overlay animation that is
  silky in Chrome desktop may stutter on a mid-range Android if we are
  sloppy with re-renders. We have to be disciplined about the Zustand
  store updates and avoid layout thrash.
- **Not "native feel" by default.** iOS users notice things like
  bounce scrolling, native nav transitions, real `UISwitch`. We do not
  get these free. We have to emulate them in CSS if we want them.
- **App Store review pain is still real.** Apple can and does reject
  "wrapper" apps that feel like a repackaged web page. We mitigate by
  ensuring the app has native integrations (notifications, Sign in with
  Apple if we add auth) and is not just a shell around a remote URL —
  the bundled `dist/` is what ships.
- **iOS build requires macOS.** For every App Store release we need
  access to Xcode. This is a CI / build-infra tax. (Android builds fine
  on any platform.)
- **WebView version skew.** Android WebView tracks Chrome and is updated
  via Play Services. iOS WKWebView is tied to the iOS version. We will
  occasionally see a CSS / JS feature that works on one and not the
  other, and have to polyfill or fall back.
- **Mobile-only interactions require extra work.** Pull-to-refresh,
  swipe-to-dismiss, long-press haptics — none of these are free. We
  build them on top of DOM events and CSS.

### Neutral

- **Native project files become part of the repo.** `android/` and
  `ios/` directories are committed (they are effectively generated
  projects with a few overrides). This adds to the repo size but is
  standard Capacitor practice.
- **Plugin ecosystem is smaller than React Native's.** It is more than
  adequate for us — core plugins cover all the native APIs we have
  actually wanted. For the very long tail, we might have to write a
  small native plugin, which Capacitor makes straightforward.
- **The story is "Web + Electron + Capacitor", not "pick a platform".**
  This is the correct mental model for this product. Each of the three
  wrappers is one thin adapter over the same React build.

## When we would reconsider

Signals that would force a re-evaluation:

- Performance hits a wall inside WebView that cannot be fixed with
  React / Tailwind optimization — e.g., the widget system jitters on
  real devices despite `transform`-only animations.
- App Store repeatedly rejects the build for "not enough native".
- A flagship feature requires deep native integration (low-latency
  audio, camera with real-time processing, background CPU work)
  that Capacitor plugins cannot deliver.

In that case the exit is predictable: the business logic is already in
`src/store`, `src/services`, etc., and can be reused. Only the
presentational layer would need a rewrite.

## References

- Capacitor docs: https://capacitorjs.com/docs
- `package.json` mobile scripts (`mobile:build`, `android:sync`, `ios:sync`)
- `capacitor.config.json`
- Related: `docs/MOBILE_DESKTOP.md`
- Electron counterpart: see `electron/main.js`
