// 轮询 Lux3D 任务状态并下载 GLB
// 用法：node tools/lux3d-collect.mjs [--once]
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { call } from './aholo-mcp.mjs'

const OUT = 'game/public/models/prologue'
const MANIFEST = OUT + '/manifest.json'
const ONCE = process.argv.includes('--once')

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('http ' + res.status)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  return buf.length
}

async function main() {
  const man = JSON.parse(await readFile(MANIFEST, 'utf8'))
  const pending = man.assets.filter(a => !existsSync(`${OUT}/${a.key}.glb`))
  if (!pending.length) { console.log('all assets present'); return }
  for (const a of pending) {
    if (!a.taskId) { console.log('no taskId for', a.key); continue }
    let st
    try {
      st = JSON.parse(await call('lux3d_get_task', { taskId: Number(a.taskId) }, 60000))
    } catch (e) {
      console.log(a.key, 'query failed:', e.message); continue
    }
    const s = st.status !== undefined ? st.status : (st.data && st.data.status)
    console.log(a.key, 'status =', s, JSON.stringify(st).slice(0, 220))
    if (s !== 3) {           // 3 = success
      if (s === 0 || s === 1) { await new Promise(r => setTimeout(r, 12000)) }
      continue
    }
    // find the glb url in the payload
    const text = JSON.stringify(st)
    const m = text.match(/https:\/\/[^"\\ ]+\.glb[^"\\ ]*/)
    if (!m) { console.log(a.key, 'no glb url in payload:', text.slice(0, 400)); continue }
    try {
      const n = await download(m[0], `${OUT}/${a.key}.glb`)
      a.glbUrl = m[0]
      a.bytes = n
      a.status = 'downloaded'
      console.log('  downloaded', a.key, n, 'bytes')
    } catch (e) {
      console.log('  download failed', a.key, e.message)
    }
  }
  await writeFile(MANIFEST, JSON.stringify(man, null, 2))
  console.log('manifest updated')
}

await main()
if (!ONCE) {
  // keep polling until everything is downloaded
  for (let i = 0; i < 40; i++) {
    const man = JSON.parse(await readFile(MANIFEST, 'utf8'))
    const left = man.assets.filter(a => !existsSync(`${OUT}/${a.key}.glb`)).length
    if (!left) { console.log('done'); break }
    console.log('remaining', left, '- sleeping')
    await new Promise(r => setTimeout(r, 20000))
    await main()
  }
}
