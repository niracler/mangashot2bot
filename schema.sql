CREATE TABLE mangashot (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_updated_at
AFTER UPDATE ON mangashot
BEGIN
    UPDATE mangashot SET updated_at = CURRENT_TIMESTAMP WHERE rowid = NEW.rowid;
END;

-- INSERT INTO mangashot (id, title, photo_url, thumbnail_url, caption)
-- SELECT id, title, photo_url, thumbnail_url, caption
-- FROM photos;