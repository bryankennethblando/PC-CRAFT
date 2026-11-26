import { ArrowRight } from "lucide-react"
import { Button } from "./components/ui/button"
import { Heading } from "./ui"
import {
  guidedScenarios,
  coolerSteps,
  displayReadouts,
  epsCompletionKey,
  evidenceResult,
  guideKey,
  restoreGuide,
  scenarioExplanations,
  startGuide,
  type GuideAction,
  type DisplayState,
  type GuideProgress,
  type GuidedScenario,
  type GuidedScenarioId,
} from "./simulation/troubleshooting"
import type { BuildId } from "./simulation/catalog"

export type ScenarioId = GuidedScenarioId | "TS-004"

export function readEpsCompletion(userId: string, build: BuildId) {
  try {
    return sessionStorage.getItem(epsCompletionKey(userId, build)) === "passed"
  } catch {
    return false
  }
}

export function readGuide(userId: string, scenario: GuidedScenario) {
  try {
    return restoreGuide(
      scenario,
      JSON.parse(
        sessionStorage.getItem(guideKey(userId, scenario.id)) ?? "null"
      )
    )
  } catch {
    return startGuide()
  }
}

export function ScenarioPicker({
  userId,
  choose,
}: {
  userId: string
  choose: (id: ScenarioId) => void
}) {
  const ids: ScenarioId[] = ["TS-001", "TS-002", "TS-003", "TS-004", "TS-005"]
  return (
    <main id="main" tabIndex={-1} className="wrap workspace lab-picker">
      <Heading
        section="Module 06 · Maintenance & Diagnostics"
        title="Troubleshooting lab"
      >
        Choose a case. Observe the symptoms, test one thing at a time, diagnose
        the fault, and verify the repair.
      </Heading>
      <div className="lab-builds">
        {ids.map((id) => {
          const scenario = id === "TS-004" ? undefined : guidedScenarios[id]
          const complete = scenario
            ? readGuide(userId, scenario).stage === "complete"
            : readEpsCompletion(userId, "basic") ||
              readEpsCompletion(userId, "advanced")
          return (
            <article className="lab-build" key={id}>
              <div className="lab-build-copy">
                <span>
                  {id}
                  {complete && " · Completed"}
                </span>
                <h2>{scenario?.title ?? "Instant power cutoff"}</h2>
                <p>
                  {scenario?.intake ??
                    "The fans twitch briefly and the PC shuts off after a PSU replacement. Check power and the external Ethernet connection."}
                </p>
                <Button onClick={() => choose(id)}>
                  Open {id} <ArrowRight />
                </Button>
              </div>
            </article>
          )
        })}
      </div>
      <p className="lab-local">
        Guided case progress stays in this browser tab.
      </p>
    </main>
  )
}

const phases = ["Observe", "Test", "Diagnose", "Verify"] as const
const phaseNumber = {
  observe: 0,
  test: 1,
  diagnose: 2,
  fix: 2,
  verify: 3,
  complete: 4,
} as const
const titles = {
  observe: "Observe the symptom",
  test: "Run diagnostic tests",
  diagnose: "Choose a diagnosis",
  fix: "Apply a fix",
  verify: "Verify the repair",
  complete: "Scenario complete",
} as const

