-- Up Migration

CREATE TABLE cv_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id INTEGER REFERENCES cvs(id) ON DELETE SET NULL,
  cv_file_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  application_count INTEGER NOT NULL,
  skill_gap JSONB NOT NULL,
  evaluation JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cv_evaluations_tier_values CHECK (tier IN ('none', 'limited', 'full'))
);

CREATE INDEX cv_evaluations_user_created_idx ON cv_evaluations (user_id, created_at DESC);

-- Down Migration

DROP TABLE cv_evaluations;
