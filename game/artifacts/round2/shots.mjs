// 一次性截图机：node artifacts/round2/shots.mjs <outdir> [views...]
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const outDir = resolve(process.argv[2] ?? 'artifacts/round2/shots')
const views = process.argv.slice(3).length ? process.argv.slice(3) : ['medicine', 'palace', 'river', 'riverSide']
const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.route('**/src/main.ts*', async (route) => {
  const response = await route.fetch()
  let text = await response.text()
  if (!/function createLoadingVeil/.test(text)) {
    text = `function createLoadingVeil(){const el=document.createElement('div');el.style.display='none';document.body.appendChild(el);return{progress(){},ready(){el.remove()}}}\n` + text
  }
  await route.fulfill({ response, body: text })
})
await mkdir(outDir, { recursive: true })
for (const view of views) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: resolve(outDir, `${view}.png`) })
}
console.log(JSON.stringify({ outDir, views, errors }))
await browser.close()