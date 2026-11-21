import { useState, type FormEvent } from "react"
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Cpu,
  Route,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, message, setToken, type User } from "./api"
import { Heading, installation, LinkButton, Status, workbench } from "./ui"

const areas = [
  {
    label: "Modules",
    title: "Understand the fundamentals",
    text: "Build a foundation in hardware and safe work practices.",
    icon: BookOpen,
    link: "#/modules",
    action: "Explore the curriculum",
  },
  {
    label: "Assembly lab",
    title: "Build it. Take it apart.",
    text: "Apply what you learn about component placement and compatibility.",
    icon: Cpu,
    link: "#/simulation",
    action: "Explore the assembly lab",
  },
  {
    label: "Troubleshooting",
    title: "Think like a technician",
    text: "Work through symptoms, gather evidence, and diagnose hardware faults.",
    icon: Stethoscope,
    link: "#/troubleshooting",
    action: "Explore troubleshooting",
  },
  {
    label: "Quizzes",
    title: "Put your knowledge to work",
    text: "Check what you know and review your results after each attempt.",
    icon: ClipboardCheck,
    link: "#/quizzes",
    action: "Take a knowledge check",
  },
]

const highlights = [
  { number: "01", label: "Connected learning journey", link: "#/modules" },
  { number: "04", label: "Ways to learn", link: "#/modules" },
  { number: "12", label: "CSS learning modules", link: "#/modules" },
  { number: "08", label: "Guided lab scenarios", link: "#/simulation" },
]

export function Landing({ user }: { user: User | null }) {
  const start = user
    ? user.role === "learner"
      ? "#/dashboard"
      : "#/admin"
    : "#/register"
  return (
    <main id="main" tabIndex={-1}>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Your digital computer servicing lab</div>
          <h1>
            Know the parts.
            <br />
            Build the skills.
            <br />
            Own the solution.
          </h1>
          <p>
            Learn Computer System Servicing through guided lessons, virtual
            practice, and knowledge checks.
          </p>
          <div className="actions">
            <LinkButton to={start}>
              {user ? "Open your dashboard" : "Start your learning path"}
            </LinkButton>
            <LinkButton to="#/simulation" variant="outline">
              Explore the assembly lab
            </LinkButton>
          </div>
          <small>
            <ShieldCheck aria-hidden="true" /> Learn at your own pace
          </small>
        </div>
        <img
          src={workbench}
          alt="Open desktop PC and components on a workbench"
          fetchPriority="high"
        />
      </section>
      <section className="learning-highlights" aria-label="Learning highlights">
        <div className="wrap">
          {highlights.map((item) => (
            <a href={item.link} key={item.label}>
              <strong>{item.number}</strong>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </section>
      <section className="wrap landing-section">
        <div className="section-intro">
          <h2>Less memorizing. More doing.</h2>
          <p>
            Connect the theory to the task. Move between lessons, practice, and
            assessment as your skills grow.
          </p>
        </div>
        <div className="feature-grid">
          {areas.map(({ icon: Icon, ...area }) => (
            <article className="feature" key={area.link}>
              <div className="feature-top">
                <span className="icon-box">
                  <Icon aria-hidden="true" />
                </span>
                <span className="eyebrow">{area.label}</span>
              </div>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
              <a href={area.link}>
                {area.action}
                <ArrowRight aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="path-section">
        <div className="wrap landing-section path-grid">
          <div>
            <h2>
              A clear path.
              <br />
              Skills you can build on.
            </h2>
            <p>
              Start with the essentials, practice with a purpose, then check
              your understanding.
            </p>
            <ol>
              <li>Learn the fundamentals</li>
              <li>Practice with PC components</li>
              <li>Review your knowledge</li>
            </ol>
          </div>
          <div className="panel path-card">
            <div className="feature-top">
              <h3>PC hardware essentials</h3>
              <Route aria-hidden="true" />
            </div>
            {[areas[0], areas[1], areas[3]].map(
              ({ icon: Icon, label, link }) => (
                <a className="list-row" key={label} href={link}>
                  <Icon aria-hidden="true" />
                  {label}
                  <ArrowRight aria-hidden="true" />
                </a>
              )
            )}
          </div>
        </div>
      </section>
      {!user && (
        <section className="landing-cta">
          <div className="wrap">
            <h2>Your next skill starts with one step.</h2>
            <LinkButton to="#/register">Create your free account</LinkButton>
          </div>
        </section>
      )}
    </main>
  )
}

export function AuthPage({
  register,
  onLogin,
}: {
  register: boolean
  onLogin: (user: User) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [registered, setRegistered] = useState(false)
  const [visible, setVisible] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email")).trim()
    const password = String(form.get("password"))
    setPending(true)
    setError("")
    try {
      if (register) {
        await api("/auth/register", "POST", {
          email,
          password,
          first_name: String(form.get("first_name")).trim(),
          last_name: String(form.get("last_name")).trim(),
        })
        setRegistered(true)
      } else {
        const session = await api<{ token: string; user: User }>(
          "/auth/login",
          "POST",
          { email, password }
        )
        setToken(session.token, form.has("remember"))
        onLogin(session.user)
      }
    } catch (error) {
      setError(message(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="main" tabIndex={-1} className="wrap auth-layout">
      <section className="auth-story">
        <div className="eyebrow">Your digital computer servicing lab</div>
        <h2>
          Good technicians
          <br />
          never stop learning.
        </h2>
        <p>
          Pick up where you left off with your modules, lab sessions, and
          progress.
        </p>
        <img
          src={installation}
          alt="A technician installing a processor on a motherboard"
        />
        <small>
          <ShieldCheck aria-hidden="true" /> Build confidence before working on
          real hardware.
        </small>
      </section>
      <section className="auth-form">
        <Heading
          section={register ? "Get started" : "Welcome back to PC-CRAFT"}
          title={register ? "Create your account." : "Continue your craft."}
        >
          {register
            ? "Create a learner profile to track your progress."
            : "Log in to your learning workspace."}
        </Heading>
        {registered ? (
          <div className="notice" role="status">
            <p>Account created. Log in to start learning.</p>
            <LinkButton to="#/login">Log in</LinkButton>
          </div>
        ) : (
          <>
            <form onSubmit={submit}>
              {register && (
                <div className="form-grid">
                  <label>
                    First name
                    <input
                      name="first_name"
                      autoComplete="given-name"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      name="last_name"
                      autoComplete="family-name"
                      maxLength={100}
                      required
                    />
                  </label>
                </div>
              )}
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 12 : undefined}
                  maxLength={128}
                  aria-describedby={register ? "password-help" : undefined}
                  required
                />
                <button
                  type="button"
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? "Hide" : "Show"}
                </button>
              </div>
              {register ? (
                <small id="password-help">Use at least 12 characters.</small>
              ) : (
                <label className="check">
                  <input type="checkbox" name="remember" /> Remember me
                </label>
              )}
              <Status error={error} />
              <Button type="submit" size="lg" disabled={pending}>
                {pending
                  ? "Please wait…"
                  : register
                    ? "Create account"
                    : "Log in"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </form>
            <p className="auth-switch">
              {register ? "Already have an account?" : "New to PC-CRAFT?"}{" "}
              <a href={register ? "#/login" : "#/register"}>
                {register ? "Log in" : "Create an account"}
              </a>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
