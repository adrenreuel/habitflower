-- v1.1 / v1.2 social schema. NOT APPLIED YET: move into migrations/ when
-- friends ship. Kept here so v1 tables are designed to accept it:
-- users.username, habits.group_id, check-in photo audience in check_ins.data.

-- Friend requests and friendships. user_a < user_b so each pair has one row.
CREATE TABLE friendships (
  user_a        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        text NOT NULL CHECK (status IN ('pending', 'accepted')),
  requested_by  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  close_friend_a boolean NOT NULL DEFAULT false,
  close_friend_b boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE blocks (
  blocker    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker, blocked)
);

CREATE TABLE reports (
  id          bigserial PRIMARY KEY,
  reporter    uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user uuid REFERENCES users(id) ON DELETE SET NULL,
  target_post uuid,
  reason      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Photos live in S3; uploads use presigned PUT URLs issued per photo.
CREATE TABLE photos (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_id uuid NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  s3_key      text NOT NULL UNIQUE,
  audience    text NOT NULL CHECK (audience IN ('same', 'close', 'me')),
  uploaded_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Updates feed: photo check-ins and finished shared tasks.
CREATE TABLE posts (
  id         uuid PRIMARY KEY,
  author_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('photo', 'task')),
  habit_id   uuid,
  check_in_id uuid,
  task_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_author ON posts (author_id, created_at DESC);

CREATE TABLE reactions (
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('love', 'fire', 'sparkle', 'watered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Grow together (v1.2).
CREATE TABLE groups (
  id         uuid PRIMARY KEY,
  habit_id   uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE group_members (
  group_id  uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at   timestamptz,
  PRIMARY KEY (group_id, user_id)
);
CREATE TABLE nudges (
  from_user uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id  uuid NOT NULL,
  day       date NOT NULL,
  PRIMARY KEY (from_user, to_user, habit_id, day)
);

-- Expo push tokens for social notifications (Expo push service).
CREATE TABLE push_tokens (
  token      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform   text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
