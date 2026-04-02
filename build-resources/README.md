# Build Resources

Place platform icons here before building installers.

## Required files:

### Windows
- `icon.ico` — 256x256 multi-size ICO

### macOS
- `icon.icns` — 1024x1024 Apple ICNS format
- `dmg-background.png` — 540x380 DMG background image (dark theme)

### Linux
- `icons/` folder with PNG icons:
  - `16x16.png`
  - `32x32.png`
  - `48x48.png`
  - `64x64.png`
  - `128x128.png`
  - `256x256.png`
  - `512x512.png`

## Generate icons

From a 1024x1024 source PNG:

```bash
# macOS .icns (requires iconutil on macOS)
mkdir icon.iconset
sips -z 16 16   source.png --out icon.iconset/icon_16x16.png
sips -z 32 32   source.png --out icon.iconset/icon_16x16@2x.png
sips -z 128 128 source.png --out icon.iconset/icon_128x128.png
sips -z 256 256 source.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 source.png --out icon.iconset/icon_256x256.png
sips -z 512 512 source.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 source.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 source.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset

# Windows .ico (use ImageMagick or online converter)
convert source.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```
