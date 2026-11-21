import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Flag,
  Lightbulb,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  api,
  message,
  useResource,
  type Attempt,
  type Question,
  type Quiz,
} from "./api"
import { Heading, LinkButton, Meter, Status } from "./ui"

type Answer = {
  question_id: string
  is_correct: number
  selected_choice_id: string | null
  correct_choice_id?: string
  points_awarded: string
}
type Detail = Attempt & {
  instructions?: string | null
  pass_mark?: string
  questions: Question[]
  answers?: Answer[]
}

function AttemptClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000))
  if (!Number.isFinite(seconds)) return null
  return (
    <div className="quiz-clock">
      <span>
        <Clock aria-hidden="true" /> Elapsed time
      </span>
      <strong>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </strong>
    </div>
  )
}

export function Quizzes({
  quizId,
  attemptId,
  userId,
}: {
  quizId?: string
  attemptId?: string
  userId: string
}) {
  const quizzes = useResource<Quiz[]>(quizId ? null : "/quizzes", true)
  const quiz = useResource<Quiz>(
    quizId && !attemptId ? `/quizzes/${quizId}` : null
  )
  const attempts = useResource<Attempt[]>(
    attemptId ? null : "/quizzes/attempts",
    true
  )
  const attempt = useResource<Detail>(
    attemptId ? `/quizzes/attempts/${attemptId}` : null
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const history = attempts.data?.filter(
    (row) => !quizId || row.quiz_id === quizId
  )
  const detail = attempt.data?.quiz_id === quizId ? attempt.data : undefined

  async function start() {
    setPending(true)
    setError("")
    try {
      const created = await api<Attempt>(`/quizzes/${quizId}/attempts`, "POST")
      location.hash = `/quizzes/${quizId}/${created.attempt_id}`
    } catch (error) {
      setError(message(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <main
      id="main"
      tabIndex={-1}
      className="wrap workspace quiz-workspace stack"
    >
      <Heading
        section={
          detail
            ? "Assessments / Knowledge quizzes / Practice quiz"
            : "Assessments / Knowledge quizzes"
        }
        title={detail?.quiz_title ?? quiz.data?.title ?? "Knowledge quizzes"}
        action={
          attemptId && (
            <a
              href="#/quizzes"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {detail?.submitted_at ? "Quiz catalog" : "Save & exit"}
            </a>
          )
        }
      >
        {detail?.instructions ??
          quiz.data?.instructions ??
          "Check what you know and review your results after each attempt."}
      </Heading>
      <Status {...quizzes} />
      <Status {...quiz} />
      <Status {...attempts} />
      <Status {...attempt} />
      <Status error={error} />
      {detail && (
        <QuizAttempt
          detail={detail}
          storageKey={`pc-craft-quiz:${userId}:${attemptId}`}
          onSubmit={attempt.reload}
        />
      )}
      {attempt.data && attempt.data.quiz_id !== quizId && (
        <Status error="This attempt belongs to another quiz." />
      )}
      {quiz.data && !attemptId && (
        <article className="panel stack">
          <h2>Ready to begin?</h2>
          <p>Passing score {Number(quiz.data.pass_mark)}%</p>
          <div>
            <Button disabled={pending} onClick={start}>
              {pending ? "Starting…" : "Start new attempt"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </article>
      )}
      {Boolean(quizzes.data?.length) && (
        <section className="two-col">
          {quizzes.data?.map((row) => (
            <article className="panel continue-card" key={row.quiz_id}>
              <span className="icon-box">
                <ClipboardCheck aria-hidden="true" />
              </span>
              <h2>{row.title}</h2>
              <p>
                {row.instructions ?? `Passing score ${Number(row.pass_mark)}%`}
              </p>
              <LinkButton to={`#/quizzes/${row.quiz_id}`}>Open quiz</LinkButton>
            </article>
          ))}
        </section>
      )}
      {quizzes.data?.length === 0 && (
        <section className="panel stack">
          <h2>No published quizzes</h2>
          <p>Published knowledge checks will appear here.</p>
        </section>
      )}
      {history && (
        <section className="panel stack">
          <h2>Attempt history</h2>
          {history.map((row) => (
            <a
              className="list-row"
              key={row.attempt_id}
              href={`#/quizzes/${row.quiz_id}/${row.attempt_id}`}
            >
              <ClipboardCheck aria-hidden="true" />
              {row.quiz_title ??
                quizzes.data?.find((quiz) => quiz.quiz_id === row.quiz_id)
                  ?.title ??
                quiz.data?.title ??
                "Quiz"}
              <span>
                {row.submitted_at
                  ? `${row.score} / ${row.max_score}`
                  : "Resume attempt"}
              </span>
            </a>
          ))}
          {history.length === 0 && <p>No attempts yet.</p>}
        </section>
      )}
    </main>
  )
}

function QuizAttempt({
  detail,
  storageKey,
  onSubmit,
}: {
  detail: Detail
  storageKey: string
  onSubmit: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) ?? "{}")
    } catch {
      return {}
    }
  })
  const [index, setIndex] = useState(0)
  const flagKey = `${storageKey}:flags`
  const [flags, setFlags] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(flagKey) ?? "[]")
      return Array.isArray(saved)
        ? saved.filter((value): value is string => typeof value === "string")
        : []
    } catch {
      return []
    }
  })
  const [review, setReview] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const { questions } = detail
  const current = questions[index]
  const isAnswered = (question: Question) =>
    question.choices.some(
      (choice) => choice.choice_id === answers[question.question_id]
    )
  const count = questions.filter(isAnswered).length
  const percent = questions.length
    ? Math.round((100 * count) / questions.length)
    : 0
  async function submit() {
    setError("")
    setPending(true)
    try {
      await api(`/quizzes/attempts/${detail.attempt_id}/submit`, "POST", {
        answers: questions.map((question) => ({
          question_id: question.question_id,
          selected_choice_id:
            question.choices.find(
              (choice) => choice.choice_id === answers[question.question_id]
            )?.choice_id ?? null,
        })),
      })
      sessionStorage.removeItem(storageKey)
      sessionStorage.removeItem(flagKey)
      onSubmit()
    } catch (error) {
      setError(message(error))
    } finally {
      setPending(false)
    }
  }
  if (detail.submitted_at)
    return (
      <section className="panel stack">
        <h2>{detail.passed ? "Quiz passed" : "Quiz results"}</h2>
        <p>
          Score {detail.score} out of {detail.max_score}
        </p>
        {questions.map((question) => {
          const answer = detail.answers?.find(
            (row) => row.question_id === question.question_id
          )
          const choice = question.choices.find(
            (row) => row.choice_id === answer?.selected_choice_id
          )
          const correct = question.choices.find(
            (row) => row.choice_id === answer?.correct_choice_id
          )
          return (
            <article className="review-row" key={question.question_id}>
              <h3>{question.question_text}</h3>
              <p>
                <strong>Your answer.</strong>{" "}
                {choice?.choice_text ?? "Unanswered"}
              </p>
              {correct && !answer?.is_correct && (
                <p>
                  <strong>Correct answer.</strong> {correct.choice_text}
                </p>
              )}
              <span className="tag">
                {answer?.is_correct
                  ? "Correct"
                  : choice
                    ? "Incorrect"
                    : "No answer"}
              </span>
            </article>
          )
        })}
        <div>
          <LinkButton to="#/quizzes">View quiz catalog and history</LinkButton>
        </div>
      </section>
    )
  if (!current) return <p className="panel">This quiz has no questions.</p>
  return (
    <div className="quiz-grid">
      <div className="stack">
        <section className="panel question-panel stack">
          {review ? (
            <>
              <h2>Review your answers</h2>
              <p>
                {count} of {questions.length} questions answered. Unanswered
                questions receive zero points.
              </p>
              {questions.map((question, position) => (
                <button
                  className="list-row quiz-review-choice"
                  key={question.question_id}
                  onClick={() => {
                    setIndex(position)
                    setReview(false)
                  }}
                >
                  <strong>
                    {flags.includes(question.question_id) && (
                      <Flag aria-label="Flagged" />
                    )}{" "}
                    {question.question_text}
                  </strong>
                  <span>
                    {question.choices.find(
                      (row) => row.choice_id === answers[question.question_id]
                    )?.choice_text ?? "Unanswered"}
                  </span>
                </button>
              ))}
              <Status error={error} />
              <div>
                <Button size="lg" disabled={pending} onClick={submit}>
                  {pending ? "Submitting…" : "Submit quiz"}
                  <Check aria-hidden="true" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="quiz-question-meta">
                <span className="tag">
                  Question {index + 1} / {questions.length}
                </span>
                <div className="quiz-meta-actions">
                  {current.points != null && (
                    <span>
                      {Number(current.points)}{" "}
                      {Number(current.points) === 1 ? "point" : "points"}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={flags.includes(current.question_id)}
                    onClick={() => {
                      const next = flags.includes(current.question_id)
                        ? flags.filter((id) => id !== current.question_id)
                        : [...flags, current.question_id]
                      sessionStorage.setItem(flagKey, JSON.stringify(next))
                      setFlags(next)
                    }}
                  >
                    <Flag aria-hidden="true" /> Flag for review
                  </Button>
                </div>
              </div>
              <fieldset>
                <legend>{current.question_text}</legend>
                <p>Choose the single best answer.</p>
                <div className="choices">
                  {current.choices.map((choice, position) => (
                    <label className="choice" key={choice.choice_id}>
                      <span className="choice-letter" aria-hidden="true">
                        {String.fromCharCode(65 + position)}
                      </span>
                      <span>{choice.choice_text}</span>
                      <input
                        type="radio"
                        name={current.question_id}
                        checked={
                          answers[current.question_id] === choice.choice_id
                        }
                        onChange={() => {
                          const next = {
                            ...answers,
                            [current.question_id]: choice.choice_id,
                          }
                          setAnswers(next)
                          sessionStorage.setItem(
                            storageKey,
                            JSON.stringify(next)
                          )
                        }}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="quiz-answer-footer">
                <p role="status" className="quiz-answer-saved">
                  {isAnswered(current) && (
                    <>
                      <Check aria-hidden="true" /> Answer selected · saved in
                      this tab
                    </>
                  )}
                </p>
                <small>You can change it before submitting.</small>
              </div>
            </>
          )}
        </section>
        {!review && (
          <div className="actions spread">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft aria-hidden="true" />
              Previous question
            </Button>
            <Button
              onClick={() =>
                index === questions.length - 1
                  ? setReview(true)
                  : setIndex(index + 1)
              }
            >
              {index === questions.length - 1
                ? "Review answers"
                : "Next question"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      <aside className="stack">
        <section className="panel stack attempt-panel">
          <div className="feature-top">
            <h2>Your attempt</h2>
            <ClipboardList aria-hidden="true" />
          </div>
          <div className="quiz-progress">
            <p>
              {count} of {questions.length} answered
            </p>
            <strong>{percent}%</strong>
          </div>
          <Meter value={percent} label="Questions answered" />
          <nav className="question-nav" aria-label="Jump to question">
            {questions.map((question, position) => (
              <Button
                key={question.question_id}
                aria-label={`Question ${position + 1}, ${isAnswered(question) ? "answered" : "unanswered"}${flags.includes(question.question_id) ? ", flagged" : ""}`}
                data-answered={isAnswered(question) || undefined}
                data-flagged={flags.includes(question.question_id) || undefined}
                aria-current={
                  !review && position === index ? "step" : undefined
                }
                variant={!review && position === index ? "default" : "outline"}
                onClick={() => {
                  setIndex(position)
                  setReview(false)
                }}
              >
                {String(position + 1).padStart(2, "0")}
              </Button>
            ))}
          </nav>
          <div className="quiz-key" aria-hidden="true">
            <span data-state="answered">Answered</span>
            <span data-state="current">Current</span>
            <span>Unanswered</span>
          </div>
          {detail.started_at && <AttemptClock startedAt={detail.started_at} />}
          <p className="quiz-mode">Practice mode · no time limit</p>
        </section>
        <div className="quiz-coaching tinted">
          <Lightbulb aria-hidden="true" />
          <h2>Review at your own pace</h2>
          <p>
            {detail.pass_mark != null &&
              `Passing score ${Number(detail.pass_mark)}%. `}
            Flag any questions you want to revisit. After submitting, you can
            review your score and the correct answers.
          </p>
          <span>Unlimited practice attempts</span>
        </div>
        <Button
          variant="outline"
          size="lg"
          disabled={review}
          onClick={() => setReview(true)}
        >
          Review & submit quiz <ArrowRight aria-hidden="true" />
        </Button>
      </aside>
    </div>
  )
}
