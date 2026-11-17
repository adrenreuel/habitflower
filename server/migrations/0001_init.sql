-- Habitflower v1 schema.
-- Synced tables keep the app's object as JSONB in `data` (same shape as the
-- app's SQLite rows), plus the columns the server needs for ownership,
-- last-write-wins and incremental pulls. New fields in v1.1/v1.2 only touch
-- `data`. Every user-owned row cascades on account delete.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id             uuid PRIMARY KEY,
  -- Unique, null until the user picks one for social features (v1.1).
  username       citext UNIQUE,
  username_changed_at timestamptz,
  avatar_seed    text NOT NULL DEFAULT '',
  -- Bumped to revoke all tokens (sign out everywhere).
  token_version  integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Apple / Google identities linked to an account. One identity backs one account.
CREATE TABLE identities (
  provider   text NOT NULL CHECK (provider IN ('apple', 'google')),
  subject    text NOT NULL,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject)
);
CREATE INDEX identities_user ON identities (user_id);

CREATE TABLE habits (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- v1.2 grow together; habits in a group are readable by its members.
  group_id          uuid,
  data              jsonb NOT NULL,
  updated_at        timestamptz NOT NULL,
  deleted_at        timestamptz,
  server_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX habits_pull ON habits (user_id, server_updated_at);

CREATE TABLE check_ins (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id          uuid NOT NULL,
  local_day         date NOT NULL,
  slot              smallint NOT NULL DEFAULT 0,
  data              jsonb NOT NULL,
  updated_at        timestamptz NOT NULL,
  deleted_at        timestamptz,
  server_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX check_ins_pull ON check_ins (user_id, server_updated_at);
CREATE INDEX check_ins_habit_day ON check_ins (habit_id, local_day);

CREATE TABLE pause_ranges (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id          uuid NOT NULL,
  data              jsonb NOT NULL,
  updated_at        timestamptz NOT NULL,
  deleted_at        timestamptz,
  server_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pause_ranges_pull ON pause_ranges (user_id, server_updated_at);

CREATE TABLE away_ranges (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data              jsonb NOT NULL,
  updated_at        timestamptz NOT NULL,
  deleted_at        timestamptz,
  server_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX away_ranges_pull ON away_ranges (user_id, server_updated_at);

CREATE TABLE tasks (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data              jsonb NOT NULL,
  updated_at        timestamptz NOT NULL,
  deleted_at        timestamptz,
  server_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_pull ON tasks (user_id, server_updated_at);

-- Feedback outlives the account on purpose (no user link kept after delete).
CREATE TABLE feedback (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
