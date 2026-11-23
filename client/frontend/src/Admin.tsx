import { useState, type FormEvent } from "react"
import { BookOpen, ClipboardCheck, List, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonBody } from "./LessonBody"
import { api, message, useResource, type Module, type User } from "./api"
import { Heading, LinkButton, Metric, Status } from "./ui"

type ContentKind = "modules" | "lessons" | "quizzes"
type PublicationStatus = "draft" | "published" | "archived"
type ContentRow = {
  title: string
  status: PublicationStatus
  module_id: string
  lesson_id?: string
  quiz_id?: string
  sort_order?: number
  summary?: string | null
  content?: string
  learning_objective?: string | null
  reading_minutes?: number | null
  instructions?: string | null
  pass_mark?: string
  has_attempts?: boolean
  questions?: {
    question_text: string
    points: string
    status?: PublicationStatus
    choices: {
      choice_text: string
      is_correct: boolean | number
      status?: PublicationStatus
    }[]
  }[]
}
type Account = User & {
  online: boolean
  account_status: string
  last_seen_at: string | null
}
type Activity = {
  lessons_completed: number
  quizzes_submitted: number
  assembly_attempts: number
  troubleshooting_attempts: number
}
type Log = {
  log_id: string
  event_type: string
  action: string
  created_at: string
}
type Feedback = {
  feedback_id: string
  category: string
  message: string
  rating: number | null
  status: string
  admin_note: string | null
}
const titles = {
  modules: "Learning modules",
  lessons: "Lessons",
  quizzes: "Knowledge quizzes",
}
const singular = { modules: "module", lessons: "lesson", quizzes: "quiz" }
const metrics = [
  ["learners", "Registered learners"],
  ["online_users", "Online now"],
  ["published_modules", "Published modules"],
  ["published_quizzes", "Published quizzes"],
  ["submitted_quiz_attempts", "Quiz submissions"],
]

function rowId(kind: ContentKind, row: ContentRow) {
  return kind === "modules"
    ? row.module_id
    : kind === "lessons"
      ? row.lesson_id
      : row.quiz_id
}

export function Admin({
  user,
  tab,
  id,
}: {
  user: User
  tab?: string
  id?: string
}) {
  const summary = useResource<Record<string, number>>(
    tab ? null : "/admin/dashboard"
  )
  const items = [
    ["", "Dashboard"],
    ["users", "Users"],
    ["modules", "Modules"],
    ["lessons", "Lessons"],
    ["quizzes", "Quizzes"],
  ]
  if (user.role === "super_admin")
    items.push(["logs", "System logs"], ["feedback", "Feedback"])
  const content =
    tab === "modules" || tab === "lessons" || tab === "quizzes"
      ? tab
      : undefined
  const title = tab
    ? (items.find(([key]) => key === tab)?.[1] ?? "Administration")
    : "Platform overview"
  const restricted =
    (tab === "logs" || tab === "feedback") && user.role !== "super_admin"
  return (
    <main id="main" tabIndex={-1} className="wrap workspace stack">
      <Heading
        section="Administration / Platform workspace"
        title={title}
        action={
          !tab && <LinkButton to="#/admin/modules/new">Add module</LinkButton>
        }
      >
        Manage learning content and monitor platform activity.
      </Heading>
      <nav className="tabs" aria-label="Administration">
        {items.map(([key, label]) => (
          <a
            href={key ? `#/admin/${key}` : "#/admin"}
            aria-current={(tab ?? "") === key ? "page" : undefined}
            key={key}
          >
            {label}
          </a>
        ))}
      </nav>
      {restricted && (
        <Status error="This page requires a super admin account." />
      )}
      {!tab && (
        <>
          <Status {...summary} />
          {summary.data && (
            <div className="metrics admin-metrics">
              {metrics.map(([key, label]) => (
                <Metric
                  key={key}
                  label={label}
                  value={summary.data?.[key] ?? "—"}
                />
              ))}
            </div>
          )}
          <UsersPanel preview />
          <h2>Manage learning content</h2>
          <div className="two-col">
            <ContentList kind="modules" preview />
            <ContentList kind="quizzes" preview />
          </div>
        </>
      )}
      {tab === "users" && <UsersPanel id={id} />}
      {content &&
        (id ? (
          <ContentEditor kind={content} id={id} />
        ) : (
          <ContentList kind={content} />
        ))}
      {user.role === "super_admin" && tab === "logs" && <Logs />}
      {user.role === "super_admin" && tab === "feedback" && <FeedbackList />}
      {tab && !restricted && !items.some(([key]) => key === tab) && (
        <p className="panel">This administration page could not be found.</p>
      )}
    </main>
  )
}