export function ScenarioExplanation({
  id,
  verified,
}: {
  id: ScenarioId
  verified: boolean
}) {
  if (!verified) return null
  const scenario = id === "TS-004" ? undefined : guidedScenarios[id]
  const explanation = scenarioExplanations[id]
  const evidence =
    scenario?.tests.map(({ label, result }) => `${label}. ${result}`) ??
    scenarioExplanations["TS-004"].evidence
  const result = scenario?.choices.verify.find(
    ({ correct }) => correct
  )?.feedback

  return (
    <section
      className="lab-report lab-placement"
      aria-label="Repair explanation"
    >
      <h2>Repair explanation</h2>
      <h3>What happened</h3>
      <p>{scenario?.intake ?? scenarioExplanations["TS-004"].symptoms}</p>
      <h3>Root cause</h3>
      <p>{explanation.cause}</p>
      <h3>How to diagnose it</h3>
      <ul>
        {evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Repair steps</h3>
      <ol className="lab-repair-steps">
        {explanation.repair.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h3>How to verify the repair</h3>
      <p>{explanation.verification}</p>
      {result && (
        <p>
          <strong>Verified result.</strong> {result}
        </p>
      )}
    </section>
  )
}

export function GuidePanel({
  scenario,
  progress,
  display,
  busy,
  act,
}: {
  scenario: GuidedScenario
  progress: GuideProgress
  display?: DisplayState
  busy: boolean
  act: (action: GuideAction) => void
}) {
  const { stage, evidence, feedback, incorrect } = progress
  const phase = phaseNumber[stage]
  const repaired = stage === "verify" || stage === "complete"
  const choiceStage =
    stage === "diagnose" || stage === "fix" || stage === "verify"
      ? stage
      : undefined
  const repairStep =
    scenario.id === "TS-001" && stage === "fix"
      ? coolerSteps[progress.coolerStep ?? 0]
      : undefined
  return (
    <>
      <section
        className="lab-placement lab-guide"
        aria-label="Troubleshooting guide"
      >
        <ol className="lab-phases" aria-label="Diagnostic phases">
          {phases.map((name, i) => (
            <li key={name} aria-current={phase === i ? "step" : undefined}>
              {name}
            </li>
          ))}
        </ol>
        <progress max={4} value={phase} aria-label="Scenario progress" />
        <h2>{titles[stage]}</h2>
        <p>{scenario.intake}</p>
        <p className="lab-step-label">
          {repaired
            ? scenario.repairedCue
            : repairStep && progress.coolerStep
              ? "Power isolated · Cooling repair in progress"
              : scenario.faultCue}
        </p>
        {display && (
          <p role="status" aria-label="Monitor readout">
            HDMI 1 · {displayReadouts[display.screen]}
          </p>
        )}
        {stage === "observe" && (
          <Button disabled={busy} onClick={() => act({ type: "observe" })}>
            Begin testing
          </Button>
        )}
        {stage === "test" &&
          scenario.tests.map(({ label }, index) => (
            <Button
              key={label}
              variant="outline"
              disabled={busy || evidence.includes(index)}
              onClick={() => act({ type: "test", index })}
            >
              {label}
              {evidence.includes(index) && " · Recorded"}
            </Button>
          ))}
        {repairStep && (
          <>
            <p>
              <strong>
                Repair step {(progress.coolerStep ?? 0) + 1} of{" "}
                {coolerSteps.length} · {repairStep.label}
              </strong>
            </p>
            <p>{repairStep.instruction}</p>
            {repairStep.id !== "paste" && (
              <Button
                disabled={busy}
                onClick={() => act({ type: "cooler", step: repairStep.id })}
              >
                {repairStep.label}
              </Button>
            )}
          </>
        )}
        {choiceStage &&
          scenario.choices[choiceStage].map(({ label }, index) => (
            <Button
              key={label}
              variant="outline"
              disabled={busy}
              onClick={() => act({ type: choiceStage, index })}
            >
              {label}
            </Button>
          ))}
        <p
          role="status"
          className={incorrect ? "lab-feedback invalid" : "lab-feedback"}
        >
          {feedback}
        </p>
      </section>
      <ScenarioExplanation id={scenario.id} verified={stage === "complete"} />
      {evidence.length > 0 && (
        <section className="lab-report" aria-label="Evidence log">
          <h3>Evidence log</h3>
          <ul>
            {evidence.map((index) => {
              const test = scenario.tests[index]
              return (
                <li key={index}>
                  <strong>{test.label}.</strong> {evidenceResult(test, display)}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
