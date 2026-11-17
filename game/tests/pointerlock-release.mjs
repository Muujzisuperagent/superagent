// 指针锁释放回归：点击画面锁定 → 失焦自动释放 → 重新锁定 → Esc 释放并显示提示。
// 用法：先 npm run dev，再 node tests/pointerlock-release.mjs
import { chromium } from 'playwright'

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (error) => console.log('PAGEERROR', error.message))

const frames = (n) => page.evaluate((count) => new Promise((done) => {
  let left = count
  const tick = () => { left -= 1; if (left <= 0) done(true); else requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
}), n)

const state = () => page.evaluate(() => {
  const hint = document.getElementById('lock-hint')
  return {
    locked: document.pointerLockElement !== null,
    hintText: hint?.textContent ?? '',
    hintHidden: hint?.classList.contains('hidden') ?? true
  }
})

const results = []
function check(name, ok, detail) {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name} · ${detail}`)
}

await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'load' })
await page.waitForTimeout(1200)
await frames(10)

await page.locator('canvas').click()
await frames(6)
let s = await state()
check('点击画面后锁定', s.locked, JSON.stringify(s))

await page.evaluate(() => window.dispatchEvent(new Event('blur')))
await frames(6)
s = await state()
check('失焦自动释放', !s.locked, JSON.stringify(s))
check('释放后显示空闲提示', !s.hintHidden && s.hintText.includes('点击画面'), JSON.stringify(s))

await page.locator('canvas').click()
await frames(6)
s = await state()
check('可重新锁定', s.locked, JSON.stringify(s))

await page.keyboard.down('Escape')
await page.waitForFunction(() => document.pointerLockElement === null, null, { timeout: 5000 })
await page.keyboard.up('Escape')
await frames(6)
s = await state()
check('Esc 释放', !s.locked, JSON.stringify(s))
check('Esc 后提示可见', !s.hintHidden, JSON.stringify(s))

await page.locator('canvas').click()
await frames(6)
s = await state()
check('可再次锁定', s.locked, JSON.stringify(s))

await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  document.dispatchEvent(new Event('visibilitychange'))
})
await frames(6)
s = await state()
check('页面隐藏时自动释放', !s.locked, JSON.stringify(s))

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)