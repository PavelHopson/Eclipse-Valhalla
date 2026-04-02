# Deployment

---

## Prerequisites

- Node.js 18+
- Supabase project (for cloud mode)
- Gemini API key (for Oracle/Forge)

---

## Environment

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For cloud | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud | Supabase anon key |

Without Supabase vars: app runs in local-only guest mode.

---

## Web

```bash
npm run build
```

Deploy `dist/` to any static host: Vercel, Netlify, Cloudflare Pages.

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

Push to GitHub. Connect repo in Netlify dashboard.
Build command: `npm run build`
Publish directory: `dist`

---

## Desktop (Electron)

### Development

```bash
npm run electron:dev
```

### Build

```bash
npm run electron:build
```

Output: `dist-electron/` (Windows NSIS installer).

For macOS: build on macOS. For Linux: configure electron-builder.

---

## Mobile (Capacitor)

### Setup

```bash
npm run build
npx cap sync
```

### Android

```bash
npx cap open android
```

Build in Android Studio.

### iOS

```bash
npx cap open ios
```

Build in Xcode (requires macOS).

---

## Database

Run these SQL files in Supabase SQL Editor:

1. `SUPABASE_SCHEMA.sql` — Core tables (10)
2. `SUPABASE_PHASE6_NEWS_PUSH.sql` — News + Push tables (4)

All tables have RLS enabled. Policies enforce user-level access.

---

## Production Checklist

- [ ] Set production Supabase keys in `.env`
- [ ] Run both SQL schema files
- [ ] Verify RLS policies
- [ ] Configure Gemini API key in Settings UI
- [ ] Test auth flow (sign up → sign in → sign out)
- [ ] Test local → cloud migration
- [ ] Build and deploy web
- [ ] Build desktop installer
- [ ] Test on target platforms
