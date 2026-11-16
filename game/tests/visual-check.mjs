import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await mkdir('artifacts', { recursive: true })
await page.goto(pathToFileURL(resolve('index.html')).href)
if (!(await page.getByText('请用启动器打开密室').isVisible())) throw new Error('file:// launch warning did not appear')
// 默认走 localhost：本机 Vite 只绑 IPv6 ::1，127.0.0.1 必然拒连。
const baseUrl = process.env.GAME_URL ?? 'http://localhost:5173'
for (const [view, file] of [['medicine', 'act4-medicine.png'], ['palace', 'act5-palace.png'], ['river', 'act6-reincarnation.png']]) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle' })
  // 等遮罩撤除信号（body[data-assets="ready"]），不猜固定毫秒；再留半秒让画面渲染完。
  await page.waitForFunction(() => document.body.dataset.assets === 'ready', null, { timeout: 12000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `artifacts/${file}` })
  const veilVisible = await page.evaluate(() => {
    const veil = document.getElementById('loading-veil')
    return veil ? getComputedStyle(veil).display !== 'none' : false
  })
  if (veilVisible) errors.push(`loading veil still visible in ${view}`)
}

// —— 玩家机位导航组图（审官 v2 复审导航分用），落盘 artifacts/nav/ ——
const navViews = [
  ['medicineEntry', 'nav-act4-entry.png'],
  ['medicineBench', 'nav-act4-bench.png'],
  ['medicineExit', 'nav-act4-exit.png'],
  ['palaceEntry', 'nav-act5-entry.png'],
  ['palaceCenter', 'nav-act5-center.png'],
  ['palaceExit', 'nav-act5-exit.png'],
  ['riverBridge', 'nav-act6-bridge.png'],
  ['riverMid', 'nav-act6-mid.png'],
  ['riverEnd', 'nav-act6-end.png'],
  ['riverSide', 'nav-act6-side.png']
]
await mkdir('artifacts/nav', { recursive: true })
for (const [view, file] of navViews) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.body.dataset.assets === 'ready', null, { timeout: 12000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `artifacts/nav/${file}` })
}
console.log(JSON.stringify({ title: await page.title(), errors, canvas: await page.locator('canvas').count() }))
await browser.close()