function UsersPanel({ id, preview }: { id?: string; preview?: boolean }) {
  const accounts = useResource<Account[]>("/admin/users", true)
  const activity = useResource<Activity>(
    id ? `/admin/users/${id}/activity` : null
  )
  const [search, setSearch] = useState("")
  const selected = accounts.data?.find((row) => row.user_id === id)
  const filtered = accounts.data?.filter((row) =>
    `${row.first_name} ${row.last_name} ${row.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )
  const rows = preview ? filtered?.slice(0, 5) : filtered
  return (
    <section className="panel stack">
      <div className="feature-top">
        <h2>
          <Users aria-hidden="true" /> User activity
        </h2>
        {preview ? (
          <LinkButton to="#/admin/users" variant="outline">
            Manage users
          </LinkButton>
        ) : (
          <label className="search">
            Search users
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        )}
      </div>
      <Status {...accounts} />
      <Status {...activity} />
      {activity.data && (
        <div className="stack tinted panel">
          <h3>
            {selected
              ? `${selected.first_name} ${selected.last_name}`
              : "Selected user"}{" "}
            activity
          </h3>
          <div className="metrics">
            <Metric
              label="Lessons completed"
              value={activity.data.lessons_completed}
            />
            <Metric
              label="Quizzes submitted"
              value={activity.data.quizzes_submitted}
            />
            <Metric
              label="Lab attempts"
              value={
                Number(activity.data.assembly_attempts) +
                Number(activity.data.troubleshooting_attempts)
              }
            />
          </div>
        </div>
      )}
      {rows?.length ? (
        <div className="table-wrap">
          <table
            className="users-table"
            aria-label="User activity"
            role="table"
          >
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  User
                </th>
                <th scope="col" role="columnheader">
                  Role
                </th>
                <th scope="col" role="columnheader">
                  Status
                </th>
                <th scope="col" role="columnheader">
                  Last seen
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((row) => (
                <tr key={row.user_id} role="row">
                  <td role="cell">
                    <a href={`#/admin/users/${row.user_id}`}>
                      {row.first_name} {row.last_name}
                    </a>
                    <small>{row.email}</small>
                  </td>
                  <td role="cell">
                    <span className="mobile-cell-label" aria-hidden="true">
                      Role
                    </span>
                    {row.role.replaceAll("_", " ")}
                  </td>
                  <td role="cell">
                    <span className="mobile-cell-label" aria-hidden="true">
                      Status
                    </span>
                    <span className={`tag ${row.online ? "positive" : ""}`}>
                      {row.online
                        ? "Online"
                        : row.account_status === "active"
                          ? "Offline"
                          : row.account_status}
                    </span>
                  </td>
                  <td role="cell">
                    <span className="mobile-cell-label" aria-hidden="true">
                      Last seen
                    </span>
                    {row.last_seen_at
                      ? new Date(row.last_seen_at).toLocaleString()
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        rows && <p>No users found.</p>
      )}
    </section>
  )
}

function ContentList({
  kind,
  preview,
}: {
  kind: ContentKind
  preview?: boolean
}) {
  const resource = useResource<ContentRow[]>(`/admin/${kind}`, true)
  const rows = preview ? resource.data?.slice(0, 4) : resource.data
  const Icon = kind === "quizzes" ? ClipboardCheck : BookOpen
  return (
    <section className="panel stack">
      <div className="feature-top">
        <h2>
          <Icon aria-hidden="true" /> {titles[kind]}
        </h2>
        <LinkButton to={`#/admin/${kind}/new`}>Add {singular[kind]}</LinkButton>
      </div>
      <Status {...resource} />
      {rows?.map((row) => (
        <a
          className="list-row"
          href={`#/admin/${kind}/${rowId(kind, row)}`}
          key={rowId(kind, row)}
        >
          {row.title}
          <span
            className={`tag ${row.status === "published" ? "positive" : ""}`}
          >
            {row.status}
          </span>
        </a>
      ))}
      {rows?.length === 0 && <p>No {kind} yet.</p>}
      {preview && <a href={`#/admin/${kind}`}>View all {kind}</a>}
    </section>
  )
}

