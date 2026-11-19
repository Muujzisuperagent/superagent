// 契约回归：检查 window.PrologueScene / LAYOUT / judgeAt / refs.judge / refs.judgeGlow /
// pick id "judge" / ?nojudge=1 / ?v28judge=1 三条回退路径
import { chromium } from 'playwright'

const base = (process.env.GAME_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true
})
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

async function probe(q) {
  await page.goto(base + '/prologue/index.html' + q, { waitUntil: 'load' })
  await page.waitForTimeout(3200)
  return page.evaluate(() => {
    const S = window.__prologueScene
    const T = window.THREE
    let judgeMeshes = 0, pickJudge = false
    if (S && S.refs.judge) {
      S.refs.judge.traverse((o) => { if (o.isMesh) judgeMeshes++ })
    }
    if (S) pickJudge = S.pickMeshes.some((o) => o.userData && o.userData.pick === 'judge')
    return {
      hasScene: !!S,
      judgeAt: S ? S.judgeAt : null,
      judgeMeshes,
      pickJudge,
      glowOpacity: S && S.refs.judgeGlow ? S.refs.judgeGlow.material.opacity : null,
      glowIsSprite: !!(S && S.refs.judgeGlow && S.refs.judgeGlow.isSprite),
      layoutHalfW: S ? S.layout.halfW : null,
      walkBounds: S ? [S.layout.walk.minX, S.layout.walk.maxX] : null,
      steps: S ? S.PICKS.length : null,
      observeTotal: S ? S.observeTotal : null
    }
  })
}

const cases = [
  ['default', ''],
  ['nojudge=1', '?nojudge=1'],
  ['v28judge=1', '?v28judge=1'],
  ['plainface=1', '?plainface=1'],
  ['dlgapproach=1', '?dlgapproach=1']
]
for (const [name, q] of cases) {
  const r = await probe(q)
  console.log(name.padEnd(14), JSON.stringify(r))
}
console.log('errors:', JSON.stringify(errors))
await browser.close()
