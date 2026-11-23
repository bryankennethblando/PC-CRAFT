export const partIds = [
  "case",
  "motherboard",
  "cpu",
  "cpu_cooler",
  "ram_1",
  "ram_2",
  "psu",
  "hdd",
  "ssd",
  "gpu",
] as const
export type PartId = (typeof partIds)[number]
export type BuildId = "basic" | "advanced"
export type Mode = "assembly" | "disassembly"
export type Point = [number, number, number]

export const parts: Record<
  PartId,
  { name: string; purpose: string; install: string; remove: string }
> = {
  case: {
    name: "PC case",
    purpose: "Supports and protects the hardware.",
    install:
      "Disconnect mains power, clear the work area and check the tray standoffs.",
    remove:
      "Disconnect mains power and prepare an antistatic surface for removed parts.",
  },
  motherboard: {
    name: "Motherboard",
    purpose: "Connects the processor, memory and expansion devices.",
    install: "Align the rear ports and mounting holes with the tray standoffs.",
    remove: "Release the mounting screws and lift the board by its edges.",
  },
  cpu: {
    name: "Processor",
    purpose: "Executes program instructions.",
    install:
      "Match the corner markers and lower the CPU into its socket without force.",
    remove: "Release the socket mechanism and lift the CPU by its edges.",
  },
  cpu_cooler: {
    name: "CPU cooler",
    purpose: "Transfers heat away from the processor.",
    install:
      "Check the thermal interface, align the mounts and tighten evenly.",
    remove:
      "Release the cooler mounts evenly and gently separate the cooler from the CPU.",
  },
  ram_1: {
    name: "Memory module 1",
    purpose: "Holds data the processor is actively using.",
    install:
      "Open the latch, align the notch with the indicated DIMM slot and seat the module.",
    remove: "Release the DIMM latch and lift the module straight out.",
  },
  ram_2: {
    name: "Memory module 2",
    purpose: "Adds a second module of working memory.",
    install:
      "Align the notch in the second indicated slot and press until the latch closes.",
    remove: "Release the DIMM latch and lift the module straight out.",
  },
  psu: {
    name: "Power supply",
    purpose: "Supplies DC power to the components.",
    install:
      "Align the PSU with its rear mounting holes and keep the fan intake clear.",
    remove: "Support the disconnected PSU as you release its mounting screws.",
  },
  hdd: {
    name: "Hard disk drive",
    purpose: "Stores files on magnetic disks.",
    install:
      "Secure the drive in the case bay with the SATA connectors accessible.",
    remove:
      "Release the drive mounting hardware and support the drive as it comes out.",
  },
  ssd: {
    name: "M.2 SSD",
    purpose: "Provides solid-state storage on the board.",
    install:
      "Align the keyed edge with the M.2 socket, insert it at an angle and secure the free end.",
    remove: "Undo the retaining screw and slide the SSD out at a slight angle.",
  },
  gpu: {
    name: "Graphics card",
    purpose: "Renders graphics and drives the display.",
    install:
      "Line up the rear bracket and seat the edge connector in the primary PCIe x16 slot.",
    remove:
      "Support the card, release the bracket and slot latch, then lift it free.",
  },
}

