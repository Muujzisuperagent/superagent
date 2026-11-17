// 点击锁定恢复验收：人工浏览器（webdriver=false）点击上锁、Esc 释放；
// 夸克下连按两次 Esc 触发刷新兜底；自动化环境（webdriver=true）保持免锁。
import { chromium } from 'playwright'

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}${detail ? ' · ' + detail : ''}`)
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })

async function openPage(userAgent, webdriver) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent,
    ...(webdriver ? {} : {})
  })
  if (!webdriver) {
    await ctx.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
    })
  }
  const page = await ctx.newPage()
  await page.goto(`${baseUrl}/?clean=1`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  return { ctx, page }
}

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
const QUARK_UA = CHROME_UA + ' QuarkPC/7.4.7.1036'

// 1) 人工浏览器：点击应上锁
{
  const { ctx, page } = await openPage(CHROME_UA, false)
  await page.locator('canvas').click()
  await page.waitForTimeout(600)
  check('人工浏览器点击上锁', await page.evaluate(() => document.pointerLockElement !== null))
  const hint = await page.evaluate(() => document.getElementById('lock-hint')?.textContent ?? '')
  check('锁定时提示 Esc', hint.includes('Esc'), hint)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  check('Esc 释放', await page.evaluate(() => document.pointerLockElement === null))
  await ctx.close()
}

// 2) 夸克人工环境：连按两次 Esc 应刷新
{
  const { ctx, page } = await openPage(QUARK_UA, false)
  await page.locator('canvas').click()
  await page.waitForTimeout(400)
  let navCount = 0
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) navCount += 1 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  check('夸克连按 Esc 刷新兜底', navCount >= 1, `navigations=${navCount}`)
  await ctx.close()
}

// 3) 自动化环境：不上锁
{
  const { ctx, page } = await openPage(CHROME_UA, true)
  await page.locator('canvas').click()
  await page.waitForTimeout(500)
  check('webdriver 环境免锁', await page.evaluate(() => document.pointerLockElement === null))
  const hint = await page.evaluate(() => document.getElementById('lock-hint')?.textContent ?? '')
  check('webdriver 提示拖动', hint.includes('按住左键拖动'), hint)
  await ctx.close()
}

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)