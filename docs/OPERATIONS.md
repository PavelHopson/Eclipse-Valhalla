# Operations

## Deployment

### Web
```bash
npm run build  # → dist/
# Deploy dist/ to Vercel, Netlify, or Cloudflare Pages
```

### Desktop
```bash
npm run dist:win    # → release/EclipseValhalla-*.exe
npm run dist:mac    # → release/EclipseValhalla-*.dmg
npm run dist:linux  # → release/EclipseValhalla-*.AppImage
```
Upload to GitHub Releases. Auto-updater fetches from there.

### Mobile
```bash
npm run mobile:build  # → dist/ + Capacitor sync
npx cap open android  # → Android Studio → Build APK/AAB
npx cap open ios      # → Xcode → Archive → TestFlight
```

## Release Process

```
1. Update version in package.json
2. npm run build (verify clean)
3. git tag v{version}
4. git push origin v{version}
5. npm run dist:all (build all platforms)
6. Create GitHub Release with assets
7. Auto-updater picks up for existing users
```

## Monitoring

### Current
- `logService.ts`: structured console logging
- `analyticsService.ts`: local event tracking
- Browser DevTools for debugging

### Recommended Additions
| Tool | Purpose | Priority |
|------|---------|----------|
| Sentry | Error tracking | High |
| Supabase Dashboard | DB monitoring | Available |
| Vercel Analytics | Web traffic | Medium |
| Posthog | Product analytics | Medium |
| UptimeRobot | Availability | Low |

## Database Maintenance

### Routine
- Check Supabase dashboard for slow queries
- Monitor storage usage (news_items grows fastest)
- Review RLS policy performance

### Cleanup Queries
```sql
-- Archive old news items (>30 days)
UPDATE news_items SET archived = true
WHERE fetched_at < NOW() - INTERVAL '30 days' AND NOT saved;

-- Remove orphaned widget configs
DELETE FROM widget_configs
WHERE quest_id NOT IN (SELECT id FROM quests);
```

## Incident Response

| Severity | Example | Response |
|----------|---------|----------|
| P0 | Auth broken, data loss | Immediate. Revert deploy. |
| P1 | Sync failing, ingestion down | Within 1 hour. Hotfix. |
| P2 | UI bug, feature broken | Within 24 hours. |
| P3 | Cosmetic, minor UX | Next release. |

## Support

### Current
- In-app feedback panel (FeedbackPanel.tsx)
- GitHub Issues for bug reports
- Feedback stored in localStorage (cloud-ready)

### Future
- Email support for Pro users
- In-app chat (Intercom/Crisp)
- Knowledge base / FAQ

## Backup Strategy

| Data | Backup |
|------|--------|
| Supabase DB | Supabase automatic daily backups (Pro plan) |
| User localStorage | Export function in Settings |
| Code | GitHub repository |
| Releases | GitHub Releases (permanent) |
