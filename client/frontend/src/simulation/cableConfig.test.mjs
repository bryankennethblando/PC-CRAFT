import assert from "node:assert/strict"
import { test } from "node:test"
import { builds, placements } from "./catalog.ts"
import {
  cableAvailable,
  cables,
  cablesBlockingRemoval,
  cablesForView,
  cableStatus,
  choosePort,
  initialWiring,
  portChoices,
  requiredCableProgress,
  restoreCable,
  seated,
  unplugged,
} from "./cableConfig.ts"

for (const build of Object.values(builds)) {
  const inventory = cables[build.id]
  const basic = build.id === "basic"
  const placed = placements(build, "disassembly", 0)
  const total = basic ? 8 : 9
  test(`${build.name} matches its hardware and scenario defaults`, () => {
    assert.equal(inventory.length, basic ? 8 : 14)
    assert.equal(
      new Set(inventory.map((lead) => lead.id)).size,
      inventory.length
    )
    assert.equal(
      inventory.filter((lead) => lead.to.part === "gpu").length,
      basic ? 1 : 2
    )
    assert.ok(
      inventory.every((lead) =>
        [lead.from, lead.to].every(
          (anchor) =>
            anchor.part === null ||
            (anchor.node && placed[anchor.part] && anchor.part !== "ssd")
        )
      )
    )
    assert.deepEqual(
      cablesForView(build.id, true),
      inventory.filter((c) => c.id !== "ethernet")
    )
    const wiring = initialWiring(build.id, true, true)
    for (const cable of inventory)
      assert.equal(
        cableStatus(wiring[cable.id]),
        cable.scenario === "TS-004" ? "disconnected" : "connected"
      )
    assert.deepEqual(wiring.eps, { from: true, to: "open" })
  })

  test(`${build.name} checks each end in either order, including optional leads`, () => {
    const all = initialWiring(build.id, true)
    const empty = initialWiring(build.id, false)
    assert.deepEqual(requiredCableProgress(build.id, placed, empty), {
      connected: 0,
      total,
    })
    for (const cable of inventory) {
      for (const [first, last] of [
        ["from", "to"],
        ["to", "from"],
      ]) {
        const one = choosePort(
          cable,
          unplugged,
          first,
          cable[first].label
        ).setting
        assert.equal(cableStatus(one), "disconnected")
        assert.deepEqual(
          restoreCable(cable, JSON.parse(JSON.stringify(one)), "assembly"),
          one
        )
        const partial = { ...all, [cable.id]: one }
        assert.equal(
          requiredCableProgress(build.id, placed, partial).connected,
          total - Number(cable.required)
        )
        const choices = portChoices(inventory, cable, last)
        assert.ok(choices.includes(cable[last].label) && choices.length > 1)
        const wrong = choosePort(cable, one, last, "unrelated socket")
        assert.match(wrong.feedback, /Incorrect port/)
        assert.deepEqual(wrong.setting, one)
        const both = choosePort(cable, one, last, cable[last].label).setting
        assert.equal(cableStatus(both), "connected")
        assert.equal(
          requiredCableProgress(build.id, placed, { ...all, [cable.id]: both })
            .connected,
          total
        )
        assert.deepEqual(choosePort(cable, both, last, "").setting, one)
        // Removing a disconnected peer must leave the attached end accessible.
        const attached = cable[first].part,
          free = cable[last].part
        if (attached) {
          const remaining = free ? { ...placed, [free]: undefined } : placed
          assert.ok(
            cablesBlockingRemoval(
              build.id,
              attached,
              remaining,
              partial
            ).includes(cable)
          )
          if (free) assert.equal(cableAvailable(cable, remaining), false)
        }
        if (free)
          assert.ok(
            !cablesBlockingRemoval(build.id, free, placed, partial).includes(
              cable
            )
          )
      }
    }
    for (const part of build.order)
      assert.deepEqual(
        cablesBlockingRemoval(build.id, part, placed, all),
        inventory.filter((c) => c.from.part === part || c.to.part === part)
      )
  })

  test(`${build.name} distinguishes wrong pins, incompatible plugs and old saves`, () => {
    const byId = (id) => inventory.find((c) => c.id === id)
    const sw = byId("powerSw"),
      eps = byId("eps"),
      lan = byId("ethernet")
    const wrongPins = choosePort(
      sw,
      unplugged,
      "to",
      sw.wrongPins.label
    ).setting
    const wrongEps = choosePort(eps, seated, "to", byId("atx").to.label).setting
    assert.equal(cableStatus(wrongPins), "faulted")
    assert.equal(cableStatus(wrongEps), "faulted")
    const wiring = { powerSw: wrongPins, eps: wrongEps }
    assert.deepEqual(
      cablesBlockingRemoval(build.id, "motherboard", placed, wiring),
      [sw]
    )
    assert.deepEqual(cablesBlockingRemoval(build.id, "psu", placed, wiring), [
      eps,
    ])
    assert.deepEqual(restoreCable(eps, "seated", "assembly"), {
      from: false,
      to: "seated",
    })
    assert.deepEqual(restoreCable(eps, "seated", "disassembly"), seated)
    assert.deepEqual(
      restoreCable(lan, "ethernet-connected", "assembly"),
      seated
    )
    assert.deepEqual(restoreCable(lan, "router-only", "assembly"), {
      from: true,
      to: "open",
    })
    assert.equal(restoreCable(lan, "seated", "assembly"), undefined)
    assert.equal(restoreCable(lan, wrongPins, "assembly"), undefined)
  })
}
