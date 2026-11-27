import type { BuildId, Mode, PartId, Placements, Point } from "./catalog"

type Connector =
  | "atx"
  | "eps"
  | "pwm"
  | "switch"
  | "sataData"
  | "sataPower"
  | "rj45"
  | "pcie"
  | "usb"
  | "audio"
export type CableEnd = "from" | "to"
export type CableSetting = {
  from: boolean
  to: "open" | "seated" | "reset" | "wrong-eps"
}
export const unplugged: CableSetting = { from: false, to: "open" }
export const seated: CableSetting = { from: true, to: "seated" }
export type CableSettings = Record<string, CableSetting | undefined>

export type CableAnchor = {
  part: PartId | null
  label: string
  node?: string
  point: Point
  outward: Point
  widthAxis: Point
}

type Route = {
  from: CableAnchor
  to: CableAnchor
  wrongPins?: CableAnchor
  via: Point[]
  unplugClearance?: [outward: number, sideways: number]
  fixedVia?: number[]
}
export type CableDefinition = Route & {
  id: string
  label: string
  connector: Connector
  radius: number
  color: number
  required: boolean
  scenario?: "TS-004"
}

const right: Point = [1, 0, 0]
const left: Point = [-1, 0, 0]
const up: Point = [0, 1, 0]
const down: Point = [0, -1, 0]
const front: Point = [0, 0, 1]
const rear: Point = [0, 0, -1]

// Author points and axes in installed scene coordinates. The renderer binds them
// in node-local coordinates before moving any part into the workbench tray.
function face(
  part: CableAnchor["part"],
  label: string,
  point: Point,
  outward: Point,
  node?: string,
  widthAxis: Point = up
): CableAnchor {
  return { part, label, point, outward, node, widthAxis }
}

const modular = "modular_ports_7"
const sockets = "polySurface21_M_sockets_0"
const headers = "polySurface20_f_2693_1_M_Cover_0"

const basic: Record<string, Route> = {
  atx: {
    from: face(
      "psu",
      "PSU ATX output",
      [-0.15, 0.0234, -0.2576],
      right,
      modular,
      front
    ),
    to: face(
      "motherboard",
      "24-pin ATX header",
      [-0.039, 0.416, -0.305],
      front,
      "24_pin_connector_0"
    ),
    via: [
      [-0.108, 0.051, -0.23],
      [-0.108, 0.084, -0.232],
      [-0.105, 0.114, -0.232],
      [-0.059, 0.161, -0.238],
      [0.017, 0.24, -0.242],
      [0.022, 0.39, -0.25],
    ],
    fixedVia: [1, 2],
  },
  eps: {
    from: face(
      "psu",
      "PSU CPU power output",
      [-0.1485, 0.0239, -0.2233],
      right,
      modular,
      front
    ),
    to: face(
      "motherboard",
      "8-pin CPU_PWR (EPS)",
      [-0.2463, 0.5148, -0.3068],
      front,
      "24_pin_connector001_1",
      right
    ),
    via: [
      [-0.085, 0.053, -0.228],
      [-0.083, 0.083, -0.23],
      [-0.081, 0.112, -0.23],
      [-0.055, 0.154, -0.203],
      [0.004, 0.231, -0.191],
      [0.027, 0.49, -0.246],
      [-0.067, 0.548, -0.26],
      [-0.225, 0.548, -0.267],
    ],
    fixedVia: [1, 2],
  },
  cpuFan: {
    from: face(
      "cpu_cooler",
      "Cooler PWM lead",
      [-0.1109, 0.4457, -0.2731],
      up,
      "Object_78",
      right
    ),
    to: face(
      "motherboard",
      "CPU_FAN header",
      [-0.1004, 0.5188, -0.3198],
      front,
      "motherboard_65",
      right
    ),
    via: [
      [-0.103, 0.485, -0.269],
      [-0.086, 0.507, -0.289],
    ],
  },
  powerSw: {
    from: face(
      "case",
      "Front I/O power switch lead",
      [0.1568, 0.5757, -0.3397],
      down,
      "polySurface10",
      right
    ),
    to: face(
      "motherboard",
      "F_PANEL · PWR_SW pins",
      [-0.1464, 0.1877, -0.3138],
      front,
      "bilinmeyen_pin_8",
      right
    ),
    wrongPins: face(
      "motherboard",
      "F_PANEL · RESET_SW pins",
      [-0.1464, 0.1845, -0.3138],
      front,
      "bilinmeyen_pin_8",
      right
    ),
    via: [
      [0.149, 0.483, -0.325],
      [0.113, 0.302, -0.311],
      [0.012, 0.141, -0.311],
      [-0.143, 0.161, -0.281],
    ],
  },
  sataData: {
    from: face(
      "motherboard",
      "SATA port 1",
      [-0.044, 0.2117, -0.308],
      front,
      "sata_port001_55",
      right
    ),
    to: face(
      "hdd",
      "HDD 7-pin SATA data",
      [0.147, 0.207, -0.277],
      right,
      "Object_19"
    ),
    via: [
      [0.015, 0.221, -0.286],
      [0.082, 0.267, -0.238],
      [0.165, 0.246, -0.238],
      [0.174, 0.208, -0.262],
    ],
  },
  sataPower: {
    from: face(
      "psu",
      "PSU peripheral output",
      [-0.1458, 0.0051, -0.1521],
      right,
      modular,
      front
    ),
    to: face(
      "hdd",
      "HDD 15-pin SATA power",
      [0.147, 0.177, -0.277],
      right,
      "Object_17"
    ),
    via: [
      [-0.065, 0.043, -0.17],
      [0.099, 0.068, -0.198],
      [0.138, 0.104, -0.22],
      [0.179, 0.17, -0.262],
    ],
    fixedVia: [1, 2],
  },
  pcie: {
    from: face(
      "psu",
      "PSU PCIe output",
      [-0.147, 0.0244, -0.1897],
      right,
      modular,
      front
    ),
    unplugClearance: [0.0015, 0.016],
    to: face(
      "gpu",
      "RX 580 8-pin power socket",
      [-0.09, 0.2475, -0.2986],
      rear,
      "Object_2",
      right
    ),
    via: [
      [-0.097, 0.053, -0.227],
      [-0.092, 0.085, -0.226],
      [-0.092, 0.112, -0.226],
      [-0.06, 0.163, -0.25],
      [-0.06, 0.221, -0.301],
      [-0.076, 0.242, -0.311],
    ],
    fixedVia: [1, 2],
  },
  ethernet: {
    from: face(
      null,
      "Router LAN jack",
      [-0.595, -0.034, -0.167],
      right,
      undefined,
      rear
    ),
    to: face(
      "motherboard",
      "Rear LAN jack",
      [-0.3235, 0.3345, -0.2843],
      left,
      "ethernet_and_usb_20_41"
    ),
    via: [
      [-0.52, -0.026, -0.177],
      [-0.449, 0.101, -0.215],
      [-0.41, 0.286, -0.283],
    ],
  },
}

