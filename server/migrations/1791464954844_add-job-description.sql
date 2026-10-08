-- Up Migration

ALTER TABLE applications
  ADD COLUMN job_description TEXT,
  ADD COLUMN jd_extraction JSONB;

-- Down Migration

ALTER TABLE applications
  DROP COLUMN jd_extraction,
  DROP COLUMN job_description;
