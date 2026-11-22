import assert from "node:assert/strict"
import { test } from "node:test"
import {
  builds,
  compatibility,
  placements,
  placementError,
  stepAt,
  tray,
} from "./catalog.ts"

for (const build of Object.values(builds)) {
  test(build.name + " guided assembly and disassembly", () => {
    for (const mode of ["assembly", "disassembly"]) {
      const order =
        mode === "assembly"
          ? build.order
          : ["case", ...build.order.slice(1).reverse()]
      order.forEach((id, index) => {
        assert.equal(stepAt(build, mode, index), id)
        const target =
          id === "case"
            ? "safe"
            : mode === "assembly"
              ? build.targets[id].id
              : tray
        for (const other of order.filter((p) => p !== id))
          assert.ok(placementError(build, mode, index, other, target))
        assert.ok(placementError(build, mode, index, id, "wrong"))
        assert.equal(placementError(build, mode, index, id, target), "")
      })
      assert.equal(stepAt(build, mode, order.length), undefined)
      assert.ok(placementError(build, mode, order.length, "case", "safe"))
    }
    assert.deepEqual(placements(build, "disassembly", build.order.length), {
      case: "workbench.case",
    })
    const full = placements(build, "assembly", build.order.length)
    assert.equal(compatibility(build, full).status, "Compatible")
    assert.equal(compatibility(build, {}).status, "Incomplete")
    assert.equal(
      compatibility(build, { ...full, gpu: "wrong" }).status,
      "Incompatible"
    )
    assert.equal(
      compatibility(
        { ...build, specs: { ...build.specs, cpuSocket: "other" } },
        full
      ).status,
      "Incompatible"
    )
    const swapped = compatibility(build, {
      ...full,
      ram_1: full.ram_2,
      ram_2: full.ram_1,
    })
    assert.equal(swapped.status, "Compatible")
    assert.equal(
      compatibility(build, { ...full, ram_2: full.ram_1 }).status,
      "Incompatible"
    )
    if (build.id === "advanced") {
      const alternate = compatibility(build, {
        ...full,
        ram_1: "motherboard.dimm_a1",
      })
      assert.equal(alternate.status, "Compatible")
      assert.match(alternate.reasons.join(" "), /alternate DIMM/)
    }
    assert.equal(Object.hasOwn(full, "ssd"), build.id === "advanced")
  })
}
