// 序厅判官特写机位（调试用）：?cam=x,y,z&look=x,y,z
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const out = outIdx >= 0 ? args[outIdx + 1] : 'artifacts/prologue/judge-rework/closeup'
const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

// 判官头心世界坐标 ≈ (0.18, 1.26, -1.28)
const shots = [
  ['head-front.png', '/prologue/index.html?clean=1&cam=0.18,1.30,-0.62&look=0.18,1.27,-1.28', 3200],
  ['head-3q.png', '/prologue/index.html?clean=1&cam=0.62,1.32,-0.80&look=0.18,1.27,-1.28', 3200],
  ['bust.png', '/prologue/index.html?clean=1&cam=0.72,1.24,-0.30&look=0.18,1.05,-1.28', 3200],
  ['head-side.png', '/prologue/index.html?clean=1&cam=-0.45,1.30,-1.05&look=0.18,1.27,-1.28', 3200]
]

for (const [file, path, wait] of shots) {
  await page.goto(base + path, { waitUntil: 'load' })
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${out}/${file}` })
  console.log(file, 'ok')
}
if (errors.length) console.log('ERRORS', JSON.stringify(errors, null, 2))
await browser.close()
