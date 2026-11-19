// 序厅+一殿 流程复评：4 步真实点击链 → 穿门探针 → 一殿五处差异逐点点击 → 半印① → 入第二殿
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const base = 'http://127.0.0.1:5173'
const out = 'D:/群核科技黑客松/评审/序厅一殿/2026-11-19-dd1e02e/flow-prologue.json'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
const log = { steps: [] }

// 1) 序厅 4 步真实点击链（?probe=1 走 raycaster 命中点击）
await page.goto(base + '/prologue/index.html?probe=1', { waitUntil: 'load' })
try {
  await page.waitForFunction(() => /^AUTOPICK/.test(document.title), { timeout: 60000 })
} catch {}
log.steps.push({ check: '序厅4步教学链', title: await page.title() })

// 2) 穿门探针（真实边界放行 + 位置检测链路）
await page.goto(base + '/prologue/index.html?walkgate=1', { waitUntil: 'load' })
await page.waitForTimeout(5000)
log.steps.push({ check: 'walkgate穿门探针', title: await page.title() })

// 3) 一殿五处差异逐点点击（?hints=1 恢复对照列表，点抽屉按钮走与 3D 点选相同的 toggle() 路径）+ 半印①
await page.goto(base + '/first-hall/index.html?from=prologue=1&hints=1', { waitUntil: 'load' })
await page.waitForTimeout(6000)
// 真实点击镜面（canvas 中央）：raycast 命中 R.mirror → toggleVision
const cvh = await page.$('#cv')
const cb = await cvh.boundingBox()
await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2)
await page.waitForTimeout(1500)
const visionState = await page.evaluate(() => window.__visionProbe ? window.__visionProbe(undefined) ?? { note: 'probe返回空' } : { note: 'no probe' })
await page.waitForTimeout(1500)
await page.click('#showPanel')
await page.waitForTimeout(1000)
const diffs = await page.$$eval('#diffList button', (bs) => bs.map(b => ({ text: b.textContent.trim(), cls: b.className })))
const clickLog = []
for (let i = 0; i < diffs.length; i++) {
  const btns = await page.$$('#diffList button')
  await btns[i].click()
  await page.waitForTimeout(900)
  const state = await page.$$eval('#diffList button', (bs) => bs.map(b => ({ t: b.textContent.trim(), ok: b.className.includes('ok') })))
  clickLog.push({ clickedIndex: i, after: state })
}
await page.waitForTimeout(1500)
const wonState = await page.evaluate(() => ({
  toast: document.getElementById('toast')?.textContent ?? null,
  carry: window.__carryProbe ? window.__carryProbe() : null
}))
log.steps.push({ check: '一殿五处差异逐点点击+通关', mirrorClick: visionState, initial: diffs, clicks: clickLog, wonState })

// 4) 点「入第二殿」落到根游戏二殿
const toSecond = await page.$('#toSecondHall')
if (toSecond) {
  await toSecond.click()
  try {
    await page.waitForURL(/from=hall1=1/, { timeout: 15000 })
    await page.waitForTimeout(4000)
    const hud = await page.evaluate(() => document.body.innerText.match(/第[二三]殿[^\n]*/)?.[0] ?? document.title)
    log.steps.push({ check: '入第二殿跳转', url: page.url(), hud })
  } catch {
    log.steps.push({ check: '入第二殿跳转', url: page.url(), note: '未跳转' })
  }
} else {
  log.steps.push({ check: '入第二殿跳转', note: '按钮不存在' })
}

log.pageErrors = errors
await writeFile(out, JSON.stringify(log, null, 2))
console.log(JSON.stringify(log, null, 1))
await browser.close()
