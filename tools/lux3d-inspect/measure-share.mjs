// 逐幕 GLB vs 程序几何三角面占比 + 天花漏光缝定位（playwright + window.__escapeWorld）
// 用法: node.exe tools/lux3d-inspect/measure-share.mjs <baseUrl> <outJson>
import { chromium } from 'file:///D:/群核科技黑客松/game/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5176'
const out = process.argv[3] ?? 'D:/群核科技黑客松/game/artifacts/perf-round3/assets-share.json'

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const result = { views: {}, seam: [] }

const VIEWS = {
  medicine: { position: [0, 2.4, 4.7], target: [0, 1.35, -1.8] },
  palace: { position: [0, 1.7, -21.6], target: [0, 1.3, -30.4] },
  river: { position: [-4.2, 2.5, -44.6], target: [0, 2.6, -68] }
}

for (const [view, cam] of Object.entries(VIEWS)) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1&shots=1`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.body.dataset.assets === 'ready', null, { timeout: 15000 })
  await page.waitForTimeout(700)
  const data = await page.evaluate(({ cam }) => {
    const world = window.__escapeWorld
    if (!world) return { error: 'no __escapeWorld' }
    const root = world.root
    root.updateMatrixWorld(true)
    const zones = { medicine: [-16, 8], palace: [-40, -16], reincarnation: [-90, -40] }
    const tally = {}
    for (const key of Object.keys(zones)) tally[key] = { glb: 0, proc: 0, glbInstances: 0, procMeshes: 0 }
    const wp = root.position.clone()
    root.traverse((node) => {
      const mesh = node
      if (!mesh.isMesh) return
      mesh.getWorldPosition(wp)
      const z = wp.z
      let act = null
      for (const [key, [lo, hi]] of Object.entries(zones)) if (z >= lo && z < hi) act = key
      if (!act) return
      let glb = false
      let p = node
      while (p) {
        if (p.userData && p.userData.glbAsset) { glb = true; break }
        p = p.parent
      }
      const geo = mesh.geometry
      const tris = (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * (mesh.isInstancedMesh ? mesh.count : 1)
      if (glb) { tally[act].glb += tris; tally[act].glbInstances += mesh.isInstancedMesh ? mesh.count : 1 }
      else { tally[act].proc += tris; tally[act].procMeshes += 1 }
    })
    // 漏光缝定位：重建 delivery 相机，把每个可见 mesh/sprite 的世界中心投影到屏幕
    const seam = []
    if (cam) {
      const pos = { x: cam.position[0], y: cam.position[1], z: cam.position[2] }
      const f = { x: cam.target[0] - pos.x, y: cam.target[1] - pos.y, z: cam.target[2] - pos.z }
      const fl = Math.hypot(f.x, f.y, f.z)
      f.x /= fl; f.y /= fl; f.z /= fl
      const r = { x: 1, y: 0, z: 0 }
      const u = { x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x }
      const tanV = Math.tan((66 / 2) * Math.PI / 180)
      const tanH = tanV * (1440 / 900)
      root.traverse((node) => {
        if (!node.isMesh && !node.isSprite) return
        if (!node.visible) return
        let p = node
        let hidden = false
        while (p) { if (p.visible === false) { hidden = true; break } p = p.parent }
        if (hidden) return
        const corners = []
        if (node.isMesh && node.geometry) {
          if (!node.geometry.boundingBox) node.geometry.computeBoundingBox()
          const bb = node.geometry.boundingBox
          for (const sx of [bb.min.x, bb.max.x]) for (const sy of [bb.min.y, bb.max.y]) for (const sz of [bb.min.z, bb.max.z]) {
            corners.push(node.localToWorld(wp.set(sx, sy, sz).clone()))
          }
        } else {
          node.getWorldPosition(wp)
          corners.push(wp.clone())
        }
        let hit = false
        for (const c of corners) {
          const d = { x: c.x - pos.x, y: c.y - pos.y, z: c.z - pos.z }
          const cz = d.x * f.x + d.y * f.y + d.z * f.z
          if (cz <= 0.1) continue
          const cx = d.x * r.x + d.y * r.y + d.z * r.z
          const cy = d.x * u.x + d.y * u.y + d.z * u.z
          const sx = (cx / (cz * tanH) + 1) * 720
          const sy = (1 - cy / (cz * tanV)) * 450
          if (sx > 690 && sx < 750 && sy > -40 && sy < 170) hit = true
        }
        if (hit) {
          node.getWorldPosition(wp)
          seam.push({ name: node.name || node.type, mat: node.material && node.material.type, color: node.material && node.material.color ? '#' + node.material.color.getHexString() : null, z: Math.round(wp.z * 100) / 100, y: Math.round(wp.y * 100) / 100 })
        }
      })
    }
    return { tally, seam }
  }, { cam })
  result.views[view] = data.tally
  if (view === 'medicine') result.seam = data.seam
}
for (const [view, t] of Object.entries(result.views)) {
  for (const [act, v] of Object.entries(t)) {
    v.glbShare = v.glb + v.proc > 0 ? +(v.glb / (v.glb + v.proc)).toFixed(4) : 0
  }
}
writeFileSync(out, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 1))
await browser.close()