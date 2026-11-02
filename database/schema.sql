CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    email TEXT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    transfer_date TEXT NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'donor_reported'
        CHECK (status IN ('donor_reported', 'bank_reconciled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);