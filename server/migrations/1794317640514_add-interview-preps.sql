-- Up Migration

CREATE TABLE interview_preps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  guidance JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX interview_preps_user_created_idx ON interview_preps (user_id, created_at DESC);

-- Down Migration

DROP TABLE interview_preps;
