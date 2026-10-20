-- Up Migration

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  CONSTRAINT skills_key_unique UNIQUE (key)
);

CREATE TABLE application_skills (
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  importance TEXT NOT NULL,
  PRIMARY KEY (application_id, skill_id),
  CONSTRAINT application_skills_importance_values CHECK (
    importance IN ('required', 'nice_to_have')
  )
);

CREATE INDEX application_skills_skill_id_idx ON application_skills (skill_id);

CREATE TABLE cv_skills (
  cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  PRIMARY KEY (cv_id, skill_id)
);

CREATE INDEX cv_skills_skill_id_idx ON cv_skills (skill_id);

-- Down Migration

DROP TABLE cv_skills;
DROP TABLE application_skills;
DROP TABLE skills;
