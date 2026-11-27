# PC-CRAFT API

Use Node.js 22+ and the MySQL schema in [the database guide](../database/README.md).
Copy .env.example to .env if needed. Set the database credentials, PORT, and
FRONTEND_ORIGIN to the exact origin serving the client, such as
http://localhost:3000. The API reads the repository's `.env` and gives process
environment variables precedence. The listener defaults to `127.0.0.1`.
Compose sets `HOST=0.0.0.0` inside the backend container so Nginx can reach it.
MySQL in Compose is normally reachable from the host on `127.0.0.1:3307`.

```bash
npm --prefix server ci
npm --prefix server start
curl http://127.0.0.1:5000/api/health
```

Health runs a live database query and returns HTTP 503 if it fails. SIGINT and
SIGTERM close the HTTP server and connection pool.

Register a learner with `first_name`, `last_name`, `email`, and `password` (12–128
characters), `privacy_accepted: true`, and `privacy_notice_version` from the current
Privacy Notice. To provision an administrator, register a dedicated account and
have a database operator set its role to `admin` or `super_admin` after confirming
the account. There is no public role assignment route. Seed accounts are disabled
and have no usable credentials.

## Contract

Apply database migration `003_privacy_consent` before deploying this API. Protected
learning and admin routes return `403 PRIVACY_CONSENT_REQUIRED` until the signed-in
account has accepted the current notice. Login, profile lookup, acknowledgment, and
logout remain available before acceptance. Update the text and increment the version
in `privacy.js` together whenever the notice changes. The project owner must supply
the retention and privacy contact details before publication.

All paths are under `/api`. JSON responses use `{ "ok": true, "data": ... }` or
`{ "ok": false, "error": { "code": "...", "message": "..." } }`. Paginated lists
accept `?page=1&limit=20` and return `meta` with `page`, `limit`, and `has_more`.
IDs and DECIMAL scores are strings. MySQL aggregate counts may also be strings.
Dates are ISO 8601 UTC strings. Grading flags selected directly from MySQL are
0 or 1, while online presence and troubleshooting response correctness are
JSON booleans. Render text fields as text in the browser.

Send `Authorization: Bearer <token>` for protected routes. Login returns
`{ user, token, expires_at }`. Sessions expire after seven days or on logout.
Authenticated requests refresh the session heartbeat at most once per minute.
An account is online when active and at least one unrevoked, unexpired session
has a heartbeat from the past five minutes.

| Method and path | Access and request |
| --- | --- |
| `GET /health` | Public |
| `POST /auth/register`, `POST /auth/login` | Public. Login accepts `email` and `password`. |
| `GET /auth/privacy` | Public. Returns the current notice text and version. |
| `GET /auth/me`, `POST /auth/logout` | Signed in. The profile includes `privacy_accepted`. |
| `POST /auth/privacy/consent` | Signed in. Send `privacy_accepted: true` and the displayed `privacy_notice_version`. |
| `GET /modules`, `GET /modules/:id`, `GET /modules/:id/lessons`, `GET /modules/lessons/:id` | Signed in. Published content only. |
| `GET /quizzes`, `GET /quizzes/:id` | Signed in. Published quizzes with published questions and choices. The list accepts optional `module_id`. |
| `POST /quizzes/:id/attempts` | Learner. Start an attempt. |
| `GET /quizzes/attempts`, `GET /quizzes/attempts/:id` | Learner. Own attempts. Both include `quiz_title`. Detail includes `instructions` and questions, and includes graded `answers` with `correct_choice_id` after submission. |
| `POST /quizzes/attempts/:id/submit` | Learner. Own attempt. Send `answers`, an array of `{ question_id, selected_choice_id }`. Omitted or null choices are unanswered. |
| `GET /progress`, `GET /progress/lessons` | Learner. Own summary and lesson history. History marks hidden lessons `available: false` and omits their titles. |
| `PUT /progress/lessons/:id` | Learner. Send `status` as `in_progress` or `completed`. Completion persists. |
| `GET /simulation/catalog` | Signed in. Supported slots, part IDs, and properties. |
| `GET /simulation/attempts`, `GET /simulation/attempts/:id` | Learner. Own assembly or disassembly attempts. |
| `POST /simulation/attempts` | Learner. Send `mode` as `assembly` or `disassembly`, optionally with `build_state`. |
| `PUT /simulation/attempts/:id` | Learner. Own attempt. Send `build_state` and optional `status` as `in_progress`, `completed`, or `abandoned`. |
| `GET /troubleshooting/scenarios`, `GET /troubleshooting/scenarios/:id` | Signed in. Published scenarios and step prompts. |
| `POST /troubleshooting/scenarios/:id/attempts` | Learner. Start a scenario. |
| `GET /troubleshooting/attempts`, `GET /troubleshooting/attempts/:id` | Learner. Own attempts and answered steps. |
| `POST /troubleshooting/attempts/:id/responses` | Learner. Own attempt. Send the next step's `step_id` and `chosen_action`. Last response completes the attempt. |
| `POST /troubleshooting/attempts/:id/abandon` | Learner. Close own attempt. |
| `POST /feedback` | Learner. Send `category`, `message`, and optional `rating` (1–5). |
| `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/users/:id/activity` | Admin or super admin. |
| `GET /admin/:collection`, `GET /admin/:collection/:id` | Admin or super admin. Collections are `modules`, `lessons`, `quizzes`, and `scenarios`. |
| `POST /admin/:collection`, `PUT /admin/:collection/:id` | Admin or super admin. Create or replace draft content. |
| `PATCH /admin/:collection/:id/status` | Admin or super admin. Send `status` as `published`, `draft` (unpublish), or `archived`. Scenarios accept `published` and `archived`. |
| `GET /admin/logs`, `GET /admin/feedback`, `PATCH /admin/feedback/:id` | Super admin. Review accepts `status` as `open`, `in_review`, or `resolved` and optional `admin_note`. |

