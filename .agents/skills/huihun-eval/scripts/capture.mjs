#!/usr/bin/env node
/**
 * Capture three act screenshots + runtime metrics for 还魂路引.
 * Usage:
 *   node capture.mjs --out <dir> --url http://127.0.0.1:5173
 * Env:
 *   GAME_DIR  absolute path to game/ (defaults to repo/game)
 */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const outDir = resolve(getArg('--out', 'eval-out'))
const baseUrl = getArg('--url', process.env.GAME_URL ?? 'http://127.0.0.1:5173')
const gameDir = resolve(getArg('--game', process.env.GAME_DIR ?? join(process.cwd(), 'game')))
const sampleMs = Number(getArg('--sample-ms', '2200'))
const settleMs = Number(getArg('--settle-ms', '4500'))
const edgeExe = getArg('--edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')

const require = createRequire(pathToFileURL(join(gameDir, 'package.json')))
const { chromium } = require('playwright')

const views = [
  ['medicine', 'act4-medicine.png'],
  ['palace', 'act5-palace.png'],
  ['river', 'act6-reincarnation.png']
]

async function launch() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] })
  } catch {
    return await chromium.launch({ executablePath: edgeExe, headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] })
  }
}

const instrument = () => {
  window.__evalFrames = 0
  window.__evalDraws = 0
  window.__evalMainDraws = 0
  window.__evalFbo = null
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => {
    window.__evalFrames += 1
    cb(t)
  })
  const wrap = (proto, names) => {
    for (const name of names) {
      const orig = proto?.[name]
      if (typeof orig !== 'function') continue
      proto[name] = function (...a) {
        window.__evalDraws += 1
        if (window.__evalFbo === null) window.__evalMainDraws += 1
        return orig.apply(this, a)
      }
    }
  }
  const names = ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements']
  wrap(window.WebGL2RenderingContext?.prototype, names)
  wrap(window.WebGLRenderingContext?.prototype, names)
  for (const proto of [window.WebGL2RenderingContext?.prototype, window.WebGLRenderingContext?.prototype]) {
    const origBind = proto?.bindFramebuffer
    if (typeof origBind === 'function') {
      proto.bindFramebuffer = function (target, fb) {
        window.__evalFbo = fb ?? null
        return origBind.call(this, target, fb)
      }
    }
  }
}

const gpuInfo = () => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    }
  } catch {
    return null
  }
}

const browser = await launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

let pageErrors = []
let consoleErrors = []
let failedRequests = []
page.on('pageerror', (e) => pageErrors.push(String(e.message || e)))
page.on('console', (m) => {
  if (m.type() === 'error') {
    const url = m.location()?.url ?? ''
    if (url.includes('favicon')) return
    consoleErrors.push(url ? `${m.text()} @ ${url}` : m.text())
  }
})
page.on('requestfailed', (r) => failedRequests.push({ url: r.url(), error: r.failure()?.errorText ?? 'failed' }))
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push({ url: r.url(), error: `HTTP ${r.status()}` })
})
await page.addInitScript(instrument)

await mkdir(join(outDir, 'screens'), { recursive: true })
const results = { baseUrl, viewport: { width: 1440, height: 900 }, capturedAt: new Date().toISOString(), views: {} }

for (const [view, file] of views) {
  pageErrors = []
  consoleErrors = []
  failedRequests = []

  const t0 = Date.now()
  await page.goto(`${baseUrl}/?view=${view}&clean=1`, { waitUntil: 'networkidle', timeout: 45000 })
  const loadMs = Date.now() - t0
  await page.waitForTimeout(settleMs)
  const screenshot = join(outDir, 'screens', file)
  await page.screenshot({ path: screenshot })

  const metric = await page.evaluate(async (ms) => {
    const f0 = window.__evalFrames
    const d0 = window.__evalDraws
    const m0 = window.__evalMainDraws
    const t0 = performance.now()
    await new Promise((r) => setTimeout(r, ms))
    const t1 = performance.now()
    const frames = window.__evalFrames - f0
    const draws = window.__evalDraws - d0
    const mainDraws = window.__evalMainDraws - m0
    const seconds = (t1 - t0) / 1000
    return {
      frames,
      seconds,
      fps: seconds > 0 ? frames / seconds : 0,
      drawsPerFrame: frames > 0 ? draws / frames : null,
      mainDrawsPerFrame: frames > 0 ? mainDraws / frames : null,
      jsHeapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null,
      canvas: document.querySelectorAll('canvas').length
    }
  }, sampleMs)

  results.views[view] = {
    screenshot,
    loadMs,
    ...metric,
    gpu: await page.evaluate(gpuInfo),
    pageErrors: [...pageErrors],
    consoleErrors: [...consoleErrors],
    failedRequests: [...failedRequests]
  }
}

results.summary = {
  canvas: Math.max(...Object.values(results.views).map((v) => v.canvas)),
  pageErrors: Object.values(results.views).flatMap((v) => v.pageErrors),
  consoleErrors: Object.values(results.views).flatMap((v) => v.consoleErrors),
  failedRequests: Object.values(results.views).flatMap((v) => v.failedRequests)
}

await writeFile(join(outDir, 'capture.json'), JSON.stringify(results, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, out: join(outDir, 'capture.json'), views: Object.keys(results.views) }))
await browser.close()
