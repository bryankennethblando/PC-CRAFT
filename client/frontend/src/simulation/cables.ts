import * as T from "three"
import {
  cableAvailable,
  adapterBase,
  endAttached,
  unplugged,
  type CableAnchor,
  type CableDefinition,
  type CableSettings,
} from "./cableConfig"
import type { PartId, Placements, Point } from "./catalog"

type Part = { root: T.Object3D; center: T.Vector3; target: T.Vector3 }
type Pose = { point: T.Vector3; outward: T.Vector3; wide: T.Vector3 }
const vector = (point: Point) => new T.Vector3(...point)

function anchorPose(
  root: T.Object3D,
  parts: ReadonlyMap<PartId, Part>,
  anchor: CableAnchor
) {
  const part = anchor.part && parts.get(anchor.part)
  const object = part
    ? (anchor.node && part.root.getObjectByName(anchor.node)) || part.root
    : root
  const shift = part ? part.target.clone().sub(part.center) : new T.Vector3()
  const authored = vector(anchor.point)
  const localPoint = object.worldToLocal(authored.clone().sub(shift))
  const inverse = object.matrixWorld.clone().invert()
  const localOutward = vector(anchor.outward).transformDirection(inverse)
  const localWide = vector(anchor.widthAxis).transformDirection(inverse)
  return {
    authored,
    name:
      anchor.label +
      " · " +
      (object.name === anchor.node ? object.name : "virtual"),
    read(installed = true): Pose {
      if (!installed)
        return {
          point: authored.clone(),
          outward: vector(anchor.outward),
          wide: vector(anchor.widthAxis),
        }
      object.updateWorldMatrix(true, false)
      return {
        point: object.localToWorld(localPoint.clone()),
        outward: localOutward.clone().transformDirection(object.matrixWorld),
        wide: localWide.clone().transformDirection(object.matrixWorld),
      }
    },
  }
}

const plugSizes = {
  atx: [0.071, 0.013, 0.019],
  eps: [0.029, 0.013, 0.016],
  pwm: [0.012, 0.006, 0.009],
  switch: [0.007, 0.003, 0.008],
  sataData: [0.015, 0.006, 0.004],
  sataPower: [0.037, 0.007, 0.004],
  rj45: [0.015, 0.013, 0.019],
  pcie: [0.02, 0.009, 0.009],
  usb: [0.025, 0.013, 0.015],
  audio: [0.017, 0.008, 0.01],
}
const outputSize = [0.021, 0.012, 0.013]
const fit = new T.Matrix4()
function pose(group: T.Object3D, { point, outward, wide }: Pose) {
  const up = new T.Vector3().crossVectors(outward, wide).normalize()
  group.position.copy(point)
  group.quaternion.setFromRotationMatrix(
    fit.makeBasis(new T.Vector3().crossVectors(up, outward), up, outward)
  )
}

