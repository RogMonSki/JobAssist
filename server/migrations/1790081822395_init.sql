-- Up Migration

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_shape CHECK (username ~ '^[A-Za-z0-9_]{3,30}$')
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (LOWER(email));
CREATE UNIQUE INDEX users_username_lower_idx ON users (LOWER(username));

CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  recruiter TEXT,
  source_website TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  applied_on DATE,
  extraction_status TEXT NOT NULL DEFAULT 'not_attempted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_values CHECK (
    status IN ('saved', 'applied', 'interview', 'offer', 'rejected')
  ),
  CONSTRAINT extraction_status_values CHECK (
    extraction_status IN ('not_attempted', 'success', 'failed')
  )
);

CREATE INDEX applications_user_id_idx ON applications (user_id);

CREATE TABLE status_history (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_history_status_values CHECK (
    status IN ('saved', 'applied', 'interview', 'offer', 'rejected')
  )
);

CREATE INDEX status_history_application_id_idx ON status_history (application_id);

-- Down Migration

DROP TABLE status_history;
DROP TABLE applications;
DROP TABLE users;
