// 轮询判官 Lux3D 任务并下载 GLB（第三轮 · 方案 A）
// 用法：node tools/lux3d-collect-judge.mjs [--once]
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { call } from './aholo-mcp.mjs'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'public/models/prologue')
const MANIFEST = join(OUT, 'manifest-judge.json')
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
  const pending = man.assets.filter(a => !existsSync(join(OUT, a.key + '.glb')))
  if (!pending.length) { console.log('all judge assets present'); return }
  for (const a of pending) {
    if (!a.taskId) { console.log('no taskId for', a.key); continue }
    let st
    try {
      st = JSON.parse(await call('lux3d_get_task', { taskId: Number(a.taskId) }, 60000))
    } catch (e) {
      console.log(a.key, 'query failed:', e.message); continue
    }
    const s = st.status !== undefined ? st.status : (st.data && st.data.status)
    console.log(a.key, 'status =', s)
    if (s !== 3) continue
    const text = JSON.stringify(st)
    const m = text.match(/https:\/\/[^"\\ ]+\.glb[^"\\ ]*/)
    if (!m) { console.log(a.key, 'no glb url:', text.slice(0, 300)); continue }
    try {
      const n = await download(m[0], join(OUT, a.key + '.glb'))
      a.glbUrl = m[0]; a.bytes = n; a.status = 'downloaded'
      console.log('  downloaded', a.key, n, 'bytes')
    } catch (e) { console.log('  download failed', a.key, e.message) }
  }
  await writeFile(MANIFEST, JSON.stringify(man, null, 2))
  console.log('manifest updated')
}

await main()
if (!ONCE) {
  for (let i = 0; i < 60; i++) {
    const man = JSON.parse(await readFile(MANIFEST, 'utf8'))
    const left = man.assets.filter(a => !existsSync(join(OUT, a.key + '.glb'))).length
    if (!left) { console.log('done'); break }
    console.log('remaining', left, '- sleep')
    await new Promise(r => setTimeout(r, 20000))
    await main()
  }
}
