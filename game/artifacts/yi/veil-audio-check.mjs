// 匠人乙一次性复验：首屏遮罩契约 + 指针锁定不被挡 + 程序化声音手势解锁 / M 静音 / 按殿 crossfade。
// 用法：dev server 起在 5173，node artifacts/yi/veil-audio-check.mjs
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const outDir = resolve('artifacts/yi')
await mkdir(outDir, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})

const spy = () => {
  window.__audio = { contexts: 0, state: null, gains: [], ramps: [], oscillators: 0, sources: 0 }
  const Orig = window.AudioContext
  window.AudioContext = class extends Orig {
    constructor(...args) {
      super(...args)
      window.__audio.contexts += 1
      window.__audio.ctx = this
    }
  }
  const origGain = AudioContext.prototype.createGain
  AudioContext.prototype.createGain = function (...args) {
    const node = origGain.apply(this, args)
    window.__audio.gains.push(node)
    return node
  }
  const origOsc = AudioContext.prototype.createOscillator
  AudioContext.prototype.createOscillator = function (...args) {
    window.__audio.oscillators += 1
    return origOsc.apply(this, args)
  }
  const origSrc = AudioContext.prototype.createBufferSource
  AudioContext.prototype.createBufferSource = function (...args) {
    window.__audio.sources += 1
    return origSrc.apply(this, args)
  }
  const origRamp = AudioParam.prototype.linearRampToValueAtTime
  AudioParam.prototype.linearRampToValueAtTime = function (value, time) {
    window.__audio.ramps.push({ value: Number(value.toFixed(3)), at: Number(time.toFixed(2)) })
    return origRamp.call(this, value, time)
  }
}

