import assert from "node:assert/strict"
import { test } from "node:test"
import { builds } from "./catalog.ts"
import {
  advanceGuide,
  coolerSteps,
  evidenceResult,
  guidedScenarios,
  restoreGuide,
  scenarioDisplay,
  startGuide,
  verifyEpsPost,
} from "./troubleshooting.ts"

for (const scenario of Object.values(guidedScenarios)) {
  test(`${scenario.id} gates repair and completion on evidence and verification`, () => {
    let state = startGuide()
    const correct = (type) =>
      scenario.choices[type].findIndex((choice) => choice.correct)
    const wrong = (type) =>
      scenario.choices[type].findIndex((choice) => !choice.correct)
    const act = (type, index) => {
      state = advanceGuide(scenario, state, { type, index })
    }
    assert.ok(builds[scenario.build].order.includes(scenario.part))
    assert.ok(
      scenario.tests.every(({ part }) =>
        builds[scenario.build].order.includes(part)
      )
    )

    act("verify", correct("verify"))
    assert.equal(state.stage, "observe")
    act("observe")
    act("test", 0)
    act("test", 0)
    act("test", 99)
    assert.deepEqual(state.evidence, [0])
    act("diagnose", correct("diagnose"))
    assert.equal(state.stage, "test")
    assert.equal(
      restoreGuide(scenario, { stage: "complete", evidence: [0, 0, 99] }).stage,
      "test"
    )

    scenario.tests.slice(1).forEach((_, i) => act("test", i + 1))
    for (const [current, next] of [
      ["diagnose", "fix"],
      ["fix", "verify"],
      ["verify", "complete"],
    ]) {
      assert.equal(state.stage, current)
      if (scenario.id === "TS-001" && current === "fix") {
        for (const step of coolerSteps)
          state = advanceGuide(scenario, state, {
            type: "cooler",
            step: step.id,
          })
        assert.equal(state.stage, next)
        continue
      }
      act(current, wrong(current))
      assert.equal(state.stage, current)
      assert.ok(state.incorrect)
      assert.ok(state.feedback)
      act(current, correct(current))
      assert.equal(state.stage, next)
      assert.equal(state.incorrect, false)
    }
    assert.equal(restoreGuide(scenario, state).stage, "complete")
    assert.equal(restoreGuide(scenario, state).feedback, state.feedback)
    assert.equal(startGuide().stage, "observe")
  })
}

test("TS-001 blocks early cleaning, paste, cooler installation, fan connection, and verification", () => {
  const scenario = guidedScenarios["TS-001"]
  const evidence = scenario.tests.map((_, index) => index)
  let state = restoreGuide(scenario, { stage: "fix", evidence })
  for (const [index, expected] of coolerSteps.entries()) {
    const wrong = coolerSteps[(index + 1) % coolerSteps.length]
    const rejected = advanceGuide(scenario, state, {
      type: "cooler",
      step: wrong.id,
    })
    assert.equal(rejected.coolerStep ?? 0, index)
    assert.equal(rejected.stage, "fix")
    assert.equal(rejected.feedback, expected.instruction)
    assert.equal(
      advanceGuide(scenario, state, { type: "verify", index: 1 }),
      state
    )
    state = advanceGuide(scenario, state, { type: "cooler", step: expected.id })
    assert.equal(state.coolerStep, index + 1)
    assert.equal(restoreGuide(scenario, state).coolerStep, index + 1)
  }
  assert.equal(state.stage, "verify")
  assert.equal(
    restoreGuide(scenario, { ...state, stage: "complete", coolerStep: 4 })
      .stage,
    "fix"
  )
})

test("TS-004 POST requires EPS at CPU_PWR, main power, and correctly seated POWER SW", () => {
  const ready = { eps: "seated", atx: "seated", powerSw: "power-switch" }
  assert.deepEqual(verifyEpsPost(ready), {
    passed: true,
    message: "The system stays powered and POST begins.",
  })
  assert.match(verifyEpsPost({ ...ready, eps: "unplugged" }).message, /CPU_PWR/)
  for (const fault of [
    { eps: "unplugged" },
    { eps: "wrong-eps-header" },
    { atx: "unplugged" },
    { powerSw: "reset-switch" },
  ])
    assert.equal(verifyEpsPost({ ...ready, ...fault }).passed, false)
})

test("TS-002 keeps the display path correct and shows BIOS only after POST", () => {
  const scenario = guidedScenarios["TS-002"]
  const evidence = scenario.tests.map((_, index) => index)
  let state = restoreGuide(scenario, { stage: "fix", evidence })
  assert.deepEqual(scenarioDisplay(scenario, state), {
    port: "gpu",
    screen: "no-signal",
  })
  state = advanceGuide(scenario, state, { type: "fix", index: 1 })
  assert.equal(state.stage, "verify")
  assert.equal(scenarioDisplay(scenario, state).screen, "no-signal")
  state = advanceGuide(scenario, state, { type: "verify", index: 1 })
  assert.deepEqual(scenarioDisplay(scenario, state), {
    port: "gpu",
    screen: "bios",
  })
})

test("TS-003 needs the GPU connection for a desktop signal and a passing verification", () => {
  const scenario = guidedScenarios["TS-003"]
  const evidence = scenario.tests.map((_, index) => index)
  const trace = scenario.tests.find(({ display }) => display)
  let state = restoreGuide(scenario, { stage: "fix", evidence })
  assert.deepEqual(scenarioDisplay(scenario, state), {
    port: "motherboard",
    screen: "no-signal",
  })
  assert.match(
    evidenceResult(trace, scenarioDisplay(scenario, state)),
    /upper motherboard/
  )
  state = advanceGuide(scenario, state, { type: "fix", index: 0 })
  assert.deepEqual(scenarioDisplay(scenario, state), {
    port: "unplugged",
    screen: "no-signal",
  })
  assert.match(
    evidenceResult(trace, scenarioDisplay(scenario, state)),
    /plug is loose/
  )
  state = advanceGuide(scenario, state, { type: "fix", index: 1 })
  assert.equal(state.stage, "fix")
  assert.equal(scenarioDisplay(scenario, state).port, "motherboard")
  assert.equal(
    restoreGuide(scenario, { ...state, stage: "complete" }).stage,
    "fix"
  )
  state = advanceGuide(scenario, state, { type: "fix", index: 2 })
  assert.equal(state.stage, "verify")
  assert.deepEqual(scenarioDisplay(scenario, state), {
    port: "gpu",
    screen: "desktop",
  })
  assert.match(
    evidenceResult(trace, scenarioDisplay(scenario, state)),
    /Resolved.*GPU port/
  )
  state = advanceGuide(scenario, state, { type: "verify", index: 1 })
  assert.equal(state.stage, "complete")
  assert.equal(restoreGuide(scenario, state).stage, "complete")
  assert.equal(scenarioDisplay(guidedScenarios["TS-001"], state), undefined)
  assert.equal(scenarioDisplay(undefined, state), undefined)
  assert.equal(scenarioDisplay(guidedScenarios["TS-005"], state), undefined)
})
