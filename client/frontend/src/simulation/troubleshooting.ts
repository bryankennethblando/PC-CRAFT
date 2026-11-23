import type { BuildId, PartId } from "./catalog"
import type { CableSettings } from "./cableConfig"

export type GuidedScenarioId = "TS-001" | "TS-002" | "TS-003" | "TS-005"
type Test = {
  label: string
  result: string
  part: PartId
  display?: true
  resultByPort?: Partial<Record<DisplayPort, string>>
}
type Choice = {
  label: string
  feedback: string
  correct?: true
  port?: DisplayPort
}
export type DisplayPort = "motherboard" | "gpu" | "unplugged"
export type DisplayState = {
  port: DisplayPort
  screen: "no-signal" | "bios" | "desktop"
}
export const displayReadouts = {
  "no-signal": "No Signal",
  bios: "BIOS splash screen",
  desktop: "Desktop",
} as const
export type GuideStage =
  "observe" | "test" | "diagnose" | "fix" | "verify" | "complete"
type ChoiceStage = "diagnose" | "fix" | "verify"

export type GuidedScenario = {
  id: GuidedScenarioId
  title: string
  build: BuildId
  part: PartId
  intake: string
  faultCue: string
  repairedCue: string
  lift?: number
  display?: "post" | "desktop"
  tests: Test[]
  choices: Record<ChoiceStage, Choice[]>
}

