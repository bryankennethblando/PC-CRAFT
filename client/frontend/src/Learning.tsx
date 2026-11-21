import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ClipboardCheck,
  Download,
  MessageCircle,
  Target,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { AssemblyDiagram, AssemblyPractice } from "./AssemblyDiagram"
import { LessonBody } from "./LessonBody"
import {
  api,
  message,
  useResource,
  type Lesson,
  type LessonProgress,
  type Module,
  type Progress,
  type Quiz,
  type User,
} from "./api"
import { Heading, installation, LinkButton, Meter, Status } from "./ui"

export function Modules({
  moduleId,
  lessonId,
  user,
}: {
  moduleId?: string
  lessonId?: string
  user: User
}) {
  const modules = useResource<Module[]>("/modules", true)
  const selected = modules.data?.find((module) => module.module_id === moduleId)
  const lessons = useResource<Lesson[]>(
    selected ? `/modules/${selected.module_id}/lessons` : null,
    true
  )
  const lesson = useResource<Lesson & { content: string }>(
    lessonId && lessons.data?.some((row) => row.lesson_id === lessonId)
      ? `/modules/lessons/${lessonId}`
      : null
  )
  const progress = useResource<LessonProgress[]>(
    user.role === "learner" ? "/progress/lessons" : null,
    true
  )
  const quizzes = useResource<Quiz[]>(
    selected && !lessonId && user.role === "learner"
      ? `/quizzes?module_id=${selected.module_id}`
      : null,
    true
  )
  const completed = new Set(
    progress.data
      ?.filter((row) => row.status === "completed")
      .map((row) => row.lesson_id)
  )
  const status = progress.data?.find(
    (row) => row.lesson_id === lessonId
  )?.status
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const bookmarkKey = `pc-craft-bookmark:${user.user_id}:${lessonId}`
  const [bookmarked, setBookmarked] = useState(
    () => localStorage.getItem(bookmarkKey) === "true"
  )
  const index =
    lessons.data?.findIndex((row) => row.lesson_id === lessonId) ?? -1
  const next = lessons.data?.[index + 1]
  const previous = lessons.data?.[index - 1]
  const publishedProgress = progress.data?.filter(
    (row) => row.available !== false
  )
  const publishedCompleted =
    publishedProgress?.filter((row) => row.status === "completed").length ?? 0
  const curriculumPercent = publishedProgress?.length
    ? Math.round((100 * publishedCompleted) / publishedProgress.length)
    : 0
  const moduleNumber =
    (modules.data?.findIndex((row) => row.module_id === moduleId) ?? -1) + 1
  const moduleCompleted = lessons.data?.filter((row) =>
    completed.has(row.lesson_id)
  ).length
  const featuredAssembly =
    lesson.data?.title === "Processor & Memory Installation" &&
    selected?.title === "System Unit Assembly"

  function downloadLesson() {
    if (!lesson.data) return
    const url = URL.createObjectURL(
      new Blob([`# ${lesson.data.title}\n\n${lesson.data.content}`], {
        type: "text/markdown;charset=utf-8",
      })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `lesson-${lessonId}.md`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function complete() {
    setPending(true)
    setError("")
    try {
      await api(`/progress/lessons/${lessonId}`, "PUT", { status: "completed" })
      setSaved(true)
      if (next) location.hash = `/modules/${moduleId}/${next.lesson_id}`
      else progress.reload()
    } catch (error) {
      setError(message(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="main" tabIndex={-1} className="wrap workspace course-workspace">
      <div className={moduleId ? "course-grid" : "course-grid course-index"}>
        <div className="stack">
          <Status {...modules} />
          <Status {...lessons} />
          <Status {...lesson} />
          <Status {...progress} />
          <Status {...quizzes} />
          {lesson.data ? (
            <>
              <div className="lesson-context">
                <div className="eyebrow">
                  <a href="#/modules">Modules</a> /{" "}
                  <a href={`#/modules/${moduleId}`}>{selected?.title}</a> /
                  Lesson {index + 1}
                </div>
                {(saved || status === "completed") && (
                  <span className="tag positive" role="status">
                    <Check aria-hidden="true" /> Progress saved
                  </span>
                )}
              </div>
              <article className="panel lesson">
                <div className="lesson-meta">
                  <span className="tag">
                    Module {String(moduleNumber).padStart(2, "0")} · Lesson{" "}
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="lesson-tools">
                    {Boolean(lesson.data.reading_minutes) && (
                      <span>{lesson.data.reading_minutes} min read</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Bookmark lesson"
                      aria-pressed={bookmarked}
                      onClick={() => {
                        if (bookmarked) localStorage.removeItem(bookmarkKey)
                        else localStorage.setItem(bookmarkKey, "true")
                        setBookmarked(!bookmarked)
                      }}
                    >
                      <Bookmark
                        fill={bookmarked ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Download lesson"
                      onClick={downloadLesson}
                    >
                      <Download aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <h1>{lesson.data.title}</h1>
                {featuredAssembly && (
                  <p className="lesson-lead">
                    The processor executes instructions. RAM holds the data it
                    needs right now. Correct installation helps protect the
                    components before the first boot.
                  </p>
                )}
                {lesson.data.learning_objective && (
                  <div className="lesson-objective">
                    <Target aria-hidden="true" />
                    <div>
                      <h2>By the end of this lesson</h2>
                      <p>{lesson.data.learning_objective}</p>
                    </div>
                  </div>
                )}
                {!featuredAssembly &&
                  /processor|cpu/i.test(lesson.data.title) && (
                    <figure className="lesson-figure">
                      <img
                        src={installation}
                        alt="Processor installation on a motherboard"
                      />
                      <figcaption>
                        Processor installation on a motherboard
                      </figcaption>
                    </figure>
                  )}
                {featuredAssembly ? (
                  <>
                    <AssemblyDiagram />
                    <details className="full-lesson">
                      <summary>Read the full lesson and self-check</summary>
                      <LessonBody content={lesson.data.content} />
                    </details>
                    <AssemblyPractice />
                  </>
                ) : (
                  <LessonBody content={lesson.data.content} />
                )}
              </article>
              <div className="actions lesson-actions">
                <a
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  href={
                    previous
                      ? `#/modules/${moduleId}/${previous.lesson_id}`
                      : `#/modules/${moduleId}`
                  }
                >
                  <ArrowLeft aria-hidden="true" />
                  {previous ? "Previous lesson" : "Back to module"}
                </a>
                {user.role === "learner" &&
                !(saved || status === "completed") ? (
                  <Button size="lg" disabled={pending} onClick={complete}>
                    {pending
                      ? "Saving…"
                      : next
                        ? "Mark complete & continue"
                        : "Mark complete"}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                ) : (
                  next && (
                    <LinkButton to={`#/modules/${moduleId}/${next.lesson_id}`}>
                      Next lesson
                    </LinkButton>
                  )
                )}
              </div>
              <Status error={error} />
            </>
          ) : selected && !lessonId ? (
            <section className="panel stack">
              <Heading section="Module overview" title={selected.title}>
                {selected.summary}
              </Heading>
              {progress.data && lessons.data && lessons.data.length > 0 && (
                <div>
                  <p>
                    {moduleCompleted} of {lessons.data.length} lessons completed
                  </p>
                  <Meter
                    value={(100 * (moduleCompleted ?? 0)) / lessons.data.length}
                    label="Module progress"
                  />
                </div>
              )}
              {lessons.data?.map((row) => (
                <a
                  className="list-row"
                  key={row.lesson_id}
                  href={`#/modules/${moduleId}/${row.lesson_id}`}
                >
                  <BookOpen aria-hidden="true" />
                  {row.title}
                  {(completed.has(row.lesson_id) ||
                    Boolean(row.reading_minutes)) && (
                    <span className="tag">
                      {completed.has(row.lesson_id)
                        ? "Completed"
                        : `${row.reading_minutes} min`}
                    </span>
                  )}
                </a>
              ))}
              {lessons.data?.length === 0 && (
                <p>No lessons have been published for this module.</p>
              )}
              {Boolean(quizzes.data?.length) && <h2>Module quizzes</h2>}
              {quizzes.data?.map((quiz) => (
                <a
                  className="list-row"
                  key={quiz.quiz_id}
                  href={`#/quizzes/${quiz.quiz_id}`}
                >
                  <ClipboardCheck aria-hidden="true" />
                  {quiz.title}
                </a>
              ))}
            </section>
          ) : (
            modules.data &&
            (!lessonId ||
              (lessons.data && index === -1) ||
              (moduleId && !selected)) && (
              <section className="panel stack">
                <Heading title="Learning modules">
                  {moduleId
                    ? "This module or lesson is unavailable."
                    : modules.data.length
                      ? "Choose a module to start learning."
                      : undefined}
                </Heading>
                {modules.data.map((row) => (
                  <a
                    className="list-row"
                    key={row.module_id}
                    href={`#/modules/${row.module_id}`}
                  >
                    <BookOpen aria-hidden="true" />
                    {row.title}
                  </a>
                ))}
                {modules.data.length === 0 && (
                  <p>No modules have been published yet.</p>
                )}
              </section>
            )
          )}
        </div>
        <aside className="stack">
          <div className="navy-panel">
            <div className="eyebrow">Your learning path</div>
            <h2>Computer System Servicing</h2>
            {publishedProgress && publishedProgress.length > 0 && (
              <div className="course-progress">
                <Meter
                  label="Curriculum lesson progress"
                  value={curriculumPercent}
                />
                <div className="feature-top">
                  <p>
                    {publishedCompleted} of {publishedProgress.length} lessons
                    completed
                  </p>
                  <strong>{curriculumPercent}%</strong>
                </div>
              </div>
            )}
          </div>
          {Boolean(modules.data?.length) && (
            <nav aria-label="Curriculum" className="panel stack curriculum">
              <h3>Foundation track</h3>
              {modules.data?.map((module, position) => {
                const rows = publishedProgress?.filter(
                  (row) => row.module_id === module.module_id
                )
                const done =
                  rows?.filter((row) => row.status === "completed").length ?? 0
                const finished = Boolean(rows?.length && done === rows.length)
                return (
                  <div
                    key={module.module_id}
                    className={
                      moduleId === module.module_id
                        ? "curriculum-current"
                        : undefined
                    }
                  >
                    <a
                      className="list-row"
                      aria-current={
                        moduleId === module.module_id && !lessonId
                          ? "page"
                          : undefined
                      }
                      href={`#/modules/${module.module_id}`}
                    >
                      <span
                        className={
                          finished
                            ? "curriculum-number positive"
                            : "curriculum-number"
                        }
                        aria-hidden="true"
                      >
                        {finished ? (
                          <Check />
                        ) : (
                          String(position + 1).padStart(2, "0")
                        )}
                      </span>
                      <span>
                        {module.title}
                        {rows && (
                          <small>
                            {rows.length}{" "}
                            {rows.length === 1 ? "lesson" : "lessons"} ·{" "}
                            {finished
                              ? "Complete"
                              : done ||
                                  rows.some(
                                    (row) => row.status === "in_progress"
                                  )
                                ? "In progress"
                                : "Not started"}
                          </small>
                        )}
                      </span>
                    </a>
                    {moduleId === module.module_id &&
                      lessons.data?.map((row) => (
                        <a
                          className="lesson-link"
                          key={row.lesson_id}
                          href={`#/modules/${module.module_id}/${row.lesson_id}`}
                          aria-current={
                            row.lesson_id === lessonId ? "page" : undefined
                          }
                        >
                          {row.title}
                          {completed.has(row.lesson_id) && (
                            <span className="tag positive">Completed</span>
                          )}
                        </a>
                      ))}
                  </div>
                )
              })}
            </nav>
          )}
          {user.role === "learner" && (
            <a className="course-support" href="#/progress">
              <MessageCircle aria-hidden="true" />
              <span>
                <strong>Need a little guidance?</strong>
                <small>View progress and send feedback</small>
              </span>
            </a>
          )}
        </aside>
      </div>
    </main>
  )
}

export function ProgressPage({ user }: { user: User }) {
  const progress = useResource<Progress>("/progress")
  const lessons = useResource<LessonProgress[]>("/progress/lessons", true)
  const [feedback, setFeedback] = useState<{
    error?: string
    messageError?: boolean
    sent?: boolean
    pending?: boolean
  }>({})
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const comment = String(data.get("message") ?? "").trim()
    if (!comment) {
      setFeedback({ messageError: true })
      form.querySelector("textarea")?.focus()
      return
    }
    setFeedback({ pending: true })
    try {
      await api("/feedback", "POST", {
        category: data.get("category"),
        message: comment,
        rating: data.get("rating") === "" ? null : Number(data.get("rating")),
      })
      form.reset()
      setFeedback({ sent: true })
    } catch (error) {
      setFeedback({ error: message(error) })
    }
  }
  return (
    <main id="main" tabIndex={-1} className="wrap workspace stack">
      <Heading section="Learner workspace" title="Progress and profile">
        Review your account and lesson completion.
      </Heading>
      <div className="dashboard-grid">
        <section className="panel stack">
          <h2>Lesson progress</h2>
          <Status {...progress} />
          <Status {...lessons} />
          {progress.data && (
            <>
              <p>
                {progress.data.completed_count} of {progress.data.lesson_count}{" "}
                lessons completed
              </p>
              <Meter
                value={progress.data.completion_percent}
                label="Lesson progress"
              />
            </>
          )}
          {lessons.data?.map((row) => (
            <div className="list-row" key={row.lesson_id}>
              <BookOpen aria-hidden="true" />
              {row.available === false ? (
                row.title
              ) : (
                <a href={`#/modules/${row.module_id}/${row.lesson_id}`}>
                  {row.title}
                </a>
              )}
              <span className="tag">{row.status.replaceAll("_", " ")}</span>
            </div>
          ))}
          {lessons.data?.length === 0 && <p>No lessons to track yet.</p>}
        </section>
        <aside className="panel profile-card">
          <div className="avatar">
            {user.first_name[0]}
            {user.last_name[0]}
          </div>
          <h2>
            {user.first_name} {user.last_name}
          </h2>
          <p>{user.email}</p>
          <span className="tag">Learner</span>
        </aside>
      </div>
      <section id="send-feedback" className="panel feedback-form">
        <h2>Send feedback</h2>
        <form
          onSubmit={send}
          onChange={() => {
            if (feedback.error || feedback.messageError || feedback.sent)
              setFeedback({})
          }}
        >
          <fieldset disabled={feedback.pending} className="stack">
            <div className="form-grid">
              <label>
                Category
                <select name="category">
                  <option value="lesson">Lesson</option>
                  <option value="quiz">Quiz</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Rating
                <select name="rating">
                  <option value="">No rating</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Message
              <textarea
                name="message"
                maxLength={5000}
                required
                aria-invalid={feedback.messageError || undefined}
                aria-describedby={
                  feedback.messageError ? "feedback-message-error" : undefined
                }
              />
            </label>
            {feedback.messageError && (
              <p
                id="feedback-message-error"
                className="notice error"
                role="alert"
              >
                Enter a feedback message.
              </p>
            )}
            <Status error={feedback.error} />
            {feedback.sent && (
              <p role="status" className="notice positive">
                Feedback submitted.
              </p>
            )}
            <Button type="submit" disabled={feedback.pending}>
              {feedback.pending ? "Sending…" : "Send feedback"}
            </Button>
          </fieldset>
        </form>
      </section>
    </main>
  )
}
