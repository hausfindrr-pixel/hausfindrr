-- Add link field to user_notifications
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Push subscriptions (one row per browser + device)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          TEXT         NOT NULL PRIMARY KEY,
  user_id     TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT         NOT NULL UNIQUE,
  p256dh      TEXT         NOT NULL,
  auth        TEXT         NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Notification settings (one row per user, upserted on first access)
CREATE TABLE IF NOT EXISTS notification_settings (
  id                    TEXT        NOT NULL PRIMARY KEY,
  user_id               TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_messages         BOOLEAN     NOT NULL DEFAULT TRUE,
  push_verification     BOOLEAN     NOT NULL DEFAULT TRUE,
  push_listings         BOOLEAN     NOT NULL DEFAULT TRUE,
  email_verification    BOOLEAN     NOT NULL DEFAULT TRUE,
  email_listing_updates BOOLEAN     NOT NULL DEFAULT FALSE,
  prompt_dismissed_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
