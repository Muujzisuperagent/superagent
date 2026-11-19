// 判官整身 Lux3D 资产生成（第三轮 · 方案 A）
// 坐像 / 立像各两版，供挑选。用法：
//   node tools/lux3d-gen-judge.mjs --submit
//   node tools/lux3d-collect-judge.mjs --once
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { call } from './aholo-mcp.mjs'

const OUT = 'game/public/models/prologue'
const SUBMIT = process.argv.includes('--submit')

// 判官形象：唐国相 / 清瘦长者 / 照章办事不是反派。
// 深灰绿官袍 + 乌纱幞头（圆冠 + 两侧平直展脚）+ 清瘦长须 + 朱笔与生死簿。
// 全部锁在冷青灰一族：不出现暖黄火、不出现亮色、不出现任何文字。
const COMMON = '写实 PBR 材质，整体深色低饱和，冷青灰色调，无任何文字、无亮色、无金色饰物'
const ITEMS = [
  { key: 'JUDGE-A1_seated', name: '判官坐像 A1',
    prompt: '中国明代判官全身坐像：一位清瘦长者坐在木椅上，穿深灰绿色宽袖官袍，交领右衽，腰束革带，袍上极淡的暗纹云样，头戴乌纱幞头，圆冠略后倾，两侧各有一片平直的展脚，面容清瘦长者，颧骨明显，眼窝略陷，眼神冷静，鼻梁挺直，八字须加垂到胸前的长须，右手执一支朱笔，左手按住一册生死簿。' + COMMON + '，正面朝向镜头，纯色灰背景，单个人物居中完整入画' },
  { key: 'JUDGE-A2_seated', name: '判官坐像 A2',
    prompt: '中国明代判官半身坐像：一位清瘦长者坐在木案后，上半身清晰可见，穿深灰绿色宽袖官袍交领右衽，头戴乌纱幞头，圆形软冠向后仰，两侧平直展脚，面容清瘦长者，颧骨高耸，眼窝微陷，眼神平静下垂，长眉，八字须与垂胸长须，右手握朱笔，左手压着一册生死簿。' + COMMON + '，正面朝向镜头，纯色灰背景，单个人物居中' },
  { key: 'JUDGE-B1_standing', name: '判官立像 B1',
    prompt: '中国明代判官全身立像：一位清瘦长者站立，穿深灰绿色宽袖官袍交领右衽，腰束革带，头戴乌纱幞头，圆冠后仰，两侧平直展脚，面容清瘦长者，颧骨分明，眼窝略陷，长眉，八字须与垂胸长须，右手执朱笔，左手持生死簿。' + COMMON + '，正面朝向镜头，纯色灰背景，单个人物居中完整入画' },
  { key: 'JUDGE-B2_standing', name: '判官立像 B2',
    prompt: '中国明代衙门判官全身立像：清瘦长者，灰白长须垂至腹，深灰绿官袍宽袖，乌纱幞头圆顶后仰加两侧平直展脚，面容清瘦，眼窝微陷神情肃穆，右手朱笔左手生死簿。' + COMMON + '，正面朝向镜头，纯色灰背景，单个人物居中完整入画' }
]

const manifestPath = OUT + '/manifest-judge.json'
let manifest = { source: 'Aholo Lux3D G1-Turbo + PBR', assets: [] }
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch {}
}
const known = new Set(manifest.assets.map(a => a.key))

for (const it of ITEMS) {
  if (!SUBMIT) { console.log('DRY', it.key); continue }
  if (known.has(it.key)) { console.log('skip', it.key); continue }
  console.log('submit', it.key)
  let r
  try {
    r = await call('lux3d_text_to_3d', {
      prompt: it.prompt,
      version: 'G1-Turbo',
      faceCount: 60000,
      outputFormat: ['glb'],
      enablePbr: true,
      wait: false,
      region: 'cn'
    }, 150000)
  } catch (e) {
    console.log('  FAIL', e.message.slice(0, 200)); continue
  }
  console.log('  ->', String(r).slice(0, 300))
  let taskId = null
  try { taskId = JSON.parse(String(r)).taskId } catch {}
  manifest.assets.push({ key: it.key, label: it.name, taskId, status: 'submitted' })
  known.add(it.key)
  await mkdir(OUT, { recursive: true })
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}
console.log('manifest ->', manifestPath)
