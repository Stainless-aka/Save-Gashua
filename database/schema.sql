CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    email TEXT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    transfer_date TEXT NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'donor_reported' CHECK (status IN ('donor_reported', 'bank_reconciled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT NOT NULL UNIQUE,
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_published_created ON gallery_images (is_published, created_at DESC);