export const guidedScenarios: Record<GuidedScenarioId, GuidedScenario> = {
  "TS-001": {
    id: "TS-001",
    title: "Heavy dust clog and thermal shutdown",
    build: "basic",
    part: "cpu_cooler",
    intake:
      "Windows loads, but the PC shuts down after a few minutes of gaming. The fans get loud and the side panel feels hot.",
    faultCue: "CPU · 99°C at cutoff · Fans 100%",
    repairedCue: "Cooling repair complete · CPU_FAN connected",
    tests: [
      {
        label: "Read CPU temperature under load",
        result:
          "The CPU reaches 99°C before thermal protection shuts the PC down.",
        part: "cpu",
      },
      {
        label: "Check the PSU 12 V rail",
        result: "The 12 V rail stays within the expected ±5% range under load.",
        part: "psu",
      },
      {
        label: "Inspect the dust filter and heatsink",
        result: "Dust blocks about 85% of the heatsink fins.",
        part: "cpu_cooler",
      },
    ],
    choices: {
      diagnose: [
        {
          label: "The PSU voltage drops under load",
          feedback:
            "The 12 V rail stayed within range. Compare the temperature and heatsink evidence.",
        },
        {
          label: "Severe dust buildup blocks the heatsink",
          correct: true,
          feedback:
            "Blocked fins restrict airflow through the heatsink, driving the CPU to thermal cutoff.",
        },
      ],
      fix: [],
      verify: [
        {
          label: "Check fan speed at idle",
          feedback:
            "Fan speed alone cannot verify that the thermal shutdown is gone.",
        },
        {
          label: "Check idle temperature and repeat the load test",
          correct: true,
          feedback:
            "CPU temperature drops to 38°C at idle and stabilizes at 68°C under load. The system runs without shutting down.",
        },
      ],
    },
  },
  "TS-002": {
    id: "TS-002",
    title: "Power on, no display",
    display: "post",
    build: "basic",
    part: "ram_2",
    intake:
      "The fans spin after a memory upgrade, but the monitor reports No Signal and the PC never reaches the firmware screen.",
    faultCue: "DRAM LED · Amber",
    repairedCue: "DRAM LED · Off",
    lift: 0.016,
    tests: [
      {
        label: "Inspect monitor input and HDMI cable",
        result:
          "The monitor is set to HDMI 1. The cable is seated at HDMI 1 and the dedicated GPU output. The display path is correct.",
        part: "gpu",
        display: true,
      },
      {
        label: "Read the POST indicators",
        result:
          "The amber DRAM indicator stays on. POST stops during memory initialization.",
        part: "motherboard",
      },
      {
        label: "Inspect the DIMM retainers",
        result: "DIMM 2 sits above its slot and its retaining clip is open.",
        part: "ram_2",
      },
    ],
    choices: {
      diagnose: [
        {
          label: "The HDMI cable is in the wrong port",
          feedback:
            "The monitor input and graphics-card connection passed the display check.",
        },
        {
          label: "DIMM 2 is loose",
          correct: true,
          feedback:
            "The amber DRAM indicator and open retaining clip both point to a seating problem.",
        },
        {
          label: "The boot drive is missing",
          feedback:
            "POST stops at memory initialization, before it checks the boot drive.",
        },
      ],
      fix: [
        {
          label: "Swap the monitor cable",
          feedback: "A monitor cable change cannot clear the DRAM fault.",
        },
        {
          label: "Isolate power and reseat DIMM 2",
          correct: true,
          feedback:
            "Power is isolated, the notch is aligned, and DIMM 2 is seated evenly with its retainers closed.",
        },
      ],
      verify: [
        {
          label: "Check that the fans spin",
          feedback:
            "The fans already spun before the repair. Check POST and the display.",
        },
        {
          label: "Restore power and run POST",
          correct: true,
          feedback:
            "POST passes, the amber DRAM indicator clears, and the monitor displays the BIOS splash screen.",
        },
      ],
    },
  },
  "TS-003": {
    id: "TS-003",
    title: "Windows starts, but the screen is black",
    build: "basic",
    part: "motherboard",
    display: "desktop",
    intake:
      "The fans run and the Windows startup chime plays after a GPU upgrade. The monitor says No Signal.",
    faultCue: "BOOT LED · Green · POST passed",
    repairedCue: "GPU HDMI · Signal detected",
    tests: [
      {
        label: "Read the POST indicators",
        result: "The BOOT indicator is green. POST passes.",
        part: "motherboard",
      },
      {
        label: "Listen for the Windows startup chime",
        result: "The chime plays. The OS reached the desktop.",
        part: "case",
      },
      {
        label: "Trace the HDMI cable at the rear I/O",
        result:
          "The plug is on the upper motherboard video output. This CPU has no integrated graphics. The dedicated GPU output is free lower on the case.",
        resultByPort: {
          unplugged:
            "The HDMI plug is loose at the PC. The monitor still has no signal.",
          gpu: "Resolved. HDMI is seated in the lower dedicated GPU port. The monitor has a signal and shows the desktop.",
        },
        part: "gpu",
        display: true,
      },
    ],
    choices: {
      diagnose: [
        {
          label: "The PC failed POST",
          feedback:
            "POST passed and the Windows startup chime played. Trace the video signal.",
        },
        {
          label: "HDMI is plugged into the motherboard video output",
          correct: true,
          feedback:
            "The CPU has no integrated graphics. The dedicated GPU provides the display signal.",
        },
      ],
      fix: [
        {
          label: "Unplug the PC end of the HDMI cable",
          port: "unplugged",
          feedback:
            "The plug is loose and the monitor has no signal. Seat it in the dedicated GPU HDMI port.",
        },
        {
          label: "Connect HDMI to the motherboard video port",
          port: "motherboard",
          feedback:
            "That port has no graphics source on this PC. The monitor still has no signal.",
        },
        {
          label: "Connect HDMI to the dedicated GPU port",
          port: "gpu",
          correct: true,
          feedback:
            "The plug is seated on the GPU. The monitor detects a signal and shows the desktop.",
        },
      ],
      verify: [
        {
          label: "Confirm that the Windows chime plays",
          feedback:
            "The chime already played before the repair. Check the visible desktop.",
        },
        {
          label: "Verify the monitor signal and desktop",
          correct: true,
          feedback:
            "The monitor has an HDMI signal from the GPU and the desktop is visible.",
        },
      ],
    },
  },
  "TS-005": {
    id: "TS-005",
    title: "No boot device detected",
    build: "advanced",
    part: "ssd",
    intake:
      "The PC shows the firmware logo and then asks for a proper boot device. The BOOT indicator stays green.",
    faultCue: "BOOT LED · Green · NVMe missing",
    repairedCue: "M.2 SSD seated and secured",
    lift: 0.018,
    tests: [
      {
        label: "Review the POST indicators",
        result: "The CPU, memory, and graphics checks pass.",
        part: "motherboard",
      },
      {
        label: "Check the firmware boot list",
        result:
          "There are no bootable entries. Firmware cannot detect the NVMe system drive.",
        part: "motherboard",
      },
      {
        label: "Inspect the M.2 SSD and its standoff",
        result:
          "The SSD is raised out of position and its retention screw is missing.",
        part: "ssd",
      },
    ],
    choices: {
      diagnose: [
        {
          label: "The boot priority is wrong",
          feedback:
            "The NVMe drive is missing from the firmware list. Deal with detection first.",
        },
        {
          label: "The M.2 SSD is unseated",
          correct: true,
          feedback:
            "The missing retention screw left the drive raised and out of its socket.",
        },
      ],
      fix: [
        {
          label: "Change the order of the existing boot entries",
          feedback:
            "There is no NVMe boot entry to select. Reseat the drive first.",
        },
        {
          label: "Isolate power, reseat the M.2 SSD, and secure the screw",
          correct: true,
          feedback:
            "The drive is fully seated, lies flat, and is secured to its standoff.",
        },
      ],
      verify: [
        {
          label: "Check that the drive lies flat",
          feedback:
            "Physical seating is only part of verification. Check drive detection and boot the OS.",
        },
        {
          label: "Confirm NVMe detection and boot to the desktop",
          correct: true,
          feedback:
            "Firmware detects the NVMe drive and the OS boots to the desktop.",
        },
      ],
    },
  },
}

