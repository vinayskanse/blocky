CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    days TEXT NOT NULL,    -- JSON: ["Mon","Tue","Wed"]
    start TEXT NOT NULL,   -- "09:00"
    end TEXT NOT NULL,     -- "18:00"
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS last_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    last_domains TEXT NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO last_state (id, last_domains) VALUES (1, '[]');
