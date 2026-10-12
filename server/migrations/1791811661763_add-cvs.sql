-- Up Migration

CREATE TABLE cvs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_data BYTEA NOT NULL,
  extracted_text TEXT,
  text_extraction_status TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cvs_mime_type_values CHECK (
    mime_type IN (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    )
  ),
  CONSTRAINT cvs_text_extraction_status_values CHECK (
    text_extraction_status IN ('success', 'failed')
  )
);

CREATE INDEX cvs_user_id_idx ON cvs (user_id);

-- Down Migration

DROP TABLE cvs;
