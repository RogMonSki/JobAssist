-- Up Migration

ALTER TABLE cvs
  ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN skills_extraction JSONB,
  ADD COLUMN skills_extraction_status TEXT NOT NULL DEFAULT 'not_attempted',
  ADD CONSTRAINT cvs_skills_extraction_status_values CHECK (
    skills_extraction_status IN ('not_attempted', 'success', 'failed')
  );

UPDATE cvs
SET is_primary = true
WHERE id IN (
  SELECT DISTINCT ON (user_id) id
  FROM cvs
  ORDER BY user_id, uploaded_at, id
);

CREATE UNIQUE INDEX cvs_one_primary_per_user ON cvs (user_id) WHERE is_primary;

-- Down Migration

DROP INDEX cvs_one_primary_per_user;

ALTER TABLE cvs
  DROP CONSTRAINT cvs_skills_extraction_status_values,
  DROP COLUMN skills_extraction_status,
  DROP COLUMN skills_extraction,
  DROP COLUMN is_primary;
