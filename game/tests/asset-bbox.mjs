// 序厅资产落位探针：量 Lux3D 挂载件的世界包围盒 + 判官关键件尺寸
import { chromium } from 'playwright'

const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(base + '/prologue/index.html?clean=1', { waitUntil: 'load' })
await page.waitForTimeout(4200)

const out = await page.evaluate(() => {
  const S = window.__prologueScene
  const T = window.THREE
  const rows = []

  // Lux3D 挂载件：lux3d 标记在父 wrap 组上，逐个 wrap 量（含 5 个 folk 实例）
  const byKey = {}
  const wraps = []
  S.root.traverse((o) => {
    if (o.userData && o.userData.lux3d) wraps.push(o)
  })
  for (const w of wraps) {
    const k = w.userData.lux3d
    w.updateWorldMatrix(true, false)
    const bb = new T.Box3().setFromObject(w)
    if (bb.isEmpty()) continue
    const sz = bb.getSize(new T.Vector3())
    const c = bb.getCenter(new T.Vector3())
    const key = k + (wraps.filter((x) => x.userData.lux3d === k).length > 1 ? '#' + wraps.indexOf(w) : '')
    byKey[key] = { what: 'lux:' + key, size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)],
                    center: [+c.x.toFixed(3), +c.y.toFixed(3), +c.z.toFixed(3)] }
  }
  for (const k of Object.keys(byKey).sort()) rows.push(byKey[k])

  // 关键交互件
  const named = {
    'desk-pass': null, 'machine': null, 'lamp': null, 'bench': null, 'censer': null
  }
  S.pickMeshes.forEach((o) => {
    const id = o.userData && o.userData.pick
    if (!id) return
    if (!named[id]) {
      o.updateWorldMatrix(true, false)
      const bb = new T.Box3().setFromObject(o)
      const sz = bb.getSize(new T.Vector3())
      const c = bb.getCenter(new T.Vector3())
      named[id] = { what: 'pick:' + id, size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)],
                    center: [+c.x.toFixed(3), +c.y.toFixed(3), +c.z.toFixed(3)] }
    }
  })
  for (const k of Object.keys(named)) if (named[k]) rows.push(named[k])

  // 判官关键件
  const judge = S.refs.judge
  const jrows = []
  judge.traverse((o) => {
    if (!o.isMesh) return
    o.updateWorldMatrix(true, false)
    const bb = new T.Box3().setFromObject(o)
    const sz = bb.getSize(new T.Vector3())
    const c = bb.getCenter(new T.Vector3())
    if (sz.x > .30 && sz.y > .15) {
      jrows.push({ what: 'judge:' + o.geometry.type, size: [+sz.x.toFixed(3), +sz.y.toFixed(3), +sz.z.toFixed(3)],
                   center: [+c.x.toFixed(3), +c.y.toFixed(3), +c.z.toFixed(3)] })
    }
  })
  rows.push(...jrows)

  // 案面（桌面）世界高度，用于核对道具落位
  const desk = S.refs.luxHosts && S.refs.luxHosts.desk
  let deskTop = null
  if (desk) {
    desk.updateWorldMatrix(true, false)
    const bb = new T.Box3().setFromObject(desk)
    deskTop = +bb.max.y.toFixed(3)
  }
  return { rows, deskTop, luxStatus: window.__lux3dStatus }
})

console.log('desk top y =', out.deskTop)
console.log('lux =', JSON.stringify(out.luxStatus))
for (const r of out.rows) {
  console.log(r.what.padEnd(26), 'size=', JSON.stringify(r.size), 'c=', JSON.stringify(r.center))
}
await browser.close()
