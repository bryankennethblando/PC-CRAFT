-- Fictional development data only. Apply once after 001_initial to a fresh development DB.
-- Users are disabled. Passwords were random, hashed with bcrypt, and discarded.
-- No usable credentials, raw tokens, or login sessions are seeded.
SET time_zone = '+00:00';
START TRANSACTION;
INSERT INTO users (user_id, first_name, last_name, email, password_hash, role, account_status) VALUES
(1, 'Alex', 'Example', 'admin@example.invalid', '$2b$12$Fx5mc3VBDFbmj5ge7aiPWOXZKcec8LnNMaeqYnfzuPvtWhXaHHSKq', 'admin', 'disabled'),
(2, 'Sam', 'Example', 'learner@example.invalid', '$2b$12$6Sbo0iJcu6OrTsQXVBaJBOGxkZCF4CUn5gPjPbgLhVq2rC8hnCqKm', 'learner', 'disabled');
INSERT INTO modules (module_id, title, summary, status, created_by, published_at) VALUES
(1, 'PC safety basics', 'Prepare a safe workspace before handling components.', 'published', 1, CURRENT_TIMESTAMP);
INSERT INTO lessons (lesson_id, module_id, title, content, status) VALUES
(1, 1, 'Disconnect power', 'Shut down the computer, unplug external power, and follow the equipment service instructions before opening the case.', 'published');
INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, completed_at) VALUES
(2, 1, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO quizzes (quiz_id, module_id, title, status, created_by) VALUES
(1, 1, 'Workspace safety check', 'published', 1);
INSERT INTO quiz_questions (question_id, quiz_id, question_text) VALUES
(1, 1, 'What should you do before opening the computer case?');
INSERT INTO quiz_choices (choice_id, question_id, choice_text, is_correct, sort_order) VALUES
(1, 1, 'Shut down and disconnect external power.', TRUE, 1),
(2, 1, 'Leave the computer running.', FALSE, 2);
INSERT INTO quiz_attempts (attempt_id, user_id, quiz_id, attempt_number, score, max_score, passed, submitted_at) VALUES
(1, 2, 1, 1, 1, 1, TRUE, CURRENT_TIMESTAMP);
INSERT INTO quiz_answers (quiz_id, attempt_id, question_id, selected_choice_id, is_correct, points_awarded) VALUES
(1, 1, 1, 1, TRUE, 1);
INSERT INTO simulation_scenarios (scenario_id, name, scenario_type, description, status, created_by) VALUES
(1, 'Loose memory module', 'troubleshooting', 'The simulated PC cannot complete POST.', 'published', 1);
INSERT INTO scenario_steps (step_id, scenario_id, step_order, prompt, action_type, expected_action, feedback_correct, feedback_incorrect, configuration_json) VALUES
(1, 1, 1, 'Power is already disconnected. Inspect the memory seating.', 'inspect', 'inspect_ram', 'The memory latch is open.', 'Inspect the memory module first.', JSON_OBJECT('component', 'ram'));
INSERT INTO troubleshooting_attempts (attempt_id, user_id, scenario_id, status, score, completed_at) VALUES
(1, 2, 1, 'completed', 1, CURRENT_TIMESTAMP);
INSERT INTO troubleshooting_responses (scenario_id, attempt_id, step_id, chosen_action, is_correct) VALUES
(1, 1, 1, 'inspect_ram', TRUE);
INSERT INTO assembly_attempts (assembly_attempt_id, user_id, mode, build_state_json, compatibility_status) VALUES
(1, 2, 'assembly', JSON_OBJECT('version', 1, 'parts', JSON_ARRAY()), 'incomplete'),
(2, 2, 'disassembly', JSON_OBJECT('version', 1, 'parts', JSON_ARRAY()), 'incomplete');
INSERT INTO system_feedback (user_id, category, rating, message, status, reviewed_by, admin_note) VALUES
(2, 'lesson', 4, 'Fictional feedback: add a workspace illustration.', 'in_review', 1, 'Development review example.');
INSERT INTO system_logs (user_id, event_type, action, metadata_json) VALUES
(NULL, 'development_seed', 'Loaded fictional development content', JSON_OBJECT('seed', '001_development')),
(1, 'content_published', 'Published PC safety basics', NULL);
COMMIT;
