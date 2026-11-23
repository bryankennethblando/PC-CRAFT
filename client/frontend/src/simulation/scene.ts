import * as T from "three"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { createCableManager } from "./cables"
import { createDisplay } from "./display"
import { createCoolingRepair, type CoolingView } from "./coolingRepair"
import { cablesForView, type CableSettings } from "./cableConfig"
import type { DisplayState } from "./troubleshooting"
import {
  tray,
  type Build,
  type PartId,
  type Mode,
  type Placements,
} from "./catalog"

export type ViewState = {
  selected: PartId
  required?: PartId
  mode: Mode
  placed: Placements
  wiring: CableSettings
  selectedCable: string
  diagnostic?: { part: PartId; label: string; fault: boolean; lift?: number }
  display?: DisplayState
  cooling?: CoolingView
}
type Events = {
  select: (id: PartId) => void
  selectCable: (id: string) => void
  drop: (id: PartId, destination: string) => void
  progress: (label: string) => void
  ready: () => void
  error: (message: string) => void
}
type Piece = {
  root: T.Object3D
  original: T.Vector3
  bounds: T.Box3
  center: T.Vector3
  target: T.Vector3
  meshes: T.Mesh[]
}

function release(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>()
  root.traverse((object) => {
    const mesh = object as T.Mesh
    if (mesh.geometry) geometries.add(mesh.geometry)
    if (mesh.material)
      for (const material of [mesh.material].flat()) materials.add(material)
  })
  for (const material of materials) {
    for (const value of Object.values(material))
      if (value instanceof T.Texture) textures.add(value)
    material.dispose()
  }
  for (const texture of textures) {
    texture.dispose()
    if (
      typeof ImageBitmap !== "undefined" &&
      texture.source.data instanceof ImageBitmap
    )
      texture.source.data.close()
  }
  for (const geometry of geometries) geometry.dispose()
}

