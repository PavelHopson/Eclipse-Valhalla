# Code Signing & Notarization

Unsigned apps trigger security warnings. Signing is required for distribution.

---

## Windows

### Prerequisites
- EV or OV code signing certificate (DigiCert, Sectigo, etc.)
- `signtool.exe` (Windows SDK)

### Environment Variables
```bash
CSC_LINK=path/to/certificate.pfx
CSC_KEY_PASSWORD=your-password
```

electron-builder auto-detects these and signs during build.

### EV Certificate (Recommended)
Eliminates SmartScreen warnings immediately.
Cost: ~$300-500/year.

---

## macOS

### Prerequisites
- Apple Developer Account ($99/year)
- Developer ID Application certificate
- App-specific password for notarization

### Environment Variables
```bash
CSC_LINK=path/to/DeveloperID.p12
CSC_KEY_PASSWORD=your-password
APPLE_ID=your@apple.id
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

### Notarization
electron-builder handles notarization automatically when credentials are set.

Configuration already in package.json:
```json
"mac": {
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```

---

## Linux
No code signing required for AppImage/deb distribution.
Optional: GPG signing for package repositories.

---

## CI/CD Signing

For GitHub Actions:
1. Store certificates as repository secrets
2. Decode in build step
3. electron-builder picks up from env

```yaml
- name: Build
  env:
    CSC_LINK: ${{ secrets.CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
  run: npm run dist
```