Build state is `{ "version": 1, "parts": [{ "slot": "cpu", "part_id": "cpu-am5" }] }`.
Each slot holds one catalog part. The server checks CPU socket, memory type, and
board fit against the case. Assembly completion requires a complete compatible
build. Disassembly completion requires empty slots.

## Content

- Modules take `title`, optional `summary` and `sort_order`. Lessons take `title`,
  Markdown `content`, and optional `sort_order`, `learning_objective`, and
  `reading_minutes`. The last two also appear on learner lesson lists and detail.
- Quizzes take `title`, optional `instructions` and `pass_mark` (percentage), and
  `questions` containing `question_text`, optional `points`, and `choices`.
  Choices have `choice_text` and `is_correct`. Questions and choices each accept
  `status` (`draft`, `published`, or `archived`), which defaults to `published`.
  A published question needs at least two published choices, including exactly
  one correct choice. Published quizzes must have at least one published question.
- Lessons and quizzes require `module_id` during creation. Publish the module
  before publishing its children. Unpublishing a module hides its lessons and
  quizzes from learner catalogs until the module is republished.
- Scenarios take `name`, `scenario_type` (`troubleshooting` or `maintenance`),
  optional `description` and `difficulty`, and `steps`. Steps include `prompt`,
  `action_type`, `expected_action`, `feedback_correct`, `feedback_incorrect`, and
  `configuration_json` with optional `component` and `actions` containing
  `{ id, label }` objects. The expected action must match one action ID.
- Omitted optional fields use their defaults on draft replacement. Draft quiz
  questions and scenario steps are replaced together with their parent in one
  transaction. Unpublish a module or lesson to edit it and retain lesson progress.
- Admin quiz detail and status responses include `has_attempts`. Once any attempt starts, its
  quiz fields, questions, and choices stay fixed. Create a new draft quiz to
  revise them and archive the previous version. The original quiz ID identifies
  the version that each learner answered. Learners can finish and review their
  existing attempts after the quiz is unpublished or archived.

Apply all numbered database migrations before starting the API. It creates no
tables on startup.

## Integration tests

Use an isolated MySQL 8.4 instance with a user allowed to create databases and
triggers. The suite creates and removes its own randomly named database.

```bash
TEST_DB_PORT=3308 npm --prefix server test
```

Set TEST_DB_USER and TEST_DB_PASSWORD for an isolated test account if needed.
The suite verifies real HTTP requests, role restrictions, ownership, content,
server grading, saved builds, presence, and rollback after a forced write error.