export const coolerSteps = [
  {
    id: "remove",
    label: "Remove CPU cooler",
    instruction:
      "Isolate power, unplug CPU_FAN, and move the cooler to the workbench.",
    feedback: "The fan lead is unplugged and the cooler is on the workbench.",
  },
  {
    id: "clean",
    label: "Clean removed cooler",
    instruction: "Clear the dust from the exposed heatsink fins.",
    feedback: "Dust clears from the heatsink fins.",
  },
  {
    id: "paste",
    label: "Apply thermal paste",
    instruction:
      "Click the exposed CPU in the 3D view, or select Processor in the component inventory.",
    feedback: "Fresh thermal paste is on the CPU.",
  },
  {
    id: "install",
    label: "Reinstall CPU cooler",
    instruction: "Seat the cooler over the CPU and tighten its mount evenly.",
    feedback: "The cooler is installed. Its fan lead is still unplugged.",
  },
  {
    id: "fan",
    label: "Reconnect CPU fan cable",
    instruction: "Seat the fan cable on the motherboard CPU_FAN header.",
    feedback:
      "The fan cable is seated in CPU_FAN. Restore power and verify cooling under load.",
  },
] as const

export type GuideProgress = {
  stage: GuideStage
  evidence: number[]
  feedback: string
  incorrect: boolean
  displayPort?: DisplayPort
  coolerStep?: number
}
export type GuideAction =
  | { type: "observe" }
  | { type: "test"; index: number }
  | { type: ChoiceStage; index: number }
  | { type: "cooler"; step: (typeof coolerSteps)[number]["id"] }

export function startGuide(): GuideProgress {
  return { stage: "observe", evidence: [], feedback: "", incorrect: false }
}

export function scenarioDisplay(
  scenario: GuidedScenario | undefined,
  progress: GuideProgress
): DisplayState | undefined {
  if (scenario?.display === "post")
    return {
      port: "gpu",
      screen: progress.stage === "complete" ? "bios" : "no-signal",
    }
  if (scenario?.display === "desktop") {
    const port = progress.displayPort ?? "motherboard"
    return { port, screen: port === "gpu" ? "desktop" : "no-signal" }
  }
}

export function evidenceResult(test: Test, display?: DisplayState) {
  return (display && test.resultByPort?.[display.port]) ?? test.result
}

