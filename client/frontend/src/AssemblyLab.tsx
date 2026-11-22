import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crosshair,
  Layers,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react"
import { Button } from "./components/ui/button"
import { Heading } from "./ui"
import {
  builds,
  compatibility,
  partIds,
  parts,
  placementError,
  placements,
  stepAt,
  tray,
  type Build,
  type BuildId,
  type Mode,
  type PartId,
} from "./simulation/catalog"
import type { createScene } from "./simulation/scene"
import "./simulation/lab.css"

type Attempt = {
  count: number
  selected: PartId
  destination: string
  feedback: string
  invalid: boolean
}
type Action =
  | { type: "select"; id: PartId }
  | { type: "target"; value: string }
  | { type: "place"; id: PartId; value: string }
  | { type: "restart" }
function start(build: Build, mode: Mode, count: number): Attempt {
  return {
    count,
    selected: stepAt(build, mode, count) ?? "case",
    destination: "",
    feedback: "",
    invalid: false,
  }
}
function update(
  build: Build,
  mode: Mode,
  state: Attempt,
  action: Action
): Attempt {
  switch (action.type) {
    case "restart":
      return start(build, mode, 0)
    case "select":
      return { ...state, selected: action.id, feedback: "", invalid: false }
    case "target":
      return { ...state, destination: action.value }
    case "place": {
      const error = placementError(
        build,
        mode,
        state.count,
        action.id,
        action.value
      )
      if (error)
        return { ...state, selected: action.id, invalid: true, feedback: error }
      const feedback =
        action.id === "case"
          ? "Work area prepared."
          : parts[action.id].name +
            (mode === "assembly"
              ? " installed."
              : " returned to the parts tray.")
      return { ...start(build, mode, state.count + 1), feedback }
    }
  }
}

