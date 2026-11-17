// 二三殿主流程验收：二殿业秤（配平→压未时→半印②证据B）→ 三殿簿库（检索→显影→勘合→半印③证据C）。
// 模式与 flow-check.mjs 一致：机位传送只改相机坐标，交互走真实射线聚焦 + E 键。
// 用法：先启动 dev server（npm run dev），再 node tests/flow-act23.mjs
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = process.env.GAME_URL ?? 'http://localhost:5173'
const outDir = resolve('artifacts/flow-act23')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const pageErrors = []
const console404 = []
page.on('pageerror', (error) => pageErrors.push(error.message))
page.on('response', (response) => { if (response.status() === 404) console404.push(response.url()) })

await page.route('**/src/main.ts*', async (route) => {
  const response = await route.fetch()
  const body = `${await response.text()}\nObject.assign(window, { __camera: camera, __world: world, __journey: journey, __renderer: renderer })\n`
  await route.fulfill({ response, body })
})

const steps = []
const knownIssues = []
async function record(name, detail, ok = true) {
  steps.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name} · ${detail}`)
}

async function frames(count = 3) {
  try {
    await page.evaluate((n) => new Promise((done) => {
      let left = n
      const tick = () => { left -= 1; if (left <= 0) done(true); else requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }), count)
  } catch (error) {
    if (String(error).includes('Execution context was destroyed') || String(error).includes('Target closed')) {
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => undefined)
      return
    }
    throw error
  }
}

async function toastText() {
  return page.evaluate(() => document.getElementById('toast')?.textContent ?? '')
}

async function dialogueText() {
  return page.evaluate(() => document.getElementById('dialogue')?.textContent ?? '')
}

async function objectiveText() {
  return page.evaluate(() => document.getElementById('objective')?.textContent ?? '')
}

async function inventoryText() {
  return page.evaluate(() => document.getElementById('inventory')?.textContent ?? '')
}

async function teleport(x, z, target) {
  await page.evaluate(([px, pz]) => {
    window.__camera.position.set(px, window.__camera.position.y, pz)
  }, [x, z])
  await frames(2)
  await page.evaluate((t) => {
    window.__camera.lookAt(t[0], t[1], t[2])
  }, target)
  await frames(2)
}

async function interactionWorld(kind, id, act) {
  return page.evaluate(([k, i, a]) => {
    const item = window.__world.interactions.find((entry) => entry.kind === k && (i == null || entry.id === i) && (a == null || entry.act === a))
    if (!item) return null
    const vector = item.object.getWorldPosition(new (item.object.position.constructor)())
    return { x: vector.x, y: vector.y, z: vector.z, enabled: item.enabled, label: item.label }
  }, [kind, id ?? null, act ?? null])
}

async function pressE() {
  await page.keyboard.press('KeyE')
  await frames(4)
  return toastText()
}

async function shoot(name) {
  await page.screenshot({ path: resolve(outDir, `${name}.png`) })
}

await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'load' })
await frames(30)
await page.locator('canvas').click()
await frames(4)
const locked = await page.evaluate(() => document.pointerLockElement !== null)
await record('锁定鼠标', `pointerLockElement=${locked}`, locked)
if (!locked) throw new Error('pointer lock failed; flow cannot run')

// —— 二殿·业秤 ——
const spawn = await page.evaluate(() => [window.__camera.position.x, window.__camera.position.z])
await record('出生点在二殿', `pos=${spawn.map((v) => Math.round(v)).join(',')}`, spawn[1] > 32)

const gatha = await interactionWorld('inscription', 'gatha', 'scale')
await teleport(gatha.x, gatha.z + 1.2, [gatha.x, gatha.y, gatha.z])
const gathaText = await pressE()
const gathaDialogue = await dialogueText()
await record('读足秤偈', (gathaDialogue || gathaText).slice(0, 40), gathaDialogue.includes('十六两'))

// 错误流：10 → 40 → 7 → 47 → 5 超重覆秤
for (const id of ['shiliang', 'qiliang', 'wuliang']) {
  const point = await interactionWorld('weight', id, 'scale')
  if (!point) throw new Error(`weight interaction missing: ${id}`)
  await teleport(point.x, point.z + 1.0, [point.x, point.y, point.z])
  const text = await pressE()
  await record(`拾放砝码 ${id}`, text.slice(0, 44), true)
}
const overflowText = await toastText()
await record('超重覆秤（10+7+5=52）', overflowText.slice(0, 44), overflowText.includes('多了') || overflowText.includes('重配'))
await shoot('01-overflow-reset')

// 正确流：10 → 40 → 7 → 47 → 3 → 50 平
for (const id of ['shiliang', 'qiliang', 'sanliang']) {
  const point = await interactionWorld('weight', id, 'scale')
  await teleport(point.x, point.z + 1.0, [point.x, point.y, point.z])
  const text = await pressE()
  await record(`重配砝码 ${id}`, text.slice(0, 44), true)
}
const balanceText = await toastText()
await record('配平五十两', balanceText.slice(0, 44), balanceText.includes('五十两') || balanceText.includes('足秤'))
const objectiveAfterBalance = await objectiveText()
await record('objective 分步更新（②压未时）', objectiveAfterBalance.slice(0, 60), objectiveAfterBalance.includes('②'))

const extra = await interactionWorld('weight', 'yiliang-extra', 'scale')
if (!extra) throw new Error('yiliang-extra not spawned after balance')
await teleport(extra.x, extra.z + 1.0, [extra.x, extra.y, extra.z])
const pressText = await pressE()
await record('那一两压进未时', pressText.slice(0, 44), pressText.includes('半印②') || pressText.includes('半印'))
await shoot('02-scale-solved')

const seal2 = await interactionWorld('seal', 'seal2', 'scale')
if (!seal2) throw new Error('seal2 missing')
await teleport(seal2.x, seal2.z + 1.15, [seal2.x, seal2.y, seal2.z])
const seal2Text = await pressE()
await record('二殿收半印②+证据B', seal2Text.slice(0, 44), seal2Text.includes('半印②'))
const invAfterScale = await inventoryText()
await record('路引状态（半印1/6 · 证据B）', invAfterScale, invAfterScale.includes('1/6') && invAfterScale.includes('B'))
await shoot('03-scale-inventory')

const exitScale = await interactionWorld('exit', 'exit', 'scale')
await teleport(exitScale.x, exitScale.z + 1.2, [exitScale.x, exitScale.y, exitScale.z])
await pressE()
await frames(6)
const actNow = await page.evaluate(() => {
  const act = document.getElementById('act')?.textContent ?? ''
  return act
})
await record('穿过南门进入三殿', actNow, actNow.includes('第三殿'))

// —— 三殿·簿库 ——
// 错误流：翻错两册
for (const id of ['jiawu', 'gengshen']) {
  const point = await interactionWorld('register', id, 'archive')
  if (!point) throw new Error(`register interaction missing: ${id}`)
  await teleport(point.x, point.z + 1.0, [point.x, point.y, point.z])
  const text = await pressE()
  await record(`翻错册 ${id}`, text.slice(0, 44), text.length > 0)
}
const objAfterWrong = await objectiveText()
await record('翻错不计入③进度', objAfterWrong.slice(0, 60), objAfterWrong.includes('①'))

// 正确流：丙午册
const bingwu = await interactionWorld('register', 'bingwu', 'archive')
await teleport(bingwu.x, bingwu.z + 1.0, [bingwu.x, bingwu.y, bingwu.z])
const bingwuText = await pressE()
await record('找到丙午册（第43位）', bingwuText.slice(0, 44), bingwuText.includes('丙午') || bingwuText.includes('四十三'))

// 提灯侧光显影
const lamp = await interactionWorld('lamp', 'lamp', 'archive')
if (!lamp) throw new Error('lamp missing')
await teleport(lamp.x, lamp.z + 1.1, [lamp.x, lamp.y, lamp.z])
const lampText = await pressE()
await record('侧光显影刮改', lampText.slice(0, 44), lampText.includes('生') || lampText.includes('刮'))
await shoot('04-scrape-revealed')

// 朱笔勘合
const brush = await interactionWorld('brush', 'brush', 'archive')
if (!brush) throw new Error('brush missing or not enabled after reveal')
await teleport(brush.x, brush.z + 1.0, [brush.x, brush.y, brush.z])
const brushText = await pressE()
await record('朱笔勘合', brushText.slice(0, 44), brushText.includes('半印③') || brushText.includes('勘合'))

const seal3 = await interactionWorld('seal', 'seal3', 'archive')
if (!seal3) throw new Error('seal3 missing')
await teleport(seal3.x, seal3.z + 1.15, [seal3.x, seal3.y, seal3.z])
const seal3Text = await pressE()
await record('三殿收半印③+证据C', seal3Text.slice(0, 44), seal3Text.includes('半印③'))
const invFinal = await inventoryText()
await record('路引终态（2/6 · B/C）', invFinal, invFinal.includes('2/6') && invFinal.includes('B') && invFinal.includes('C'))
await shoot('05-archive-solved')

// —— 指标采样 ——
const metrics = await page.evaluate(() => new Promise((done) => {
  const renderer = window.__renderer
  let framesCount = 0
  const start = performance.now()
  function tick() {
    framesCount += 1
    if (performance.now() - start < 2000) requestAnimationFrame(tick)
    else done({
      fps: Math.round(framesCount / 2),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    })
  }
  requestAnimationFrame(tick)
}))
await record('性能（三殿区域）', `fps=${metrics.fps} draws=${metrics.drawCalls} tris=${metrics.triangles}`, metrics.fps >= 24 && metrics.drawCalls <= 800)

await record('无 pageerror', `${pageErrors.length} errors`, pageErrors.length === 0)
await record('无关键 404', `${console404.length} missing`, console404.length === 0)

const failed = steps.filter((step) => !step.ok)
const summary = { total: steps.length, failed: failed.length, steps, pageErrors, console404, metrics, knownIssues }
await writeFile(resolve(outDir, 'flow-act23.json'), JSON.stringify(summary, null, 2))
console.log(`\n==== ${steps.length - failed.length}/${steps.length} PASS · 结果: ${failed.length ? '打回' : '通过'} ====`)
await browser.close()
process.exit(failed.length ? 1 : 0)
