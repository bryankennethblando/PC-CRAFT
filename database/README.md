# Database contract

MySQL 8.0.16+ with InnoDB, strict SQL mode, and `utf8mb4_0900_ai_ci`.
The repository previously contained an empty schema, no migrations, and empty
backend models/controllers. No existing data backfill is needed for this baseline.
An external database that already has tables requires a separate inventory and
additive migration; do not apply this baseline over it.

Backend and frontend agent reviews agreed this contract before implementation.
The SQL files define exact column types, defaults, constraint names, and indexes.
These roles and tables supersede the prototype descriptions in the root README.

## Local Docker database

From the repository root, copy `.env.example` to `.env` and set separate,
nonempty `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD` values. Keep `.env` private.
Docker Compose uses the official MySQL image, so no custom Dockerfile is needed.

```bash
cp .env.example .env
# Edit .env and set both passwords, then start MySQL:
docker compose up -d --wait
docker compose exec db mysql -u pc_craft -p pc_craft_db
```

Enter `DB_PASSWORD` at the prompt. A host SQL client can connect to
`127.0.0.1:3307`, database `pc_craft_db`, user `pc_craft`, with that password.
Change `DB_PORT` if port 3307 is occupied. The port binds only to localhost.
Containers on this Compose network use host `db` and port `3306`.

The named volume preserves data across restarts and `docker compose down`.
The initial migration runs automatically only when the data volume is empty;
do not also import `schema.sql`. Later migrations must be applied explicitly.
Changing passwords in `.env` does not change accounts in an existing volume;
use `ALTER USER` with an authorized account for password changes.
Do not use `docker compose down -v` unless you intend to delete database data.
The generated `pc_craft` account has database-wide privileges for local development;
production deployments need separately provisioned, restricted application users.

Optional fictional seeds, applied once after startup:

```bash
docker compose cp database/seeds/001_development.sql db:/tmp/001_development.sql
docker compose exec db mysql -u pc_craft -p pc_craft_db -e 'source /tmp/001_development.sql'
```

Seeds are not loaded automatically.

## Manual apply

Create an empty database with an operator account, then apply **either** the
migration **or** the identical `schema.sql` snapshot, never both:

```bash
mysql -u root -p -e 'CREATE DATABASE pc_craft_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;'
mysql -u root -p pc_craft_db < database/migrations/001_initial.sql
mysql -u root -p pc_craft_db -e 'SELECT * FROM schema_migrations;'
```

Database selection stays outside SQL; no hardcoded `USE` or database creation.
Migration order is `001_initial.sql`, followed by any future numbered migrations.
Run migrations once, serially, with a migration account. The final statement
records `001_initial` in `schema_migrations` only after all tables are created.
Do not use the mysql client's `--force`: it continues after failures. Reapplying
fails rather than silently accepting incompatible existing tables.

MySQL DDL commits implicitly. On partial failure, inspect the created objects and
repair forward before recording completion. There is no destructive down migration.
For an existing deployment, back up first and use a reviewed forward migration or
restore procedure. Application accounts should not have DDL permission.

Optional, fresh development databases only:

```bash
mysql -u root -p pc_craft_db < database/seeds/001_development.sql
```

Seeds use fixed fixture IDs and one transaction. A second application fails on
unique IDs and leaves existing rows intact when the client stops on error.
Both fictional `example.invalid` accounts are disabled. Their bcrypt hashes were
created from random passwords that were discarded. There are no login credentials
or sessions to reuse. Set a new password through the eventual backend before
activating a development account. Never run these seeds in production.

## Tables and relationships

| Tables | Relationships and integrity |
| --- | --- |
| `users`, `user_sessions` | Sessions belong to users; email and token digest are unique. Session deletion cascades only when its user is deleted. |
| `modules`, `lessons`, `lesson_progress` | Modules have creators and ordered lessons. Progress references a user and lesson, unique per pair. |
| `quizzes`, `quiz_questions`, `quiz_choices` | Quizzes belong to modules and creators; questions belong to quizzes; choices belong to questions. |
| `quiz_attempts`, `quiz_answers` | Attempts reference users and quizzes, unique per user/quiz/attempt number. Answers are unique per attempt/question. Composite FKs enforce that the question belongs to the attempt's quiz and the selected choice belongs to that question. A null choice represents an unanswered question. |
| `simulation_scenarios`, `scenario_steps` | Scenarios have creators; step order is unique per scenario. Types are `troubleshooting` and `maintenance`. |
| `troubleshooting_attempts`, `troubleshooting_responses` | Attempts reference users/scenarios. Composite FKs require each response's step and attempt to belong to the same scenario. Repeated responses to a step are allowed. |
| `assembly_attempts` | Separate user-owned attempts for `assembly` and `disassembly`; JSON stores variable build and compatibility snapshots. |
| `system_feedback` | User-owned feedback, optional reviewer and rating 1–5, review status `open`, `in_review`, or `resolved`. Deleting a reviewer clears attribution. |
| `system_logs` | Nullable actor permits system events; deleting an otherwise unreferenced actor clears attribution and preserves the log. Entity identifiers are descriptive audit references, not enforced polymorphic foreign keys. |
| `schema_migrations` | Applied migration version and timestamp. |

