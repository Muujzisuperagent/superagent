// 查 GLB 原始世界包围盒（未经 fitTo 定尺），用于诊断 fit 塌缩
import { chromium } from 'playwright'

const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })

const files = ['S0-21_blank_pass_A', 'S0-07_elm_bench_A',
  'S0-12_ticket_machine_A', 'S0-37_paper_effigy_A']

for (const f of files) {
  await page.goto(base + '/prologue/index.html?clean=1', { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(async (url) => {
    const T = window.THREE
    const loader = new T.GLTFLoader()
    return new Promise((res) => {
      loader.load(url, (g) => {
        const bb = new T.Box3().setFromObject(g.scene)
        const sz = bb.getSize(new T.Vector3())
        res({ size: [+sz.x.toFixed(4), +sz.y.toFixed(4), +sz.z.toFixed(4)],
              min: [+bb.min.x.toFixed(4), +bb.min.y.toFixed(4), +bb.min.z.toFixed(4)],
              max: [+bb.max.x.toFixed(4), +bb.max.y.toFixed(4), +bb.max.z.toFixed(4)],
              meshes: (() => { let n = 0; g.scene.traverse((o) => { if (o.isMesh) n++ }); return n })() })
      }, undefined, (e) => res({ err: String(e).slice(0, 120) }))
    })
  }, '/models/prologue/' + f + '.glb')
  console.log(f.padEnd(30), JSON.stringify(r))
}
await browser.close()
