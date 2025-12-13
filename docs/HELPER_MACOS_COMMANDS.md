
Crazy commands
To run that rust blocker helper locally you need to give it sudo access 
```bash
sudo target/release/blocker_helper check
Password:
ROOT_OK
> sudo target/release/blocker_helper check
> target/release/blocker_helper check
NOT_ROOT (euid = 501)
> target/release/blocker_helper block "[example.com"]
Unknown command: block
Usage:
  site_blocker_helper check
  site_blocker_helper apply '["example.com","youtube.com"]'
  site_blocker_helper clear
> target/release/blocker_helper apply "[example.com"]
apply error: expected value at line 1 column 2
> target/release/blocker_helper apply "['example.com']"
apply error: expected value at line 1 column 2
> target/release/blocker_helper apply '["example.com"]'
apply error: Permission denied (os error 13)
> sudo target/release/blocker_helper apply '["example.com"]'

> sudo chown root:wheel /usr/local/bin/blocker_helper
> sudo chmod 4755 /usr/local/bin/blocker_helper

> blocker_helper
Usage:
  site_blocker_helper check
  site_blocker_helper apply '["example.com","youtube.com"]'
  site_blocker_helper clear
> blocker_helper check
ROOT_OK
```

Build 
```bash
cargo build --release

# path where it is build: ./target/release/<service-folder>
```

```bash
finalDomains = computed from DB
lastDomains  = read from DB.last_state

IF finalDomains != lastDomains:
    → always call helper.apply(finalDomains)
    → update last_state.finalDomains
ELSE:
    → verify /etc/hosts marker block matches finalDomains
        IF mismatch → helper.apply(finalDomains)
        ELSE → do nothing
```