function ContentEditor({ kind, id }: { kind: ContentKind; id: string }) {
  const isNew = id === "new"
  const item = useResource<ContentRow>(isNew ? null : `/admin/${kind}/${id}`)
  const modules = useResource<Module[]>(
    isNew && kind !== "modules" ? "/admin/modules" : null,
    true
  )
  return (
    <section className="panel stack editor">
      <LinkButton to={`#/admin/${kind}`} variant="outline">
        Back to {kind}
      </LinkButton>
      <Status {...item} />
      <Status {...modules} />
      {(isNew || item.data) && (
        <ContentForm
          kind={kind}
          id={id}
          row={item.data}
          modules={modules.data}
        />
      )}
    </section>
  )
}

type QuestionInput = {
  question_text: string
  points: number
  status: PublicationStatus
  choices: {
    choice_text: string
    status: PublicationStatus
    is_correct: boolean
  }[]
}
const blankChoice = (is_correct = false) => ({
  choice_text: "",
  status: "published" as const,
  is_correct,
})
const blankQuestion = (): QuestionInput => ({
  question_text: "",
  points: 1,
  status: "published",
  choices: [blankChoice(true), blankChoice()],
})

function PublicationOptions() {
  return (
    <>
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </>
  )
}

function ContentForm({
  kind,
  id,
  row,
  modules,
}: {
  kind: ContentKind
  id: string
  row?: ContentRow
  modules?: Module[]
}) {
  const isNew = id === "new"
  const [savedRow, setSavedRow] = useState(row)
  const status = savedRow?.status ?? "draft"
  const [questions, setQuestions] = useState<QuestionInput[]>(
    () =>
      row?.questions?.map((question) => ({
        question_text: question.question_text,
        points: Number(question.points),
        status: question.status ?? "published",
        choices: question.choices.map((choice) => ({
          choice_text: choice.choice_text,
          status: choice.status ?? "published",
          is_correct: Boolean(choice.is_correct),
        })),
      })) ?? (kind === "quizzes" ? [blankQuestion()] : [])
  )
  const [result, setResult] = useState<{
    error?: string
    success?: string
    pending?: boolean
  }>({})
  const [dirty, setDirty] = useState(false)
  const canEdit = status === "draft" && !savedRow?.has_attempts
  const path = `/admin/${kind}${isNew ? "" : "/" + id}`
  function updateQuestion(index: number, patch: Partial<QuestionInput>) {
    setDirty(true)
    setQuestions((previous) =>
      previous.map((question, position) =>
        position === index ? { ...question, ...patch } : question
      )
    )
  }
  function quizFields(instructions: string | null, pass_mark: number) {
    return {
      instructions,
      pass_mark,
      questions: questions.map((question) => ({
        ...question,
        question_text: question.question_text.trim(),
        choices: question.choices.map((choice) => ({
          ...choice,
          choice_text: choice.choice_text.trim(),
        })),
      })),
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (field: string) => String(data.get(field) ?? "").trim()
    const fields =
      kind === "modules"
        ? {
            summary: text("summary") || null,
            sort_order: Number(data.get("sort_order")),
          }
        : kind === "lessons"
          ? {
              content: String(data.get("content") ?? ""),
              learning_objective: text("learning_objective") || null,
              reading_minutes: text("reading_minutes")
                ? Number(data.get("reading_minutes"))
                : null,
              sort_order: Number(data.get("sort_order")),
            }
          : quizFields(
              text("instructions") || null,
              Number(data.get("pass_mark"))
            )
    setResult({ pending: true })
    try {
      const created = await api<ContentRow>(path, isNew ? "POST" : "PUT", {
        title: text("title"),
        ...fields,
        ...(isNew && kind !== "modules"
          ? { module_id: text("module_id") }
          : {}),
      })
      if (isNew) location.hash = `/admin/${kind}/${rowId(kind, created)}`
      else {
        setSavedRow(created)
        setDirty(false)
        setResult({ success: "Draft saved." })
      }
    } catch (error) {
      setResult({ error: message(error) })
    }
  }
  async function copyQuiz() {
    if (!savedRow) return
    setResult({ pending: true })
    try {
      const copy = await api<ContentRow>("/admin/quizzes", "POST", {
        title: savedRow.title,
        module_id: savedRow.module_id,
        ...quizFields(
          savedRow.instructions ?? null,
          Number(savedRow.pass_mark ?? 80)
        ),
      })
      location.hash = `/admin/quizzes/${copy.quiz_id}`
    } catch (error) {
      setResult({ error: message(error) })
    }
  }
  async function changeStatus(next: PublicationStatus) {
    setResult({ pending: true })
    try {
      const updated = await api<ContentRow>(`${path}/status`, "PATCH", {
        status: next,
      })
      setSavedRow((saved) => ({ ...saved, ...updated }))
      setResult({
        success:
          next === "published"
            ? "Content published."
            : next === "draft"
              ? "Content unpublished."
              : "Content archived.",
      })
    } catch (error) {
      setResult({ error: message(error) })
    }
  }
  return (
    <>
      <div className="feature-top">
        <h2>{isNew ? `New ${singular[kind]}` : savedRow?.title}</h2>
        <span className="tag">{status}</span>
      </div>
      {savedRow?.has_attempts && (
        <p>
          This quiz has learner attempts. Create a draft copy to revise its
          questions or grading.
        </p>
      )}
      {savedRow && status === "draft" && (
        <details className="draft-preview">
          <summary>Preview saved draft</summary>
          <DraftPreview kind={kind} row={savedRow} />
        </details>
      )}
      <form onSubmit={save} onChange={() => setDirty(true)}>
        <fieldset disabled={!canEdit || result.pending} className="stack">
          {isNew && kind !== "modules" && (
            <label>
              Parent module
              <select required name="module_id">
                <option value="">Choose a module</option>
                {modules?.map((module) => (
                  <option key={module.module_id} value={module.module_id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Title
            <input
              name="title"
              defaultValue={row?.title}
              maxLength={200}
              required
            />
          </label>
          {kind === "modules" && (
            <label>
              Summary
              <textarea
                name="summary"
                maxLength={10000}
                defaultValue={row?.summary ?? ""}
              />
            </label>
          )}
          {kind === "lessons" && (
            <>
              <label>
                Learning objective
                <textarea
                  name="learning_objective"
                  maxLength={1000}
                  defaultValue={row?.learning_objective ?? ""}
                />
              </label>
              <label>
                Reading time (minutes)
                <input
                  name="reading_minutes"
                  type="number"
                  min={1}
                  max={65535}
                  defaultValue={row?.reading_minutes ?? ""}
                />
              </label>
              <label>
                Lesson content (Markdown)
                <textarea
                  name="content"
                  maxLength={50000}
                  defaultValue={row?.content}
                  required
                />
              </label>
            </>
          )}
          {kind !== "quizzes" && (
            <label>
              Sort order
              <input
                name="sort_order"
                type="number"
                min={0}
                max={2147483647}
                defaultValue={row?.sort_order ?? 0}
                required
              />
            </label>
          )}
          {kind === "quizzes" && (
            <>
              <p>
                Each published question needs at least two published choices and
                one correct published choice.
              </p>
              <label>
                Instructions
                <textarea
                  name="instructions"
                  maxLength={10000}
                  defaultValue={row?.instructions ?? ""}
                />
              </label>
              <label>
                Passing score (%)
                <input
                  name="pass_mark"
                  type="number"
                  step=".01"
                  min="0"
                  max="100"
                  defaultValue={row?.pass_mark ?? 80}
                  required
                />
              </label>
              {questions.map((question, index) => (
                <fieldset className="question-editor stack" key={index}>
                  <legend>Question {index + 1}</legend>
                  <label>
                    Question status
                    <select
                      value={question.status}
                      onChange={(event) =>
                        updateQuestion(index, {
                          status: event.target.value as PublicationStatus,
                        })
                      }
                    >
                      <PublicationOptions />
                    </select>
                  </label>
                  <label>
                    Question text
                    <textarea
                      required
                      maxLength={5000}
                      value={question.question_text}
                      onChange={(event) =>
                        updateQuestion(index, {
                          question_text: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Points
                    <input
                      type="number"
                      min=".01"
                      max="99999.99"
                      step=".01"
                      required
                      value={
                        Number.isNaN(question.points) ? "" : question.points
                      }
                      onChange={(event) =>
                        updateQuestion(index, {
                          points: event.target.valueAsNumber,
                        })
                      }
                    />
                  </label>
                  {question.choices.map((choice, position) => {
                    function updateChoice(patch: Partial<typeof choice>) {
                      updateQuestion(index, {
                        choices: question.choices.map((value, at) =>
                          at === position ? { ...value, ...patch } : value
                        ),
                      })
                    }
                    return (
                      <fieldset className="choice-editor" key={position}>
                        <legend>Choice {position + 1}</legend>
                        <label>
                          Choice text
                          <input
                            required
                            maxLength={1000}
                            value={choice.choice_text}
                            onChange={(event) =>
                              updateChoice({ choice_text: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          Choice status
                          <select
                            value={choice.status}
                            onChange={(event) =>
                              updateChoice({
                                status: event.target.value as PublicationStatus,
                              })
                            }
                          >
                            <PublicationOptions />
                          </select>
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={choice.is_correct}
                            onChange={(event) =>
                              updateChoice({ is_correct: event.target.checked })
                            }
                          />
                          Correct answer
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            updateQuestion(index, {
                              choices: question.choices.filter(
                                (_, at) => at !== position
                              ),
                            })
                          }
                        >
                          Remove choice {position + 1}
                        </Button>
                      </fieldset>
                    )
                  })}
                  {canEdit && (
                    <div className="actions">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={question.choices.length >= 10}
                        onClick={() =>
                          updateQuestion(index, {
                            choices: [...question.choices, blankChoice()],
                          })
                        }
                      >
                        Add choice
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDirty(true)
                          setQuestions((previous) =>
                            previous.filter((_, at) => at !== index)
                          )
                        }}
                      >
                        Remove question
                      </Button>
                    </div>
                  )}
                </fieldset>
              ))}
              {canEdit && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={questions.length >= 100}
                    onClick={() => {
                      setDirty(true)
                      setQuestions((previous) => [...previous, blankQuestion()])
                    }}
                  >
                    Add question
                  </Button>
                </div>
              )}
            </>
          )}
          {canEdit && (
            <div>
              <Button type="submit">
                {result.pending ? "Saving…" : "Save draft"}
              </Button>
            </div>
          )}
        </fieldset>
      </form>
      {!isNew && (
        <div className="actions">
          {status === "draft" && (
            <Button
              disabled={result.pending || dirty}
              onClick={() => {
                if (
                  window.confirm(`Publish this ${singular[kind]} for learners?`)
                )
                  void changeStatus("published")
              }}
            >
              Publish saved draft
            </Button>
          )}
          {status === "published" && (
            <Button
              variant="outline"
              disabled={result.pending}
              onClick={() => {
                if (
                  window.confirm(
                    `Unpublish this ${singular[kind]} and hide it from learners?`
                  )
                )
                  void changeStatus("draft")
              }}
            >
              Unpublish
            </Button>
          )}
          {kind === "quizzes" &&
            (savedRow?.has_attempts || status === "archived") && (
              <Button
                variant="outline"
                disabled={result.pending || dirty}
                onClick={copyQuiz}
              >
                Create draft copy
              </Button>
            )}
          {status !== "archived" && (
            <Button
              variant="outline"
              disabled={result.pending}
              onClick={() => {
                if (
                  window.confirm(
                    "Archive this content? Archived content cannot be reopened."
                  )
                )
                  void changeStatus("archived")
              }}
            >
              Archive
            </Button>
          )}
        </div>
      )}
      <Status error={result.error} />
      {result.success && (
        <p role="status" className="notice">
          {result.success}
        </p>
      )}
    </>
  )
}

function DraftPreview({ kind, row }: { kind: ContentKind; row: ContentRow }) {
  const questions = row.questions?.filter(
    (question) => question.status !== "draft" && question.status !== "archived"
  )
  return (
    <article className="panel stack">
      <h2>{row.title}</h2>
      {kind === "modules" && row.summary && <p>{row.summary}</p>}
      {kind === "lessons" && (
        <>
          {row.reading_minutes && <p>{row.reading_minutes} min read</p>}
          {row.learning_objective && (
            <p>
              <strong>Learning objective.</strong> {row.learning_objective}
            </p>
          )}
          <LessonBody content={row.content ?? ""} />
        </>
      )}
      {kind === "quizzes" && (
        <>
          {row.instructions && <p>{row.instructions}</p>}
          <p>Passing score {Number(row.pass_mark)}%</p>
          {questions?.map((question, index) => (
            <fieldset key={index}>
              <legend>{question.question_text}</legend>
              {question.choices
                .filter(
                  (choice) =>
                    choice.status !== "draft" && choice.status !== "archived"
                )
                .map((choice, position) => (
                  <label className="checkbox" key={position}>
                    <input type="radio" name={`preview-${index}`} />
                    {choice.choice_text}
                  </label>
                ))}
            </fieldset>
          ))}
          {!questions?.length && <p>This quiz has no published questions.</p>}
        </>
      )}
    </article>
  )
}

function Logs() {
  const logs = useResource<Log[]>("/admin/logs", true)
  return (
    <section className="panel stack">
      <h2>
        <List aria-hidden="true" /> System activity
      </h2>
      <Status {...logs} />
      {logs.data?.map((row) => (
        <div className="list-row" key={row.log_id}>
          <div>
            <strong>{row.action}</strong>
            <small>{row.event_type.replaceAll("_", " ")}</small>
          </div>
          <time dateTime={row.created_at}>
            {new Date(row.created_at).toLocaleString()}
          </time>
        </div>
      ))}
      {logs.data?.length === 0 && <p>No log entries yet.</p>}
    </section>
  )
}

function FeedbackList() {
  const feedback = useResource<Feedback[]>("/admin/feedback", true)
  return (
    <section className="stack">
      <Status {...feedback} />
      {feedback.data?.map((row) => (
        <FeedbackForm key={row.feedback_id} row={row} />
      ))}
      {feedback.data?.length === 0 && (
        <p className="panel">No feedback has been submitted yet.</p>
      )}
    </section>
  )
}

function FeedbackForm({ row }: { row: Feedback }) {
  const [result, setResult] = useState<{
    error?: string
    success?: string
    pending?: boolean
  }>({})
  const [status, setStatus] = useState(row.status)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setResult({ pending: true })
    try {
      const saved = await api<Feedback>(
        `/admin/feedback/${row.feedback_id}`,
        "PATCH",
        {
          status: form.get("status"),
          admin_note: String(form.get("admin_note")).trim() || null,
        }
      )
      setStatus(saved.status)
      setResult({ success: "Review saved." })
    } catch (error) {
      setResult({ error: message(error) })
    }
  }
  return (
    <article className="panel stack">
      <h2>
        {row.category}{" "}
        <span className="tag">{status.replaceAll("_", " ")}</span>
      </h2>
      <p className="lesson-content">{row.message}</p>
      {row.rating !== null && <p>Rating {row.rating} / 5</p>}
      <form onSubmit={save}>
        <label>
          Review status
          <select name="status" defaultValue={row.status}>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label>
          Admin note
          <textarea
            name="admin_note"
            defaultValue={row.admin_note ?? ""}
            maxLength={5000}
          />
        </label>
        <Status error={result.error} />
        {result.success && <p role="status">{result.success}</p>}
        <div>
          <Button type="submit" disabled={result.pending}>
            {result.pending ? "Saving…" : "Save review"}
          </Button>
        </div>
      </form>
    </article>
  )
}
