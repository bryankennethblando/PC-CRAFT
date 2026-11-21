import { useEffect } from "react"
import {
  ArrowUpRight,
  Award,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  Circle,
  ClipboardCheck,
  Clock,
  Cpu,
  Pencil,
  ShieldCheck,
  Target,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  type Attempt,
  type LessonProgress,
  type Module,
  type Progress,
  type User,
  useResource,
} from "./api"
import { Heading, LinkButton, Meter, Status } from "./ui"

type Lab = { status: string; mode?: string }

const percent = (completed: number, total: number) =>
  total ? Math.round((100 * completed) / total) : 0

const dateLabel = (date: string | number) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

function reveal(id: string) {
  const section = document.getElementById(id)
  section?.focus()
  section?.scrollIntoView({ block: "nearest" })
}

export function Dashboard({
  user,
  activityRequested,
}: {
  user: User
  activityRequested: boolean
}) {
  useEffect(() => {
    if (activityRequested) {
      const frame = requestAnimationFrame(() => reveal("learner-activity"))
      return () => cancelAnimationFrame(frame)
    }
  }, [activityRequested])
  const progress = useResource<Progress>("/progress")
  const lessons = useResource<LessonProgress[]>("/progress/lessons", true)
  const modules = useResource<Module[]>("/modules", true)
  const attempts = useResource<Attempt[]>("/quizzes/attempts", true)
  const assembly = useResource<Lab[]>("/simulation/attempts", true)
  const troubleshooting = useResource<Lab[]>("/troubleshooting/attempts", true)

  const moduleStats = modules.data?.map((module) => {
    const rows =
      lessons.data?.filter(
        (lesson) =>
          lesson.available !== false && lesson.module_id === module.module_id
      ) ?? []
    const complete = rows.filter(
      (lesson) => lesson.status === "completed"
    ).length
    return {
      ...module,
      lessons: rows,
      complete,
      percent: percent(complete, rows.length),
    }
  })
  const completed = lessons.data?.filter(
    (lesson) => lesson.available !== false && lesson.status === "completed"
  )
  const completeModules =
    moduleStats?.filter(
      (module) =>
        module.lessons.length > 0 && module.complete === module.lessons.length
    ).length ?? 0
  const loggedMinutes =
    completed?.reduce(
      (total, lesson) => total + (lesson.reading_minutes ?? 0),
      0
    ) ?? 0
  const submitted = attempts.data?.filter(
    (attempt) => attempt.submitted_at && Number(attempt.max_score) > 0
  )
  const average = submitted?.length
    ? Math.round(
        submitted.reduce(
          (total, attempt) =>
            total + (100 * Number(attempt.score)) / Number(attempt.max_score),
          0
        ) / submitted.length
      )
    : undefined
  const completedAssembly =
    assembly.data?.filter((lab) => lab.status === "completed") ?? []
  const built = completedAssembly.some((lab) => lab.mode === "assembly")
  const labsComplete =
    completedAssembly.length +
    (troubleshooting.data?.filter((lab) => lab.status === "completed").length ??
      0)
  const next = progress.data?.next_lesson
  const nextModule = moduleStats?.find(
    (module) => module.module_id === next?.module_id
  )
  const nextModuleNumber =
    moduleStats?.findIndex((module) => module.module_id === next?.module_id) ??
    -1
  const nextLessonNumber =
    nextModule?.lessons.findIndex(
      (lesson) => lesson.lesson_id === next?.lesson_id
    ) ?? -1
  const nextUrl = next
    ? `#/modules/${next.module_id}/${next.lesson_id}`
    : "#/modules"
  const milestones = [
    {
      label: "First lesson",
      earned: Boolean(completed?.length),
      icon: ShieldCheck,
    },
    { label: "First module", earned: Boolean(completeModules), icon: BookOpen },
    { label: "Quiz starter", earned: Boolean(submitted?.length), icon: Award },
  ]
  const goals = [
    { label: "Complete your first lesson", done: Boolean(completed?.length) },
    { label: "Complete your first module", done: Boolean(completeModules) },
    { label: "Finish an assembly lab", done: built },
    {
      label: "Pass a quiz",
      done: Boolean(submitted?.some((attempt) => attempt.passed)),
    },
  ]
  const goalsComplete = goals.filter((goal) => goal.done).length
  const activity = [
    ...(completed ?? []).flatMap((lesson) =>
      lesson.completed_at
        ? [
            {
              time: lesson.completed_at,
              title: lesson.title,
              label: "Lesson completed",
              href: `#/modules/${lesson.module_id}/${lesson.lesson_id}`,
              icon: BookOpen,
            },
          ]
        : []
    ),
    ...(submitted ?? []).flatMap((attempt) =>
      attempt.submitted_at
        ? [
            {
              time: attempt.submitted_at,
              title: attempt.quiz_title ?? "Knowledge quiz",
              label: `Quiz submitted · ${percent(Number(attempt.score), Number(attempt.max_score))}%`,
              href: `#/quizzes/${attempt.quiz_id}/${attempt.attempt_id}`,
              icon: ClipboardCheck,
            },
          ]
        : []
    ),
    ...(progress.data?.resumable_assembly?.updated_at
      ? [
          {
            time: progress.data.resumable_assembly.updated_at,
            title: "Assembly lab in progress",
            label: "Saved assembly attempt",
            href: "#/simulation",
            icon: Cpu,
          },
        ]
      : []),
  ].sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format()

  const stats = [
    {
      label: "Modules complete",
      value:
        modules.data && lessons.data
          ? `${completeModules} / ${modules.data.length}`
          : "—",
      note: "Foundation track",
      icon: BookOpen,
    },
    {
      label: "Labs completed",
      value: assembly.data && troubleshooting.data ? labsComplete : "—",
      note: "Assembly and troubleshooting",
      icon: Cpu,
    },
    {
      label: "Quiz average",
      value: average == null ? "—" : `${average}%`,
      note: `Across ${submitted?.length ?? 0} attempts`,
      icon: ClipboardCheck,
    },
    {
      label: "Learning time",
      value:
        !completed ||
        completed.some((lesson) => lesson.reading_minutes === undefined)
          ? "—"
          : loggedMinutes < 60
            ? `${loggedMinutes}m`
            : `${Math.floor(loggedMinutes / 60)}h ${loggedMinutes % 60}m`,
      note: "Estimated reading time",
      icon: Clock,
    },
  ]

  return (
    <main id="main" tabIndex={-1} className="wrap workspace overview-workspace">
      <Heading
        section={`Your learning workspace / ${today}`}
        title={`Welcome back, ${user.first_name}.`}
        action={
          <a
            className={buttonVariants({ variant: "outline", size: "lg" })}
            href="#/progress"
          >
            Learner profile <Pencil aria-hidden="true" />
          </a>
        }
      >
        Small steps. Real skills. Keep building your know-how.
      </Heading>
      <nav className="tabs overview-tabs" aria-label="Learner workspace">
        <a href="#/dashboard" aria-current="page">
          Overview
        </a>
        <a href="#/progress">My learning</a>
        <button type="button" onClick={() => reveal("learner-goals")}>
          Goals
        </button>
        <button type="button" onClick={() => reveal("learner-milestones")}>
          Achievements
        </button>
        <a href="#/progress">Account</a>
      </nav>
      <div className="dashboard-grid">
        <div className="stack overview-content">
          {[
            progress,
            lessons,
            modules,
            attempts,
            assembly,
            troubleshooting,
          ].map((resource, index) =>
            resource.error ? <Status key={index} {...resource} /> : null
          )}
          <section
            className="overview-metrics"
            aria-label="Learning statistics"
          >
            {stats.map(({ label, value, note, icon: Icon }) => (
              <div className="panel overview-metric" key={label}>
                <div className="feature-top">
                  <span>{label}</span>
                  <Icon aria-hidden="true" />
                </div>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </section>
          <section className="stack">
            <div className="feature-top">
              <h2>Pick up where you left off</h2>
              <a href="#/progress" className="overview-link">
                View my learning <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="two-col">
              <article className="panel overview-resume">
                <div className="eyebrow">
                  <BookOpen aria-hidden="true" />{" "}
                  {nextModuleNumber >= 0 && nextLessonNumber >= 0
                    ? `Module ${String(nextModuleNumber + 1).padStart(2, "0")} / Lesson ${String(nextLessonNumber + 1).padStart(2, "0")}`
                    : "Learning modules"}
                </div>
                <h3>{next?.title ?? "Explore your learning path"}</h3>
                <p>
                  {nextModule?.title ?? "Computer System Servicing"}
                  {next?.reading_minutes
                    ? ` · ${next.reading_minutes} min read`
                    : ""}
                </p>
                <div className="resume-progress">
                  <Meter
                    label="Lesson completion"
                    value={
                      nextModule?.percent ??
                      progress.data?.completion_percent ??
                      0
                    }
                  />
                  <span>
                    {nextModule
                      ? `${nextModule.complete} of ${nextModule.lessons.length} lessons complete`
                      : `${progress.data?.completed_count ?? 0} lessons complete`}
                  </span>
                </div>
                <LinkButton to={nextUrl}>
                  {next ? "Continue lesson" : "Browse modules"}
                </LinkButton>
              </article>
              <article className="panel overview-resume tinted">
                <div className="eyebrow">
                  <Cpu aria-hidden="true" /> Assembly lab / Guided
                </div>
                <h3>
                  Build your
                  <br /> first PC
                </h3>
                <p>
                  {progress.data?.resumable_assembly
                    ? "You have a saved assembly attempt."
                    : "Apply your hardware knowledge in the assembly lab."}
                </p>
                <div className="resume-progress">
                  <Meter
                    label="First assembly lab completed"
                    value={built ? 100 : 0}
                  />
                  <span>
                    {built
                      ? "First lab complete"
                      : progress.data?.resumable_assembly
                        ? "In progress"
                        : "Ready to start"}
                  </span>
                </div>
                <LinkButton to="#/simulation" variant="outline">
                  {progress.data?.resumable_assembly
                    ? "Resume assembly lab"
                    : "Open assembly lab"}
                </LinkButton>
              </article>
            </div>
          </section>
          <div className="overview-detail">
            <section className="panel stack">
              <div className="feature-top">
                <h2>Your skill foundation</h2>
                <ChartNoAxesCombined aria-hidden="true" />
              </div>
              {moduleStats?.slice(0, 4).map((module) => (
                <div className="skill-row" key={module.module_id}>
                  <div className="feature-top">
                    <span>{module.title}</span>
                    <span>{module.percent}%</span>
                  </div>
                  <Meter value={module.percent} label={module.title} />
                </div>
              ))}
              <p>Based on completed lessons.</p>
            </section>
            <section
              className="panel stack"
              id="learner-activity"
              tabIndex={-1}
            >
              <h2>Recent activity</h2>
              {activity
                .slice(0, 3)
                .map(({ time, title, label, href, icon: Icon }) => (
                  <a className="overview-event" href={href} key={href}>
                    <span className="icon-box">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{label}</small>
                      <time dateTime={time}>{dateLabel(time)}</time>
                    </span>
                  </a>
                ))}
              {!activity.length && (
                <p>Completed lessons and quiz results will appear here.</p>
              )}
            </section>
          </div>
          <section
            className="panel overview-milestones"
            id="learner-milestones"
            tabIndex={-1}
          >
            <div>
              <h2>Milestones earned</h2>
              <p>
                {milestones.filter((milestone) => milestone.earned).length}{" "}
                achievements unlocked
              </p>
            </div>
            {milestones.map(({ label, earned, icon: Icon }) => (
              <div className="overview-event" key={label}>
                <span className="icon-box">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{earned ? "Earned" : "In reach"}</small>
                </span>
              </div>
            ))}
          </section>
        </div>
        <aside className="stack overview-sidebar">
          <section className="panel profile-card">
            <div className="avatar" aria-hidden="true">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <h2>
              {user.first_name} {user.last_name}
            </h2>
            <p>Computer System Servicing</p>
            <span className="tag">Foundation learner</span>
            <div className="overview-profile-progress">
              <div className="feature-top">
                <strong>Curriculum progress</strong>
                <span>{progress.data?.completion_percent ?? 0}%</span>
              </div>
              <Meter
                value={progress.data?.completion_percent ?? 0}
                label="Curriculum progress"
              />
              <p>
                {progress.data?.completed_count ?? 0} of{" "}
                {progress.data?.lesson_count ?? 0} lessons completed
              </p>
            </div>
            <a className="overview-profile-callout" href="#/progress">
              <BookOpen aria-hidden="true" />
              <span>
                <strong>My learning</strong>
                <small>See your progress and send feedback.</small>
              </span>
            </a>
          </section>
          <section
            className="navy-panel overview-goals"
            id="learner-goals"
            tabIndex={-1}
          >
            <div className="feature-top">
              <h2>My learning goals</h2>
              <Target aria-hidden="true" />
            </div>
            <p>Build and diagnose a PC independently.</p>
            <ul>
              {goals.map(({ label, done }) => (
                <li key={label}>
                  {done ? (
                    <Check aria-label="Complete" />
                  ) : (
                    <Circle aria-label="Pending" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
            <Meter
              value={percent(goalsComplete, goals.length)}
              label="Learning goals completed"
            />
            <p>
              {goalsComplete} of {goals.length} goals complete
            </p>
            <a
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href={nextUrl}
            >
              Continue learning
            </a>
          </section>
        </aside>
      </div>
    </main>
  )
}
