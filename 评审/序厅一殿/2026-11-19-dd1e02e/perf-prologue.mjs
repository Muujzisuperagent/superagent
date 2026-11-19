// 序厅 + 第一殿 性能采集：FPS / draw calls / 加载耗时 / console 错误
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const gameDir = 'D:/群核科技黑客松/game'
const req = createRequire(pathToFileURL(gameDir + '/package.json'))
const { chromium } = req('playwright')
const base = 'http://127.0.0.1:5173'

async function launch() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] })
  } catch {
    return await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] })
  }
}

const instrument = () => {
  window.__evalFrames = 0
  window.__evalDraws = 0
  window.__evalMainDraws = 0
  window.__evalFbo = null
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => { window.__evalFrames += 1; cb(t) })
  const wrap = (proto, names) => {
    for (const name of names) {
      const orig = proto?.[name]
      if (typeof orig !== 'function') return
      proto[name] = function (...a) {
        window.__evalDraws += 1
        if (window.__evalFbo === null) window.__evalMainDraws += 1
        const fbo = a[1]?.framebuffer
        if (fbo !== undefined) window.__evalFbo = fbo
        return orig.apply(this, a)
      }
    }
  }
  wrap(window.WebGL2RenderingContext.prototype, ['drawElements', 'drawArrays'])
  wrap(window.WebGLRenderingContext.prototype, ['drawElements', 'drawArrays'])
}

const views = [
  ['prologue-start', '/prologue/index.html'],
  ['prologue-judge', '/prologue/index.html?dlgapproach=1'],
  ['first-hall-entry', '/first-hall/index.html'],
  ['first-hall-solved', '/first-hall/index.html?solved=1&vision=1']
]

const browser = await launch()
const out = { views: {}, summary: {} }
for (const [name, path] of views) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(instrument)
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  const t0 = Date.now()
  await page.goto(base + path, { waitUntil: 'load' })
  await page.waitForTimeout(5000)
  const loadMs = Date.now() - t0
  const m = await page.evaluate(() => {
    const g = window.__threeRenderer || window.renderer
    let calls = window.__evalDraws || 0, main = window.__evalMainDraws || 0
    let info = null
    for (const k of Object.keys(window)) {
      try { if (window[k]?.isWebGLRenderer) { info = window[k].info.render; break } } catch {}
    }
    const frames = window.__evalFrames || 0
    return { calls, main, frames, info }
  })
  const seconds = 5
  out.views[name] = {
    path, loadMs,
    fps: +(m.frames / seconds).toFixed(2),
    drawsPerFrame: m.info ? m.info.calls : null,
    triangles: m.info ? m.info.triangles : null,
    pageErrors: errors
  }
  await page.close()
}
await browser.close()
out.summary.pageErrors = Object.values(out.views).flatMap(v => v.pageErrors)
await writeFile('D:/群核科技黑客松/评审/序厅一殿/2026-11-19-dd1e02e/perf-prologue.json', JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 1))
