import * as T from "three"

export type CoolingView = { removed: boolean; dusty: boolean; paste: boolean }

export function createCoolingRepair(
  scene: T.Scene,
  cooler: T.Box3,
  cpu: T.Box3
) {
  const center = cooler.getCenter(new T.Vector3())
  const size = cooler.getSize(new T.Vector3())
  const dustMaterial = new T.MeshStandardMaterial({
    color: 0xb6a391,
    transparent: true,
    depthWrite: false,
    roughness: 1,
  })
  const dust = new T.InstancedMesh(
    new T.DodecahedronGeometry(1, 0),
    dustMaterial,
    36
  )
  dust.name = "Heatsink dust"
  const fleck = new T.Object3D()
  for (let i = 0; i < dust.count; i++) {
    const angle = i * 2.39996
    const radius = 0.31 + (i % 5) * 0.032
    fleck.position.set(
      Math.cos(angle) * size.x * radius,
      Math.sin(angle) * size.y * radius,
      size.z * (0.35 + (i % 3) * 0.075)
    )
    const width = size.y * (0.026 + (i % 4) * 0.007)
    fleck.scale.set(width * 1.8, width, width * 0.62)
    fleck.rotation.z = angle
    fleck.updateMatrix()
    dust.setMatrixAt(i, fleck.matrix)
  }
  const paste = new T.Mesh(
    new T.SphereGeometry(cpu.getSize(new T.Vector3()).x * 0.13, 16, 8),
    new T.MeshStandardMaterial({ color: 0xd7dde4, roughness: 0.46 })
  )
  paste.name = "Thermal paste"
  cpu.getCenter(paste.position)
  paste.position.z = cpu.max.z + 0.0004
  paste.scale.z = 0.28
  dust.visible = paste.visible = false
  scene.add(dust, paste)
  let dusty = false
  let clearing: number | undefined

  return {
    sync(view: CoolingView, position: T.Vector3, original: T.Vector3) {
      dust.position.copy(center).add(position).sub(original)
      paste.visible = view.paste
      if (dusty === view.dusty) return
      dusty = view.dusty
      if (dusty) {
        clearing = undefined
        dust.visible = true
        dust.scale.setScalar(1)
        dustMaterial.opacity = 1
      } else {
        clearing = performance.now()
      }
    },
    animate(time: number) {
      if (clearing === undefined) return false
      const progress = T.MathUtils.clamp((time - clearing) / 550, 0, 1)
      dust.scale.setScalar(1 + progress * 0.48)
      dustMaterial.opacity = 1 - progress
      dust.visible = progress < 1
      if (!dust.visible) clearing = undefined
      return dust.visible
    },
  }
}
