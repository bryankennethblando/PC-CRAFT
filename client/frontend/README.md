# PC-CRAFT React client

Use Node.js 22.12+ or 24+. Set up the [Express API](../../server/README.md)
and [MySQL database](../../database/README.md) first. Then run from the repository root:

```sh
npm --prefix client/frontend ci
npm --prefix client/frontend run dev
```

Open http://localhost:3000. Vite proxies `/api` to `http://127.0.0.1:5000`.
For a different API port or host, set the public `VITE_API_ORIGIN` before starting
Vite and set the server's `FRONTEND_ORIGIN` to the browser's exact origin.
Run `npm --prefix client/frontend run build` to generate `client/frontend/dist`.
In production, serve that directory and forward `/api` to Express, or set
`VITE_API_ORIGIN` before building and configure CORS on Express.

## Routes and APIs

| React route | Express API under `/api` |
| --- | --- |
| `#/`, `#/login`, `#/register` | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` |
| `#/dashboard`, `#/progress` | `/progress`, `/progress/lessons`, `/quizzes/attempts`, `/feedback` |
| `#/modules/:moduleId/:lessonId` | `/modules`, `/modules/:id/lessons`, `/modules/lessons/:id`, `/progress/lessons`, `/progress/lessons/:id`, `/quizzes?module_id=:moduleId` |
| `#/quizzes/:quizId/:attemptId` | `/quizzes`, `/quizzes/:id`, `/quizzes/:id/attempts`, `/quizzes/attempts/:id`, `/quizzes/attempts/:id/submit` |
| `#/admin` and subpages | `/admin/dashboard`, `/admin/users`, `/admin/users/:id/activity`, `/admin/modules`, `/admin/lessons`, `/admin/quizzes` and their item/status routes |
| `#/admin/logs`, `#/admin/feedback` | `/admin/logs`, `/admin/feedback`, `/admin/feedback/:id` (super admin) |
| `#/simulation`, `#/troubleshooting` | Integration placeholders |

The client uses the API's bearer sessions, response envelopes, and paginated
lists. Remember me stores the bearer token across browser sessions. Quiz answer
drafts stay in the current tab until submission. Learner profiles are read-only
because the API has no profile update endpoint. The API supports learner, admin,
and super admin roles. Admin accounts require provisioning by a database operator.

## Manage curriculum

Seed the initial curriculum with the [database import instructions](../../database/README.md#import-the-curriculum).
Sign in as an admin or super admin and open **Modules**, **Lessons**, or
**Quizzes** in the administration navigation. Select an entry or use **Add**.
Save the draft, open **Preview saved draft**, then choose **Publish saved draft**
and confirm. Publish the parent module before publishing its lessons or quizzes.
Lessons accept Markdown, including tables and `> [!CAUTION]`-style callouts.

Use **Unpublish** to return a published item to draft. Use **Archive** to
retire it. Set each question and choice's publication status within its quiz
draft. A published question needs at least two published choices and exactly
one correct published choice. Once a quiz has learner attempts, use **Create
draft copy** to revise it. Review and publish the copy, then retire the old quiz.
Attempts stay attached to the original quiz and its answer key.

The lab placeholders live in `src/App.tsx`. The lab HTML stubs remain in
`client/pages`. Their script stubs remain in `client/js/simulation` and
`client/js/troubleshooting`. Future lab integration can replace the two
placeholder routes with React views.
