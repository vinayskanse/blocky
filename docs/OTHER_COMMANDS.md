### Build DMG

```bash
hdiutil create Blocky.dmg \
  -volname "Blocky" \
  -srcfolder BlockyDMG \
  -ov \
  -format UDZO
```

### Run Blocky.pkg to test directly

```bash
sudo installer -pkg Blocky.pkg -target /
```

### Check if the scheduler is running

```bash
sudo launchctl list | grep com.vinayskanse.blocky.scheduler
sudo launchctl print system/com.vinayskanse.blocky.scheduler
```

#### Check logs for scheduler
```bash
tail -f /var/log/blocky.log
tail -f /var/log/blocky.err
```