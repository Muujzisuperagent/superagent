// 动线自测：序厅 → 第一殿 → 第二至第六殿 的入口串联与 HUD 统一
// 用法：node.exe tests/route-check.mjs
// 前置：vite dev 已起在 GAME_URL（默认 http://127.0.0.1:5173）
// 产出：artifacts/route-flow/*.png
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const out = 'artifacts/route-flow'
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('response', (r) => { if (r.status() >= 400) errors.push('http ' + r.status() + ' ' + r.url()) })

const log = (...a) => console.log(...a)
let failures = 0
function check(name, ok, detail) {
  if (!ok) failures += 1
  log((ok ? 'PASS ' : 'FAIL ') + name + (detail === undefined ? '' : ' :: ' + JSON.stringify(detail)))
}

// ── 1. 路线图页 ──
await page.goto(base + '/entry/index.html', { waitUntil: 'load' })
await page.waitForTimeout(600)
const entry = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.node')].map((n) => ({
    title: n.querySelector('h3').textContent.trim(),
    href: n.getAttribute('href')
  }))
  return { title: document.title, count: nodes.length, nodes, body: document.body.innerText.length }
})
check('入口页标题', entry.title.includes('还魂路引'), entry.title)
check('入口页 7 个节点', entry.count === 7, entry.count)
check('入口页序厅链接', entry.nodes[0].href === '../prologue/index.html', entry.nodes[0])
check('入口页一殿链接', entry.nodes[1].href === '../first-hall/index.html', entry.nodes[1])
check('入口页二至六殿链接', entry.nodes.slice(2).every((n) => n.href === '../../'), entry.nodes.slice(2).map((n) => n.href))
await page.screenshot({ path: out + '/entry-route.png', fullPage: true })

// ── 2. 根游戏起点浮层（默认参数）──
await page.goto(base + '/', { waitUntil: 'load' })
await page.waitForSelector('body[data-assets="ready"]', { timeout: 20000 })
await page.waitForTimeout(1800)
const start = await page.evaluate(() => {
  const overlay = document.getElementById('start-overlay')
  const prologue = document.getElementById('start-prologue')
  const direct = document.getElementById('start-direct')
  const cs = overlay ? getComputedStyle(overlay) : null
  return {
    exists: !!overlay,
    opacity: cs ? cs.opacity : null,
    pointerEvents: cs ? cs.pointerEvents : null,
    prologueDisabled: prologue ? prologue.disabled : null,
    directDisabled: direct ? direct.disabled : null,
    veilGone: !!document.querySelector('#loading-veil.veil-gone, #loading-veil.veil-out'),
    act: document.getElementById('act')?.textContent
  }
})
check('起点浮层存在', start.exists === true)
check('起点浮层资产就位后可见', Number(start.opacity) > 0.9, start.opacity)
check('起点浮层可点', start.pointerEvents === 'auto', start.pointerEvents)
check('起点按钮已放开', start.prologueDisabled === false && start.directDisabled === false, start)
check('加载遮罩已撤除', start.veilGone === true, start.veilGone)
await page.screenshot({ path: out + '/root-start-overlay.png' })

// 次按钮：关闭浮层并进入现有指针锁流程
await page.click('#start-direct')
await page.waitForTimeout(600)
const afterDirect = await page.evaluate(() => ({
  overlayClass: document.getElementById('start-overlay')?.className ?? 'removed',
  display: document.getElementById('start-overlay') ? getComputedStyle(document.getElementById('start-overlay')).display : 'none',
  act: document.getElementById('act')?.textContent,
  objective: document.getElementById('objective')?.textContent
}))
check('次按钮关闭浮层', afterDirect.display === 'none' || afterDirect.overlayClass.includes('closed'), afterDirect)
check('HUD 停在第二殿', (afterDirect.act ?? '').includes('业秤'), afterDirect.act)
await page.screenshot({ path: out + '/root-act2-hud.png' })

// ── 3. clean / shots 模式无浮层 ──
for (const q of ['?clean=1', '?shots=1']) {
  await page.goto(base + '/' + q, { waitUntil: 'load' })
  await page.waitForSelector('body[data-assets="ready"]', { timeout: 20000 })
  await page.waitForTimeout(400)
  const has = await page.evaluate(() => !!document.getElementById('start-overlay'))
  check('无浮层 ' + q, has === false, has)
}

// ── 4. 从一殿入二殿：?from=hall1=1 不再弹浮层 ──
await page.goto(base + '/?from=hall1=1', { waitUntil: 'load' })
await page.waitForSelector('body[data-assets="ready"]', { timeout: 20000 })
await page.waitForTimeout(400)
const fromHall = await page.evaluate(() => ({
  overlay: !!document.getElementById('start-overlay'),
  act: document.getElementById('act')?.textContent
}))
check('一殿进入不再弹浮层', fromHall.overlay === false, fromHall)
check('一殿进入即二殿', (fromHall.act ?? '').includes('业秤'), fromHall.act)

