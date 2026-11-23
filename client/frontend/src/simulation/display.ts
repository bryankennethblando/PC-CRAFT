import * as T from "three"
import { box, plug } from "./cables"
import type { DisplayPort, DisplayState } from "./troubleshooting"

export function createDisplay(scene: T.Scene, chassis: T.Box3, height: number) {
  const root = new T.Group()
  root.name = "Monitor and HDMI cable"
  scene.add(root)

  const scale = height / 0.6464
  const monitor = new T.Group()
  monitor.name = "HDMI 1 monitor"
  monitor.position.set(
    chassis.max.x + height * 0.27,
    chassis.min.y,
    chassis.max.z + height * 0.11
  )
  root.add(monitor)

  const shell = new T.MeshStandardMaterial({ color: 0x242d37, roughness: 0.75 })
  const insert = new T.MeshStandardMaterial({ color: 0x12171e, roughness: 0.8 })
  const cableMaterial = new T.MeshStandardMaterial({
    color: 0xb17841,
    roughness: 0.8,
  })
  box(
    monitor,
    shell,
    0.248 * scale,
    0.149 * scale,
    0.018 * scale,
    0.162 * scale,
    0
  )
  box(
    monitor,
    shell,
    0.022 * scale,
    0.087 * scale,
    0.023 * scale,
    0.052 * scale,
    -0.002 * scale
  )
  box(
    monitor,
    shell,
    0.119 * scale,
    0.012 * scale,
    0.087 * scale,
    0.006 * scale,
    0.005 * scale
  )

  const display = document.createElement("canvas")
  display.width = 1024
  display.height = 576
  const context = display.getContext("2d")!
  const texture = new T.CanvasTexture(display)
  texture.colorSpace = T.SRGBColorSpace
  const glass = new T.Mesh(
    new T.PlaneGeometry(0.232 * scale, 0.131 * scale),
    new T.MeshBasicMaterial({ map: texture, toneMapped: false })
  )
  glass.position.set(0, 0.162 * scale, 0.0095 * scale)
  monitor.add(glass)

  const source = new T.Vector3(-0.068, 0.125, -0.011).multiplyScalar(scale)
  box(
    monitor,
    insert,
    0.017 * scale,
    0.009 * scale,
    0.005 * scale,
    source.y,
    source.z,
    source.x
  )
  const jack = plug(monitor, [0.019, 0.01, 0.018], scale, cableMaterial)
  jack.group.position.copy(source)
  jack.group.rotation.y = Math.PI
  const from = source.clone().add(monitor.position)
  from.z -= jack.bootEnd
  const deskY = chassis.min.y + 0.045 * scale
  const deskZ = chassis.max.z + 0.065 * scale

  // Virtual jacks aligned to the upper rear I/O and lower expansion bracket on the Basic build.
  const rear = chassis.min.x
  const board = new T.Vector3(
    rear + 0.022 * scale,
    0.451 * scale,
    -0.298 * scale
  )
  const gpu = new T.Vector3(rear + 0.023 * scale, 0.252 * scale, -0.247 * scale)
  const ports = {
    motherboard: board,
    gpu,
    unplugged: gpu
      .clone()
      .add(new T.Vector3(-0.047, -0.035, 0.013).multiplyScalar(scale)),
  }
  for (const [name, place] of [
    ["Motherboard HDMI", board],
    ["Dedicated GPU HDMI", gpu],
  ] as const) {
    const socket = new T.Group()
    socket.name = name
    socket.position.copy(place)
    socket.rotation.y = -Math.PI / 2
    box(socket, insert, 0.016 * scale, 0.008 * scale, 0.004 * scale, 0, 0)
    root.add(socket)
  }
  const pc = plug(root, [0.019, 0.01, 0.018], scale, cableMaterial)
  pc.group.rotation.y = -Math.PI / 2
  const wire = new T.Mesh(new T.BufferGeometry(), cableMaterial)
  root.add(wire)
  let previousPort: DisplayPort | undefined
  let previousScreen: DisplayState["screen"] | undefined

  function write(
    text: string,
    x: number,
    y: number,
    size: number,
    color = "#eef4ff"
  ) {
    context.fillStyle = color
    context.font = `600 ${size}px system-ui, sans-serif`
    context.fillText(text, x, y)
  }

  return {
    center: new T.Vector3(
      (monitor.position.x + rear) / 2,
      (monitor.position.y + 0.162 * scale + board.y) / 2,
      (monitor.position.z + board.z) / 2
    ),
    sync(state: DisplayState) {
      if (state.port !== previousPort) {
        previousPort = state.port
        const end = ports[state.port]
        pc.group.position.copy(end)
        const tail = end.clone()
        tail.x -= pc.bootEnd
        const bend = (x: number, y: number, z: number) =>
          new T.Vector3(x, y, z).multiplyScalar(scale)
        const path = new T.CatmullRomCurve3([
          from,
          from.clone().add(bend(0, -0.02, -0.014)),
          // Run along the desk outside the open side, then bend around the rear corner.
          new T.Vector3(chassis.max.x + 0.045 * scale, deskY, deskZ),
          new T.Vector3(rear + 0.07 * scale, deskY, deskZ),
          new T.Vector3(rear - 0.085 * scale, deskY, deskZ - 0.025 * scale),
          new T.Vector3(
            rear - 0.125 * scale,
            deskY + 0.09 * scale,
            -0.205 * scale
          ),
          tail.clone().add(bend(-0.051, -0.023, 0)),
          tail,
        ])
        wire.geometry.dispose()
        wire.geometry = new T.TubeGeometry(path, 88, 0.0042 * scale, 8, false)
      }
      if (state.screen === previousScreen) return
      previousScreen = state.screen
      context.fillStyle = state.screen === "desktop" ? "#17495d" : "#101923"
      context.fillRect(0, 0, 1024, 576)
      if (state.screen === "no-signal") {
        write("HDMI 1", 52, 85, 49, "#bac8dc")
        write("No Signal", 322, 326, 80)
      } else if (state.screen === "bios") {
        write("BIOS", 95, 200, 110)
        write("POST passed", 100, 330, 62, "#99ebbb")
        write("System memory detected", 100, 425, 49)
      } else {
        context.fillStyle = "#256e80"
        context.fillRect(62, 66, 112, 83)
        write("Files", 63, 200, 44)
        write("Desktop", 294, 331, 86)
        context.fillStyle = "#102f41"
        context.fillRect(0, 510, 1024, 66)
        write("HDMI 1 · Signal detected", 53, 555, 40, "#bce8ed")
      }
      texture.needsUpdate = true
    },
  }
}