const results = []
const record = (name, detail, ok = true) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name} · ${detail}`)
}

async function newPage(init) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript(spy)
  if (init) await page.addInitScript(init)
  return { page, pageErrors }
}

const veilState = (page) => page.evaluate(() => {
  const el = document.getElementById('loading-veil')
  if (!el) return { present: false }
  const style = getComputedStyle(el)
  return {
    present: true,
    display: style.display,
    opacity: Number(style.opacity),
    pointerEvents: style.pointerEvents,
    indeterminate: el.classList.contains('veil-indeterminate'),
    percent: el.querySelector('.veil-percent')?.textContent ?? '',
    count: el.querySelector('.veil-count')?.textContent ?? '',
    barWidth: el.querySelector('.veil-bar')?.style.width ?? ''
  }
})

// ——— A 组：真实页面（scene.ts 尚未派发进度事件时的兜底路径） ———
{
  const { page, pageErrors } = await newPage()
  await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'commit' })
  await page.waitForSelector('#loading-veil', { timeout: 15000 })
  const veilSeenAt = Date.now()
  const early = await veilState(page)
  record('A 遮罩首屏出现', JSON.stringify(early), early.present && early.display !== 'none')
  await page.screenshot({ path: resolve(outDir, 'A-veil-early.png') })

  // 遮罩仍在时点击 canvas：必须能拿到指针锁定。
  await page.locator('canvas').click()
  const lockedDuringVeil = await page.evaluate(() => document.pointerLockElement !== null)
  const duringVeil = await veilState(page)
  record('A 遮罩期间点击仍锁定鼠标', `locked=${lockedDuringVeil} veil.pointerEvents=${duringVeil.pointerEvents}`, lockedDuringVeil && duringVeil.pointerEvents === 'none')

  const audioBefore = await page.evaluate(() => ({ contexts: window.__audio.contexts, oscillators: window.__audio.oscillators }))
  record('A 点击后解锁 AudioContext', JSON.stringify(audioBefore), audioBefore.contexts === 1 && audioBefore.oscillators > 10)

  await page.waitForFunction(() => {
    const el = document.getElementById('loading-veil')
    return !el || getComputedStyle(el).display === 'none'
  }, { timeout: 12000 })
  const goneAt = Date.now() - veilSeenAt
  const gone = await veilState(page)
  record('A 无进度事件时兜底淡出', `display=${gone.display} opacity=${gone.opacity} 遮罩出现后${goneAt}ms`, gone.display === 'none' && goneAt <= 7200)
  await page.screenshot({ path: resolve(outDir, 'A-after-veil.png') })

  const badge0 = await page.evaluate(() => document.getElementById('audio-toggle')?.textContent ?? '')
  await page.keyboard.press('KeyM')
  await page.waitForTimeout(320)
  const mutedState = await page.evaluate(() => ({
    badge: document.getElementById('audio-toggle')?.textContent ?? '',
    pressed: document.getElementById('audio-toggle')?.getAttribute('aria-pressed'),
    master: window.__audio.gains[0]?.gain.value ?? -1
  }))
  record('A M 键静音', `${badge0} → ${JSON.stringify(mutedState)}`, mutedState.badge.includes('静音') && mutedState.pressed === 'true' && mutedState.master < 0.01)
  await page.keyboard.press('KeyM')
  await page.waitForTimeout(320)
  const unmuted = await page.evaluate(() => ({ badge: document.getElementById('audio-toggle')?.textContent ?? '', master: window.__audio.gains[0]?.gain.value ?? -1 }))
  record('A M 键恢复', JSON.stringify(unmuted), unmuted.badge.includes('开') && unmuted.master > 0.2 && unmuted.master <= 0.25)

  // 传送到五殿，检查环境音 crossfade 被调度（ramp 到 1 与 0）。
  await page.evaluate(() => { window.__audio.ramps.length = 0 })
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(200)
  await page.keyboard.up('KeyS')
  const wayfinderMedicine = await page.evaluate(() => document.querySelector('#wayfinder .wf-name')?.textContent ?? '')
  await page.evaluate(() => {
    const camera = window.__camera
    camera.position.set(0, camera.position.y, -27)
  })
  await page.waitForFunction(() => (document.querySelector('#wayfinder .wf-name')?.textContent ?? '').includes('石板'), { timeout: 10000 })
  const ramps = await page.evaluate(() => window.__audio.ramps)
  const wayfinderPalace = await page.evaluate(() => ({
    name: document.querySelector('#wayfinder .wf-name')?.textContent ?? '',
    meta: document.querySelector('#wayfinder .wf-meta')?.textContent ?? '',
    act: document.getElementById('act')?.textContent ?? ''
  }))
  record('A 按殿切换环境音', `ramps=${JSON.stringify(ramps.slice(0, 6))}`, ramps.some((r) => r.value === 1) && ramps.some((r) => r.value === 0))
  record('A 引路牌随殿更新', `${wayfinderMedicine} → ${JSON.stringify(wayfinderPalace)}`, wayfinderPalace.act.includes('第五殿') && wayfinderPalace.name.includes('石板'))
  await page.screenshot({ path: resolve(outDir, 'A-palace-wayfinder.png') })

  // 释放鼠标后重新锁定，确认遮罩/提示不残状态（headless 下 Esc 不触发浏览器级解锁，用 exitPointerLock 等价验证）。
  await page.evaluate(() => document.exitPointerLock())
  await page.waitForTimeout(300)
  const unlockedHint = await page.evaluate(() => ({
    locked: document.pointerLockElement !== null,
    hint: getComputedStyle(document.getElementById('lock-hint')).display
  }))
  await page.waitForTimeout(1200)
  await page.locator('canvas').click()
  await page.waitForTimeout(400)
  const relocked = await page.evaluate(() => ({
    locked: document.pointerLockElement !== null,
    hint: getComputedStyle(document.getElementById('lock-hint')).display,
    veil: getComputedStyle(document.getElementById('loading-veil')).display
  }))
  record('A Esc 释放后可重新锁定', `${JSON.stringify(unlockedHint)} → ${JSON.stringify(relocked)}`, !unlockedHint.locked && relocked.locked && relocked.hint === 'none' && relocked.veil === 'none')
  record('A pageErrors', JSON.stringify(pageErrors), pageErrors.length === 0)
  await page.close()
}

// ——— B 组：按契约注入 assets-progress / assets-ready，验证百分比与 ready 淡出 ———
{
  const { page, pageErrors } = await newPage(() => {
    let loaded = 0
    const total = 6
    const tick = () => {
      loaded += 1
      window.dispatchEvent(new CustomEvent('assets-progress', { detail: { loaded, total } }))
      if (loaded >= total) window.dispatchEvent(new CustomEvent('assets-ready', { detail: { total } }))
      else window.setTimeout(tick, 320)
    }
    window.setTimeout(tick, 400)
  })
  await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'commit' })
  await page.waitForSelector('#loading-veil', { timeout: 15000 })
  await page.waitForTimeout(900)
  const mid = await veilState(page)
  const [loadedText, totalText] = (mid.count.match(/(\d+) \/ (\d+)/) ?? []).slice(1)
  const expectedPercent = loadedText ? `${Math.round((Number(loadedText) / Number(totalText)) * 100)}%` : ''
  record('B 进度百分比与件数一致', JSON.stringify(mid), mid.present && !!loadedText && mid.percent === expectedPercent && !mid.indeterminate && mid.pointerEvents === 'none')
  await page.screenshot({ path: resolve(outDir, 'B-veil-progress.png') })
  await page.waitForFunction(() => document.querySelector('#loading-veil .veil-percent')?.textContent === '100%', { timeout: 8000 })
  const full = await veilState(page)
  record('B ready 后 100%', JSON.stringify(full), full.percent === '100%' && full.barWidth === '100%')
  await page.waitForFunction(() => getComputedStyle(document.getElementById('loading-veil')).display === 'none', { timeout: 8000 })
  const gone = await veilState(page)
  record('B ready 后淡出并 display:none', JSON.stringify(gone), gone.display === 'none' && gone.pointerEvents === 'none')
  await page.locator('canvas').click()
  await page.waitForTimeout(200)
  const locked = await page.evaluate(() => document.pointerLockElement !== null)
  record('B 淡出后指针锁定', `locked=${locked}`, locked)
  await page.screenshot({ path: resolve(outDir, 'B-after-veil.png') })
  record('B pageErrors', JSON.stringify(pageErrors), pageErrors.length === 0)
  await page.close()
}

const failed = results.filter((item) => !item.ok)
const report = { ranAt: new Date().toISOString(), baseUrl, results, ok: failed.length === 0 }
await writeFile(resolve(outDir, 'veil-audio-log.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ok: report.ok, failed: failed.map((item) => item.name) }))
await browser.close()
process.exit(report.ok ? 0 : 1)