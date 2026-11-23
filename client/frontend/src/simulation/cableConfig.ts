import type { BuildId, PartId, Placements, Point } from "./catalog"

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
export type CableSetting =
  | "unplugged"
  | "seated"
  | "power-switch"
  | "reset-switch"
  | "router-only"
  | "pc-only"
  | "ethernet-connected"
  | "wrong-eps-header"
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
  fixedVia?: number[]
}
export type CableDefinition = Route & {
  id: string
  label: string
  connector: Connector
  radius: number
  color: number
  required: boolean
  unplugClearance?: [outward: number, sideways: number]
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

const basic: Record<string, Route> = {
  atx: {
    from: face("psu", "PSU ATX output", [-0.145, 0.014, -0.241], right),
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
    from: face("psu", "PSU CPU power output", [-0.145, 0.013, -0.211], right),
    to: face(
      "motherboard",
      "EPS CPU power header",
      [-0.247, 0.514, -0.306],
      front,
      undefined,
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
      [-0.106, 0.452, -0.277],
      up,
      undefined,
      right
    ),
    to: face(
      "motherboard",
      "CPU_FAN header",
      [-0.083, 0.509, -0.314],
      front,
      undefined,
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
      [0.156, 0.552, -0.34],
      down,
      undefined,
      right
    ),
    to: face(
      "motherboard",
      "F_PANEL · PWR_SW pins",
      [-0.066, 0.183, -0.315],
      front,
      undefined,
      right
    ),
    wrongPins: face(
      "motherboard",
      "F_PANEL · RESET_SW pins",
      [-0.077, 0.183, -0.315],
      front,
      undefined,
      right
    ),
    via: [
      [0.149, 0.483, -0.325],
      [0.113, 0.302, -0.311],
      [0.012, 0.141, -0.311],
      [-0.068, 0.156, -0.276],
    ],
  },
  sataData: {
    from: face(
      "motherboard",
      "SATA port 1",
      [-0.032, 0.212, -0.313],
      right,
      "sata_port001_55"
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
    from: face("psu", "PSU peripheral output", [-0.145, 0.012, -0.171], right),
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
      [-0.323, 0.334, -0.281],
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
    from: face("psu", "PSU ATX output", [0.24, 0.65, -0.349], front),
    to: face("motherboard", "24-pin ATX header", [0.694, 3.81, 0.665], left),
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
    from: face("psu", "PSU CPU power output", [0.04, 0.65, -0.349], front),
    to: face(
      "motherboard",
      "EPS CPU power header",
      [0.692, 4.55, -1.25],
      left,
      undefined,
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
    from: face("cpu_cooler", "Cooler PWM lead", [0.38, 4.12, 0.005], front),
    to: face(
      "motherboard",
      "CPU_FAN header",
      [0.69, 4.51, 0.1],
      left,
      undefined,
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
      [0.96, 4.99, 2.05],
      down,
      undefined,
      front
    ),
    to: face(
      "motherboard",
      "F_PANEL · PWR_SW pins",
      [0.75, 1.534, 0.52],
      left,
      undefined,
      front
    ),
    wrongPins: face(
      "motherboard",
      "F_PANEL · RESET_SW pins",
      [0.75, 1.534, 0.43],
      left,
      undefined,
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
    from: face("motherboard", "SATA port 1", [0.713, 1.84, 0.692], front),
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
    from: face("psu", "PSU peripheral output", [0.232, 0.557, -0.349], front),
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
    to: face("motherboard", "Rear LAN jack", [0.47, 3.478, -1.89], rear),
    via: [
      [-0.19, 0.36, -3.45],
      [0.22, 1.63, -2.94],
      [0.46, 3.03, -2.49],
    ],
  },
  pcie: {
    from: face("psu", "PSU PCIe modular output", [-0.37, 0.65, -0.349], front),
    to: face(
      "gpu",
      "GPU 6+2-pin power input",
      [-0.392, 2.788, -0.42],
      left,
      undefined,
      front
    ),
    via: [
      [-0.2, 0.82, 0.0],
      [0.14, 1.08, -0.055],
      [0.15, 1.42, -0.064],
      [-0.38, 1.77, -0.17],
      [-0.54, 2.18, -0.23],
      [-0.58, 2.7, -0.24],
    ],
    fixedVia: [1, 2],
  },
  frontUsb: {
    from: face(
      "case",
      "Front USB 3.0 lead",
      [0.955, 5.0, 1.52],
      down,
      undefined,
      front
    ),
    to: face(
      "motherboard",
      "USB 3.0 19-pin header",
      [0.74, 1.575, 0.24],
      left,
      undefined,
      front
    ),
    via: [
      [0.89, 4.52, 1.52],
      [0.87, 3.2, 1.4],
      [0.78, 2.53, 1.15],
      [0.46, 1.46, 0.65],
      [0.44, 1.47, 0.36],
    ],
  },
  frontAudio: {
    from: face(
      "case",
      "Front headphone/mic lead",
      [0.96, 5.0, 1.73],
      down,
      undefined,
      front
    ),
    to: face(
      "motherboard",
      "HD Audio header",
      [0.75, 1.54, -1.24],
      left,
      undefined,
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

for (const [index, y] of [0.62, 1.93, 3.24].entries()) {
  const number = index + 1
  const fan = `Fan0${number}`
  const boardY = [1.7, 2.25, 4.27][index]
  advanced[fan] = {
    from: face("case", `${fan} PWM lead`, [-0.68, y, 2.396], rear, fan),
    to: face(
      "motherboard",
      `SYS_FAN${number} header`,
      [0.74, boardY, 0.608],
      left
    ),
    via: [
      [-0.73, y, 2.21],
      [-0.72, [1.12, 2.04, 3.56][index], 1.74],
      [-0.13, [1.55, 2.48, 4.48][index], 1.31],
      [0.48, boardY, 0.96],
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
  advanced: inventory.map((cable) => ({ ...cable, ...advanced[cable.id] })),
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

export function seatedSetting(cable: CableDefinition) {
  if (cable.connector === "rj45") return "ethernet-connected"
  return cable.wrongPins ? "power-switch" : "seated"
}

export function isCableSetting(
  cable: CableDefinition,
  setting: unknown
): setting is CableSetting {
  return (
    setting === "unplugged" ||
    setting === seatedSetting(cable) ||
    (cable.connector === "eps" && setting === "wrong-eps-header") ||
    (Boolean(cable.wrongPins) && setting === "reset-switch") ||
    (cable.connector === "rj45" &&
      (setting === "router-only" || setting === "pc-only"))
  )
}

export const ethernetPorts = {
  router: [
    ["lan", "Router LAN jack"],
    ["wan", "Router WAN jack"],
  ],
  pc: [
    ["lan", "Rear LAN jack"],
    ["usb", "Rear USB port"],
  ],
} as const
export type EthernetEnd = keyof typeof ethernetPorts

export function ethernetEnds(setting: CableSetting | undefined) {
  return {
    router: setting === "router-only" || setting === "ethernet-connected",
    pc: setting === "pc-only" || setting === "ethernet-connected",
  }
}

export function chooseEthernetPort(
  setting: CableSetting | undefined,
  end: EthernetEnd,
  port: string
) {
  if (port !== "" && port !== "lan")
    return {
      feedback: `Incorrect port. Choose the ${ethernetPorts[end][0][1]}.`,
    }
  const ends = { ...ethernetEnds(setting), [end]: port === "lan" }
  return {
    setting:
      ends.router && ends.pc
        ? "ethernet-connected"
        : ends.router
          ? "router-only"
          : ends.pc
            ? "pc-only"
            : "unplugged",
  } as const
}

export function cableStatus(setting: CableSetting | undefined) {
  if (setting === "reset-switch") return "faulted"
  return setting === "seated" ||
    setting === "power-switch" ||
    setting === "ethernet-connected"
    ? "connected"
    : "disconnected"
}

export function cablesBlockingRemoval(
  build: BuildId,
  part: PartId,
  placed: Placements,
  wiring: CableSettings
) {
  return cables[build].filter((cable) => {
    if (!cableAvailable(cable, placed)) return false
    const setting = wiring[cable.id]
    if (!isCableSetting(cable, setting)) return false
    if (cable.connector === "rj45")
      return cable.to.part === part && ethernetEnds(setting).pc
    return (
      cableStatus(setting) !== "disconnected" &&
      (cable.from.part === part || cable.to.part === part)
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
      isCableSetting(cable, wiring[cable.id]) &&
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
        ? "unplugged"
        : seatedSetting(cable),
    ])
  )
}
