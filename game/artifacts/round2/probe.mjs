// 一次性探针：三幕 draw calls + 每顶层组可见 mesh 数 + 四殿中心斜板定名
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.route('**/src/main.ts*', async (route) => {
  const response = await route.fetch()
  let text = await response.text()
  // 匠人乙并行改 main.ts 期间的临时桩：createLoadingVeil 尚未定义时兜底，避免整模块抛错。
  if (!/function createLoadingVeil|createLoadingVeil\s*=/.test(text)) {
    text = `function createLoadingVeil(){const el=document.createElement('div');el.style.display='none';document.body.appendChild(el);return{progress(){},ready(){el.remove()}}}\n` + text
  }
  const body = `${text}\nObject.assign(window, { __camera: camera, __world: world, __renderer: renderer, __journey: journey })\n`
  await route.fulfill({ response, body })
})

const out = {}
for (const view of ['medicine', 'palace', 'river', 'riverSide']) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(4500)
  out[view] = await page.evaluate(() => {
    const groups = window.__world.root.children.map((child, index) => {
      let meshes = 0
      let visibleMeshes = 0
      child.traverse((node) => {
        if (!node.isMesh) return
        meshes += 1
        let vis = node.visible
        let p = node.parent
        while (vis && p) { vis = p.visible; p = p.parent }
        if (vis) visibleMeshes += 1
      })
      return { index, name: child.name || '(group)', type: child.type, meshes, visibleMeshes, z: child.position.z }
    })
    // 斜板候选：世界包围盒中心落在药案上方区域
    const suspects = []
    window.__world.root.updateMatrixWorld(true)
    window.__world.root.traverse((node) => {
      if (!node.isMesh) return
      let vis = node.visible
      let p = node.parent
      while (vis && p) { vis = p.visible; p = p.parent }
      if (!vis) return
      node.geometry.computeBoundingBox()
      const bb = node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld)
      const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2
      const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z
      if (cx > -2 && cx < 2 && cy > 2.0 && cy < 4.2 && cz > -8 && cz < -4.5 && Math.max(sx, sy, sz) > 0.8) {
        const chain = []
        let q = node
        while (q && q !== window.__world.root) { chain.push(q.name || q.type); q = q.parent }
        suspects.push({ name: node.name || '(mesh)', chain: chain.join(' < '), center: [cx.toFixed(2), cy.toFixed(2), cz.toFixed(2)], size: [sx.toFixed(2), sy.toFixed(2), sz.toFixed(2)], rot: [node.rotation.x.toFixed(2), node.rotation.y.toFixed(2), node.rotation.z.toFixed(2)] })
      }
    })
    return {
      drawCalls: window.__renderer.info.render.calls,
      triangles: window.__renderer.info.render.triangles,
      groups,
      suspects
    }
  })
}
await mkdir('artifacts/round2', { recursive: true })
await writeFile('artifacts/round2/probe-before.json', JSON.stringify(out, null, 2))
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { drawCalls: v.drawCalls, suspects: v.suspects.length }])), null, 2))
await browser.close()