const advanced: Record<string, Route> = {
  atx: {
    from: face(
      "psu",
      "PSU ATX output",
      [0.255, 0.715, -0.356],
      front,
      modular,
      right
    ),
    to: face(
      "motherboard",
      "24-pin ATX header",
      [0.674, 3.478, 0.632],
      left,
      sockets
    ),
    via: [
      [0.26, 0.89, 0.046],
      [0.25, 1.13, 0.116],
      [0.25, 1.4, 0.127],
      [0.45, 1.72, 0.7],
      [0.61, 2.53, 1.03],
      [0.57, 3.58, 1.0],
    ],
    fixedVia: [1, 2],
  },
  eps: {
    from: face(
      "psu",
      "PSU CPU power output",
      [-0.031, 0.717, -0.37],
      front,
      modular,
      right
    ),
    to: face(
      "motherboard",
      "8-pin CPU_PWR (EPS)",
      [0.65, 4.546, -1.232],
      left,
      sockets,
      front
    ),
    via: [
      [0.07, 0.9, 0.048],
      [0.1, 1.12, 0.065],
      [0.1, 1.42, 0.068],
      [0.2, 1.92, 0.71],
      [0.27, 2.78, 1.12],
      [0.37, 4.72, 0.81],
      [0.47, 4.8, -0.91],
      [0.51, 4.63, -1.24],
    ],
    fixedVia: [1, 2],
  },
  cpuFan: {
    from: face(
      "cpu_cooler",
      "Cooler PWM lead",
      [0.309, 3.998, -0.082],
      front,
      "Object_78002"
    ),
    to: face(
      "motherboard",
      "CPU_FAN header",
      [0.76, 4.55, -0.011],
      left,
      headers,
      front
    ),
    via: [
      [0.35, 4.27, 0.153],
      [0.48, 4.49, 0.209],
    ],
  },
  powerSw: {
    from: face(
      "case",
      "Front I/O power switch lead",
      [0.959, 5.198, 2.061],
      down,
      "polySurface10",
      front
    ),
    to: face(
      "motherboard",
      "F_PANEL · PWR_SW pins",
      [0.784, 1.47, 0.475],
      left,
      headers,
      front
    ),
    wrongPins: face(
      "motherboard",
      "F_PANEL · RESET_SW pins",
      [0.784, 1.447, 0.475],
      left,
      headers,
      front
    ),
    via: [
      [0.91, 4.57, 1.94],
      [0.81, 3.48, 1.24],
      [0.76, 2.65, 1.1],
      [0.58, 1.67, 0.88],
    ],
  },
  sataData: {
    from: face(
      "motherboard",
      "SATA port 1",
      [0.754, 1.795, 0.681],
      front,
      headers
    ),
    to: face(
      "hdd",
      "HDD 7-pin SATA data",
      [0.957, 1.895, 2.321],
      front,
      "Object_19"
    ),
    via: [
      [0.61, 1.84, 1.02],
      [0.64, 1.93, 1.95],
      [0.68, 1.95, 2.35],
      [0.85, 1.92, 2.365],
    ],
  },
  sataPower: {
    from: face(
      "psu",
      "PSU peripheral output",
      [-0.622, 0.557, -0.399],
      front,
      modular,
      right
    ),
    to: face(
      "hdd",
      "HDD 15-pin SATA power",
      [0.957, 1.594, 2.321],
      front,
      "Object_17"
    ),
    via: [
      [0.4, 0.83, 0.35],
      [0.62, 1.06, 1.53],
      [0.66, 1.32, 1.68],
      [0.68, 1.44, 2.32],
      [0.85, 1.56, 2.37],
    ],
    fixedVia: [1, 2],
  },
  ethernet: {
    from: face(
      null,
      "Router LAN jack",
      [-0.26, 0.245, -4.08],
      front,
      undefined,
      right
    ),
    to: face(
      "motherboard",
      "Rear LAN jack",
      [0.489, 3.382, -1.883],
      rear,
      "pCylinder41_M_Mobo_0"
    ),
    via: [
      [-0.19, 0.36, -3.45],
      [0.22, 1.63, -2.94],
      [0.46, 3.03, -2.49],
    ],
  },
  frontUsb: {
    from: face(
      "case",
      "Front USB 3.0 lead",
      [0.959, 5.013, 1.532],
      down,
      "polySurface14",
      front
    ),
    to: face(
      "motherboard",
      "USB 3.0 19-pin header",
      [0.791, 1.443, -0.402],
      left,
      headers,
      front
    ),
    via: [
      [0.89, 4.52, 1.52],
      [0.87, 3.2, 1.4],
      [0.78, 2.53, 1.15],
      [0.46, 1.46, 0.65],
      [0.52, 1.37, -0.32],
    ],
  },
  frontAudio: {
    from: face(
      "case",
      "Front headphone/mic lead",
      [0.8995, 5.183, 1.204],
      down,
      "pCylinder6",
      front
    ),
    to: face(
      "motherboard",
      "HD Audio header",
      [0.745, 1.459, -1.386],
      left,
      headers,
      front
    ),
    via: [
      [0.91, 4.52, 1.72],
      [0.9, 3.33, 1.56],
      [0.85, 2.54, 1.47],
      [0.55, 1.37, 0.69],
      [0.52, 1.34, -0.97],
    ],
  },
}

