-- Add import identities, lesson metadata, and per-item quiz publication.
ALTER TABLE modules
  ADD COLUMN source_key VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_modules_source_key (source_key);

ALTER TABLE lessons
  ADD COLUMN source_key VARCHAR(64) NULL,
  ADD COLUMN learning_objective TEXT NULL,
  ADD COLUMN reading_minutes SMALLINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_lessons_source_key (source_key),
  ADD CONSTRAINT ck_lessons_reading_minutes CHECK (reading_minutes > 0);

ALTER TABLE quizzes
  ADD COLUMN source_key VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_quizzes_source_key (source_key);

ALTER TABLE quiz_questions
  ADD COLUMN status ENUM('draft','published','archived') NOT NULL DEFAULT 'published';

ALTER TABLE quiz_choices
  ADD COLUMN status ENUM('draft','published','archived') NOT NULL DEFAULT 'published';

INSERT INTO schema_migrations (version) VALUES ('002_curriculum');
