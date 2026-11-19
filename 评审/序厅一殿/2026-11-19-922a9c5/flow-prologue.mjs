// 流程 D 验收：序厅教学链 → 穿门 → 第一殿 → 通关态 → 接续入口检查
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const base = 'http://127.0.0.1:5173'
const out = 'D:/群核科技黑客松/评审/序厅一殿/2026-11-19-922a9c5/flow-prologue.json'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
const log = { steps: [] }

// 1) 序厅教学链（probe=1 用真实 raycaster 命中点击走完 4 步）
await page.goto(base + '/prologue/index.html?probe=1', { waitUntil: 'load' })
try {
  await page.waitForFunction(() => /^AUTOPICK/.test(document.title), { timeout: 60000 })
  log.autopick = await page.title()
} catch { log.autopick = 'TIMEOUT title=' + await page.title() }
log.steps.push({ check: '序厅4步教学链', title: await page.title() })

// 2) 穿门（walkgate：真实边界放行 + 位置检测触发过场跳转）
await page.goto(base + '/prologue/index.html?walkgate=1', { waitUntil: 'load' })
await page.waitForTimeout(6000)
log.steps.push({ check: '穿门跳转', url: page.url(), title: await page.title() })

// 2b) 真实穿门跳转：step=4 置位后点击门扇 → 应落到 /first-hall/?from=prologue=1
await page.goto(base + '/prologue/index.html?step=4&cam=0,1.6,-17&look=0,1.5,-20.5', { waitUntil: 'load' })
await page.waitForTimeout(3500)
const cv = await page.$('canvas')
const box = await cv.boundingBox()
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
try {
  await page.waitForURL(/first-hall/, { timeout: 20000 })
  await page.waitForTimeout(3000)
  log.steps.push({ check: '真实穿门跳转', url: page.url(), title: await page.title() })
} catch {
  log.steps.push({ check: '真实穿门跳转', url: page.url(), title: await page.title(), note: '未在20s内跳转' })
}

// 3) 第一殿 solved 态：半印① 落下 + 面板状态
await page.goto(base + '/first-hall/index.html?solved=1&vision=1', { waitUntil: 'load' })
await page.waitForTimeout(5000)
const fh = await page.evaluate(() => ({
  title: document.title,
  toast: document.getElementById('toast')?.textContent ?? null,
  sealText: (document.body.innerText.match(/半印[①1][^\n]*/) || [null])[0],
  buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0, 30),
  hasSecondHallLink: !!document.querySelector('a[href*="../"], button[onclick]'),
  links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href'))
}))
log.steps.push({ check: '第一殿通关态+接续入口', ...fh })

// 4) 第一殿正常进入（非 solved）确认无 solved 泄漏
await page.goto(base + '/first-hall/index.html', { waitUntil: 'load' })
await page.waitForTimeout(4000)
const fh2 = await page.evaluate(() => ({
  toast: document.getElementById('toast')?.textContent ?? null,
  won: document.title
}))
log.steps.push({ check: '第一殿初始态', ...fh2 })

log.pageErrors = errors
await writeFile(out, JSON.stringify(log, null, 2))
console.log(JSON.stringify(log, null, 1))
await browser.close()
