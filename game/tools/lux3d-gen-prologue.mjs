// 序厅 S0 六件 Lux3D 资产生成（走 Aholo 本地 stdio MCP）
// 用法：node tools/lux3d-gen-prologue.mjs [--dry]
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { call } from './aholo-mcp.mjs'

const OUT = 'game/public/models/prologue'
const DRY = process.argv.includes('--dry')

const ITEMS = [
  { key: 'S0-12_ticket_machine_A', name: '取号机',
    prompt: '中国明清衙署里的一台矮宽台式取号机：一只横向的长方体木箱，宽明显大于高，长宽比约一点二比一，深色老榆木箱体。正面正中偏右装着一只黄铜摇柄，摇柄是一根短黄铜轴挑出一枚圆盘手轮，可以转。下面有一条横向的竹牌出口槽，四角包铜。整体是一个小矮箱不像柜子。造型敦厚方正，无文字无标识，摄影级写实 PBR 材质，单个道具居中' },
  { key: 'S0-13_bamboo_tally_A', name: '竹牌',
    prompt: '一枚中国旧式竹制号牌，长条形薄竹片，表面磨旧发黄带竹纤维纹理，一端有穿绳小孔，无任何文字刻痕，摄影级写实 PBR 材质，单个道具居中' },
  { key: 'S0-07_elm_bench_A', name: '榆木长凳',
    prompt: '中国明清衙署候审区的一条老榆木长凳：很长的整木厚板做座面，座面很窄，深度只有长度的四分之一，四条粗方腿，无靠背无雕花，边缘被坐得圆润发亮。摄影级写实 PBR 材质，单个道具居中' },
  { key: 'S0-37_paper_effigy_A', name: '纸扎人',
    prompt: '中国民俗纸扎人偶，一个穿着宽大长袍的纸人。脸部完全空白，是一张没有任何五官的平面白纸，没有眼睛没有眉毛没有鼻子没有嘴巴没有瞳孔。身上穿一件宽大的及脚长袍，交领右衽，袍身是灰白色的旧纸糊成的，有明显的纸壳折棱和层叠接缝，袖子很宽大垂到身侧，没有任何颜色没有红色没有花纹没有刺绣没有文字。整体是纸壳平板剪影的质感，旧灰白纸色。身高约一米七的站姿人形，双手垂在身侧。摄影级写实 PBR 材质，单个人偶居中' },
  { key: 'S0-15_paper_lantern_A', name: '白纸灯笼',
    prompt: '中国旧式白纸灯笼，糊白色薄纸的圆筒灯罩，外有三道竹箍，上下是深色木圈，中间垂一根细绳，无文字无图案，纸质半透，摄影级写实 PBR 材质，单个灯具居中' },
  { key: 'S0-21_blank_pass_A', name: '空白路引',
    prompt: '一张中国旧式空白通行牒证，摊平放置的厚黄纸册页，是两半对折后平摊开的样子：长方形薄片，很薄只有一两毫米厚，比宽是长宽比约一点五比一，封皮素面无字无印章，中间有一道对折的折痕，纸边磨损起毛。摄影级写实 PBR 材质，单个道具平放俯视居中' }
]

const manifestPath = OUT + '/manifest.json'
let manifest = { source: 'Aholo Lux3D g1-turbo + PBR', assets: [] }
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch {}
}
const known = new Set(manifest.assets.map(a => a.key))

for (const it of ITEMS) {
  if (existsSync(`${OUT}/${it.key}.glb`) && !process.argv.includes('--force-' + it.key)) {
    console.log('skip (exists)', it.key); continue
  }
  if (DRY) { console.log('DRY', it.key, it.name); continue }
  console.log('submit', it.key, '(' + it.name + ')')
  let r
  try {
    r = await call('lux3d_text_to_3d', {
      prompt: it.prompt,
      version: 'G1-Turbo',
      faceCount: 20000,
      outputFormat: ['glb'],
      enablePbr: true,
      wait: false,
      region: 'cn'
    }, 120000)
  } catch (e) {
    console.log('  FAIL', e.message)
    continue
  }
  console.log('  ->', String(r).slice(0, 400))
  let taskId = null, worldId = null
  try {
    const j = JSON.parse(String(r))
    taskId = j.taskId || (j.data && j.data.taskId) || null
    worldId = j.worldId || (j.data && j.data.worldId) || null
  } catch {}
  const rec = manifest.assets.find(a => a.key === it.key)
  if (!rec) {
    manifest.assets.push({ key: it.key, label: it.name, taskId, worldId, status: 'submitted' })
  } else {
    if (taskId) rec.taskId = taskId
    if (worldId) rec.worldId = worldId
    rec.status = 'submitted'
  }
  known.add(it.key)
  await mkdir(OUT, { recursive: true })
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}
console.log('manifest ->', manifestPath)