All domain IDs are unsigned BIGINT primary keys. Foreign keys prevent orphans.
Content and learner-history deletes are restricted; archive content or disable
users instead. A module, lesson, quiz, or scenario can be `draft`, `published`, or
`archived`. Questions, choices, and steps inherit their parent lifecycle.

Additional checks enforce percentage, positive point/order/attempt values,
nonnegative scores, score ceilings, boolean domains, rating bounds, token digest
format, and timestamp ordering when end timestamps exist. JSON columns reject
malformed JSON; their application-specific shape still requires backend validation.

## Indexes

- Unique: user email; session digest; user/lesson progress; user/quiz/attempt
  number; attempt/question answers; scenario/step order; migration version.
- Composite unique parent keys support the quiz and scenario ownership FKs.
- Content lists: module status/order, lesson module/order, quiz module/status,
  question quiz/order, choice question/order, scenario type/status.
- History: user/date and quiz/date attempts; scenario/status troubleshooting;
  user/date assembly; feedback status/date and user/date.
- Presence: session revocation/expiry/heartbeat plus user lookup.
- Logs: date, user/date, event type/level/date.
- InnoDB adds supporting foreign-key indexes where an existing index cannot
  cover the required leading columns.

## Backend and frontend integration

- Roles are `learner`, `admin`, `super_admin`; account state is `active` or
  `disabled`. The earlier README's student/instructor names are not DB values.
- Store only password hashes produced by a password hashing library. For sessions,
  generate high-entropy opaque tokens and store lowercase SHA-256 hex digests only.
  A format check cannot prove a caller supplied a real hash; backend validation
  remains essential. Reject disabled users and revoked/expired sessions on every
  authenticated request. Never expose either hash to the frontend or write raw
  tokens/passwords into logs or JSON snapshots.
- Set each database connection's timezone to `+00:00`. Serialize API timestamps
  as ISO 8601 UTC strings and BIGINT IDs as strings, avoiding JavaScript precision
  loss. Preserve DECIMAL values when calculating scores.
- Online presence is derived from a valid session with a recent heartbeat, for
  example the last five minutes. `users.last_seen_at` is informational, never a
  permanent online flag. Disabled users must be excluded from presence results.

```sql
SELECT DISTINCT u.user_id
FROM users u
JOIN user_sessions s ON s.user_id = u.user_id
WHERE u.account_status = 'active'
  AND s.revoked_at IS NULL
  AND s.expires_at > CURRENT_TIMESTAMP
  AND s.last_seen_at >= CURRENT_TIMESTAMP - INTERVAL 5 MINUTE;
```

- Derive `quiz_answers.quiz_id` and `troubleshooting_responses.scenario_id` from
  the owned attempt server-side. Never trust client-supplied ownership or scores.
  Assembly attempt IDs and troubleshooting attempt IDs are different resources.
- Allocate quiz attempt numbers inside a transaction with serialization (for
  example locking the learner row), or retry a duplicate-key conflict. An
  unguarded `MAX(attempt_number) + 1` races.
- Grade and submit in one transaction. Backend enforces exactly one correct choice
  for published single-choice questions, points awarded no greater than question
  points, score totals, pass marks, completion timestamps/status consistency, and
  no changes to submitted attempts. These cross-row/workflow rules are not enforced
  by SQL CHECKs. Withhold `is_correct`, `expected_action`, and grading feedback
  until the API permits review.
- Once learning content has been attempted, treat its text, choices, points,
  pass marks, and steps as immutable. Archive and clone the parent and children
  for revisions. FKs prevent deletion of referenced rows and cross-parent answers,
  but do not freeze text or all content relationships. Backend must
  enforce this policy transactionally; this schema has no revision engine.
- JSON is limited to scenario configuration, response details, build state,
  compatibility reports, and log metadata. Users, content, attempts, and responses
  remain relational. Validate JSON shapes and sizes at the API boundary.

## Verification

A dependency-free Python test invokes a MySQL client, creates a randomly named
scratch database, and removes only that database in `finally`. The test account
needs database creation/deletion rights. Use a configured login path or socket
authentication so individual checks do not prompt for passwords:

```bash
python3 database/tests/check_schema.py mysql --login-path=local
# Or an existing isolated local container:
python3 database/tests/check_schema.py podman exec -i pc-craft-db-check mysql -uroot
```

Checks cover fresh migration, snapshot parity, seeds, safe repeat rejection,
cross-quiz/choice/scenario ownership, uniqueness, score/rating/JSON/hash checks,
archive preservation, session expiry/revocation/heartbeat, and actorless logs.

Validated on an isolated MySQL 8.4 container. No deployment database was migrated.
MySQL 8.0.16 itself, API integration, production data upgrades, query performance,
and concurrent writers have not been exercised.
