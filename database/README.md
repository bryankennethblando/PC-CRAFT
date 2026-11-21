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
Compose builds on the official MySQL image and includes the numbered migrations.

```bash
cp .env.example .env
# Edit .env and set both passwords, then start MySQL:
docker compose up --build -d --wait db
docker compose exec db mysql -u pc_craft -p pc_craft_db
```

Enter `DB_PASSWORD` at the prompt. A host SQL client can connect to
`127.0.0.1:3307`, database `pc_craft_db`, user `pc_craft`, with that password.
Change `DB_PORT` if port 3307 is occupied. The port binds only to localhost.
Containers on this Compose network use host `db` and port `3306`.

The named volume preserves data across restarts and `docker compose down`.
Compose runs the numbered migrations in order when the data volume is empty.
Apply later migrations explicitly to an existing volume.
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

## Local demo accounts

From the repository root, with local MySQL running and server dependencies
installed, create a learner, an instructor (`admin`), and a super admin:

```bash
npm --prefix server run seed:local-accounts
```

The command prints the account IDs, emails, and generated passwords once.
Store the passwords privately. If a demo email already exists, the command
rolls back without replacing any credentials. Use the printed instructor ID
for the [curriculum import](#import-the-curriculum). Sign in at
`http://localhost:3000` when using the local Compose frontend.

## Manual apply

Create an empty database with an operator account. Apply the numbered migrations
in order, or apply `database/schema.sql` to perform the same setup in one step.

```bash
mysql -u root -p -e 'CREATE DATABASE pc_craft_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;'
mysql -u root -p pc_craft_db < database/migrations/001_initial.sql
mysql -u root -p pc_craft_db < database/migrations/002_curriculum.sql
mysql -u root -p pc_craft_db -e 'SELECT * FROM schema_migrations;'
```

Database selection stays outside SQL; no hardcoded `USE` or database creation.
Run migrations once, serially, with a migration account. Each migration records
its version in `schema_migrations` after completing its schema changes.
Do not use the mysql client's `--force`: it continues after failures. Reapplying
fails rather than silently accepting incompatible existing tables.

For a database with `001_initial` already recorded, apply only the new migration.
With Compose, copy the migration to the running container and source it from
the MySQL client using an account with DDL privileges.

```bash
docker compose cp database/migrations/002_curriculum.sql db:/tmp/002_curriculum.sql
docker compose exec db mysql -u root -p pc_craft_db -e 'source /tmp/002_curriculum.sql'
```

MySQL DDL commits implicitly. On partial failure, inspect the created objects and
repair forward before recording completion. There is no destructive down migration.
For an existing deployment, back up first and use a reviewed forward migration or
restore procedure. Application accounts should not have DDL permission.

The curriculum migration adds nullable import keys and lesson metadata and sets
existing quiz questions and choices to published. Existing IDs, attempts and
answers retain their relationships. To roll back the deployment before using
per-item quiz visibility, redeploy the previous API and leave the additive
schema in place. Keep the upgraded API once quiz items use draft or archived
status because the previous API ignores item status.

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

## Import the curriculum

Apply migration `002_curriculum` and install the server dependencies. Provision
an active admin or super admin as described in the [API guide](../server/README.md).
From the repository root, pass that account's numeric `user_id` to the importer.
It connects using the server's repository `.env`.

```bash
npm --prefix server run import:curriculum -- 42
```

When running the full Compose stack, run the importer in the backend container:

```bash
docker compose exec backend npm run import:curriculum -- 42
```

The import creates 6 published modules, 25 published lessons, and 6 published
quizzes with 18 questions and 54 choices. The quizzes contain three original
questions per module with a 66% pass mark, which requires two correct answers.
One transaction covers the import. Stable source keys let you run it again
while preserving edits, publication status, and learner history. Change live
content through the admin application.

[module.md](seeds/module.md) is the original curriculum reference. Its module
and lesson numbers supply the source keys and order. The importer moves reading
time and objectives to fields and raises lesson section headings to Markdown
level 2. All 25 lessons have a reading time. Module 06 supplies no explicit
learning objectives for its five lessons. The 51 source self-check prompts and
answers remain in the lessons as practice. [curriculum-quizzes.json](seeds/curriculum-quizzes.json)
holds the module summaries and distinct graded questions. The lab scenario and
frontend specification sections stay in the reference file.

Subject-matter review items in the source include the electrical-shock and
chemical-splash first-aid wording in lesson 01.3, XMP/EXPO stability and BIOS
idle temperatures in 04.1, loopback and ICMP diagnosis in 05.4, and
model-specific motherboard LED colors and fault indications in 06.3.

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
`archived`. Quiz questions and choices also carry publication status. Learners
see published questions and choices within a published quiz and module.
Scenario steps inherit the scenario lifecycle.

Additional checks enforce percentage, positive point/order/attempt values,
nonnegative scores, score ceilings, boolean domains, rating bounds, token digest
format, and timestamp ordering when end timestamps exist. JSON columns reject
malformed JSON; their application-specific shape still requires backend validation.

## Indexes

- Unique: user email; session digest; curriculum source keys; user/lesson progress; user/quiz/attempt
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
- Once a quiz attempt starts, treat the quiz's text, question and choice
  publication, points, and pass mark as immutable. A revision uses a new quiz ID
  with new questions and choices. Old attempts retain the original quiz ID and
  answer keys. Scenario revisions also retain attempted rows. Foreign keys
  enforce ownership while the API enforces immutability.
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

Checks cover fresh migration, additive upgrade with existing data, snapshot parity, seeds, safe repeat rejection,
cross-quiz/choice/scenario ownership, uniqueness, score/rating/JSON/hash checks,
archive preservation, session expiry/revocation/heartbeat, and actorless logs.

Validated on an isolated MySQL 8.4 container. No deployment database was migrated.
MySQL 8.0.16 itself, API integration, production data upgrades, query performance,
and concurrent writers have not been exercised.
