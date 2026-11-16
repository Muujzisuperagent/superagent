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
  await page.goto(`${baseUrl}/?view=${view}&clean=1&shots=1`, { waitUntil: 'networkidle' })
  // 等遮罩撤除信号（body[data-assets="ready"]），不猜固定毫秒；再留半秒让画面渲染完。
  await page.waitForFunction(() => document.body.dataset.assets === 'ready', null, { timeout: 12000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `artifacts/${file}` })
  const veilVisible = await page.evaluate(() => {
    const veil = document.getElementById('loading-veil')
    return veil ? getComputedStyle(veil).display !== 'none' : false
  })
  if (veilVisible) errors.push(`loading veil still visible in ${view}`)
  // B8：三幕预览均不得显示无物名的空框；直接查计算样式，不只信 class。
  const nearbyEmptyBoxVisible = await page.evaluate(() => {
    const el = document.getElementById('nearby-list')
    if (!el) return false
    const empty = (el.textContent ?? '').trim().length === 0
    return empty && getComputedStyle(el).display !== 'none'
  })
  if (nearbyEmptyBoxVisible) errors.push(`nearby-list empty box visible in ${view}`)
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
  await page.goto(`${baseUrl}/?view=${view}&clean=1&shots=1`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.body.dataset.assets === 'ready', null, { timeout: 12000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `artifacts/nav/${file}` })
  // 近黑判据 + 构图中心遮挡判据：canvas 采样（shots=1 才有像素，HUD 在四角不采）。
  // frame：中央 60% 区域，暗像素 >85% 记错误（90% 级黑帧必须拦下；交付帧远低于此）。
  // center：中央 1/3 区域，暗像素 >40% 记错误——挡住画面正中的遮挡物（如亡魂挡桥面）自动拦截。
  const ratios = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return { frame: 1, center: 1 }
    const sample = document.createElement('canvas')
    sample.width = 100; sample.height = 100
    const context = sample.getContext('2d')
    if (!context) return { frame: 1, center: 1 }
    const darkRatio = (region) => {
      context.clearRect(0, 0, 100, 100)
      context.drawImage(canvas, (canvas.width - canvas.width * region) / 2, (canvas.height - canvas.height * region) / 2, canvas.width * region, canvas.height * region, 0, 0, 100, 100)
      const data = context.getImageData(0, 0, 100, 100).data
      let dark = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 15 && data[i + 1] < 15 && data[i + 2] < 15) dark += 1
      }
      return dark / (data.length / 4)
    }
    return { frame: darkRatio(0.6), center: darkRatio(1 / 3) }
  })
  if (ratios.frame > 0.85) errors.push(`nav frame near-black (${view}): ${(ratios.frame * 100).toFixed(1)}%`)
  if (ratios.center > 0.4) errors.push(`nav frame center occluded (${view}): ${(ratios.center * 100).toFixed(1)}%`)
}

console.log(JSON.stringify({ title: await page.title(), errors, canvas: await page.locator('canvas').count() }))
await browser.close()
