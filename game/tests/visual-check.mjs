import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await mkdir('artifacts', { recursive: true })
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(5000)
await page.screenshot({ path: 'artifacts/act4-medicine.png' })
await page.keyboard.press('F8')
await page.waitForTimeout(1000)
await page.screenshot({ path: 'artifacts/act5-palace.png' })
await page.keyboard.press('F9')
await page.waitForTimeout(1000)
await page.screenshot({ path: 'artifacts/act6-reincarnation.png' })
console.log(JSON.stringify({ title: await page.title(), errors, canvas: await page.locator('canvas').count() }))
await browser.close()