export function advanceGuide(
  scenario: GuidedScenario,
  state: GuideProgress,
  action: GuideAction
): GuideProgress {
  if (action.type === "cooler") {
    if (scenario.id !== "TS-001" || state.stage !== "fix") return state
    const completed = state.coolerStep ?? 0
    const next = coolerSteps[completed]
    if (!next) return state
    if (action.step !== next.id)
      return { ...state, incorrect: true, feedback: next.instruction }
    const coolerStep = completed + 1
    return {
      ...state,
      coolerStep,
      stage: coolerStep === coolerSteps.length ? "verify" : "fix",
      feedback: next.feedback,
      incorrect: false,
    }
  }
  if (state.stage !== action.type) return state
  if (action.type === "observe") return { ...state, stage: "test" }
  if (action.type === "test") {
    if (!scenario.tests[action.index] || state.evidence.includes(action.index))
      return state
    const evidence = [...state.evidence, action.index]
    return {
      ...state,
      evidence,
      stage: evidence.length === scenario.tests.length ? "diagnose" : "test",
    }
  }
  const choice = scenario.choices[action.type][action.index]
  if (!choice) return state
  const next = { diagnose: "fix", fix: "verify", verify: "complete" } as const
  const displayPort = choice.port ?? state.displayPort
  const wrongOutput =
    scenario.display === "desktop" &&
    action.type !== "diagnose" &&
    displayPort !== "gpu"
  const correct = choice.correct && !wrongOutput
  return {
    ...state,
    stage: correct ? next[action.type] : state.stage,
    displayPort,
    feedback:
      choice.correct && wrongOutput
        ? "The monitor needs a signal from the dedicated GPU before verification can pass."
        : choice.feedback,
    incorrect: !correct,
  }
}

export function guideKey(userId: string, id: GuidedScenarioId) {
  return `pc-craft.troubleshooting.v${id === "TS-001" ? 3 : 2}.${userId}.${id}`
}

export function epsCompletionKey(userId: string, build: BuildId) {
  return `pc-craft.troubleshooting.TS-004.${userId}.${build}`
}

export function verifyEpsPost(wiring: CableSettings) {
  if (wiring.eps === "wrong-eps-header")
    return {
      passed: false,
      message:
        "Move the EPS plug to the motherboard 8-pin CPU_PWR header. The 24-pin ATX header is for main power.",
    }
  if (wiring.eps !== "seated")
    return {
      passed: false,
      message:
        "Connect the 8-pin EPS 12V cable to the motherboard CPU_PWR header.",
    }
  if (wiring.atx !== "seated")
    return {
      passed: false,
      message: "Reconnect the 24-pin ATX main power lead.",
    }
  if (wiring.powerSw !== "power-switch")
    return { passed: false, message: "Seat POWER SW on the PWR_SW pins." }
  return { passed: true, message: "The system stays powered and POST begins." }
}

export function restoreGuide(
  scenario: GuidedScenario,
  saved: unknown
): GuideProgress {
  if (
    !saved ||
    typeof saved !== "object" ||
    !("evidence" in saved) ||
    !Array.isArray(saved.evidence) ||
    !("stage" in saved)
  )
    return startGuide()
  const evidence = [
    ...new Set(
      saved.evidence.filter(
        (index) => Number.isInteger(index) && scenario.tests[index]
      )
    ),
  ]
  if (saved.stage === "observe") return startGuide()
  if (evidence.length < scenario.tests.length)
    return { ...startGuide(), stage: "test", evidence }
  let stage: GuideStage =
    saved.stage === "fix" ||
    saved.stage === "verify" ||
    saved.stage === "complete"
      ? saved.stage
      : "diagnose"
  const port = "displayPort" in saved ? saved.displayPort : undefined
  const displayPort =
    scenario.display === "desktop" &&
    (port === "gpu" || port === "motherboard" || port === "unplugged")
      ? port
      : undefined
  if (
    scenario.display === "desktop" &&
    (stage === "verify" || stage === "complete") &&
    displayPort !== "gpu"
  )
    stage = "fix"
  const savedStep = "coolerStep" in saved ? saved.coolerStep : undefined
  const coolerStep =
    scenario.id === "TS-001" &&
    stage !== "diagnose" &&
    typeof savedStep === "number" &&
    Number.isInteger(savedStep) &&
    savedStep >= 0 &&
    savedStep <= coolerSteps.length
      ? savedStep
      : 0
  if (
    scenario.id === "TS-001" &&
    (stage === "verify" || stage === "complete") &&
    coolerStep < coolerSteps.length
  )
    stage = "fix"
  if (
    scenario.id === "TS-001" &&
    stage === "fix" &&
    coolerStep === coolerSteps.length
  )
    stage = "verify"
  return {
    ...startGuide(),
    stage,
    evidence,
    coolerStep,
    displayPort:
      stage === "fix" || stage === "verify" || stage === "complete"
        ? displayPort
        : undefined,
    feedback:
      stage === "complete"
        ? scenario.choices.verify.find(({ correct }) => correct)!.feedback
        : "",
  }
}
