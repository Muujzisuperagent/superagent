// 验官功能回归探针（HEAD=3894f94）— 只读验证，不改游戏代码。
// 用法：先起 dev server（5196 端口），再 GAME_URL=http://localhost:5196 node.exe 本脚本。
// 产物：本目录 probes.json
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'

const { chromium } = await import(pathToFileURL('D:/群核科技黑客松/game/node_modules/playwright/index.mjs'))

const url = process.env.GAME_URL || 'http://localhost:5196'
const out = { url, startedAt: new Date().toISOString(), checks: [] }
const add = (name, ok, detail) => { out.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(detail)}`) }

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('body[data-assets=ready]', { timeout: 60000 })
await page.waitForTimeout(3000)

// 1) colliderCount
const colliderCount = await page.evaluate(() => window.__escapeWorld?.colliderCount)
add('colliderCount=317', colliderCount === 317, { colliderCount })

// 步行模拟：多路点逐步 constrain（非传送），卡住自动停
const walk = `((w) => {
  return (route, completedKeys, step = 0.1) => {
    const completed = new Set(completedKeys)
    const pos = { x: route[0][0], y: 1.65, z: route[0][1] }
    let prev = { x: pos.x, y: 1.65, z: pos.z }
    for (const [tx, tz] of route.slice(1)) {
      let best = Infinity
      for (let i = 0; i < 6000; i++) {
        prev = { x: pos.x, y: pos.y, z: pos.z }
        const dx = tx - pos.x, dz = tz - pos.z
        const d = Math.hypot(dx, dz)
        if (d < 0.01) break
        pos.x += (dx / d) * step; pos.z += (dz / d) * step
        w.constrain(pos, prev, completed)
        // 网格进度检测：净距离 2000 步无改善即视为被实体挡住，转下一个路点（等价玩家的沿墙滑动换向）
        if (i % 2000 === 0) {
          const nd = Math.hypot(tx - pos.x, tz - pos.z)
          if (nd > best - 0.05) break
          best = nd
        }
      }
    }
    return { x: +pos.x.toFixed(3), z: +pos.z.toFixed(3), y: +pos.y.toFixed(3) }
  }
})(window.__escapeWorld)`

const w = await page.evaluateHandle(walk)
const run = (route, completed) => w.evaluate((f, arg) => f(arg.r, arg.c), { r: route, c: completed })
const full = ['archive', 'scale', 'medicine', 'palace']

// 2) 四殿：未配药不得出北门 z≈-7.8（从东侧绕开药案后直行）
const act4a = await run([[3, 2], [3, -4], [0, -16.01]], [])
add('act4 未配药不得出北门(z≈-7.8)', act4a.z >= -7.9 && act4a.z <= -7.7, act4a)
// 配药后：南门→东绕药案→北门洞 z=-16.01
const act4b = await run([[0, 6], [3.1, -1], [0, -16.01]], ['medicine'])
add('act4 配药后绕药案达北门洞', act4b.z <= -15.9 && Math.abs(act4b.x) <= 1.01, act4b)

// 3) 五殿：9/9 格心 + 北门
const cells = [
  ['8', -2.05, -25.7], ['1', 0, -25.7], ['6', 2.05, -25.7],
  ['3', -2.05, -27.75], ['5', 0, -27.75], ['7', 2.05, -27.75],
  ['4', -2.05, -29.8], ['9', 0, -29.8], ['2', 2.05, -29.8]
]
let cellOk = 0
const cellResults = []
for (const [v, cx, cz] of cells) {
  // 中列(1/5/9)从 (0,-22) 直线会被前铜盏(0,-24.65)挡，玩家沿推出方向滑动绕行；探针用同路点
  const route = Math.abs(cx) < 0.01 ? [[0, -22], [-2.05, -24.6], [cx, cz]] : [[0, -22], [cx, cz]]
  const r = await run(route, full)
  const ok = Math.abs(r.x - cx) < 0.35 && Math.abs(r.z - cz) < 0.35
  if (ok) cellOk++
  cellResults.push({ v, target: [cx, cz], got: [r.x, r.z], ok })
}
add('act5 九宫 9/9 格心可达', cellOk === 9, cellResults)
const act5nolock = await run([[0, -35.9], [0, -37.5]], full.filter((k) => k !== 'palace'))
add('act5 未收印⑤不得穿北门(停于门线 z≥-36)', act5nolock.z >= -36.05, act5nolock)
const act5lock = await run([[0, -35.9], [0, -37.5]], full)
add('act5 收印⑤后北行到 z≈-37.5', act5lock.z <= -37.4 && act5lock.z >= -37.6, act5lock)

// 4) 六殿：桥面钳制 / 岸台横撞 / 合符台两侧 / 门框 / 三结局台
const bridgeRight = await run([[0, -60], [3, -60]], full)
add('桥面 z=-60 右行停 x≈1.9', Math.abs(bridgeRight.x - 1.9) < 0.02, bridgeRight)
const bridgeLeft = await run([[0, -60], [-3, -60]], full)
add('桥面 z=-60 左行停 x≈-1.9', Math.abs(bridgeLeft.x + 1.9) < 0.02, bridgeLeft)
const bank = await run([[-4, -49], [-4, -56]], full)
add('岸台横撞桥口停 z≈-52 且 x 不变', Math.abs(bank.z + 52) < 0.15 && Math.abs(bank.x + 4) < 0.01, bank)
const sideR = await run([[1.5, -68.5], [1.5, -71.5]], full)
add('合符台右侧 x=1.5 可到 z≈-71.5', Math.abs(sideR.z + 71.5) < 0.3 && Math.abs(sideR.x - 1.5) < 0.3, sideR)
const sideL = await run([[-1.5, -68.5], [-1.5, -71.5]], full)
add('合符台左侧 x=-1.5 可到 z≈-71.5', Math.abs(sideL.z + 71.5) < 0.3 && Math.abs(sideL.x + 1.5) < 0.3, sideL)
const bridgeCenter = await run([[0, -51.9], [0, -69.4], [1.9, -69.4], [1.9, -71.3], [0, -73.9]], full)
add('桥心中轴被合符台挡后绕行达桥尾', bridgeCenter.z <= -73.8, bridgeCenter)
const doorFrame = await run([[0, -73.9], [0, -77.6]], full)
add('六殿门框通行至结局台线', doorFrame.z <= -77.0, doorFrame)
const endR = await run([[2.7, -75], [2.7, -77.6]], full)
const endM = await run([[0, -75.5], [0, -77.6]], full)
const endL = await run([[-2.7, -75], [-2.7, -77.6]], full)
add('三结局台(-2.7/0/+2.7,-77.6)可达', endR.z <= -77.0 && endM.z <= -77.0 && endL.z <= -77.0, { endR, endM, endL })

// 5) 指针锁分流：Playwright(webdriver) 点 canvas 不上锁 + 提示含「按住左键拖动」
await page.mouse.click(640, 360)
await page.waitForTimeout(300)
const lockState = await page.evaluate(() => ({
  locked: document.pointerLockElement !== null,
  hint: document.querySelector('#lock-hint')?.textContent || Array.from(document.querySelectorAll('div')).map((d) => d.textContent).find((t) => t && t.includes('环视')) || ''
}))
add('webdriver 点击 canvas 不上锁', lockState.locked === false, lockState)
add('免锁提示含「按住左键拖动」', lockState.hint.includes('按住左键拖动'), { hint: lockState.hint })

add('pageErrors=0', errors.length === 0, { errors })
out.finishedAt = new Date().toISOString()
writeFileSync(new URL('./probes.json', import.meta.url), JSON.stringify(out, null, 2))
const failed = out.checks.filter((c) => !c.ok)
console.log(`TOTAL ${out.checks.length - failed.length}/${out.checks.length} passed`)
await browser.close()
process.exit(failed.length ? 1 : 0)
