// 读 GLB 的 JSON chunk：三角形数、包围盒、贴图尺寸
import { readFileSync } from 'node:fs'

for (const f of process.argv.slice(2)) {
  const buf = readFileSync(f)
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'))
  let tris = 0, verts = 0
  const meshes = json.meshes || []
  for (const m of meshes) {
    for (const p of m.primitives) {
      const acc = json.accessors[p.indices !== undefined ? p.indices : p.attributes.POSITION]
      tris += acc.count / 3
      verts += json.accessors[p.attributes.POSITION].count
    }
  }
  const bb = json.accessors.find(a => a.type === 'VEC3' && a.min && a.max && a.max.some(v => Math.abs(v) > 0.001) && json.meshes.some(m => m.primitives.some(p => json.accessors[p.attributes.POSITION] === a)))
  console.log(f.replace(/^.*\//, ''))
  console.log('  tris     =', Math.round(tris))
  console.log('  verts    =', verts)
  console.log('  bboxMin  =', bb && bb.min.map(v => +v.toFixed(3)).join(', '))
  console.log('  bboxMax  =', bb && bb.max.map(v => +v.toFixed(3)).join(', '))
  console.log('  size     =', bb ? bb.max.map((v, i) => +(v - bb.min[i]).toFixed(3)).join(' x ') : '?')
  console.log('  images   =', (json.images || []).map(i => i.uri || 'buffer').join(','))
  console.log('  mats     =', (json.materials || []).map(m => (m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorTexture ? 'tex' : 'flat') + ':' + JSON.stringify(m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorFactor)).join(' | '))
}
