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
const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
for (const [view, file] of [['medicine', 'act4-medicine.png'], ['palace', 'act5-palace.png'], ['river', 'act6-reincarnation.png']]) {
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: `artifacts/${file}` })
}
console.log(JSON.stringify({ title: await page.title(), errors, canvas: await page.locator('canvas').count() }))
await browser.close()
