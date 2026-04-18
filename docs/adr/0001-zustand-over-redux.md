# ADR 0001 — Zustand over Redux for state management

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Project lead

## Context

Eclipse Valhalla is a personal operating system for execution, intelligence,
and discipline. It runs as a single-codebase React 19 application that
ships simultaneously as a web app, an Electron desktop app, and a Capacitor
mobile app (see `package.json` — `dist:win`, `dist:mac`, `dist:linux`,
`android:sync`, `ios:sync`).

The UI is feature-heavy. Concurrently in one view we keep:

- quest graph (active / planned / completed quests)
- widget overlay system — floating, lockable, escalating cards with
  z-index, opacity, blockers
- habits with streaks and ritual chains
- workouts, nutrition, intake logs
- oracle outputs (LLM-generated reflections)
- focus sessions and timers

All of this must survive:

- page reloads (this is a "personal OS" — losing state is unacceptable)
- platform switches (web → desktop → mobile must feel continuous)
- offline use (Capacitor mobile, Electron desktop)

We needed a state library that:

1. keeps state colocated with the feature that owns it (no giant root store)
2. persists selected slices to `localStorage` with zero ceremony
3. has near-zero runtime cost — this app has widgets re-rendering on drag
4. does not force a specific async pattern (we use `Promise` / `async`
   directly with Supabase + Gemini)
5. works fine inside Electron's renderer and inside a Capacitor WebView

## Decision

We use **[Zustand](https://github.com/pmndrs/zustand) 5.x** with its
`persist` middleware.

Every feature slice owns its store. The canonical example is
`src/widgets/widgetStore.ts` — a single `create<WidgetStoreState>()(persist(...))`
call that covers CRUD, positioning, z-index management, escalation, and
quest-scoped bulk operations. It writes to `localStorage` under the key
`eclipse-valhalla-widgets` with a `partialize` filter so only the
persistable fields travel across reloads.

We do not use any global root store. Each domain (widgets, quests, habits,
workouts, oracle) has its own store file. Cross-slice reads happen via
direct hook calls, not selectors against a monolith.

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Redux Toolkit | Mature, DevTools, time-travel, huge ecosystem, strong patterns | ~10KB gzip, reducer/slice/action boilerplate, middleware needed for persist, async handled via thunks/RTK-Query adds more surface | Too heavy for a product that is mostly local state. Boilerplate tax is paid on every new feature. We would spend engineering time writing slices and actions instead of product. |
| Jotai | Atomic model, very small, Suspense-friendly, good for fine-grained reactivity | Many atoms per feature → harder to reason about feature-level shape, persistence story split across `atomWithStorage` per atom | Widget system needs one coherent collection (`widgets: WidgetState[]`) with bulk ops (`removeByQuestId`, `clearAll`). Atoms would shatter that into per-widget atoms and complicate bulk transitions. |
| Recoil | Similar atomic model, Facebook-backed | Project momentum has stalled (no 1.0 in years), uncertain maintenance | Risk of betting on an unmaintained dep for a multi-year product. |
| Context + useReducer | Zero deps, idiomatic React | No cross-component perf optimization (context triggers full subtree re-render), no persist, no middleware chain, reducer boilerplate | Would force per-provider optimization (`useMemo`, splitting contexts). The widget store alone would be painful — drag updates re-render every consumer. |
| MobX | Observable objects, minimal boilerplate in class style | Pulls in a runtime, decorators / proxies feel non-idiomatic in functional React, TypeScript inference more work | Clashes with the rest of the codebase, which is pure functional React + hooks. |
| Valtio | Proxy-based, small | Same proxy-semantics friction as MobX, smaller community | Zustand's hook-based API matches our style; Valtio would be a stylistic outlier. |

## Consequences

### Positive

- **Bundle size.** Zustand is ~1KB gzip vs Redux Toolkit ~10KB. On mobile
  (Capacitor) and Electron first-paint this actually matters.
- **No boilerplate.** A new store is one `create(...)` call. No action
  creators, no reducer switch, no slice file.
- **Persistence is free.** Wrapping with `persist({ name, partialize })`
  is a single line. Compare to `redux-persist` which requires rehydration
  plumbing and a `PersistGate` component.
- **TypeScript inference works end-to-end.** The store interface is
  declared once (`WidgetStoreState`) and consumers get full typing at the
  hook call site.
- **Bulk operations are natural.** `removeByQuestId`, `getVisibleWidgets`,
  `clearAll` are plain methods on the store — not selectors, not thunks.
- **Same store file works on web, Electron, and Capacitor.** No platform
  branching. `localStorage` is available in all three runtimes.

### Negative

- **No Redux DevTools by default.** We can add the `devtools` middleware
  but it is not wired in yet. Debugging state over time relies on
  `console.log` in reducers or snapshots of `localStorage`.
- **No strict immutability enforcement.** Zustand allows direct set, so a
  careless contributor can mutate the draft. Our pattern uses the
  functional form (`set(state => ({ widgets: state.widgets.map(...) }))`)
  but there is no compiler-level guardrail.
- **No first-class async pattern.** Redux has `createAsyncThunk` /
  `RTK Query`. Zustand leaves async up to us. We mitigate this by keeping
  data fetching in `src/services/*` (Gemini, Supabase) and letting stores
  own only local state.
- **Persist schema drift risk.** If `WidgetState` shape changes, the data
  in `localStorage` becomes stale. We do not currently run migrations. A
  future version of the store will need a `version` + `migrate` function
  on `persist`.
- **Cross-store coordination is manual.** When a quest is deleted, we
  call `useWidgetStore.getState().removeByQuestId(questId)` from the
  quest store. This works but is an implicit coupling — a single
  "quest removed" event bus would be cleaner.

### Neutral

- **Testing story.** Zustand stores are testable via direct `getState()`
  calls and by calling setters. No different from testing Redux reducers
  in practice, just a different shape.
- **No middleware ecosystem to speak of.** For this app we do not miss
  it. If we later want logging, undo/redo, or optimistic mutations, we
  will have to write them ourselves or find a community middleware.
- **SSR is not a concern.** This is a SPA + Electron + Capacitor — no
  server rendering. Zustand's lack of strict SSR story does not affect
  us.

## Migration path if we outgrow this

The store interface (`WidgetStoreState` etc.) is the boundary. If Zustand
ever becomes the bottleneck (very unlikely given our workload), we could
swap the implementation file and leave consumers untouched — every hook
call is `useWidgetStore(selector)`, which any of the alternatives above
can match.

## References

- Source of truth: `src/widgets/widgetStore.ts`
- Zustand docs: https://zustand.docs.pmnd.rs/
- `persist` middleware: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
- Bundle comparison: https://bundlephobia.com/package/zustand vs
  https://bundlephobia.com/package/@reduxjs/toolkit
- Related: `docs/ARCHITECTURE_DEEP.md`, `docs/WIDGET_SYSTEM.md`
