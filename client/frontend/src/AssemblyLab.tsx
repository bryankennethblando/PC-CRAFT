import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"
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
import {
  cableAvailable,
  cables,
  cablesBlockingRemoval,
  cablesForView,
  cableStatus,
  chooseEthernetPort,
  ethernetEnds,
  ethernetPorts,
  initialWiring,
  isCableSetting,
  requiredCableProgress,
  seatedSetting,
  type CableSetting,
  type CableSettings,
  type EthernetEnd,
} from "./simulation/cableConfig"
import type { createScene, ViewState } from "./simulation/scene"
import {
  GuidePanel,
  ScenarioPicker,
  readEpsCompletion,
  readGuide,
  type ScenarioId,
} from "./TroubleshootingGuide"
import {
  advanceGuide,
  coolerSteps,
  epsCompletionKey,
  guidedScenarios,
  guideKey,
  scenarioDisplay,
  startGuide,
  verifyEpsPost,
  type GuideAction,
  type GuidedScenario,
} from "./simulation/troubleshooting"
import "./simulation/lab.css"

type Attempt = {
  count: number
  selected: PartId
  destination: string
  feedback: string
  invalid: boolean
  wiring: CableSettings
  selectedCable: string
  cableFeedback: string
}
type Action =
  | { type: "select"; id: PartId }
  | { type: "target"; value: string }
  | { type: "place"; id: PartId; value: string }
  | { type: "selectCable"; id: string }
  | { type: "wire"; id: string; setting: CableSetting }
  | { type: "ethernet-port"; end: EthernetEnd; port: string }
  | { type: "restart" }
function start(
  build: Build,
  mode: Mode,
  count: number,
  troubleshooting: boolean
): Attempt {
  return {
    count,
    selected: stepAt(build, mode, count) ?? "case",
    destination: "",
    feedback: "",
    invalid: false,
    wiring: initialWiring(build.id, mode === "disassembly", troubleshooting),
    selectedCable: troubleshooting ? "eps" : "",
    cableFeedback: "",
  }
}

function restore(
  build: Build,
  mode: Mode,
  key: string,
  troubleshooting: boolean
) {
  if (troubleshooting) return start(build, mode, 0, true)
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "0")
    const count = typeof saved === "number" ? saved : saved?.count
    if (Number.isInteger(count) && count >= 0 && count <= build.order.length) {
      const state = start(build, mode, count, false)
      for (const cable of cables[build.id]) {
        const setting = saved?.wiring?.[cable.id]
        if (isCableSetting(cable, setting)) state.wiring[cable.id] = setting
      }
      return state
    }
  } catch {
    /* In-memory state remains usable. */
  }
  return start(build, mode, 0, false)
}

function update(
  build: Build,
  mode: Mode,
  troubleshooting: boolean,
  state: Attempt,
  action: Action
): Attempt {
  switch (action.type) {
    case "restart":
      return start(build, mode, 0, troubleshooting)
    case "select":
      return {
        ...state,
        selected: action.id,
        selectedCable: "",
        cableFeedback: "",
        feedback: "",
        invalid: false,
      }
    case "selectCable":
      return { ...state, selectedCable: action.id, cableFeedback: "" }
    case "wire": {
      const cable = cables[build.id].find(({ id }) => id === action.id)
      if (
        !cable ||
        cable.connector === "rj45" ||
        !isCableSetting(cable, action.setting) ||
        !cableAvailable(cable, placements(build, mode, state.count))
      )
        return state
      return {
        ...state,
        ...(mode === "disassembly" && { feedback: "", invalid: false }),
        wiring: { ...state.wiring, [action.id]: action.setting },
      }
    }
    case "ethernet-port": {
      const cable = cables[build.id].find(
        ({ connector }) => connector === "rj45"
      )
      if (
        !cable ||
        !cableAvailable(cable, placements(build, mode, state.count))
      )
        return state
      const result = chooseEthernetPort(
        state.wiring[cable.id],
        action.end,
        action.port
      )
      return result.setting
        ? {
            ...state,
            ...(mode === "disassembly" && { feedback: "", invalid: false }),
            cableFeedback: "",
            wiring: { ...state.wiring, [cable.id]: result.setting },
          }
        : { ...state, cableFeedback: result.feedback }
    }
    case "target":
      return { ...state, destination: action.value }
    case "place": {
      if (
        mode === "disassembly" &&
        action.id !== "case" &&
        action.id === stepAt(build, mode, state.count) &&
        cablesBlockingRemoval(
          build.id,
          action.id,
          placements(build, mode, state.count),
          state.wiring
        ).length
      )
        return {
          ...state,
          selected: action.id,
          invalid: true,
          feedback:
            "Removal blocked. Disconnect the cables listed in this step first.",
        }
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
      const next = start(build, mode, state.count + 1, troubleshooting)
      return { ...next, feedback, wiring: state.wiring }
    }
  }
}

