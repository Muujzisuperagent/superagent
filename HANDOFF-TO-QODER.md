# 交接文档 · 还魂路引四五六殿 → Qoder

**交出时间**：2026-11-16
**交出原因**：本轮 AI 汇报额度已耗尽，后续开发移交回 Qoder。
**仓库**：`D:\群核科技黑客松`，分支 `main`
**本文件由验官（正式验收）起草**，只写可核实的事实与待办，不写「已完成」的口头承诺。

---

## 0. 一句话现状

四五六殿的**工程侧已经全部达标**（构建/流程/性能/交付满分），**画面侧按 95 分口径还差约 10 分**；最关键的未完成项是 **Lux3D GLB 主资产还没真正接管画面**——目前 GLB 只在 `?glb=1` 调试开关下启用，默认仍是程序几何，这与用户「GLB 视觉占比 ≥50%、不得退回 `visible=false`」的硬性要求相冲突。

---

## 1. 提交与推送状态（接手第一件事）

```
main ...origin/main [ahead 10]
```

本地比远端多 **10 个提交**，`git push` 一直报 `SEC_E_NO_CREDENTIALS`（schannel 取不到凭据），需要 Qoder 环境下的 git 凭据重新推送。**推送前先 `git log origin/main..HEAD --oneline` 确认这 10 个提交都是要的。**

工作区还有**未提交改动**，接手时不要直接丢弃：

| 文件 | 状态 | 说明 |
|---|---|---|
| `game/src/scene.ts` | 已改未提交（+33/−6） | 戥子放大到 1.8× 并移到药案前景、九宫只替换石板（保留建筑/铜盏/布幡/数字）、石桥 GLB 拱腹侧视、四件 GLB 材质参数从 `metalness=1/roughness=1` 修正为木/石/铜分别取值 |
| `game/artifacts/**`（三幕 + nav 10 张 + flow 日志） | 已改未提交 | 上述改动的验证截图，**可作为「改动前」对照证据** |
| `game/public/assets/generated/lux3d-new/herbal-cabinet-v2.glb` | 新增未提交 | 14.03 MB，见第 3 节 |

---

## 2. 验收口径（接手后必须按这个判）

- 脚本：`.agents/skills/huihun-eval/`，入口 `scripts/run_auto.py` → 手动填 `rubric.json` → `scripts/score.py`
- **通过线 95 / 100**（口径 v2.1，2026-11-16 由用户从 80 上调），**取消「有条件通过」档，低于 95 一律打回**
- 任一硬门槛 G0–G5 失败 → 直接打回，不看总分
- 旧版（通过线 80）留档在 `.agents/skills/huihun-eval/references/archive/`
- 目标基线：`评审/四五六殿/target-95.md`（逐项「当前分 → 目标分 → 要看到什么」）
- 规则：**没有证据不给分**；每次改动后**全量重跑**，复审开新目录，不覆盖旧版；近黑一律用 `visual.json` 的 `near_black_ratio`，`audit_img.py` 只作参考

**最近一次正式验收**：`评审/四五六殿/2026-11-16-68c3504/` → **84.8 分，打回重改**，返工清单在该目录 `rework.md`。

---

## 3. Lux3D 生成资产（交接重点）

### 3.1 用户的硬性要求（不可退让）
1. **Lux3D 生成的 GLB 必须在画面中真用上，视觉占比 ≥50%**
2. **不得因为观感不佳就退回 `visible=false`**，必须调尺度、朝向、材质、落位把它修好
3. 之后新增 3D 资产**一律优先用 Lux3D 的 MCP 工具生成**（`lux3d_text_to_3d` / `lux3d_img_to_3d`，如 `g1-turbo`），不再手写程序几何；程序几何只作加载失败兜底与远景降级
4. 落位目标：四殿百子柜 + 戥子 + 药碗用 GLB，五殿九宫石板用 GLB，六殿桥 + 轮盘用 GLB