// ── 5. 第一殿：抽屉默认收起 + 通关出口 ──
await page.goto(base + '/first-hall/index.html?solved=1', { waitUntil: 'load' })
await page.waitForTimeout(4500)
const hall = await page.evaluate(() => {
  const panel = document.getElementById('panel')
  const row = document.getElementById('exitRow')
  const toP = document.getElementById('toPrologue')
  const toS = document.getElementById('toSecondHall')
  const show = document.getElementById('showPanel')
  return {
    panelHidden: panel.classList.contains('hide'),
    showPanelVisible: getComputedStyle(show).display !== 'none',
    exitRowOn: row.classList.contains('on'),
    exitRowDisplay: getComputedStyle(row).display,
    toPrologueOn: toP.classList.contains('on'),
    toPrologueDisplay: getComputedStyle(toP).display,
    toSecondDisplay: getComputedStyle(toS).display,
    topbar: document.querySelector('.topbar h1')?.textContent.trim(),
    goal: document.querySelector('.topbar .goal')?.textContent.trim(),
    hint: document.getElementById('hint')?.textContent.trim()
  }
})
check('一殿抽屉默认收起', hall.panelHidden === true, hall.panelHidden)
check('一殿右上角小按钮可见', hall.showPanelVisible === true, hall.showPanelVisible)
check('一殿通关显示出口行', hall.exitRowOn === true && hall.exitRowDisplay === 'flex', hall)
check('非串联态不显示回便民司', hall.toPrologueOn === false, hall.toPrologueOn)
check('一殿通关显示入第二殿', hall.toSecondDisplay !== 'none', hall.toSecondDisplay)
check('一殿顶部标题块', (hall.topbar ?? '').includes('第一殿 · 孽镜台'), hall.topbar)
check('一殿顶部目标句', (hall.goal ?? '').includes('半印①'), hall.goal)
await page.screenshot({ path: out + '/first-hall-won.png' })

// 展开抽屉 → 功能仍在
await page.click('#showPanel')
await page.waitForTimeout(400)
const drawer = await page.evaluate(() => {
  const panel = document.getElementById('panel')
  const ids = ['reset', 'shot', 'viewFront', 'toggleMirror', 'diffList', 'collapse']
  const missing = ids.filter((id) => !document.getElementById(id))
  return {
    panelHidden: panel.classList.contains('hide'),
    visible: getComputedStyle(panel).display !== 'none',
    missing,
    diffButtons: document.querySelectorAll('#diffList .diff').length
  }
})
check('抽屉可展开', drawer.panelHidden === false && drawer.visible === true, drawer)
check('抽屉功能件齐全', drawer.missing.length === 0, drawer.missing)
check('五处差异列表仍在', drawer.diffButtons === 5, drawer.diffButtons)
await page.screenshot({ path: out + '/first-hall-drawer.png' })

// 点「入第二殿 · 业秤」
await page.click('#toSecondHall')
await page.waitForLoadState('load')
await page.waitForTimeout(1200)
const landed = await page.evaluate(() => ({
  url: location.href,
  overlay: !!document.getElementById('start-overlay'),
  act: document.getElementById('act')?.textContent
}))
check('入第二殿落到根游戏', landed.url.includes('from=hall1=1'), landed.url)
check('入第二殿不再弹浮层', landed.overlay === false, landed.overlay)
check('入第二殿 HUD=业秤', (landed.act ?? '').includes('业秤'), landed.act)
await page.screenshot({ path: out + '/root-act2-from-hall.png' })

// ── 6. 序厅串联进来：一殿通关两个按钮都在 ──
await page.goto(base + '/first-hall/index.html?from=prologue=1&solved=1', { waitUntil: 'load' })
await page.waitForTimeout(4500)
const both = await page.evaluate(() => ({
  toPrologue: getComputedStyle(document.getElementById('toPrologue')).display,
  toSecond: getComputedStyle(document.getElementById('toSecondHall')).display,
  row: getComputedStyle(document.getElementById('exitRow')).display
}))
check('串联态回便民司可见', both.toPrologue !== 'none', both)
check('串联态入第二殿可见', both.toSecond !== 'none', both)
await page.screenshot({ path: out + '/first-hall-won-serial.png' })

// ── 7. 序厅页仍能走到第一殿（未改动，回归）──
await page.goto(base + '/prologue/index.html', { waitUntil: 'load' })
await page.waitForTimeout(3500)
const pro = await page.evaluate(() => ({ title: document.title, probe: window.__prologueProbe ? window.__prologueProbe() : null }))
check('序厅页正常', (pro.title ?? '').includes('序厅'), pro.title)

// ── 8. 起点浮层主按钮跳序厅 ──
await page.goto(base + '/', { waitUntil: 'load' })
await page.waitForSelector('body[data-assets="ready"]', { timeout: 20000 })
await page.waitForTimeout(1200)
await page.click('#start-prologue')
await page.waitForLoadState('load')
await page.waitForTimeout(1500)
const jumped = await page.evaluate(() => ({ url: location.href, title: document.title }))
check('主按钮跳到序厅', jumped.url.includes('/prologue/index.html'), jumped.url)
check('序厅标题正确', (jumped.title ?? '').includes('序厅'), jumped.title)

// ── 9. 窄屏不遮挡画面 ──
await page.setViewportSize({ width: 420, height: 760 })
await page.goto(base + '/first-hall/index.html?solved=1', { waitUntil: 'load' })
await page.waitForTimeout(4500)
const narrow = await page.evaluate(() => {
  const hint = document.getElementById('hint')
  const top = document.querySelector('.topbar')
  const row = document.getElementById('exitRow')
  return {
    hintDisplay: getComputedStyle(hint).display,
    topWidth: top.getBoundingClientRect().width,
    rowWidth: row.getBoundingClientRect().width,
    viewport: innerWidth
  }
})
check('窄屏藏底部键位条', narrow.hintDisplay === 'none', narrow.hintDisplay)
check('窄屏标题块不超宽', narrow.topWidth <= narrow.viewport, narrow)
check('窄屏出口行不超宽', narrow.rowWidth <= narrow.viewport, narrow)
await page.screenshot({ path: out + '/first-hall-narrow.png' })

log('\nERRORS: ' + JSON.stringify(errors, null, 2))
log('FAILURES: ' + failures)
await browser.close()
process.exitCode = failures > 0 || errors.length > 0 ? 1 : 0