function Workspace({
  build,
  mode,
  userId,
  leave,
  troubleshooting,
  scenario,
}: {
  build: Build
  mode: Mode
  userId: string
  leave: () => void
  troubleshooting: boolean
  scenario?: GuidedScenario
}) {
  const storageKey = `pc-craft.lab.v1.${userId}.${build.id}.${mode}`
  const epsCase = troubleshooting && !scenario
  const [checked, setChecked] = useState(() => ({
    power: epsCase && readEpsCompletion(userId, build.id),
    ethernet: false,
  }))
  const [attempt, dispatch] = useReducer(
    (s: Attempt, a: Action) =>
      update(build, mode, troubleshooting && !scenario, s, a),
    storageKey,
    (key) => {
      if (scenario)
        return { ...start(build, mode, 0, false), selected: scenario.part }
      const state = restore(build, mode, key, troubleshooting)
      if (epsCase && checked.power) state.wiring.eps = "seated"
      return state
    }
  )
  const {
    count,
    selected,
    destination,
    feedback,
    invalid,
    wiring: attemptWiring,
    selectedCable,
    cableFeedback,
  } = attempt
  const required = troubleshooting ? undefined : stepAt(build, mode, count)
  const [guide, setGuide] = useState(() =>
    scenario ? readGuide(userId, scenario) : startGuide()
  )
  const coolingCase = scenario?.id === "TS-001"
  const coolerStep = guide.coolerStep ?? 0
  const removed = coolingCase && coolerStep > 0 && coolerStep < 4
  const fanUnplugged =
    coolingCase && coolerStep > 0 && coolerStep < coolerSteps.length
  const placed = useMemo(() => {
    const installed = placements(build, mode, count)
    if (removed) delete installed.cpu_cooler
    return installed
  }, [build, mode, count, removed])
  const wiring = useMemo<CableSettings>(
    () =>
      fanUnplugged ? { ...attemptWiring, cpuFan: "unplugged" } : attemptWiring,
    [attemptWiring, fanUnplugged]
  )
  const cooling = useMemo(
    () =>
      coolingCase
        ? { removed, dusty: coolerStep < 2, paste: removed && coolerStep >= 3 }
        : undefined,
    [coolingCase, coolerStep, removed]
  )
  const post = verifyEpsPost(wiring)
  const postPassed = epsCase && checked.power && post.passed
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState("Opening workspace…")
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const repaired = guide.stage === "verify" || guide.stage === "complete"
  const display = useMemo(
    () => scenarioDisplay(scenario, guide),
    [scenario, guide]
  )
  const diagnostic = useMemo(
    () =>
      scenario && {
        part: scenario.part,
        label: repaired
          ? scenario.repairedCue
          : cooling && coolerStep > 0
            ? cooling.dusty
              ? "Cooler removed · Dusty fins"
              : removed
                ? "Heatsink fins cleared"
                : "CPU_FAN unplugged"
            : scenario.faultCue,
        fault: !repaired && (!cooling || coolerStep === 0 || cooling.dusty),
        lift: repaired ? 0 : scenario.lift,
      },
    [coolerStep, cooling, removed, repaired, scenario]
  )
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<ReturnType<typeof createScene> | null>(null)
  const view = useRef<ViewState>({
    selected,
    required,
    mode,
    placed,
    wiring,
    selectedCable,
    diagnostic,
    display,
    cooling,
  })
  useEffect(() => {
    const next = {
      selected,
      required,
      mode,
      placed,
      wiring,
      selectedCable,
      diagnostic,
      display,
      cooling,
    }
    view.current = next
    scene.current?.sync(next)
  }, [
    selected,
    required,
    mode,
    placed,
    wiring,
    selectedCable,
    diagnostic,
    display,
    cooling,
  ])
  useEffect(() => {
    if (!scenario) return
    try {
      sessionStorage.setItem(
        guideKey(userId, scenario.id),
        JSON.stringify({
          stage: guide.stage,
          evidence: guide.evidence,
          displayPort: guide.displayPort,
          coolerStep: guide.coolerStep,
        })
      )
    } catch {
      /* In-memory state remains usable. */
    }
  }, [guide, scenario, userId])
  useEffect(() => {
    if (!epsCase) return
    const key = epsCompletionKey(userId, build.id)
    try {
      if (postPassed) sessionStorage.setItem(key, "passed")
      else sessionStorage.removeItem(key)
    } catch {
      /* In-memory state remains usable. */
    }
  }, [build.id, epsCase, postPassed, userId])
  useEffect(() => {
    if (troubleshooting) return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ count, wiring }))
    } catch {
      /* In-memory state remains usable. */
    }
  }, [count, storageKey, troubleshooting, wiring])
  const selectPart = useCallback(
    (id: PartId) => {
      dispatch({ type: "select", id })
      if (id === "cpu" && scenario?.id === "TS-001")
        setGuide((progress) =>
          advanceGuide(scenario, progress, { type: "cooler", step: "paste" })
        )
    },
    [scenario]
  )
  useEffect(() => {
    let active = true
    import("./simulation/scene")
      .then(({ createScene }) => {
        if (!active || !host.current) return
        scene.current = createScene(host.current, build, view.current, {
          select: selectPart,
          selectCable: (id) => dispatch({ type: "selectCable", id }),
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
  }, [build, retry, selectPart])

  function actGuide(action: GuideAction) {
    if (!scenario) return
    const next = advanceGuide(scenario, guide, action)
    if (next === guide) return
    setGuide(next)
    if (action.type === "test") {
      const test = scenario.tests[action.index]
      dispatch({ type: "select", id: test.part })
      if (test.display) {
        scene.current?.inspectDisplay()
      } else {
        scene.current?.inspect(test.part)
      }
    } else if (
      action.type === "cooler" &&
      next.coolerStep !== guide.coolerStep
    ) {
      dispatch({ type: "select", id: "cpu_cooler" })
      if (action.step === "remove" || action.step === "install")
        scene.current?.resetCamera()
      if (action.step === "fan") dispatch({ type: "selectCable", id: "cpuFan" })
    } else if (
      next.displayPort !== guide.displayPort ||
      (scenario.display && next.stage === "complete")
    ) {
      scene.current?.inspectDisplay()
    }
  }

  const busy = Boolean(loading || error)
  const inventory = cablesForView(build.id, Boolean(display))
  const cable = inventory.find(({ id }) => id === selectedCable)
  const available = cable && cableAvailable(cable, placed)
  const setting = wiring[selectedCable] ?? "unplugged"
  const status = cableStatus(setting)
  const isEthernet = cable?.connector === "rj45"
  const ends = ethernetEnds(setting)
  const isEps = epsCase && cable?.connector === "eps"
  const wire = (setting: CableSetting) => {
    if (
      epsCase &&
      (selectedCable === "eps" ||
        selectedCable === "atx" ||
        selectedCable === "powerSw") &&
      wiring[selectedCable] !== setting
    )
      setChecked((current) => ({ ...current, power: false }))
    dispatch({ type: "wire", id: selectedCable, setting })
  }
  const cableProgress = requiredCableProgress(build.id, placed, wiring)
  const ethernetConnected = cableStatus(wiring.ethernet) === "connected"
  const part = parts[selected]
  const report = compatibility(build, placed)
  const safety = required === "case"
  const installing = mode === "assembly"
  const removalBlockers =
    !installing && required && !safety
      ? cablesBlockingRemoval(build.id, required, placed, wiring)
      : []
  const wiringPending =
    installing && cableProgress.connected < cableProgress.total
  const complete = !required && !troubleshooting && !wiringPending
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
      : wiringPending
        ? "Connect required cables"
        : "Procedure complete"
  return (
    <main id="main" tabIndex={-1} className="lab-page workspace">
      <div className="lab-toolbar">
        <div className="lab-title">
          <Button
            variant="outline"
            size="icon"
            title={
              scenario ? "Choose another scenario" : "Choose another build"
            }
            aria-label={
              scenario ? "Choose another scenario" : "Choose another build"
            }
            onClick={leave}
          >
            <ArrowLeft />
          </Button>
          <div>
            <small>
              {troubleshooting
                ? `Troubleshooting / ${scenario?.id ?? "TS-004"}`
                : installing
                  ? "Assembly lab / Assembly"
                  : "Assembly lab / Disassembly"}
            </small>
            <h1>{scenario?.title ?? build.name}</h1>
          </div>
        </div>
        <div className="lab-tools" aria-label="Workspace controls">
          {display && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => scene.current?.inspectDisplay()}
            >
              <Crosshair /> Inspect display
            </Button>
          )}
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
                  onClick={() => selectPart(id)}
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
          {scenario ? (
            <GuidePanel
              scenario={scenario}
              progress={guide}
              display={display}
              busy={busy}
              act={actGuide}
            />
          ) : troubleshooting ? (
            <section className="lab-placement">
              <h2>Instant power cutoff</h2>
              <p>
                The fans twitch briefly and the PC shuts off after a PSU
                replacement. Inspect the wiring, then run POST verification.
              </p>
              <p aria-label="EPS connection">
                {wiring.eps === "seated"
                  ? "EPS connection valid. The plug is seated in CPU_PWR."
                  : wiring.eps === "wrong-eps-header"
                    ? "EPS connection invalid. The plug cannot seat in the ATX header."
                    : "EPS connection missing. CPU_PWR is empty."}
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setChecked({ ...checked, power: true })}
              >
                Run POST verification
              </Button>
              <p
                className={
                  post.passed ? "lab-feedback" : "lab-feedback invalid"
                }
                role="status"
                aria-label="POST verification result"
              >
                {postPassed
                  ? `Passed. ${post.message}`
                  : post.passed
                    ? "Ready to verify. Run the POST check to confirm power stays on."
                    : `Not solved. ${post.message}`}
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setChecked({ ...checked, ethernet: true })}
              >
                Check Ethernet link
              </Button>
              <p className="lab-feedback" role="status">
                {checked.ethernet &&
                  (ethernetConnected
                    ? "Ethernet link established in the cable check."
                    : "No Ethernet link. Check the rear LAN connection to the router.")}
              </p>
            </section>
          ) : (
            <section>
              <div className="lab-step-label">
                {required
                  ? `Step ${count + 1} of ${build.order.length}`
                  : wiringPending
                    ? `Wiring · ${cableProgress.connected} of ${cableProgress.total} required cables connected`
                    : "All steps complete"}
              </div>
              <progress
                max={
                  build.order.length + (installing ? cableProgress.total : 0)
                }
                value={count + (installing ? cableProgress.connected : 0)}
                aria-label="Procedure progress"
              />
              <h2>{stepTitle}</h2>
              <p>
                {required
                  ? parts[required][installing ? "install" : "remove"]
                  : wiringPending
                    ? "All components are in place. Finish wiring in the Cables panel."
                    : installing
                      ? "All components are installed and required cables are connected."
                      : "All removable components are back in the inventory."}
              </p>
              {removalBlockers.length > 0 && (
                <p className="lab-target">
                  Disconnect in Cables before removal.{" "}
                  {removalBlockers.map((lead) => lead.label).join(", ")}.
                </p>
              )}
              {required && !safety && (
                <p className="lab-target">
                  <Crosshair aria-hidden="true" />
                  {installing ? build.targets[required]!.label : "Parts tray"}
                </p>
              )}
            </section>
          )}
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
          <section className="lab-placement lab-inspection" aria-label="Cables">
            <h3>
              Cables <small>· {inventory.length}</small>
            </h3>
            <label>
              Select a cable
              <select
                value={selectedCable}
                onChange={(e) =>
                  dispatch({ type: "selectCable", id: e.target.value })
                }
              >
                <option value="">Choose a cable</option>
                {inventory.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.label}
                  </option>
                ))}
              </select>
            </label>
            {cable && (
              <>
                <p>
                  {cable.from.label} to{" "}
                  {setting === "reset-switch" && cable.wrongPins
                    ? cable.wrongPins.label
                    : cable.to.label}
                </p>
                <p
                  role="status"
                  className={
                    status === "faulted" && available
                      ? "lab-feedback invalid"
                      : "lab-feedback"
                  }
                >
                  {!available
                    ? "Install both endpoints to use this cable."
                    : isEps && setting === "wrong-eps-header"
                      ? "Invalid header. The EPS plug is still loose."
                      : isEthernet
                        ? status === "connected"
                          ? "Connected · 2 of 2 ends seated"
                          : `Disconnected · ${Number(ends.router) + Number(ends.pc)} of 2 ends seated`
                        : status === "faulted"
                          ? "Faulted. POWER SW is seated on RESET_SW pins."
                          : status === "connected"
                            ? "Connected."
                            : "Disconnected."}
                </p>
                {!scenario &&
                  (isEps ? (
                    <label>
                      EPS motherboard header
                      <select
                        value={setting}
                        disabled={busy || !available}
                        onChange={(e) => {
                          const value = e.target.value
                          if (
                            value === "unplugged" ||
                            value === "seated" ||
                            value === "wrong-eps-header"
                          )
                            wire(value)
                        }}
                      >
                        <option value="unplugged">Unplugged</option>
                        <option value="seated">8-pin CPU_PWR (EPS)</option>
                        <option value="wrong-eps-header">
                          24-pin ATX main power header
                        </option>
                      </select>
                    </label>
                  ) : isEthernet ? (
                    <>
                      {(["router", "pc"] as const).map((end) => (
                        <label key={end}>
                          {end === "router" ? "Router end port" : "PC end port"}
                          <select
                            value={ends[end] ? "lan" : ""}
                            disabled={busy || !available}
                            onChange={(e) =>
                              dispatch({
                                type: "ethernet-port",
                                end,
                                port: e.target.value,
                              })
                            }
                          >
                            <option value="">Unplugged</option>
                            {ethernetPorts[end].map(([id, name]) => (
                              <option key={id} value={id}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                      <p role="status" className="lab-feedback invalid">
                        {cableFeedback}
                      </p>
                    </>
                  ) : cable.wrongPins ? (
                    <label>
                      POWER SW pin pair
                      <select
                        value={setting}
                        disabled={busy || !available}
                        onChange={(e) => {
                          const value = e.target.value
                          if (
                            value === "unplugged" ||
                            value === "power-switch" ||
                            value === "reset-switch"
                          )
                            wire(value)
                        }}
                      >
                        <option value="unplugged">Disconnected</option>
                        <option value="power-switch">PWR_SW pins</option>
                        <option value="reset-switch">RESET_SW pins</option>
                      </select>
                    </label>
                  ) : (
                    <Button
                      disabled={busy || !available}
                      onClick={() =>
                        wire(
                          status === "connected"
                            ? "unplugged"
                            : seatedSetting(cable)
                        )
                      }
                    >
                      {status === "connected"
                        ? "Disconnect cable"
                        : "Connect cable"}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  disabled={busy || !available}
                  onClick={() => scene.current?.inspectCable(cable.id)}
                >
                  <Crosshair /> Inspect cable
                </Button>
              </>
            )}
            {installing && (
              <p>
                Required cables connected · {cableProgress.connected} of{" "}
                {cableProgress.total}
              </p>
            )}
          </section>
          {!troubleshooting && (
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
                Compatibility uses the example hardware specifications. Cable
                status appears in the Cables panel.
              </p>
            </details>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (
                troubleshooting ||
                !count ||
                window.confirm("Restart this procedure from step one?")
              ) {
                dispatch({ type: "restart" })
                if (scenario) {
                  setGuide(startGuide())
                  dispatch({ type: "select", id: scenario.part })
                }
                setChecked({ power: false, ethernet: false })
                scene.current?.resetCamera()
              }
            }}
          >
            {troubleshooting
              ? `Restart ${scenario?.id ?? "TS-004"}`
              : "Restart procedure"}
          </Button>
          {complete && (
            <Button onClick={leave}>
              Choose another procedure <ArrowRight />
            </Button>
          )}
          {scenario && guide.stage === "complete" && (
            <Button onClick={leave}>
              Choose another scenario <ArrowRight />
            </Button>
          )}
        </aside>
      </div>
    </main>
  )
}

export default function AssemblyLab({
  userId,
  troubleshooting = false,
}: {
  userId: string
  troubleshooting?: boolean
}) {
  const [chosen, setChosen] = useState<BuildId | null>(null)
  const [mode, setMode] = useState<Mode>("assembly")
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null)
  if (troubleshooting && !scenarioId)
    return <ScenarioPicker userId={userId} choose={setScenarioId} />
  if (scenarioId && scenarioId !== "TS-004") {
    const scenario = guidedScenarios[scenarioId]
    return (
      <Workspace
        key={scenarioId}
        build={builds[scenario.build]}
        mode="disassembly"
        troubleshooting
        scenario={scenario}
        userId={userId}
        leave={() => setScenarioId(null)}
      />
    )
  }
  if (chosen)
    return (
      <Workspace
        build={builds[chosen]}
        mode={troubleshooting ? "disassembly" : mode}
        troubleshooting={troubleshooting}
        userId={userId}
        leave={() => setChosen(null)}
      />
    )
  return (
    <main id="main" tabIndex={-1} className="wrap workspace lab-picker">
      {troubleshooting && (
        <Button variant="outline" onClick={() => setScenarioId(null)}>
          <ArrowLeft /> All scenarios
        </Button>
      )}
      <Heading
        section={
          troubleshooting
            ? "Learning workspace / Troubleshooting"
            : "Learning workspace / Assembly lab"
        }
        title={
          troubleshooting
            ? "TS-004 · Instant power cutoff"
            : "Choose your build"
        }
      >
        {troubleshooting
          ? "Choose a PC to diagnose the startup fault and verify the external Ethernet connection."
          : "Work through a guided assembly or disassembly using the parts in each PC."}
      </Heading>
      {!troubleshooting && (
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
      )}
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
      {!troubleshooting && (
        <p className="lab-local">
          Progress stays in this browser tab. Reopen the same build and
          procedure to continue.
        </p>
      )}
    </main>
  )
}