### 3.2 第一批 6 件（已在库，manifest 有据）
`game/public/assets/generated/` 下 6 件，`manifest.json` 记录了 Lux3D taskId、sha256 与 WebP 转码副本：

| id | taskId | 原件 MB | WebP MB | 状态 |
|---|---|---:|---:|---|
| celadon-bowl | 7400735 | 8.63 | 1.18 | 在用 |
| six-realm-wheel | 7400753 | 8.27 | 1.50 | 在用 |
| herbal-cabinet | 7400776 | 9.95 | 2.16 | **旧模型，单 Mesh 整板，待换** |
| dengzi-scale | 7400806 | 8.60 | 1.24 | 在用（材质已修） |
| nine-palace | 7402698 | 12.65 | 2.31 | 在用（只替换石板） |
| stone-bridge | 7402772 | 9.06 | 2.07 | 在用（拱腹侧视已验证） |

> 上一轮 `check_assets.mjs` 对这 6 件的 glTF Validator 结果为 **errors=0 / warnings=0**（G4 门槛达标）。WebP 副本是 `gltf-transform` 转码的贴图副本，**不压几何、不减面**，原件保留。

### 3.3 关键坑（务必传给接手人）

- **旧的四件 `metalness=1 / roughness=1`**：金属度全开 + 全粗糙，导致画面发黑、质感像塑料。这是「GLB 看起来不如程序几何」的主因，**不是模型本身差**。必须按材质分族改：木 `metalness 0–0.1 / roughness 0.85`，石 `0.0 / 0.7`，铜 `0.7–0.85 / 0.35`。
- **单 mesh / 单 primitive 结构**：旧百子柜和 v2 都是「一整块」，柜面的 42 格抽屉和铜环**可能只是贴图**。落位前必须先渲染确认柜面是否真有格子；没有就要走「GLB 柜体 + 程序格架叠加」的混合方案，并用 `addEngraving` 之类的方式补细节。
- **整组隐藏的连带 bug**：上一版九宫全黑的根因是整组 `nine-palace-fallback` 被隐藏，连带建筑、铜盏、布幡、数字一起消失。替换 GLB 时**只替换目标子件**（石板），不要隐藏整组。
- **默认路径仍是程序几何**：`scene.ts:2049` 注释写明「`?glb=1` 打开四件 GLB 主资产，默认仍走程序几何；正式交付前评估去留」，`scene.ts:2116` 在 `!useLuxPrimary` 时把四件设回 `visible=false`。**这与用户第 1、2 条要求直接冲突**，是交接后第一个要处理的决策点。

### 3.4 第二批（进行中，未完成）
`game/public/assets/generated/lux3d-new/herbal-cabinet-v2.glb`（14.03 MB）已下载：
- meshes 1 / nodes 1 / materials 1 / textures 3 / images 3
- `Designer_Logic_PBR`，**metalness 0.1 / roughness 1**（比旧的正常），triangles ≈186,028
- **风险**：同样是单 mesh 单 primitive，格子结构是否真建模**未经渲染确认**

另有三个 Lux3D 任务在产出前中断（额度耗尽），**需要重新提交或查询任务状态**：九宫 `8100912`、石桥 `8100935`、彼岸花 `8100943`。若这些任务在 Lux3D 侧已完成，直接下载即可，不必重新生成。

---

## 4. 验收分数现状与还差什么

**68c3504：84.8 / 100（打回重改）**

| 维度 | 得分 | 满分 | 说明 |
|---|---:|---:|---|
| A 资产与自动画质 | 12.10 | 15 | A3 3/4（戥子仍不可辨），A4 3.10（b1=62.08，需 ≥75） |
| B 美术十项 | 38.75 | 50 | 需 46.25（原始分 ≥37/40） |
| C 逐幕清单 | 14.00 | 15 | C1 7/9（缺「左门见雾」与「戥子」） |
| D 可玩流程 | 10 | 10 | 已满 |
| E 性能与稳定 | 5 | 5 | 已满 |
| F 交付与可复现 | 5 | 5 | 已满 |