// The 3090 mesh has a solid upper rail. The supplied dual-8-pin adapter
// seats on that rail at the inboard end of the rear fin stack.
export const adapterBase = face(
  "gpu",
  "RTX 3090 12-pin adapter",
  [-0.38, 2.75, -0.83],
  left,
  "Metal_Frame_Metal_0",
  front
)
for (const [index, id] of ["pcie", "pcie2"].entries()) {
  const z = adapterBase.point[2] + (index ? 0.105 : -0.105)
  advanced[id] = {
    from: face(
      "psu",
      `PSU PCIe output ${index + 1}`,
      [-0.311, index ? 0.554 : 0.718, -0.384],
      front,
      modular,
      right
    ),
    to: face(
      "gpu",
      `GPU adapter 8-pin input ${index + 1}`,
      [-0.554, 2.75, z],
      left,
      adapterBase.node,
      front
    ),
    via: [
      [-0.22, 0.85, -0.34 + index * 0.12],
      [0.115 + index * 0.065, 1.08, -0.13 + index * 0.12],
      [0.115 + index * 0.065, 1.42, -0.13 + index * 0.12],
      [-0.31, 1.85, z + 0.28],
      [-0.71, 2.21, z + 0.16],
      [-0.79, 2.62, z],
    ],
    fixedVia: [1, 2],
  }
}

