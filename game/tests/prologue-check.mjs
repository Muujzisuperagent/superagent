// 序厅 + 第一殿 截图与健康检查（审官/验官共用）
// 用法：node.exe tests/prologue-check.mjs [--out 目录]
// 前置：vite dev 已起在 GAME_URL（默认 http://127.0.0.1:5173）
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const out = outIdx >= 0 ? args[outIdx + 1] : 'artifacts/prologue'
const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
const missing = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`) })

const shots = [
  ['prologue-start.png', '/prologue/index.html', 3200],
  ['prologue-judge.png', '/prologue/index.html?dlgapproach=1', 4000],
  ['prologue-door.png', '/prologue/index.html?clean=1&cam=0,1.6,-14', 3200],
  ['first-hall-entry.png', '/first-hall/index.html', 4500],
  ['first-hall-vision.png', '/first-hall/index.html?vision=1', 5000],
  ['first-hall-solved.png', '/first-hall/index.html?solved=1&vision=1', 5000]
]

const results = []
for (const [file, path, wait] of shots) {
  await page.goto(base + path, { waitUntil: 'load' })
  await page.waitForTimeout(wait)
  const state = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const loading = document.getElementById('loading')
    return {
      title: document.title,
      canvas: canvas ? [canvas.width, canvas.height] : null,
      loadingDone: loading ? loading.classList.contains('done') : true,
      lux: window.__lux3dStatus
        ? { total: window.__lux3dStatus.total, mounted: window.__lux3dStatus.mounted, missing: window.__lux3dStatus.missing, assets: window.__lux3dStatus.assets }
        : null,
      probe: window.__prologueProbe ? window.__prologueProbe() : null
    }
  })
  await page.screenshot({ path: `${out}/${file}` })
  results.push({ file, path, ...state })
  console.log(file, JSON.stringify(state))
}

const report = { base, at: new Date().toISOString(), results, errors, httpErrors: missing }
await writeFile(`${out}/check.json`, JSON.stringify(report, null, 2))
if (errors.length || missing.length) {
  console.log('ERRORS', JSON.stringify(errors, null, 2))
  console.log('HTTP>=400', JSON.stringify(missing, null, 2))
}
await browser.close()
if (errors.length) process.exitCode = 1
