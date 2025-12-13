
### Load the service
```bash
launchctl load ~/Library/LaunchAgents/com.blocker.scheduler.plist
# start immediately
launchctl start com.blocker.scheduler
```

### Check if it is running
```bash
launchctl list | grep com.blocker.scheduler
```

### Stop the service
```bash
launchctl stop com.blocker.scheduler
```

### Unload the service
```bash
launchctl unload ~/Library/LaunchAgents/com.blocker.scheduler.plist
# delete the file
rm ~/Library/LaunchAgents/com.blocker.scheduler.plist
```

To verify it really runs at startup:

Reboot your Mac

Immediately check:
```bash
launchctl list | grep com.blocker.scheduler
# for logs
tail -f ~/.blocker/scheduler.log
```