-- MySQL 8.0.16+ / InnoDB. Apply once to an empty, externally selected database.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

CREATE TABLE users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('learner','admin','super_admin') NOT NULL DEFAULT 'learner',
  account_status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL,
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_status_role (account_status, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_sessions (
  session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  UNIQUE KEY uq_session_token_hash (token_hash),
  KEY ix_sessions_presence (revoked_at, expires_at, last_seen_at),
  KEY ix_sessions_user (user_id),
  CONSTRAINT ck_session_hash CHECK (token_hash REGEXP '^[0-9a-f]{64}$'),
  CONSTRAINT ck_session_expiry CHECK (expires_at > created_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modules (
  module_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  summary TEXT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  KEY ix_modules_status_order (status, sort_order),
  CONSTRAINT fk_modules_creator FOREIGN KEY (created_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lessons (
  lesson_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_lessons_module_order (module_id, sort_order),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lesson_progress (
  progress_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress_user_lesson (user_id, lesson_id),
  KEY ix_progress_lesson_status (lesson_id, status),
  CONSTRAINT ck_progress_dates CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quizzes (
  quiz_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT NULL,
  pass_mark DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_quizzes_module_status (module_id, status),
  CONSTRAINT ck_quiz_pass_mark CHECK (pass_mark BETWEEN 0 AND 100),
  CONSTRAINT fk_quizzes_module FOREIGN KEY (module_id) REFERENCES modules(module_id),
  CONSTRAINT fk_quizzes_creator FOREIGN KEY (created_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quiz_questions (
  question_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('single_choice') NOT NULL DEFAULT 'single_choice',
  points DECIMAL(7,2) NOT NULL DEFAULT 1.00,
  sort_order INT NOT NULL DEFAULT 0,
  KEY ix_questions_quiz_order (quiz_id, sort_order),
  UNIQUE KEY uq_question_quiz (question_id, quiz_id),
  CONSTRAINT ck_question_points CHECK (points > 0),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quiz_choices (
  choice_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  KEY ix_choices_question_order (question_id, sort_order),
  UNIQUE KEY uq_choice_question (choice_id, question_id),
  CONSTRAINT ck_choice_correct CHECK (is_correct IN (0, 1)),
  CONSTRAINT fk_choices_question FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quiz_attempts (
  attempt_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  quiz_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  score DECIMAL(8,2) NULL,
  max_score DECIMAL(8,2) NULL,
  passed BOOLEAN NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  UNIQUE KEY uq_attempt_number (user_id, quiz_id, attempt_number),
  KEY ix_attempts_user_date (user_id, started_at),
  KEY ix_attempts_quiz_date (quiz_id, started_at),
  UNIQUE KEY uq_attempt_quiz (attempt_id, quiz_id),
  CONSTRAINT ck_attempt_number CHECK (attempt_number > 0),
  CONSTRAINT ck_attempt_score CHECK ((score IS NULL OR score >= 0) AND (max_score IS NULL OR max_score > 0) AND (score IS NULL OR (max_score IS NOT NULL AND score <= max_score))),
  CONSTRAINT ck_attempt_passed CHECK (passed IS NULL OR passed IN (0, 1)),
  CONSTRAINT ck_attempt_dates CHECK (submitted_at IS NULL OR submitted_at >= started_at),
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE quiz_answers (
  quiz_id BIGINT UNSIGNED NOT NULL,
  answer_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  selected_choice_id BIGINT UNSIGNED NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  UNIQUE KEY uq_answer_attempt_question (attempt_id, question_id),
  CONSTRAINT ck_answer_points CHECK (points_awarded >= 0),
  CONSTRAINT ck_answer_correct CHECK (is_correct IN (0, 1)),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id, quiz_id) REFERENCES quiz_attempts(attempt_id, quiz_id) ON DELETE RESTRICT,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id, quiz_id) REFERENCES quiz_questions(question_id, quiz_id),
  CONSTRAINT fk_answers_choice FOREIGN KEY (selected_choice_id, question_id) REFERENCES quiz_choices(choice_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE simulation_scenarios (
  scenario_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  scenario_type ENUM('troubleshooting','maintenance') NOT NULL,
  description TEXT NULL,
  difficulty ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_scenarios_type_status (scenario_type, status),
  CONSTRAINT fk_scenarios_creator FOREIGN KEY (created_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE scenario_steps (
  step_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  scenario_id BIGINT UNSIGNED NOT NULL,
  step_order INT NOT NULL,
  prompt TEXT NOT NULL,
  action_type VARCHAR(60) NOT NULL,
  expected_action VARCHAR(120) NOT NULL,
  feedback_correct TEXT NOT NULL,
  feedback_incorrect TEXT NOT NULL,
  configuration_json JSON NULL,
  UNIQUE KEY uq_scenario_step_order (scenario_id, step_order),
  UNIQUE KEY uq_step_scenario (step_id, scenario_id),
  CONSTRAINT ck_step_order CHECK (step_order > 0),
  CONSTRAINT fk_steps_scenario FOREIGN KEY (scenario_id) REFERENCES simulation_scenarios(scenario_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE troubleshooting_attempts (
  attempt_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  scenario_id BIGINT UNSIGNED NOT NULL,
  status ENUM('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  score DECIMAL(8,2) NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  KEY ix_trouble_attempt_user_date (user_id, started_at),
  KEY ix_trouble_attempt_scenario (scenario_id, status),
  UNIQUE KEY uq_trouble_attempt_scenario (attempt_id, scenario_id),
  CONSTRAINT ck_trouble_score CHECK (score IS NULL OR score >= 0),
  CONSTRAINT ck_trouble_dates CHECK (completed_at IS NULL OR completed_at >= started_at),
  CONSTRAINT fk_trouble_attempt_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_trouble_attempt_scenario FOREIGN KEY (scenario_id) REFERENCES simulation_scenarios(scenario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE troubleshooting_responses (
  scenario_id BIGINT UNSIGNED NOT NULL,
  response_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  step_id BIGINT UNSIGNED NOT NULL,
  chosen_action VARCHAR(120) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_data_json JSON NULL,
  responded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_responses_attempt (attempt_id),
  CONSTRAINT ck_response_correct CHECK (is_correct IN (0, 1)),
  CONSTRAINT fk_responses_attempt FOREIGN KEY (attempt_id, scenario_id) REFERENCES troubleshooting_attempts(attempt_id, scenario_id) ON DELETE RESTRICT,
  CONSTRAINT fk_responses_step FOREIGN KEY (step_id, scenario_id) REFERENCES scenario_steps(step_id, scenario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE assembly_attempts (
  assembly_attempt_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  mode ENUM('assembly','disassembly') NOT NULL,
  status ENUM('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  build_state_json JSON NOT NULL,
  compatibility_status ENUM('compatible','incompatible','incomplete') NULL,
  compatibility_report_json JSON NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  KEY ix_assembly_user_date (user_id, started_at),
  CONSTRAINT ck_assembly_dates CHECK (completed_at IS NULL OR completed_at >= started_at),
  CONSTRAINT fk_assembly_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE system_feedback (
  feedback_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(60) NOT NULL,
  rating TINYINT UNSIGNED NULL,
  message TEXT NOT NULL,
  status ENUM('open','in_review','resolved') NOT NULL DEFAULT 'open',
  reviewed_by BIGINT UNSIGNED NULL,
  admin_note TEXT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  KEY ix_feedback_status_date (status, submitted_at),
  KEY ix_feedback_user_date (user_id, submitted_at),
  CONSTRAINT ck_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT ck_feedback_dates CHECK (resolved_at IS NULL OR resolved_at >= submitted_at),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_feedback_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE system_logs (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  action VARCHAR(160) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id VARCHAR(80) NULL,
  level ENUM('info','warning','error') NOT NULL DEFAULT 'info',
  metadata_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_logs_date (created_at),
  KEY ix_logs_user_date (user_id, created_at),
  KEY ix_logs_type_level_date (event_type, level, created_at),
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE schema_migrations (
  version VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO schema_migrations (version) VALUES ('001_initial');

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