type Target = { id: string; label: string; center: Point; tolerance: number }
function target(
  id: string,
  label: string,
  center: Point,
  tolerance: number
): Target {
  return { id, label, center, tolerance }
}
// Centers are in GLB scene coordinates. Keep each root's authored quaternion and scale.
// Tolerance is a fraction of case height on the camera-facing drop plane.
const basic = {
  motherboard: target(
    "case.motherboard_tray",
    "Motherboard tray",
    [-0.179, 0.352, -0.294],
    0.085
  ),
  cpu: target(
    "motherboard.cpu_socket",
    "CPU socket",
    [-0.152, 0.408, -0.31],
    0.045
  ),
  cpu_cooler: target(
    "cpu.cooler_mount",
    "CPU cooler mount",
    [-0.152, 0.409, -0.29],
    0.055
  ),
  ram_1: target(
    "motherboard.dimm_1",
    "DIMM slot 1",
    [-0.0815, 0.41, -0.292],
    0.009
  ),
  ram_2: target(
    "motherboard.dimm_2",
    "DIMM slot 2",
    [-0.068, 0.41, -0.292],
    0.009
  ),
  psu: target(
    "case.psu_bay",
    "Power supply bay",
    [-0.244, 0.021, -0.214],
    0.07
  ),
  hdd: target(
    "case.storage_bay",
    "SATA drive bay",
    [0.069, 0.204, -0.27],
    0.065
  ),
  gpu: target(
    "motherboard.pcie_x16",
    "Primary PCIe x16 slot",
    [-0.203, 0.26, -0.235],
    0.055
  ),
}
const advanced = {
  motherboard: target(
    "case.motherboard_tray",
    "Motherboard tray",
    [0.594, 3.008, -0.599],
    0.085
  ),
  cpu: target(
    "motherboard.cpu_socket",
    "CPU socket",
    [0.732, 3.672, -0.441],
    0.045
  ),
  cpu_cooler: target(
    "cpu.cooler_mount",
    "CPU cooler mount",
    [0.466, 3.694, -0.421],
    0.055
  ),
  ram_1: target(
    "motherboard.dimm_a2",
    "DIMM A2 · second slot",
    [0.65, 3.636, 0.239],
    0.009
  ),
  ram_2: target(
    "motherboard.dimm_b2",
    "DIMM B2 · fourth slot",
    [0.574, 3.64, 0.437],
    0.009
  ),
  psu: target(
    "case.psu_bay",
    "Power supply bay",
    [-0.046, 0.677, -1.148],
    0.07
  ),
  hdd: target(
    "case.storage_bay",
    "SATA drive bay",
    [0.862, 1.859, 1.519],
    0.065
  ),
  ssd: target(
    "motherboard.m2",
    "M.2 storage socket",
    [0.779, 2.897, -0.74],
    0.04
  ),
  gpu: target(
    "motherboard.pcie_x16",
    "Primary PCIe x16 slot",
    [0.101, 2.746, -0.869],
    0.055
  ),
}
export type Build = {
  id: BuildId
  name: string
  url: string
  bytes: number
  view: Point
  order: readonly PartId[]
  targets: Partial<Record<PartId, Target>>
  specs: {
    boardSocket: string
    cpuSocket: string
    boardMemory: string
    memory: string
    dimms: string[]
    storage: string[]
  }
}
const specs = {
  boardSocket: "AM4",
  cpuSocket: "AM4",
  boardMemory: "DDR4",
  memory: "DDR4",
}
const modelPath = `${import.meta.env?.BASE_URL ?? "/"}assets/models/`
export const builds: Record<BuildId, Build> = {
  basic: {
    id: "basic",
    name: "Basic Build",
    url: modelPath + "basic_build_optimized.glb",
    bytes: 22598972,
    view: [0.34, 0.22, 1],
    order: partIds.filter((id) => id !== "ssd"),
    targets: basic,
    specs: {
      ...specs,
      dimms: ["motherboard.dimm_1", "motherboard.dimm_2"],
      storage: ["SATA"],
    },
  },
  advanced: {
    id: "advanced",
    name: "Advanced Build",
    url: modelPath + "advanced_build_optimized.glb",
    bytes: 25927436,
    view: [-1, 0.22, 0.34],
    order: partIds,
    targets: advanced,
    specs: {
      ...specs,
      dimms: [
        "motherboard.dimm_a1",
        "motherboard.dimm_a2",
        "motherboard.dimm_b1",
        "motherboard.dimm_b2",
      ],
      storage: ["SATA", "M.2 PCIe"],
    },
  },
}