**硬门槛 G0–G5 全过**：26/26 单测、构建成功、canvas=1、0 pageerror、三幕非空白、流程 34 步全 PASS、6 件 GLB 0 错误、主帧 233/170/80 draws、FPS 60.27/59.97/60.30。

**距 95 还差 10.2 分，刚性三条**（详见 `2026-11-16-68c3504/rework.md`）：
1. **B10**：删掉五殿案台上方悬浮的纯黑四棱锥（它把匾额「戴九履一 · 左三右七」截断）
2. **A3 + C1**：戥子做成能辨的「杆—盘—砣」三件
3. **C1**：四殿左侧补门洞 + 雾（现在左墙是实墙 + 一张悬空素纸）

其余加分靠 B 项五项从 3→4（建议 B1/B2/B4/B8 + 任选一项）与 A4 从 62.08 → ≥75。**没有余量**：少一项即 93.75。

---

## 5. 已知未完成 / 有风险的事项

| 事项 | 状态 |
|---|---|
| Lux3D GLB 默认启用（视觉占比 ≥50%） | **未做**，默认仍程序几何 |
| 百子柜 v2 落位 | **未做**，等待渲染确认格子结构 |
| 九宫 / 石桥 / 彼岸花新 GLB | **未生成完**，任务号见 3.4 |
| `scene.ts` 未提交改动 | 需决定保留还是提交 |
| 本地 10 个提交未推送 | 需配置 git 凭据后推送 |
| 五殿近黑基调 | 从 65.8% 拉到 13.1%，B4 因此扣一档；需回调到 25–35% |

---

## 6. 接手后建议的执行顺序

1. 配好 git 凭据，`git log origin/main..HEAD --oneline` 确认 10 个提交后推送
2. 决定 `scene.ts` 未提交改动去留（建议：先提交保留，作为 GLB 落位的对照基线）
3. 用 Lux3D 把九宫 `8100912`、石桥 `8100935`、彼岸花 `8100943` 三件补齐
4. 渲染确认 `herbal-cabinet-v2.glb` 是否真有 6×7 格；据此定「纯 GLB」还是「GLB 柜体 + 程序格架」
5. 按 3.3 材质分族参数重做四件落位，**把默认路径切到 GLB**，程序几何退为兜底
6. 修刚性三条（B10 黑锥体、戥子、左门见雾）
7. 全量重跑 `run_auto.py` → 填 `rubric.json` → `score.py`，开新目录，按 95 线判

---

## 7. 常用命令

```powershell
cd D:\群核科技黑客松

# 全量采集（需要能起 esbuild / dev server 的环境）
python .agents\skills\huihun-eval\scripts\run_auto.py --out 评审\四五六殿\<日期>-<哈希>

# 打分（先复制 rubric.template.json 为 rubric.json 逐项填分与 evidence）
python .agents\skills\huihun-eval\scripts\score.py --dir 评审\四五六殿\<日期>-<哈希>

# 游戏本体
cd game
npm.cmd run build
npm.cmd test
node tests\visual-check.mjs      # 三幕 + 10 张导航图
node tests\flow-check.mjs        # 34 步完整流程
```

Python 用 `C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe`；npm 用 `npm.cmd`。

---

## 8. 证据索引

| 内容 | 位置 |
|---|---|
| 最近一次验收（84.8，打回） | `评审/四五六殿/2026-11-16-68c3504/`（report / scores / rubric / rework / crops 8 张 2× 放大图） |
| 上一轮验收（72.7，打回） | `评审/四五六殿/2026-11-16-998d014/` |
| 95 分目标基线 | `评审/四五六殿/target-95.md` |
| 验收口径（v2.1） | `.agents/skills/huihun-eval/`（旧版在 `references/archive/`） |
| GLB 清单与 taskId | `game/public/assets/generated/manifest.json` |
| 交付几何说明 | `game/README.md:34/36`（注：该节写的「程序几何为交付版本」与用户最新要求冲突，需更新） |
| 流程日志 | `game/artifacts/flow/flow-log.json` |
