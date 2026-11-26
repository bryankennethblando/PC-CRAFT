"""Run against MySQL 8.0.16+; creates and removes its own temporary database.

python3 database/tests/check_schema.py mysql --login-path=local
python3 database/tests/check_schema.py podman exec -i pc-craft-db-check mysql -uroot
"""
from pathlib import Path
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
CLIENT = sys.argv[1:] or ['mysql', '-u', 'root']
DATABASE = 'pc_craft_test_' + uuid.uuid4().hex


def sql(statement, error=None, database=DATABASE):
    command = CLIENT + ['--batch', '--skip-column-names']
    if database:
        command += [database]
    result = subprocess.run(command, input=statement, text=True, capture_output=True)
    if error is None:
        assert result.returncode == 0, result.stderr
    else:
        assert result.returncode != 0 and f'ERROR {error} ' in result.stderr, result.stderr or result.stdout
    return result.stdout.strip()


migrations = [file.read_text() for file in sorted((ROOT / 'migrations').glob('*.sql'))]
migration, curriculum, privacy = migrations
assert '\n'.join(migrations) == (ROOT / 'schema.sql').read_text(), 'Schema snapshot differs from migrations'
sql(f'CREATE DATABASE `{DATABASE}`', database=None)
try:
    sql(migration)
    assert sql('SELECT version FROM schema_migrations') == '001_initial'
    assert sql('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()') == '18'
    seed = (ROOT / 'seeds/001_development.sql').read_text()
    sql(seed)
    assert sql("SELECT COUNT(*) FROM users WHERE account_status='disabled' AND password_hash LIKE '$2b$%'") == '2'
    assert sql('SELECT COUNT(*) FROM user_sessions') == '0'
    assert sql('SELECT COUNT(*) FROM system_logs WHERE user_id IS NULL') == '1'
    sql(seed, 1062)  # Refuse repeat seeding rather than overwrite data.
    assert sql('SELECT COUNT(*) FROM users') == '2'
    sql(migration, 1050)  # Refuse reapplying the baseline.
    sql(curriculum)
    assert sql('SELECT version FROM schema_migrations ORDER BY version').splitlines() == ['001_initial', '002_curriculum']
    sql(privacy)
    assert sql('SELECT COUNT(*) FROM users') == '2'
    assert sql('SELECT COUNT(*) FROM privacy_consents') == '0'
    assert sql('SELECT version FROM schema_migrations ORDER BY version').splitlines()[-1] == '003_privacy_consent'
    sql("INSERT INTO privacy_consents (user_id, notice_version) VALUES (1,'1'),(1,'2')")
    sql("INSERT INTO privacy_consents (user_id, notice_version) VALUES (1,'2')", 1062)
    sql("INSERT INTO privacy_consents (user_id, notice_version) VALUES (999,'1')", 1452)
    assert sql('SELECT status FROM quiz_questions WHERE question_id=1') == 'published'
    assert sql('SELECT status FROM quiz_choices WHERE choice_id=1') == 'published'
    assert sql('SELECT COUNT(*) FROM quiz_attempts WHERE attempt_id=1') == '1'
    assert sql('SELECT source_key, learning_objective, reading_minutes FROM lessons WHERE lesson_id=1') == 'NULL\tNULL\tNULL'
    sql('UPDATE lessons SET reading_minutes=0 WHERE lesson_id=1', 3819)
    sql("UPDATE modules SET source_key='module-01' WHERE module_id=1")
    sql("INSERT INTO modules (title, created_by, source_key) VALUES ('Duplicate', 1, 'module-01')", 1062)
    sql("INSERT INTO quizzes (quiz_id,module_id,title,created_by) VALUES (2,1,'Other quiz',1)")
    sql("INSERT INTO quiz_questions (question_id,quiz_id,question_text) VALUES (2,2,'Other question'),(3,1,'Same quiz question')")
    sql("INSERT INTO quiz_choices (choice_id,question_id,choice_text) VALUES (3,2,'Other choice'),(4,3,'Same quiz other choice')")
    sql('INSERT INTO quiz_attempts (attempt_id,user_id,quiz_id,attempt_number) VALUES (2,2,1,2)')
    sql('INSERT INTO quiz_answers (quiz_id,attempt_id,question_id,selected_choice_id) VALUES (1,2,2,3)', 1452)
    sql('INSERT INTO quiz_answers (quiz_id,attempt_id,question_id,selected_choice_id) VALUES (2,2,2,3)', 1452)
    sql('INSERT INTO quiz_answers (quiz_id,attempt_id,question_id,selected_choice_id) VALUES (1,2,1,4)', 1452)
    sql('INSERT INTO quiz_answers (quiz_id,attempt_id,question_id,selected_choice_id) VALUES (1,2,1,NULL)')
    sql('INSERT INTO quiz_answers (quiz_id,attempt_id,question_id) VALUES (1,2,1)', 1062)
    sql('INSERT INTO quiz_attempts (user_id,quiz_id,attempt_number) VALUES (2,1,2)', 1062)
    sql('INSERT INTO lesson_progress (user_id,lesson_id) VALUES (2,1)', 1062)
    sql("INSERT INTO simulation_scenarios (scenario_id,name,scenario_type,created_by) VALUES (2,'Other scenario','troubleshooting',1)")
    sql("INSERT INTO scenario_steps (step_id,scenario_id,step_order,prompt,action_type,expected_action,feedback_correct,feedback_incorrect) VALUES (2,2,1,'Prompt','inspect','inspect_cpu','Yes','No')")
    sql("INSERT INTO troubleshooting_responses (scenario_id,attempt_id,step_id,chosen_action,is_correct) VALUES (1,1,2,'inspect_cpu',0)", 1452)
    sql("INSERT INTO troubleshooting_responses (scenario_id,attempt_id,step_id,chosen_action,is_correct) VALUES (2,1,2,'inspect_cpu',0)", 1452)
    sql("INSERT INTO troubleshooting_responses (scenario_id,attempt_id,step_id,chosen_action,is_correct) VALUES (1,1,1,'inspect_ram',1)")
    sql('DELETE FROM quiz_choices WHERE choice_id=1', 1451)
    sql('DELETE FROM lessons WHERE lesson_id=1', 1451)
    sql('DELETE FROM scenario_steps WHERE step_id=1', 1451)
    sql('DELETE FROM quiz_attempts WHERE attempt_id=1', 1451)
    sql("UPDATE lessons SET status='archived' WHERE lesson_id=1")
    assert sql('SELECT COUNT(*) FROM lesson_progress WHERE lesson_id=1') == '1'
    sql("UPDATE system_feedback SET rating=6", 3819)
    sql('UPDATE quizzes SET pass_mark=101', 3819)
    sql('UPDATE quiz_attempts SET score=2,max_score=1 WHERE attempt_id=1', 3819)
    sql('UPDATE quiz_questions SET points=0 WHERE question_id=1', 3819)
    sql("UPDATE assembly_attempts SET build_state_json='invalid'", 3140)
    sql("INSERT INTO user_sessions (user_id,token_hash,expires_at) VALUES (2,'raw-token',CURRENT_TIMESTAMP + INTERVAL 1 DAY)", 3819)
    sql("INSERT INTO user_sessions (user_id,token_hash,expires_at) VALUES (2,REPEAT('a',64),CURRENT_TIMESTAMP - INTERVAL 1 DAY)", 3819)
    sql("INSERT INTO user_sessions (user_id,token_hash,created_at,last_seen_at,expires_at,revoked_at) VALUES "
        "(2,REPEAT('a',64),NOW(),NOW(),NOW()+INTERVAL 1 DAY,NULL),"
        "(2,REPEAT('b',64),NOW()-INTERVAL 2 DAY,NOW(),NOW()-INTERVAL 1 DAY,NULL),"
        "(2,REPEAT('c',64),NOW(),NOW(),NOW()+INTERVAL 1 DAY,NOW()),"
        "(2,REPEAT('d',64),NOW()-INTERVAL 1 HOUR,NOW()-INTERVAL 1 HOUR,NOW()+INTERVAL 1 DAY,NULL)")
    assert sql('SELECT COUNT(*) FROM user_sessions WHERE revoked_at IS NULL AND expires_at > NOW() AND last_seen_at >= NOW()-INTERVAL 5 MINUTE') == '1'
    sql("INSERT INTO user_sessions (user_id,token_hash,expires_at) VALUES (2,REPEAT('a',64),NOW()+INTERVAL 1 DAY)", 1062)
    sql("INSERT INTO users (user_id,first_name,last_name,email,password_hash) SELECT 3,'Temp','Example','temp@example.invalid',password_hash FROM users WHERE user_id=1")
    sql("INSERT INTO system_logs (user_id,event_type,action) VALUES (3,'test','Temporary actor')")
    sql('DELETE FROM users WHERE user_id=3')
    assert sql("SELECT user_id IS NULL FROM system_logs WHERE action='Temporary actor'") == '1'
    print('PASS: migration, seeds, ownership, uniqueness, checks, archives, sessions, actorless logs')
finally:
    sql(f'DROP DATABASE `{DATABASE}`', database=None)