export const tray = "workbench.parts_tray"
export type Placements = Partial<Record<PartId, string>>

export function stepAt(
  build: Build,
  mode: Mode,
  count: number
): PartId | undefined {
  if (count >= build.order.length) return undefined
  return build.order[
    mode === "assembly" || count === 0 ? count : build.order.length - count
  ]
}

export function placements(
  build: Build,
  mode: Mode,
  count: number
): Placements {
  const installed =
    mode === "assembly"
      ? count
      : Math.min(build.order.length, build.order.length - count + 1)
  return Object.fromEntries(
    build.order
      .slice(0, installed)
      .map((id) => [id, build.targets[id]?.id ?? "workbench.case"])
  )
}

export function placementError(
  build: Build,
  mode: Mode,
  count: number,
  part: PartId,
  destination: string
) {
  const required = stepAt(build, mode, count)
  if (!required) return "This procedure is complete."
  if (part !== required)
    return `Complete the current step first: ${parts[required].name}.`
  if (part === "case")
    return destination === "safe"
      ? ""
      : "Confirm that power is disconnected and the work area is safe."
  const slot = build.targets[part]!
  if (destination !== (mode === "assembly" ? slot.id : tray))
    return mode === "assembly"
      ? `Place ${parts[part].name} at the highlighted target: ${slot.label}.`
      : "Move the removed component to the parts tray."
  return ""
}

export function compatibility(build: Build, placed: Placements) {
  const issues: string[] = [],
    missing: string[] = [],
    notes: string[] = []
  const { specs } = build
  for (const id of build.order) {
    const position = placed[id]
    if (!position) missing.push(parts[id].name)
    else if (id === "ram_1" || id === "ram_2") {
      if (!specs.dimms.includes(position))
        issues.push(`${parts[id].name} is outside a DIMM slot.`)
    } else if (id !== "case" && position !== build.targets[id]!.id) {
      issues.push(
        `${parts[id].name} is outside its configured mounting position.`
      )
    }
  }
  const memorySlots = [placed.ram_1, placed.ram_2].filter(
    (slot): slot is string => Boolean(slot)
  )
  if (memorySlots.length === 2 && memorySlots[0] === memorySlots[1])
    issues.push("Two modules cannot occupy one DIMM slot.")
  const recommended = [build.targets.ram_1!.id, build.targets.ram_2!.id]
  if (
    memorySlots.some(
      (slot) => specs.dimms.includes(slot) && !recommended.includes(slot)
    )
  )
    notes.push(
      "Memory is seated in an alternate DIMM slot. Use the recommended pair for this exercise."
    )
  if (placed.motherboard && placed.cpu && specs.cpuSocket !== specs.boardSocket)
    issues.push("CPU and motherboard sockets differ.")
  if (
    placed.motherboard &&
    (placed.ram_1 || placed.ram_2) &&
    specs.memory !== specs.boardMemory
  )
    issues.push("Memory generation differs from the board requirement.")
  for (const [id, connection] of [
    ["hdd", "SATA"],
    ["ssd", "M.2 PCIe"],
  ] as const)
    if (placed[id] && !specs.storage.includes(connection))
      issues.push(`${connection} storage is unsupported.`)
  const status = issues.length
    ? "Incompatible"
    : missing.length
      ? "Incomplete"
      : "Compatible"
  const reasons = [...issues, ...notes]
  if (missing.length) reasons.push(`Still to install: ${missing.join(", ")}.`)
  if (status === "Compatible") {
    reasons.push(
      `CPU and board share socket ${specs.boardSocket}. Both memory modules use ${specs.boardMemory}.`
    )
    if (!notes.length)
      reasons.push("Both modules occupy their recommended DIMM slots.")
    reasons.push(
      `Graphics card seated in the primary PCIe x16 slot. Supported storage: ${specs.storage.join(" and ")}.`
    )
  }
  return { status, reasons }
}
