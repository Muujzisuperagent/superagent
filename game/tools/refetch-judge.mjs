// 按 manifest-judge.json 里的 glbUrl 重新拉取指定判官原始件（本地不留原件时补用）
// 用法：node.exe tools/refetch-judge.mjs JUDGE-A2_seated
import { readFileSync, createWriteStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'public/models/prologue')
const man = JSON.parse(readFileSync(join(OUT, 'manifest-judge.json'), 'utf8'))
const keys = process.argv.slice(2)
for (const k of keys) {
  const a = man.assets.find(x => x.key === k)
  if (!a || !a.glbUrl) { console.log('no url for', k); continue }
  const res = await fetch(a.glbUrl)
  if (!res.ok) { console.log(k, 'http', res.status); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  const dest = join(OUT, k + '.glb')
  await new Promise((r, j) => { const s = createWriteStream(dest); s.on('finish', r); s.on('error', j); s.end(buf) })
  console.log(k, buf.length, 'bytes ->', dest)
}
