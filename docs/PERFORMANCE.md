# Performance

## Current Metrics

| Metric | Value |
|--------|-------|
| Vite build | ~4 seconds |
| TypeScript check | ~3 seconds |
| Initial bundle (main) | ~290 KB (gzipped ~57 KB) |
| Largest chunk (recharts) | ~383 KB (gzipped ~106 KB) |
| Total build output | ~1.2 MB (gzipped ~400 KB) |
| Code splitting | ✓ (lazy routes) |

## Code Splitting

All heavy views are lazy-loaded:
```typescript
const Dashboard = lazy(() => import('./components/Dashboard'));
const OracleView = lazy(() => import('./components/OracleView'));
const NewsView = lazy(() => import('./components/NewsView'));
const WorkoutView = lazy(() => import('./components/WorkoutView'));
// ... 10+ lazy-loaded components
```

## Rendering

| Optimization | Status |
|-------------|--------|
| React 19 | ✓ (automatic batching) |
| Lazy loading | ✓ (all views) |
| Suspense boundaries | ✓ |
| Widget render isolation | ✓ (Zustand selectors) |
| Debounced auto-save | ✓ (500ms) |

## Data Layer

| Optimization | Status |
|-------------|--------|
| localStorage reads | Synchronous, instant |
| Cloud sync | Async, non-blocking |
| News pipeline | Parallel fetch (batches of 5) |
| Widget state | Zustand with selective subscriptions |
| Auto-save safety net | `beforeunload` event |

## Potential Bottlenecks

| Area | Risk | Mitigation |
|------|------|------------|
| Recharts bundle | 383 KB | Consider lighter chart lib or conditional import |
| localStorage 5MB limit | At ~500 news items | Trim old items, move to IndexedDB |
| RSS fetch latency | 15s timeout per source | Parallel batches, scheduler staggers |
| Gemini API latency | 2-5s per request | Loading states, non-blocking UI |
| Widget re-renders | On drag (60fps) | Direct DOM position (no React re-render during drag) |
| Large quest lists | >500 items | Consider virtualization (react-window) |

## Optimization Roadmap

### Short Term
- Move news storage from localStorage to IndexedDB
- Add react-window for quest lists >100 items
- Lazy-load recharts only on stats views

### Medium Term
- Service Worker caching for API responses
- Background sync with periodic queue
- Web Worker for news pipeline processing

### Long Term
- Server-side ingestion (remove client-side fetch entirely)
- CDN for news images
- Edge caching for Supabase queries
