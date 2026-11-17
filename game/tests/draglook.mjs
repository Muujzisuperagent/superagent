// 夸克免锁模式验收：UA 含 QuarkPC 时不申请指针锁，按住左键拖动可环视，WASD 可移动。
// 用法：先 npm run dev，再 node tests/draglook.mjs
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, userAgent: UA })
const hash = (buffer) => createHash('sha1').update(buffer).digest('hex').slice(0, 12)
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}${detail ? ' · ' + detail : ''}`)
}

await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'load' })
await page.waitForTimeout(2000)
const meta = await page.evaluate(() => ({
  hint: document.getElementById('lock-hint')?.textContent ?? '',
  cursor: (document.querySelector('canvas')).style.cursor
}))
check('免锁模式提示', meta.hint.includes('按住左键拖动'), meta.hint)
check('画布显示抓取光标', meta.cursor === 'grab', meta.cursor)

const before = await page.screenshot()
await page.locator('canvas').click()
await page.waitForTimeout(500)
check('点击不再申请指针锁', await page.evaluate(() => document.pointerLockElement === null))
check('点击不隐藏提示以外的东西', await page.evaluate(() => document.getElementById('lock-hint') !== null))

const box = await page.locator('canvas').boundingBox()
const cx = box.x + box.width / 2
const cy = box.y + box.height / 2
await page.mouse.move(cx, cy)
await page.mouse.down()
for (let i = 1; i <= 10; i += 1) await page.mouse.move(cx + i * 20, cy + i * 2)
await page.mouse.up()
await page.waitForTimeout(500)
const rotated = await page.screenshot()
check('拖动可环视', hash(before) !== hash(rotated))

await page.keyboard.down('KeyW')
await page.waitForTimeout(700)
await page.keyboard.up('KeyW')
await page.waitForTimeout(400)
const moved = await page.screenshot()
check('WASD 可移动', hash(rotated) !== hash(moved))

await page.keyboard.press('Escape')
await page.waitForTimeout(300)
check('Esc 无副作用', await page.evaluate(() => document.pointerLockElement === null))

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)