export function box(
  parent: T.Group,
  material: T.Material,
  width: number,
  height: number,
  depth: number,
  y: number,
  z: number,
  x = 0
) {
  const mesh = new T.Mesh(new T.BoxGeometry(width, height, depth), material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
}

export function plug(
  parent: T.Group,
  size: number[],
  scale: number,
  material: T.MeshStandardMaterial,
  split = false
) {
  const [width, height, depth] = size.map((n) => n * scale)
  const group = new T.Group()
  if (split) {
    box(
      group,
      material,
      width * 0.73,
      height,
      depth,
      0,
      depth / 2,
      -width * 0.135
    )
    box(
      group,
      material,
      width * 0.23,
      height,
      depth,
      0,
      depth / 2,
      width * 0.385
    )
  } else {
    box(group, material, width, height, depth, 0, depth / 2)
  }
  box(
    group,
    material,
    width * 0.38,
    height * 0.23,
    depth * 0.8,
    height * 0.6,
    depth * 0.47
  )
  box(
    group,
    material,
    width * 0.43,
    height * 0.8,
    depth * 0.37,
    0,
    depth * 1.12
  )
  parent.add(group)
  return { group, bootEnd: depth * 1.3 }
}

type CableView = {
  placed: Placements
  wiring: CableSettings
  selectedCable: string
}

export function createCableManager(
  scene: T.Scene,
  host: HTMLElement,
  definitions: readonly CableDefinition[],
  parts: ReadonlyMap<PartId, Part>,
  height: number
) {
  const root = new T.Group()
  root.name = "Procedural cables"
  scene.add(root)
  const scale = height / 0.6464
  const pickMaterial = new T.MeshBasicMaterial({ visible: false })
  const fixedPlugMaterial = new T.MeshStandardMaterial({
    color: 0x29313a,
    roughness: 0.65,
  })
  const adapter = new T.Group()
  const mount =
    definitions.some((cable) => cable.id === "pcie2") &&
    anchorPose(scene, parts, adapterBase)
  if (mount) {
    adapter.name = "RTX 3090 dual 8-pin to 12-pin adapter"
    // One mounted adapter with two independent PSU leads.
    box(adapter, fixedPlugMaterial, 0.2, 0.085, 0.09, 0, 0.045)
    box(adapter, fixedPlugMaterial, 0.41, 0.106, 0.085, 0, 0.1315)
    const inlet = new T.MeshStandardMaterial({ color: 0x13171b })
    for (const x of [-0.105, 0.105])
      box(adapter, inlet, 0.17, 0.075, 0.002, 0, 0.174, x)
    root.add(adapter)
  }
  const leads = definitions.map((definition) => {
    const { from, to, wrongPins, via, fixedVia } = definition
    const group = new T.Group()
    group.name = definition.label
    group.visible = false
    root.add(group)

    const source = anchorPose(scene, parts, from)
    const target = anchorPose(scene, parts, to)
    const misplaced = wrongPins && anchorPose(scene, parts, wrongPins)
    const waypoints = via.map(vector)
    const cableMaterial = new T.MeshStandardMaterial({
      color: definition.color,
      roughness: 0.85,
    })
    const plugMaterial = new T.MeshStandardMaterial({
      color: 0x29313a,
      roughness: 0.65,
    })
    const connector = plugSizes[definition.connector]
    const sourceMaterial = fixedPlugMaterial.clone()
    const start = plug(
      group,
      from.part === "psu" ? outputSize : connector,
      scale,
      sourceMaterial
    )
    const basicGpu = definition.connector === "pcie" && !mount
    const end = plug(
      group,
      basicGpu ? [0.017, 0.007, 0.005] : connector,
      scale,
      plugMaterial,
      definition.connector === "pcie"
    )
    const wire = new T.Mesh(new T.BufferGeometry(), cableMaterial)
    const pickWire = new T.Mesh(new T.BufferGeometry(), pickMaterial)
    group.add(wire, pickWire)

    if (from.part === null) {
      const router = new T.Group()
      router.name = "Virtual router LAN jack"
      pose(router, source.read())
      box(
        router,
        new T.MeshStandardMaterial({ color: 0x364351 }),
        0.16 * scale,
        0.045 * scale,
        0.075 * scale,
        -0.008 * scale,
        -0.0375 * scale
      )
      box(
        router,
        new T.MeshStandardMaterial({ color: 0x141e26 }),
        0.021 * scale,
        0.016 * scale,
        0.003 * scale,
        0,
        0
      )
      root.add(router)
    }

    let previous: T.Vector3[] = []
    return {
      definition,
      group,
      hitTargets: [pickWire, ...start.group.children, ...end.group.children],
      anchors: [source, target, ...(misplaced ? [misplaced] : [])],
      inspect() {
        const a = source.read().point
        const b = target.read()
        return from.part === null
          ? {
              center: a.lerp(b.point, 0.55),
              distance: height * 1.72,
              outside: b.outward,
            }
          : {
              center: start.group.position
                .clone()
                .lerp(end.group.position, 0.5),
              distance: Math.max(
                height * 0.57,
                start.group.position.distanceTo(end.group.position) * 1.5
              ),
            }
      },
      sync({ placed, selectedCable, wiring }: CableView) {
        const setting = wiring[definition.id] ?? unplugged
        const looseSource = !setting.from
        const looseTarget = !endAttached(setting, "to")
        group.visible =
          cableAvailable(definition, placed) || !looseSource || !looseTarget
        if (!group.visible) return
        const selected = selectedCable === definition.id
        const seatedColor = selected ? 0x2f8393 : 0x29313a
        const looseColor = 0x9b793b
        cableMaterial.color.setHex(selected ? 0x2d829b : definition.color)
        sourceMaterial.color.setHex(looseSource ? looseColor : seatedColor)
        plugMaterial.color.setHex(
          setting.to === "reset"
            ? 0xba5229
            : looseTarget
              ? looseColor
              : seatedColor
        )
        const a = source.read(!from.part || !!placed[from.part])
        const sourceDelta = a.point.clone().sub(source.authored)
        const seated = target.read(!to.part || !!placed[to.part])
        const targetDelta = seated.point.clone().sub(target.authored)
        const b =
          setting.to === "reset" && misplaced ? misplaced.read() : seated
        if (looseSource) {
          a.point.addScaledVector(a.outward, 0.023 * scale)
          a.point.addScaledVector(a.wide, 0.009 * scale)
        }
        if (looseTarget) {
          const [outward, sideways] = definition.unplugClearance ?? [
            0.023, 0.009,
          ]
          b.point.addScaledVector(b.outward, outward * scale)
          b.point.addScaledVector(b.wide, sideways * scale)
        }
        // shortcut: Drag routes interpolate without collision checks, revisit if clearance must hold throughout a drag.
        const middle = waypoints.map((waypoint, i) => {
          if (fixedVia?.includes(i)) return waypoint
          const fraction = (i + 1) / (waypoints.length + 1)
          return waypoint
            .clone()
            .addScaledVector(sourceDelta, 1 - fraction)
            .addScaledVector(targetDelta, fraction)
        })
        const first = a.point.clone().addScaledVector(a.outward, start.bootEnd)
        const last = b.point.clone().addScaledVector(b.outward, end.bootEnd)
        const tangent = (boot: T.Vector3, next: T.Vector3, dir: T.Vector3) =>
          boot
            .clone()
            .addScaledVector(
              dir,
              Math.min(0.017 * scale, boot.distanceTo(next) * 0.42)
            )
        const points = [
          first,
          tangent(first, middle[0], a.outward),
          ...middle,
          tangent(last, middle[middle.length - 1], b.outward),
          last,
        ]
        const transforms = [...points, a.outward, a.wide, b.outward, b.wide]
        if (
          transforms.every((p, i) => previous[i]?.distanceToSquared(p) < 1e-12)
        )
          return
        previous = transforms
        pose(start.group, a)
        pose(end.group, b)
        const path = new T.CatmullRomCurve3(points)
        const steps = T.MathUtils.clamp(
          Math.ceil((path.getLength() / height) * 75),
          32,
          150
        )
        for (const [mesh, radius] of [
          [wire, definition.radius],
          [pickWire, Math.max(0.011, definition.radius * 1.7)],
        ] as const) {
          mesh.geometry.dispose()
          mesh.geometry = new T.TubeGeometry(
            path,
            steps,
            radius * scale,
            8,
            false
          )
        }
        group.updateMatrixWorld(true)
      },
    }
  })

  const debug = new URLSearchParams(location.search).has("cableDebug")
  const markers = debug
    ? Array.from({ length: 3 }, (_, index) => {
        const axes = new T.AxesHelper(0.027 * scale)
        axes.visible = false
        root.add(axes)
        const label = document.createElement("span")
        label.className = "lab-anchor"
        if (index === 2) label.style.transform = "translate(-50%, 25%)"
        label.hidden = true
        host.append(label)
        return { axes, label }
      })
    : []
  const projected = new T.Vector3()
  const hitOwners = new Map(
    leads.flatMap((lead) =>
      lead.hitTargets.map((mesh) => [mesh, lead] as const)
    )
  )
  return {
    sync(view: CableView) {
      if (mount) {
        adapter.visible = Boolean(view.placed.gpu)
        if (adapter.visible) pose(adapter, mount.read())
      }
      for (const lead of leads) lead.sync(view)
      const selected = leads.find(
        ({ definition, group }) =>
          group.visible && definition.id === view.selectedCable
      )
      markers.forEach(({ axes, label }, i) => {
        const anchor = selected?.anchors[i]
        axes.visible = Boolean(anchor)
        if (anchor) {
          pose(axes, anchor.read())
          label.textContent = anchor.name
        }
      })
    },
    render(camera: T.Camera) {
      for (const { axes, label } of markers) {
        projected.copy(axes.position).project(camera)
        label.hidden =
          !axes.visible ||
          Math.abs(projected.x) > 1 ||
          Math.abs(projected.y) > 1 ||
          Math.abs(projected.z) > 1
        label.style.left = (projected.x + 1) * 50 + "%"
        label.style.top = (1 - projected.y) * 50 + "%"
      }
    },
    pick(ray: T.Raycaster, distance: number) {
      const hit = ray.intersectObjects(
        leads
          .filter(({ group }) => group.visible)
          .flatMap(({ hitTargets }) => hitTargets),
        false
      )[0]
      return hit && hit.distance <= distance + 0.008 * scale
        ? hitOwners.get(hit.object)?.definition.id
        : undefined
    },
    inspect(id: string) {
      return leads
        .find(({ definition, group }) => group.visible && definition.id === id)
        ?.inspect()
    },
    disposeLabels() {
      for (const { label } of markers) label.remove()
    },
  }
}