for (const [index, y] of [0.62, 1.93, 3.24].entries()) {
  const number = index + 1
  const fan = `Fan0${number}`
  const boardZ = [-0.028, 0.095, 0.213][index]
  const boardY = 1.456
  advanced[fan] = {
    from: face("case", `${fan} PWM lead`, [-0.68, y, 2.396], rear, fan),
    to: face(
      "motherboard",
      `SYS_FAN${number} header`,
      [0.76 + index * 0.002, boardY, boardZ],
      left,
      headers,
      front
    ),
    via: [
      [-0.73, y, 2.21],
      [-0.72, [1.12, 2.04, 3.56][index], 1.74],
      [-0.13, [1.55, 2.48, 4.48][index], 1.31],
      [0.49, 1.3 - index * 0.04, boardZ + 0.23],
    ],
  }
}

const inventory = [
  {
    id: "atx",
    label: "24-pin ATX main power",
    connector: "atx",
    radius: 0.008,
    color: 0x434d59,
    required: true,
  },
  {
    id: "eps",
    label: "4/8-pin EPS CPU power",
    connector: "eps",
    radius: 0.0055,
    color: 0x536171,
    required: true,
    scenario: "TS-004",
  },
  {
    id: "cpuFan",
    label: "CPU cooler PWM",
    connector: "pwm",
    radius: 0.0028,
    color: 0x536a67,
    required: true,
  },
  {
    id: "powerSw",
    label: "Front-panel POWER SW",
    connector: "switch",
    radius: 0.0026,
    color: 0x70594b,
    required: true,
  },
  {
    id: "sataData",
    label: "HDD SATA data",
    connector: "sataData",
    radius: 0.0038,
    color: 0x94514b,
    required: true,
    unplugClearance: [0.0035, 0],
  },
  {
    id: "sataPower",
    label: "HDD SATA power",
    connector: "sataPower",
    radius: 0.0047,
    color: 0x55515a,
    required: true,
    unplugClearance: [0.0035, 0],
  },
  {
    id: "ethernet",
    label: "External Ethernet RJ45",
    connector: "rj45",
    radius: 0.0043,
    color: 0x3a6485,
    required: true,
    scenario: "TS-004",
  },
  {
    id: "pcie",
    label: "PCIe 6+2-pin GPU power",
    connector: "pcie",
    radius: 0.006,
    color: 0x4c4b55,
    required: true,
  },
  {
    id: "pcie2",
    label: "PCIe GPU power · lead 2",
    connector: "pcie",
    radius: 0.006,
    color: 0x4c4b55,
    required: true,
  },
  ...["Fan01", "Fan02", "Fan03"].map(
    (id) =>
      ({
        id,
        label: `${id} case fan PWM`,
        connector: "pwm",
        radius: 0.0026,
        color: 0x50635a,
        required: false,
      }) as const
  ),
  {
    id: "frontUsb",
    label: "Front-panel USB 3.0",
    connector: "usb",
    radius: 0.0048,
    color: 0x4a5d79,
    required: false,
  },
  {
    id: "frontAudio",
    label: "Front-panel HD Audio",
    connector: "audio",
    radius: 0.0031,
    color: 0x6e6175,
    required: false,
  },
] as const satisfies readonly Omit<CableDefinition, keyof Route>[]

export const cables: Record<BuildId, CableDefinition[]> = {
  basic: inventory.flatMap((cable) =>
    basic[cable.id] ? [{ ...cable, ...basic[cable.id] }] : []
  ),
  advanced: inventory.map((cable) => ({
    ...cable,
    ...advanced[cable.id],
    label: cable.id === "pcie" ? "PCIe GPU power · lead 1" : cable.label,
  })),
}

export function cablesForView(build: BuildId, hasMonitor: boolean) {
  return hasMonitor
    ? cables[build].filter(({ connector }) => connector !== "rj45")
    : cables[build]
}

export function cableAvailable(cable: CableDefinition, placed: Placements) {
  return [cable.from, cable.to].every(
    ({ part }) => part === null || Boolean(placed[part])
  )
}