export function createScene(
  host: HTMLDivElement,
  build: Build,
  initial: ViewState,
  events: Events
) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.transmissionResolutionScale = 0.25
  renderer.toneMapping = T.ACESFilmicToneMapping
  const canvas = renderer.domElement
  canvas.setAttribute("aria-label", build.name + " interactive 3D workspace")
  canvas.setAttribute("role", "img")
  const targetLabel = document.createElement("span")
  targetLabel.className = "lab-anchor"
  targetLabel.hidden = true
  host.append(canvas, targetLabel)
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(37, 1, 0.001, 100)
  const controls = new OrbitControls(camera, canvas)
  const manager = new T.LoadingManager()
  const room = new RoomEnvironment()
  const generator = new T.PMREMGenerator(renderer)
  const environment = generator.fromScene(room, 0.03)
  room.dispose()
  generator.dispose()
  scene.environment = environment.texture
  scene.add(new T.HemisphereLight(0xffffff, 0x9da6bd, 1.4))
  const key = new T.DirectionalLight(0xffffff, 2)
  key.position.set(...build.view).add(new T.Vector3(0, 2, 0))
  scene.add(key)

  function outline(color: number) {
    const helper = new T.Box3Helper(new T.Box3(), color)
    const material = helper.material as T.LineBasicMaterial
    material.depthTest = false
    material.transparent = true
    helper.renderOrder = 5
    helper.visible = false
    scene.add(helper)
    return helper
  }
  const selectedBox = outline(0x477bd2),
    targetBox = outline(0x00856a)
  const pieces = new Map<PartId, Piece>()
  const owners = new Map<T.Object3D, PartId>()
  const ray = new T.Raycaster(),
    pointer = new T.Vector2(),
    point = new T.Vector3()
  const trayCenter = new T.Vector3(),
    home = new T.Vector3()
  const facing = new T.Vector3(...build.view).normalize()
  let state = initial,
    height = 1,
    frame = 0,
    closed = false,
    ready = false
  let cables: ReturnType<typeof createCableManager> | undefined
  let display: ReturnType<typeof createDisplay> | undefined
  let cooling: ReturnType<typeof createCoolingRepair> | undefined
  let cableTap: { id: string; pid: number; x: number; y: number } | undefined
  let drag:
    | {
        id: PartId
        pid: number
        x: number
        y: number
        plane: T.Plane
        offset: T.Vector3
        moved: boolean
      }
    | undefined
  function render() {
    if (!closed && !frame)
      frame = requestAnimationFrame((time) => {
        frame = 0
        const animating = cooling?.animate(time)
        renderer.render(scene, camera)
        cables?.render(camera)
        const cue = state.diagnostic
        const marked = cue && pieces.get(cue.part)
        targetLabel.hidden = !targetBox.visible && !marked
        targetLabel.dataset.fault = String(Boolean(cue?.fault && marked))
        if (targetBox.visible) {
          targetBox.box.getCenter(point)
          point.y = targetBox.box.max.y
        } else if (marked && cue) {
          targetLabel.textContent = cue.label
          point
            .copy(marked.center)
            .add(marked.root.position)
            .sub(marked.original)
          point.y += marked.bounds.max.y - marked.center.y
        }
        if (!targetLabel.hidden) {
          point.project(camera)
          targetLabel.hidden =
            Math.abs(point.x) > 1 ||
            Math.abs(point.y) > 1 ||
            Math.abs(point.z) > 1
          targetLabel.style.left = (point.x + 1) * 50 + "%"
          targetLabel.style.top = (1 - point.y) * 50 + "%"
        }
        if (animating) render()
      })
  }
  function aim(center: T.Vector3, distance: number, direction = facing) {
    controls.target.copy(center)
    camera.position.copy(direction).multiplyScalar(distance).add(center)
    controls.update()
    render()
  }
  function resetCamera() {
    aim(home, height * Math.max(2.1, 3.25 / camera.aspect))
  }
  function destination(id: PartId) {
    return state.mode === "disassembly" ? trayCenter : pieces.get(id)!.target
  }
  function sync(next: ViewState) {
    state = next
    selectedBox.visible = targetBox.visible = false
    for (const [id, piece] of pieces) {
      const installed = id === "case" || Boolean(state.placed[id])
      piece.root.visible =
        installed ||
        (id === "cpu_cooler" && Boolean(state.cooling?.removed)) ||
        id === state.selected ||
        (id === state.required && state.selected === "case")
      if (drag?.id !== id) {
        piece.root.position
          .copy(piece.original)
          .sub(piece.center)
          .add(installed ? piece.target : trayCenter)
        if (state.diagnostic?.part === id && state.diagnostic.lift)
          piece.root.position.addScaledVector(
            facing,
            height * state.diagnostic.lift
          )
      }
      if (id === state.selected && !state.selectedCable && piece.root.visible) {
        selectedBox.box
          .copy(piece.bounds)
          .translate(point.copy(piece.root.position).sub(piece.original))
        selectedBox.visible = true
      }
      if (id === state.required && id !== "case") {
        targetBox.box
          .copy(piece.bounds)
          .translate(point.copy(destination(id)).sub(piece.center))
        targetBox.visible = true
        targetLabel.textContent =
          state.mode === "assembly" ? build.targets[id]!.label : "Parts tray"
      }
    }
    cables?.sync(state)
    if (state.display) display?.sync(state.display)
    const cooler = pieces.get("cpu_cooler")
    if (state.cooling && cooler)
      cooling?.sync(state.cooling, cooler.root.position, cooler.original)
    render()
  }
  function resize() {
    const { clientWidth: width, clientHeight: h } = host
    if (!width || !h) return
    camera.aspect = width / h
    camera.updateProjectionMatrix()
    renderer.setSize(width, h, false)
    render()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()
  controls.addEventListener("change", render)
  const controller = new AbortController()
  const options = { capture: true, signal: controller.signal }
  function setRay(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((e.clientY - rect.top) / rect.height) * 2
    )
    ray.setFromCamera(pointer, camera)
  }
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      cableTap = undefined
      if (
        e.button !== 0 ||
        !e.isPrimary ||
        !ready ||
        drag ||
        e.shiftKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return
      setRay(e)
      const meshes = [...pieces.values()]
        .filter((p) => p.root.visible)
        .flatMap((p) => p.meshes)
      const hit = ray.intersectObjects(meshes, false)[0]
      const id = hit && owners.get(hit.object)
      const cable =
        id && id === state.required && id !== "case"
          ? undefined
          : cables?.pick(ray, hit?.distance ?? Infinity)
      if (cable) {
        cableTap = { id: cable, pid: e.pointerId, x: e.clientX, y: e.clientY }
        return
      }
      if (!id) return
      events.select(id)
      if (id === "case" || !state.required) return
      const piece = pieces.get(id)!
      const plane = new T.Plane().setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new T.Vector3()),
        destination(id)
      )
      if (!ray.ray.intersectPlane(plane, point)) return
      const center = piece.center
        .clone()
        .add(piece.root.position)
        .sub(piece.original)
      drag = {
        id,
        pid: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        plane,
        offset: plane.projectPoint(center, center).sub(point),
        moved: false,
      }
      controls.enabled = false
      canvas.setPointerCapture(e.pointerId)
      e.stopImmediatePropagation()
    },
    options
  )
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (
        cableTap?.pid === e.pointerId &&
        Math.hypot(e.clientX - cableTap.x, e.clientY - cableTap.y) >= 5
      )
        cableTap = undefined
      if (!drag || drag.pid !== e.pointerId) return
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4)
        return
      setRay(e)
      if (!ray.ray.intersectPlane(drag.plane, point)) return
      drag.moved = true
      const piece = pieces.get(drag.id)!
      piece.root.position
        .copy(point)
        .add(drag.offset)
        .sub(piece.center)
        .add(piece.original)
      selectedBox.box
        .copy(piece.bounds)
        .translate(point.copy(piece.root.position).sub(piece.original))
      cables?.sync(state)
      render()
    },
    options
  )
  function endDrag(e: PointerEvent) {
    if (cableTap?.pid === e.pointerId) {
      if (
        e.type === "pointerup" &&
        Math.hypot(e.clientX - cableTap.x, e.clientY - cableTap.y) < 5
      )
        events.selectCable(cableTap.id)
      cableTap = undefined
    }
    if (!drag || drag.pid !== e.pointerId) return
    const { id, moved } = drag
    drag = undefined
    controls.enabled = true
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId)
    if (e.type === "pointerup" && moved) {
      const p = pieces.get(id)!,
        slot = build.targets[id]!
      const distance = point
        .copy(p.center)
        .add(p.root.position)
        .sub(p.original)
        .distanceTo(destination(id))
      events.drop(
        id,
        distance <= slot.tolerance * height
          ? state.mode === "assembly"
            ? slot.id
            : tray
          : ""
      )
    }
    sync(state)
  }
  for (const event of [
    "pointerup",
    "pointercancel",
    "lostpointercapture",
  ] as const)
    canvas.addEventListener(event, endDrag, options)
  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault()
      if (!closed)
        events.error(
          "The graphics context was lost. Reload the workspace to continue this step."
        )
    },
    options
  )

  // Decoder requests can be shared across workspaces, so keep them off the abortable scene manager.
  const draco = new DRACOLoader().setDecoderPath(
    `${import.meta.env.BASE_URL}draco/`
  )
  new GLTFLoader(manager).setDRACOLoader(draco).load(
    build.url,
    (gltf) => {
      draco.dispose()
      if (closed) {
        release(gltf.scene)
        return
      }
      scene.add(gltf.scene)
      try {
        for (const node of gltf.scene.children) node.visible = false
        for (const id of build.order) {
          const root = gltf.scene.children.find((node) => node.name === id)
          if (!root) throw Error("Missing component: " + id)
          const bounds = new T.Box3().setFromObject(root, true)
          const center = bounds.getCenter(new T.Vector3()),
            meshes: T.Mesh[] = []
          root.traverse((node) => {
            if (node instanceof T.Mesh) {
              meshes.push(node)
              owners.set(node, id)
            }
          })
          if (!meshes.length || bounds.isEmpty())
            throw Error("Empty component: " + id)
          const slot = build.targets[id]
          pieces.set(id, {
            root,
            original: root.position.clone(),
            bounds,
            center,
            target: slot ? new T.Vector3(...slot.center) : center.clone(),
            meshes,
          })
        }
        const chassis = pieces.get("case")!
        height = chassis.bounds.max.y - chassis.bounds.min.y
        if (state.cooling)
          cooling = createCoolingRepair(
            scene,
            pieces.get("cpu_cooler")!.bounds,
            pieces.get("cpu")!.bounds
          )
        cables = createCableManager(
          scene,
          host,
          cablesForView(build.id, Boolean(state.display)),
          pieces,
          height
        )
        if (state.display)
          display = createDisplay(scene, chassis.bounds, height)
        const right = new T.Vector3()
          .crossVectors(camera.up, facing)
          .normalize()
        trayCenter.copy(chassis.center).addScaledVector(right, -0.85 * height)
        home
          .copy(chassis.center)
          .addScaledVector(right, (display ? 0.22 : -0.25) * height)
        controls.minDistance = height * 0.08
        controls.maxDistance = height * 8
        camera.near = height * 0.002
        camera.far = height * 25
        camera.updateProjectionMatrix()
        resetCamera()
        sync(state)
        renderer.render(scene, camera)
        ready = true
        events.ready()
      } catch (error) {
        events.error(
          error instanceof Error
            ? error.message
            : "Could not prepare the model."
        )
      }
    },
    (event) => {
      if (closed) return
      const percent = Math.min(
        100,
        Math.round((event.loaded / (event.total || build.bytes)) * 100)
      )
      events.progress(
        percent === 100
          ? "Preparing components…"
          : `Loading model · ${percent}%`
      )
    },
    () => {
      draco.dispose()
      if (!closed)
        events.error(
          "Could not load the model. Check your connection and retry."
        )
    }
  )

  return {
    sync,
    resetCamera,
    inspectDisplay() {
      if (display)
        aim(
          display.center,
          height * Math.max(2.4, 1.75 / camera.aspect),
          new T.Vector3(-0.83, 0.22, 0.95).normalize()
        )
    },
    inspectCable(id: string) {
      const cable = cables?.inspect(id)
      if (!cable) return
      const direction = cable.outside
        ? facing.clone().addScaledVector(cable.outside, 1.6).normalize()
        : facing
      aim(
        cable.center,
        cable.distance * Math.max(1, 1 / camera.aspect),
        direction
      )
    },
    zoom(factor: number) {
      const offset = camera.position.clone().sub(controls.target)
      offset.setLength(
        T.MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance
        )
      )
      camera.position.copy(controls.target).add(offset)
      controls.update()
    },
    inspect(part = state.selected) {
      const piece = pieces.get(part)
      if (!piece) return
      const center = piece.center
        .clone()
        .add(piece.root.position)
        .sub(piece.original)
      aim(
        center,
        piece.bounds.getSize(point).length() *
          Math.max(1.65, 1.65 / camera.aspect)
      )
    },
    dispose() {
      closed = true
      manager.abort()
      controller.abort()
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      cables?.disposeLabels()
      release(scene)
      environment.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      targetLabel.remove()
      canvas.remove()
    },
  }
}
