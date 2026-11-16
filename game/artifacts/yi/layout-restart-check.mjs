import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const errs = []
for (const [w, h] of [[1440, 900], [1024, 640], [480, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  page.on('pageerror', (e) => errs.push(`${w}x${h}: ${e.message}`))
  await page.goto('http://127.0.0.1:5173/?clean=1', { waitUntil: 'load' })
  await page.waitForTimeout(3600)
  await page.locator('canvas').click()
  await page.waitForTimeout(400)
  const geo = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
    const hud = r('#hud'), wf = r('#wayfinder'), badge = r('#audio-toggle'), veil = document.getElementById('loading-veil')
    const hit = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; const overlap = hit(hud, wf) || hit(wf, badge) || hit(hud, badge)
    return { hud, wf, badge, overlap, veilDisplay: veil ? getComputedStyle(veil).display : 'absent', locked: document.pointerLockElement !== null, vw: innerWidth, vh: innerHeight }
  })
  console.log(`${w}x${h}`, JSON.stringify(geo))
  await page.screenshot({ path: `artifacts/yi/viewport-${w}x${h}.png` })
  await page.close()
}
// 重开：结局后点重走按钮，页面 reload，遮罩重新出现且无残留
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => errs.push(`restart: ${e.message}`))
await page.goto('http://127.0.0.1:5173/?clean=1', { waitUntil: 'load' })
await page.waitForTimeout(3000)
await page.evaluate(() => { document.getElementById('ending').classList.remove('hidden') })
await page.locator('#restart').click()
await page.waitForLoadState('load')
await page.waitForTimeout(600)
console.log('restart', await page.evaluate(() => ({
  veil: !!document.getElementById('loading-veil'),
  veilDisplay: getComputedStyle(document.getElementById('loading-veil')).display,
  endingHidden: document.getElementById('ending').classList.contains('hidden'),
  inventory: document.getElementById('inventory').textContent,
  audioContexts: window.__audio ? 'n/a' : 'n/a'
})))
await page.waitForTimeout(3200)
await page.locator('canvas').click()
await page.waitForTimeout(300)
console.log('restart-lock', await page.evaluate(() => ({ locked: document.pointerLockElement !== null, veil: getComputedStyle(document.getElementById('loading-veil')).display })))
console.log('errs', errs)
await browser.close()