// Decode v1 tab saves, including the original independently attachable RJ45.
export function restoreCable(
  cable: CableDefinition,
  saved: unknown,
  mode: Mode
): CableSetting | undefined {
  if (
    saved &&
    typeof saved === "object" &&
    "from" in saved &&
    "to" in saved &&
    typeof saved.from === "boolean" &&
    (saved.to === "open" ||
      saved.to === "seated" ||
      (saved.to === "reset" && cable.wrongPins) ||
      (saved.to === "wrong-eps" && cable.connector === "eps"))
  )
    return { from: saved.from, to: saved.to }
  // Old internal-cable controls operated only the destination plug.
  const legacySource = mode === "disassembly"
  switch (saved) {
    case "unplugged":
      return unplugged
    case "seated":
      return cable.connector !== "rj45" && !cable.wrongPins
        ? { from: legacySource, to: "seated" }
        : undefined
    case "power-switch":
      return cable.wrongPins ? { from: legacySource, to: "seated" } : undefined
    case "reset-switch":
      return cable.wrongPins ? { from: legacySource, to: "reset" } : undefined
    case "wrong-eps-header":
      return cable.connector === "eps"
        ? { from: true, to: "wrong-eps" }
        : undefined
    case "ethernet-connected":
      return cable.connector === "rj45" ? seated : undefined
    case "router-only":
      return cable.connector === "rj45" ? { from: true, to: "open" } : undefined
    case "pc-only":
      return cable.connector === "rj45"
        ? { from: false, to: "seated" }
        : undefined
  }
}

export function endAttached(setting: CableSetting, end: CableEnd) {
  return end === "from"
    ? setting.from
    : setting.to === "seated" || setting.to === "reset"
}

export function cableStatus(setting = unplugged) {
  if (setting.to === "reset" || setting.to === "wrong-eps") return "faulted"
  return setting.from && setting.to === "seated" ? "connected" : "disconnected"
}

export function portChoices(
  inventory: CableDefinition[],
  cable: CableDefinition,
  end: CableEnd
) {
  const anchor = cable[end]
  const ports = inventory
    .flatMap((lead) => [lead.from, lead.to])
    .filter((port) => port.part === anchor.part)
    .map((port) => port.label)
  if (cable.wrongPins && end === "to") ports.push(cable.wrongPins.label)
  if (anchor.part === null) ports.push("Router WAN jack")
  if (cable.connector === "rj45" && end === "to") ports.push("Rear USB port")
  // A component with just one lead still needs a distinguishable incorrect choice.
  if (new Set(ports).size === 1)
    ports.push(cable[end === "to" ? "from" : "to"].label)
  return [...new Set(ports)]
}

export function choosePort(
  cable: CableDefinition,
  setting: CableSetting,
  end: CableEnd,
  port: string
) {
  const correct = cable[end].label
  if (end === "to" && port && port === cable.wrongPins?.label)
    return {
      setting: { ...setting, to: "reset" },
      feedback: "Wrong pins. Move POWER SW to the PWR_SW pair.",
    } as const
  if (end === "to" && cable.connector === "eps" && port === "24-pin ATX header")
    return {
      setting: { ...setting, to: "wrong-eps" },
      feedback: "The EPS plug cannot seat in the ATX header. Choose CPU_PWR.",
    } as const
  if (port && port !== correct)
    return { setting, feedback: `Incorrect port. Choose the ${correct}.` }
  const next: CableSetting =
    end === "from"
      ? { ...setting, from: Boolean(port) }
      : { ...setting, to: port ? "seated" : "open" }
  return { setting: next, feedback: "" }
}

export function cablesBlockingRemoval(
  build: BuildId,
  part: PartId,
  placed: Placements,
  wiring: CableSettings
) {
  if (!placed[part]) return []
  return cables[build].filter((cable) => {
    const setting = wiring[cable.id] ?? unplugged
    return (
      (cable.from.part === part && setting.from) ||
      (cable.to.part === part && endAttached(setting, "to"))
    )
  })
}

export function requiredCableProgress(
  build: BuildId,
  placed: Placements,
  wiring: CableSettings
) {
  const required = cables[build].filter((cable) => cable.required)
  const connected = required.filter(
    (cable) =>
      cableAvailable(cable, placed) &&
      cableStatus(wiring[cable.id]) === "connected"
  ).length
  return { connected, total: required.length }
}

export function initialWiring(
  build: BuildId,
  connected: boolean,
  troubleshooting = false
): CableSettings {
  if (!connected) return {}
  return Object.fromEntries(
    cables[build].map((cable) => [
      cable.id,
      troubleshooting && cable.scenario === "TS-004"
        ? { from: cable.id === "eps", to: "open" }
        : seated,
    ])
  )
}