function Workspace({
  build,
  mode,
  userId,
  leave,
}: {
  build: Build
  mode: Mode
  userId: string
  leave: () => void
}) {
  const storageKey = `pc-craft.lab.v1.${userId}.${build.id}.${mode}`
  const [attempt, dispatch] = useReducer(
    (s: Attempt, a: Action) => update(build, mode, s, a),
    storageKey,
    (key) => {
      let count = 0
      try {
        count = Number(sessionStorage.getItem(key))
      } catch {
        /* Storage may be disabled. */
      }
      return start(
        build,
        mode,
        Number.isInteger(count) && count >= 0 && count <= build.order.length
          ? count
          : 0
      )
    }
  )
  const { count, selected, destination, feedback, invalid } = attempt
  const required = stepAt(build, mode, count)
  const placed = useMemo(
    () => placements(build, mode, count),
    [build, mode, count]
  )
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState("Opening workspace…")
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<ReturnType<typeof createScene> | null>(null)
  const view = useRef({ selected, required, mode, placed })
  useEffect(() => {
    const next = { selected, required, mode, placed }
    view.current = next
    scene.current?.sync(next)
  }, [selected, required, mode, placed])
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(count))
    } catch {
      /* In-memory state remains usable. */
    }
  }, [count, storageKey])
  useEffect(() => {
    let active = true
    import("./simulation/scene")
      .then(({ createScene }) => {
        if (!active || !host.current) return
        scene.current = createScene(host.current, build, view.current, {
          select: (id) => dispatch({ type: "select", id }),
          drop: (id, value) => dispatch({ type: "place", id, value }),
          progress: setLoading,
          ready: () => setLoading(""),
          error: setError,
        })
      })
      .catch(() => {
        if (active)
          setError(
            "The 3D workspace could not start. Enable WebGL 2 or try a browser with hardware acceleration."
          )
      })
    return () => {
      active = false
      scene.current?.dispose()
      scene.current = null
    }
  }, [build, retry])

  const busy = Boolean(loading || error)
  const part = parts[selected]
  const report = compatibility(build, placed)
  const safety = required === "case"
  const installing = mode === "assembly"
  const targets = installing
    ? build.order.flatMap((id) => build.targets[id] ?? [])
    : [{ id: tray, label: "Parts tray" }]
  const found = build.order.filter((id) =>
    (parts[id].name + " " + id + " " + parts[id].purpose)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )
  const stepTitle = safety
    ? "Prepare the work area"
    : required
      ? (installing ? "Install " : "Remove ") +
        parts[required].name.toLowerCase()
      : "Procedure complete"
  return (
    <main id="main" tabIndex={-1} className="lab-page workspace">
      <div className="lab-toolbar">
        <div className="lab-title">
          <Button
            variant="outline"
            size="icon"
            title="Choose another build"
            aria-label="Choose another build"
            onClick={leave}
          >
            <ArrowLeft />
          </Button>
          <div>
            <small>
              Assembly lab / {installing ? "Assembly" : "Disassembly"}
            </small>
            <h1>{build.name}</h1>
          </div>
        </div>
        <div className="lab-tools" aria-label="Workspace controls">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => scene.current?.inspect()}
          >
            <Crosshair /> Inspect part
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Zoom out"
            aria-label="Zoom out"
            disabled={busy}
            onClick={() => scene.current?.zoom(1.25)}
          >
            <Minus />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Zoom in"
            aria-label="Zoom in"
            disabled={busy}
            onClick={() => scene.current?.zoom(0.8)}
          >
            <Plus />
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => scene.current?.resetCamera()}
          >
            <RotateCcw /> Reset view
          </Button>
        </div>
      </div>
      <div className="lab-layout">
        <aside className="lab-palette" aria-label="Component inventory">
          <h2>
            Component inventory <span>{build.order.length}</span>
          </h2>
          <label className="lab-search">
            <Search aria-hidden="true" />
            <input
              aria-label="Search components"
              placeholder="Search components"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="lab-parts">
            {found.map((id) => {
              const status =
                id === required
                  ? "Ready"
                  : placed[id]
                    ? "Installed"
                    : !installing
                      ? "Removed"
                      : "Locked"
              return (
                <button
                  key={id}
                  className="lab-part"
                  aria-pressed={id === selected}
                  onClick={() => dispatch({ type: "select", id })}
                >
                  <span
                    className="lab-thumb"
                    style={{
                      backgroundImage: `url(/assets/lab/${build.id}-parts.webp)`,
                      backgroundPositionX:
                        (partIds.indexOf(id) / (partIds.length - 1)) * 100 +
                        "%",
                    }}
                  />
                  <strong>{parts[id].name}</strong>
                  <small>{parts[id].purpose}</small>
                  <span className="lab-part-status">
                    {id === selected ? "Selected · " : ""}
                    {status}
                  </span>
                </button>
              )
            })}
          </div>
          {!found.length && <p>No matching components.</p>}
        </aside>
        <section className="lab-stage" aria-label="3D workspace">
          <div className="lab-viewport" ref={host} />
          {busy && (
            <div className="lab-overlay" role={error ? "alert" : "status"}>
              <strong>{error || loading}</strong>
              {error && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setError("")
                    setLoading("Opening workspace…")
                    setRetry((n) => n + 1)
                  }}
                >
                  Retry model
                </Button>
              )}
            </div>
          )}
          <div className="lab-canvas-note">
            <MousePointer2 aria-hidden="true" /> Orbit by dragging empty space.
            Scroll to zoom. Shift-drag to pan.
          </div>
        </section>
        <aside className="lab-details" aria-label="Step and component details">
          <section>
            <div className="lab-step-label">
              {required
                ? `Step ${count + 1} of ${build.order.length}`
                : "All steps complete"}
            </div>
            <progress
              max={build.order.length}
              value={count}
              aria-label="Procedure progress"
            />
            <h2>{stepTitle}</h2>
            <p>
              {required
                ? parts[required][installing ? "install" : "remove"]
                : installing
                  ? "All components are in place."
                  : "All removable components are back in the inventory."}
            </p>
            {required && !safety && (
              <p className="lab-target">
                <Crosshair aria-hidden="true" />
                {installing ? build.targets[required]!.label : "Parts tray"}
              </p>
            )}
          </section>
          <section className="lab-inspection">
            <h3>{part.name}</h3>
            <p>{part.purpose}</p>
            {required && selected !== required && (
              <p>{part[installing ? "install" : "remove"]}</p>
            )}
          </section>
          {required && (
            <div className="lab-placement">
              {!safety && (
                <label>
                  Placement target
                  <select
                    value={destination}
                    onChange={(e) =>
                      dispatch({ type: "target", value: e.target.value })
                    }
                  >
                    <option value="">Choose a target</option>
                    {targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Button
                size="lg"
                disabled={busy}
                onClick={() =>
                  dispatch({
                    type: "place",
                    id: selected,
                    value: safety ? "safe" : destination,
                  })
                }
              >
                <Check />
                {safety
                  ? "Confirm safe work area"
                  : installing
                    ? "Place component"
                    : "Remove component"}
              </Button>
              {!safety && (
                <p>
                  Or drag the component to the labeled target in the workspace.
                </p>
              )}
            </div>
          )}
          <p
            role="status"
            className={invalid ? "lab-feedback invalid" : "lab-feedback"}
          >
            {feedback}
          </p>
          <details
            className="lab-report"
            key={required ? "working" : "complete"}
            open={!required}
          >
            <summary>Compatibility · {report.status}</summary>
            <ul>
              {report.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p>
              Example specifications for this exercise. Power connections and
              electrical behavior are outside its scope.
            </p>
          </details>
          <Button
            variant="outline"
            onClick={() => {
              if (
                !count ||
                window.confirm("Restart this procedure from step one?")
              ) {
                dispatch({ type: "restart" })
                scene.current?.resetCamera()
              }
            }}
          >
            Restart procedure
          </Button>
          {!required && (
            <Button onClick={leave}>
              Choose another procedure <ArrowRight />
            </Button>
          )}
        </aside>
      </div>
    </main>
  )
}

export default function AssemblyLab({ userId }: { userId: string }) {
  const [chosen, setChosen] = useState<BuildId | null>(null)
  const [mode, setMode] = useState<Mode>("assembly")
  if (chosen)
    return (
      <Workspace
        build={builds[chosen]}
        mode={mode}
        userId={userId}
        leave={() => setChosen(null)}
      />
    )
  return (
    <main id="main" tabIndex={-1} className="wrap workspace lab-picker">
      <Heading
        section="Learning workspace / Assembly lab"
        title="Choose your build"
      >
        Work through a guided assembly or disassembly using the parts in each
        PC.
      </Heading>
      <fieldset className="lab-mode">
        <legend>Procedure</legend>
        {(["assembly", "disassembly"] as const).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="procedure"
              checked={mode === value}
              onChange={() => setMode(value)}
            />
            {value === "assembly" ? "Assembly" : "Disassembly"}
          </label>
        ))}
      </fieldset>
      <div className="lab-builds">
        {Object.values(builds).map((build) => (
          <article key={build.id} className="lab-build">
            <div className="lab-build-preview">
              <img
                src={`/assets/lab/${build.id}-build.webp`}
                alt={build.name + " assembled with the side panel open"}
              />
            </div>
            <div className="lab-build-copy">
              <span>
                <Layers aria-hidden="true" /> {build.order.length} components
              </span>
              <h2>{build.name}</h2>
              <p>
                {build.id === "basic"
                  ? "Fit two memory modules and a SATA hard drive in a two-slot desktop board."
                  : "Use the recommended pair on a four-slot board and install both SATA and M.2 storage."}
              </p>
              <Button size="lg" onClick={() => setChosen(build.id)}>
                Open {build.name} <ArrowRight />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="lab-local">
        Progress stays in this browser tab. Reopen the same build and procedure
        to continue.
      </p>
    </main>
  )
}
