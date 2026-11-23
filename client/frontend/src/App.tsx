import { lazy, Suspense, useEffect, useState, type ReactNode } from "react"
import { Bell, BookOpen, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Admin } from "./Admin"
import { api, getToken, message, setToken, useResource, type User } from "./api"
import { Dashboard } from "./Dashboard"
import { Modules, ProgressPage } from "./Learning"
import { AuthPage, Landing } from "./Public"
import { Quizzes } from "./Quizzes"
import { Brand, Heading, LinkButton, Status } from "./ui"
import "./site.css"

const AssemblyLab = lazy(() => import("./AssemblyLab"))

const learnerLinks = [
  ["/dashboard", "Overview"],
  ["/modules", "Modules"],
  ["/simulation", "Assembly lab"],
  ["/troubleshooting", "Troubleshooting"],
  ["/quizzes", "Quizzes"],
]
const adminLinks = [
  ["/admin", "Dashboard"],
  ["/admin/modules", "Modules"],
  ["/admin/quizzes", "Quizzes"],
  ["/admin/users", "Users"],
]
const idPattern = /^[1-9]\d{0,19}$/
function currentRoute() {
  const hash = location.hash.slice(1)
  return hash.startsWith("/") ? hash.replace(/\/$/, "") || "/" : "/"
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [token, setSessionToken] = useState(getToken)
  const [signedIn, setSignedIn] = useState<User | null>(null)
  const [logoutState, setLogoutState] = useState<{
    error?: string
    pending?: boolean
  }>({})
  const profile = useResource<User>(token && !signedIn ? "/auth/me" : null)
  const user = signedIn ?? (token ? (profile.data ?? null) : null)
  const [page, tab, id, ...extra] = route.slice(1).split("/")
  const admin = Boolean(user && user.role !== "learner")
  const valid =
    extra.length === 0 &&
    (page === "dashboard"
      ? (!tab || tab === "activity") && !id
      : [
            "",
            "login",
            "register",
            "progress",
            "simulation",
            "troubleshooting",
          ].includes(page)
        ? !tab && !id
        : page === "modules" || page === "quizzes"
          ? (!tab || idPattern.test(tab)) &&
            (!id || (Boolean(tab) && idPattern.test(id)))
          : page === "admin" &&
            (!id ||
              (id === "new"
                ? ["modules", "lessons", "quizzes"].includes(tab)
                : idPattern.test(id) &&
                  ["users", "modules", "lessons", "quizzes"].includes(tab))))
  const protectedPage =
    valid &&
    ["dashboard", "modules", "quizzes", "progress", "admin"].includes(page)
  const denied =
    user &&
    (page === "admin"
      ? !admin
      : ["dashboard", "progress", "quizzes"].includes(page) && admin)
  const home = admin ? "#/admin" : "#/dashboard"
  const links = admin
    ? [
        ...adminLinks,
        ...(user?.role === "super_admin"
          ? [
              ["/admin/logs", "System logs"],
              ["/admin/feedback", "Feedback"],
            ]
          : []),
      ]
    : user
      ? learnerLinks
      : [["/", "Overview"], ...learnerLinks.slice(1)]

  useEffect(() => {
    const change = () => {
      if (!location.hash.startsWith("#/") && location.hash) return
      setRoute(currentRoute())
      window.scrollTo(0, 0)
      requestAnimationFrame(() => document.getElementById("main")?.focus())
    }
    const sessionEnded = () => {
      setSessionToken(null)
      setSignedIn(null)
    }
    window.addEventListener("hashchange", change)
    window.addEventListener("pc-craft-session-ended", sessionEnded)
    return () => {
      window.removeEventListener("hashchange", change)
      window.removeEventListener("pc-craft-session-ended", sessionEnded)
    }
  }, [])

  function login(profile: User) {
    setSessionToken(getToken())
    setSignedIn(profile)
    const next = new URLSearchParams(location.search).get("next")
    history.replaceState(null, "", location.pathname + location.hash)
    const allowed =
      next &&
      /^\/(dashboard|progress|modules|quizzes|admin)(\/|$)/.test(next) &&
      (profile.role === "learner"
        ? !next.startsWith("/admin")
        : /^\/(admin|modules)(\/|$)/.test(next))
    location.hash = allowed
      ? next
      : profile.role === "learner"
        ? "/dashboard"
        : "/admin"
  }

  async function logout() {
    setLogoutState({ pending: true })
    try {
      await api("/auth/logout", "POST")
      setToken(null)
      setSessionToken(null)
      setSignedIn(null)
      location.hash = "/"
      setLogoutState({})
    } catch (error) {
      setLogoutState({ error: message(error) })
    }
  }

  let content: ReactNode
  if (!valid)
    content = (
      <main id="main" tabIndex={-1} className="wrap workspace">
        <Heading title="Page not found" />
        <LinkButton to="#/">Back to overview</LinkButton>
      </main>
    )
  else if (protectedPage && token && !user)
    content = (
      <main id="main" tabIndex={-1} className="wrap workspace">
        <Status {...profile} />
      </main>
    )
  else if (protectedPage && !user)
    content = (
      <main id="main" tabIndex={-1} className="wrap workspace">
        <Heading title="Log in to continue">
          Sign in to open your PC-CRAFT workspace.
        </Heading>
        <LinkButton to={`?next=${encodeURIComponent(route)}#/login`}>
          Log in
        </LinkButton>
      </main>
    )
  else if (denied)
    content = (
      <main id="main" tabIndex={-1} className="wrap workspace">
        <Heading title="Access restricted">
          This page requires a different account role.
        </Heading>
        <LinkButton to={home}>Return to dashboard</LinkButton>
      </main>
    )
  else if (page === "simulation" || page === "troubleshooting") {
    content = (
      <Suspense
        fallback={
          <main id="main" tabIndex={-1} className="wrap workspace">
            <Status loading />
          </main>
        }
      >
        <AssemblyLab
          key={page + ":" + (user?.user_id ?? "guest")}
          userId={user?.user_id ?? "guest"}
          troubleshooting={page === "troubleshooting"}
        />
      </Suspense>
    )
  } else if (page === "login" || page === "register") {
    content = user ? (
      <main id="main" tabIndex={-1} className="wrap workspace">
        <Heading title={`You're signed in as ${user.first_name}.`} />
        <LinkButton to={home}>Open dashboard</LinkButton>
      </main>
    ) : (
      <AuthPage key={page} register={page === "register"} onLogin={login} />
    )
  } else if (user && page === "dashboard")
    content = <Dashboard user={user} activityRequested={tab === "activity"} />
  else if (user && page === "modules")
    content = <Modules key={route} moduleId={tab} lessonId={id} user={user} />
  else if (user && page === "quizzes")
    content = (
      <Quizzes key={route} quizId={tab} attemptId={id} userId={user.user_id} />
    )
  else if (user && page === "progress") content = <ProgressPage user={user} />
  else if (user && page === "admin")
    content = <Admin key={route} user={user} tab={tab} id={id} />
  else content = <Landing user={user} />

  const active = links
    .map(([path]) => path)
    .filter((path) => route === path || route.startsWith(path + "/"))
    .sort((a, b) => b.length - a.length)[0]
  return (
    <div className="app">
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById("main")?.focus()
        }}
      >
        Skip to content
      </a>
      <header
        className={
          user?.role === "learner"
            ? "site-header learner-header"
            : "site-header"
        }
      >
        <div className="wrap header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            {links.map(([path, label]) => (
              <a
                key={path}
                href={`#${path}`}
                aria-current={active === path ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-account">
            {user?.role === "learner" ? (
              <>
                <a
                  className="activity-link"
                  href="#/dashboard/activity"
                  aria-label="Recent activity"
                >
                  <Bell aria-hidden="true" />
                </a>
                <details className="learner-account" key={route}>
                  <summary className="account">
                    <span className="avatar" aria-hidden="true">
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </span>
                    <span>
                      <strong>
                        {user.first_name} {user.last_name}
                      </strong>
                      <small>Foundation learner</small>
                    </span>
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <div className="panel account-menu">
                    <a
                      href="#/progress"
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open")
                      }}
                    >
                      Progress and profile
                    </a>
                    <Button
                      variant="ghost"
                      aria-label="Log out"
                      disabled={logoutState.pending}
                      onClick={logout}
                    >
                      <LogOut aria-hidden="true" /> Log out
                    </Button>
                  </div>
                </details>
              </>
            ) : user ? (
              <>
                <a
                  className="account"
                  href={admin ? home : "#/progress"}
                  aria-label={admin ? "Admin dashboard" : "Your profile"}
                >
                  <span className="avatar" aria-hidden="true">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </span>
                  <span>
                    <strong>
                      {user.first_name} {user.last_name}
                    </strong>
                    <small>{user.role.replaceAll("_", " ")}</small>
                  </span>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Log out"
                  title="Log out"
                  disabled={logoutState.pending}
                  onClick={logout}
                >
                  <LogOut aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <a href="#/login">Log in</a>
                <LinkButton to="#/register">Start learning</LinkButton>
              </>
            )}
          </div>
        </div>
      </header>
      {logoutState.error && (
        <div className="wrap">
          <Status error={logoutState.error} />
        </div>
      )}
      {content}
      <footer
        className={
          user?.role === "learner"
            ? "site-footer learner-footer"
            : "site-footer"
        }
      >
        <div className="wrap">
          <span>© {new Date().getFullYear()} PC-CRAFT</span>
          <a href="#/modules">
            <BookOpen aria-hidden="true" /> Explore modules
          </a>
        </div>
      </footer>
    </div>
  )
}
