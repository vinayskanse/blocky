### Build DMG

```bash
hdiutil create Blocky.dmg \
  -volname "Blocky" \
  -srcfolder BlockyDMG \
  -ov \
  -format UDZO
```