import assert from "node:assert/strict"
import { test } from "node:test"
import { builds, placements } from "./catalog.ts"
import {
  cableAvailable,
  cables,
  cablesBlockingRemoval,
  cablesForView,
  cableStatus,
  chooseEthernetPort,
  ethernetEnds,
  initialWiring,
  isCableSetting,
  requiredCableProgress,
  seatedSetting,
} from "./cableConfig.ts"

const standard = [
  "atx",
  "eps",
  "cpuFan",
  "powerSw",
  "sataData",
  "sataPower",
  "ethernet",
]
const advanced = ["pcie", "Fan01", "Fan02", "Fan03", "frontUsb", "frontAudio"]

for (const build of Object.values(builds)) {
  test(`${build.name} cable inventory and availability`, () => {
    const inventory = cables[build.id]
    const ids = inventory.map(({ id }) => id)
    assert.deepEqual(
      new Set(ids),
      new Set(build.id === "basic" ? standard : [...standard, ...advanced])
    )
    assert.equal(ids.length, new Set(ids).size)

    const assembled = placements(build, "disassembly", 0)
    for (const cable of inventory) {
      assert.ok(cable.via.length > 0)
      assert.ok(cableAvailable(cable, assembled))
      for (const { part } of [cable.from, cable.to]) {
        if (part) {
          assert.ok(build.order.includes(part))
          assert.equal(
            cableAvailable(cable, { ...assembled, [part]: undefined }),
            false
          )
        }
        assert.notEqual(part, "ssd")
      }
    }
    const ethernet = inventory.find(({ id }) => id === "ethernet")
    assert.equal(ethernet.from.part, null)
    assert.equal(ethernet.to.part, "motherboard")
    assert.equal(cablesForView(build.id, false), inventory)
    assert.deepEqual(
      cablesForView(build.id, true).map(({ id }) => id),
      ids.filter((id) => id !== "ethernet")
    )
  })

  test(`${build.name} wiring defaults and fault states`, () => {
    const inventory = cables[build.id]
    const powerSwitch = inventory.find(({ id }) => id === "powerSw")
    assert.notDeepEqual(powerSwitch.to.point, powerSwitch.wrongPins.point)
    assert.equal(cableStatus(seatedSetting(powerSwitch)), "connected")
    assert.equal(cableStatus("reset-switch"), "faulted")

    const assembly = initialWiring(build.id, false)
    const disassembly = initialWiring(build.id, true)
    const troubleshooting = initialWiring(build.id, true, true)
    for (const cable of inventory) {
      assert.equal(cableStatus(assembly[cable.id]), "disconnected")
      assert.equal(cableStatus(disassembly[cable.id]), "connected")
      assert.equal(
        cableStatus(troubleshooting[cable.id]),
        cable.scenario === "TS-004" ? "disconnected" : "connected"
      )
    }
  })

  test(`${build.name} requires both manually chosen Ethernet ports`, () => {
    const placed = placements(build, "assembly", build.order.length)
    const ethernet = cables[build.id].find(({ id }) => id === "ethernet")
    const wiring = { ...initialWiring(build.id, true), ethernet: undefined }
    const total = build.id === "basic" ? 7 : 8

    assert.equal(ethernet.required, true)
    assert.equal(isCableSetting(ethernet, "seated"), false)
    assert.deepEqual(ethernetEnds(wiring.ethernet), {
      router: false,
      pc: false,
    })
    assert.deepEqual(requiredCableProgress(build.id, placed, wiring), {
      connected: total - 1,
      total,
    })

    for (const [first, second, wrong] of [
      ["router", "pc", "usb"],
      ["pc", "router", "wan"],
    ]) {
      wiring.ethernet = chooseEthernetPort(undefined, first, "lan").setting
      assert.equal(isCableSetting(ethernet, wiring.ethernet), true)
      assert.equal(cableStatus(wiring.ethernet), "disconnected")
      assert.equal(ethernetEnds(wiring.ethernet)[first], true)
      assert.equal(ethernetEnds(wiring.ethernet)[second], false)
      assert.deepEqual(requiredCableProgress(build.id, placed, wiring), {
        connected: total - 1,
        total,
      })
      const rejected = chooseEthernetPort(wiring.ethernet, second, wrong)
      assert.match(rejected.feedback, /Incorrect port/)
      assert.equal(rejected.setting, undefined)

      wiring.ethernet = chooseEthernetPort(
        wiring.ethernet,
        second,
        "lan"
      ).setting
      assert.equal(cableStatus(wiring.ethernet), "connected")
      assert.deepEqual(requiredCableProgress(build.id, placed, wiring), {
        connected: total,
        total,
      })
      assert.ok(
        requiredCableProgress(
          build.id,
          { ...placed, motherboard: undefined },
          wiring
        ).connected < total
      )
      assert.equal(
        chooseEthernetPort(wiring.ethernet, second, "").setting,
        first === "router" ? "router-only" : "pc-only"
      )
    }
  })

  test(`${build.name} removal requires every attached cable to be unplugged`, () => {
    const placed = placements(build, "disassembly", 0)
    const wiring = initialWiring(build.id, true)
    const blockers = (part, installed = placed) =>
      cablesBlockingRemoval(build.id, part, installed, wiring).map(
        ({ id }) => id
      )

    for (const part of build.order) {
      assert.deepEqual(
        blockers(part),
        cables[build.id]
          .filter(({ from, to }) => from.part === part || to.part === part)
          .map(({ id }) => id)
      )
    }

    assert.deepEqual(blockers("hdd"), ["sataData", "sataPower"])
    wiring.sataData = "unplugged"
    assert.deepEqual(blockers("hdd"), ["sataPower"])
    wiring.sataPower = "unplugged"
    assert.deepEqual(blockers("hdd"), [])

    wiring.powerSw = "reset-switch"
    wiring.ethernet = "pc-only"
    assert.ok(blockers("motherboard").includes("powerSw"))
    assert.ok(blockers("motherboard").includes("ethernet"))
    wiring.ethernet = "router-only"
    assert.ok(!blockers("motherboard").includes("ethernet"))
    assert.ok(
      !blockers("motherboard", { ...placed, psu: undefined }).includes("atx")
    )
  })
}
