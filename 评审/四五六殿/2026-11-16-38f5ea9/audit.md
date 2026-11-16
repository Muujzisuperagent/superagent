# 验收报告体检 · 2026-11-16-38f5ea9（验官·只读复核）

- 复核时间：2026-11-16
- 复核对象：`评审/四五六殿/2026-11-16-38f5ea9/`（report.md、scores.json、rubric.json、auto.json、capture.json、assets.json、visual.json、screens/×3）+ `game/artifacts/flow/flow-log.json`
- 复核人：验官（正式验收口径 huihun-eval v2.0）
- 本轮性质：**只读体检，未重跑采集，未改任何原产物**。HEAD=c6ca16d。

## 结论（先行）

1. **总分 60.7 的算术成立**，但**口径有两处偏差**：C2 按 rubric.md 的锚点应为 3 分（报告给 2），D4 记 n/a 使分母从 100 缩到 99（折算 +0.6 分）。修正后总分区间 **60.1 – 61.7**，取中口径 **61.7/100**。
2. **结论不变**：仍为「打回重改」。G5 硬门槛 FAIL 判定成立（`capture.json` medicine.mainDrawsPerFrame=1003 > 800），且 B 维度 52.5% < 60% 按 §12 应整维度记 P0。
3. **证据完整性合格**：20 条人工项 100% 有 evidence+reason，抽查 14 条全部能在产物中命中；**证据缺失 0 条**，**证据格式不合规 2 条（A4、E2 在 rework.md 里是 Python dict 字面量）**，**引错/不可复核 3 处**（详见 §3、§4）。
4. **范围合格**：未评序厅与前三殿，无应剔除项。
5. **rework.md 不合格**：0 条写「复验条件」（grep 计数=0），不满足验收交付要求；下一轮必须由验官重出带「位置→动作→复验条件」的三列清单。

## 1. 口径复核（加权 / 折算 / 总分自洽）

| 检查 | 结果 | 证据 |
|---|---|---|
| 维度分值合计 = 100 | PASS | A(4+2+4+5=15)+B(5×10=50)+C(5×3=15)+D(3+3+3+1=10)+E(2+2+1=5)+F(2+3=5)=100，与 `score.py:21-48` MAX 表一致 |
| B 项 0–4 → 5 分制折算 | PASS | `score.py:296` `points = raw/INPUT_MAX*MAX`；B1 raw1→1.25、B2 raw2→2.5、B6 raw3→3.75，与 `scores.json.scores.B*` 逐项吻合 |
| A3 折算 | PASS | INPUT_MAX=MAX=4，raw2→2.0（`scores.json.manual.A3`） |
| 各维度小计 | PASS | A 4+2+1.86+2=9.86 ✓；B 26.25 ✓；C 4+2+3=9 ✓；D 3+2+2=7（D4 null）✓；E 2+0+1=3 ✓；F 5 ✓ |
| 总分公式 | PASS | raw=60.11，denominator=99（100−D4 的 1 分），60.11/99×100=60.7 ✓（`score.py:310-312`，`scores.json.denominator=99`） |
| **C2 锚点适用** | **FAIL** | `rubric.md:125` C2 锚点「0（≤2）/2（3–4）/3（5–6）/5（7–8）」；`rubric.json.C2.evidence` 明确列出 5 项成立（洛书、刻字、脚印、机位、氛围），`reason` 却写「落 3–4 档」→ 应为 **3 分**，报告给 2。修正后 raw 61.11 → **总分 61.7** |
| **D4 记 n/a** | **口径偏宽** | `rubric.md:76` 的 n/a 只定义在 B 十项（「无证据 = n/a，从分母剔除」）；§7 的 D4 锚点只有 0/1 两档。D4 记 n/a 使分母 99，等效 +0.6 分。若按「未证实即 0」，总分 = 60.11/100 = **60.1**。本轮不追改，但下一轮必须实测 Esc 释放 + 重开，不得再用 n/a 回避 |
| 维度级 P0（§12） | **脚本未实现** | `rubric.md:193` 「任一维度得分 < 60%」为 P0；`score.py:343-350` 只按**单条** ratio 判优先级，B 维度 52.5% 的整维度 P0 没有出现在 report/rework 的判定语里（B1/B2/B3/B4/B5/B8/B10 恰好各自 <60%，结果上覆盖，但口径来源不同） |

## 2. 硬门槛逐条重算

| 门槛 | 报告判定 | 我的复核 | 证据 |
|---|---|---|---|
| G0 构建+单测 | PASS | **成立** | `auto.json.build.ok=true`（`✓ built in 988ms`，仅 three 629.60 kB 警告）、`build.tests_ok=true`（vitest `✓ tests/story.test.ts (6 tests)`、`act23.test.ts (14 tests)` 等，合计 26） |
| G1 页面启动 | PASS | **成立** | `capture.json.summary.canvas=1`、`pageErrors=[]`、`consoleErrors=[]`、`failedRequests=[]`；三视图各自亦空 |
| G2 三幕截图有效 | PASS | **成立（实现有缺口）** | `visual.json` std_luma = 0.1157 / 0.0737 / 0.0706，均 > 0.012（`visual_score.py:81`）；文件 641808 / 534506 / 461560 B，均 > 20KB。注意：`score.py:224` 只查 `blank_views`，**未实现 §2 的「文件 > 20KB」子句**，本轮数值恰好满足 |
| G3 主流程 | PASS | **成立，但证据要加注** | `flow-log.json` 22 步全 ok：四殿四味取药→证据 C→半印④→五殿踩板 1→9→六殿合符→`unlockedEndings=["return","judge"]`→选结局「还阳」，`ok:true`。风险：`flow-check.mjs:125` 把「收证据 D」以 `record(..., true)` 记成 PASS，实际 detail 是「跳过：坐标 bug」→ **`ok:true` 不能当作全步骤执行的证明**，rubric 的 D2=2 处理正确 |
| G4 资产 | PASS | **成立** | `assets.json.summary.totalErrors=0`、`totalWarnings=0`、6 件 GLB（celadon-bowl / dengzi-scale / herbal-cabinet / nine-palace / six-realm-wheel / stone-bridge）逐件 errors=0；`capture.*.failedRequests=[]` 无 GLB 404 |
| G5 性能 | FAIL | **成立（但样本存疑，见 §6.4）** | `score.py:242` 要求 minFps≥24 且 maxDraws≤800；`capture.json` minFps=60.18（三视图 60.18/60.30/60.32）**达标**；mainDrawsPerFrame 取 max = **1003**（medicine）> 800 → FAIL。注意 palace=691、river=597 均 ≤800，**唯一超限样本是 medicine** |

**门槛结论：G0/G1/G2/G3/G4 PASS，G5 FAIL → 结论固定「打回重改」，与总分无关。**

## 3. 证据完整性与抽查（14 条）

- 20 条人工项（A3、B1–B10、C1–C3、D1–D4、F1–F2）全部有 `evidence` + `reason`；`score.py:285-291` 会在缺证据时直接退出，说明产物是完整填过的。
- 6 条自动项（A1、A2、A4、E1、E2、E3）不在 rubric.json 里，由 `auto_scores()` 从 auto.json 派生 —— 与 `rubric.template.json` 只列 20 个 MANUAL 键一致，**不算缺失**。

| # | 引用项 | 证据出处 | 命中 |
|---|---|---|---|
| 1 | B1 中央倾斜深色大平板 | `screens/act4-medicine.png` 画面中部 x≈580–790、y≈280–420，斜板压在百子柜立面前 | ✓ |
| 2 | B5 左墙悬浮纸板拼成锯齿「楼梯」 | 同图左侧 x≈20–320、y≈160–520 的阶梯状贴片 | ✓ |
| 3 | B10 ≥5 片纸张悬浮 | 同图顶部 x≈430,y≈55；左墙 4 片；右侧 x≈1140,y≈210 与 x≈1170,y≈370 | ✓ |
| 4 | A3 碗体纯黑半球、无碗沿层次 | 同图 x≈510–590、y≈410–470 | ✓ |
| 5 | C1 药案有台面/桌腿/下层隔板、药材 3 类（粉/白/绿） | 同图中部台面 x≈750–1120 的三堆色块 | ✓ |
| 6 | B2/C2 八盏灯为白色光球 | `screens/act5-palace.png` 左右各 3 盏 + 中后 2 盏白球 | ✓ |
| 7 | C2 洛书 8 1 6 / 3 5 7 / 4 9 2 | 同图自下而上 8 1 6 / 3 5 7 / 4 9 2，与匾额「戴九履一·左三右七」一致 | ✓ |
| 8 | B4 1/6 石板青绿、2/4 靛蓝染色 | 同图 1、6 格明显绿，2、4 格偏蓝 | ✓ |
| 9 | C3 桥拱侧视缺失 + 右侧布幡深色竖块 | `screens/act6-reincarnation.png` 桥面为平铺石板；右侧 x≈1100–1200、y≈430–560 深色竖板 | ✓ |
| 10 | C3 孟婆亭起翘瓦顶、彼岸花成片、亡魂队列 | 同图左侧亭顶、两岸红色花丛、桥上深色队列 | ✓ |
| 11 | B2 `visual.json palace.near_black_ratio=65.6%、mean_luma=0.048` | `visual.json.views.palace` = 0.6559 / 0.0483 | ✓（四舍五入一致） |
| 12 | A4/E2 自动指标 | `visual.json.b1=37.29`、`capture.json.medicine.mainDrawsPerFrame=1003` | ✓ |
| 13 | D1–D3 流程步骤 | `flow-log.json.steps[]` 与 `unlockedEndings`、`knownIssues` | ✓ |
| 14 | F1 启动器 | `game/启动密室.bat` 138 B、`game/start-game.ps1` 2441 B、`game/README.md` 1660 B 均存在 | ✓ |

**证据缺失：0 条。** 需要标注的问题：

| 问题 | 位置 | 说明 |
|---|---|---|
| 证据格式不合规 | `rework.md` 的 `P0 · A4` 与 `scores.json.rework[E2].evidence` | 写成 `{'score': 37.29, ...}` / `{'maxDrawsPerFrame': 1003}` 的 Python dict 字面量，违反 §11「截图+区域 / 文件:行号 / 命令输出片段」；来源是 `score.py:357` 对自动项直接塞 dict |
| 数字不可复核 | 第 1 轮任务简报里的 `b1=38.18`、`act5 tech 28.81`、`near_black 0.6583`、`mean_luma 0.0477` | 产物实为 37.29 / 28.92 / 0.6559 / 0.0483；简报数字来自另一次采集，**不得写进验收结论**。report.md 本身与 visual.json 一致，无需改 |
| 间接证据 | `rubric.json.B8.evidence` 引 `game/tests/flow-check.mjs:3` 注释 | 注释原文存在（已核对），但「测试脚本要传送才命中」是测试实现，不足以证明**玩家机位下**的路线/出口辨识；B8=2 结论方向合理，下一轮要换成玩家机位截图 |

## 4. 范围复核

- `auto.json.meta.scope = "acts 4-6 only; acts 1-3 excluded by product decision"`。
- 逐条扫 20 项 evidence：全部指向 `act4-medicine.png` / `act5-palace.png` / `act6-reincarnation.png`、`visual.json` 三视图、`flow-log.json` 的四/五/六殿步骤，**无一条给序厅或前三殿打分或扣分** → 无需剔除项，总分不因范围问题调整。
- 集成风险（只提示，不计分）：`flow-log.json.收尾状态` 显示 HUD「路引 · 半印 3/6　证据 A/C」，即流程起点依赖队友前三殿预置的半印与证据 A；前三殿若改动状态机，四五六殿的 G3 会被连带打破。

## 5. 下一轮全量验收（精确命令）

工作树现状：`M game/src/main.ts`、`?? game/artifacts/round2/`（匠人乙在改）。**必须等匠人甲乙都提交、scene.ts/main.ts 落库后再跑**，否则评的是半完成状态。

```bat
cd /d D:\群核科技黑客松
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\run_auto.py --out 评审\四五六殿\<YYYY-MM-DD>-<新git短哈希>
```

`run_auto.py` 内部依次执行（无需手敲）：`npm run build` → `npm test` → 启动/复用 `http://127.0.0.1:5173` → `capture.mjs` → `check_assets.mjs` → `visual_score.py`。

然后：把新目录下的 `rubric.template.json` 复制为 `rubric.json`，**20 项全部重填**（含未改动项，不允许沿用上一轮分数），再：

```bat
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\score.py --dir 评审\四五六殿\<YYYY-MM-DD>-<新git短哈希>
```

**必须重测、不得沿用的数字**：

| 数字 | 原因 |
|---|---|
| `capture.json` 全部 fps / mainDrawsPerFrame / drawsPerFrame / loadMs | 几何与灯光一改就变 |
| `visual.json` 的 mean_luma / near_black_ratio / tech_score / b1 | 亮度与对比是本轮 P0 修复目标 |
| 三张 screens 的 B1–B10、C1–C3 全部看图结论 | 截图换了三幕审美必须重判 |
| `flow-log.json` 的 steps / `unlockedEndings` / `knownIssues` | 证据 D 修好后 replace 结局应进列表，D2/D3 与 G3 证据都要重写 |
| `assets.json` 的 errors/warnings/triangles | GLB 若重导出必须重验 |
| D4（Esc 释放 + 重开） | 本轮 n/a，下一轮要实测出分，不再 n/a |
| 目录名与 `meta.commit` | 本轮产物标 `38f5ea9`，但截图采自「38f5ea9 + 未提交 scene.ts」，那份代码现已落成 `c6ca16d` → 采集来源与标注提交号不一致，属溯源缺陷；下一轮目录名与 commit 字段必须等于当时的真实 HEAD |

可沿用（前提是不改口径）：`references/rubric.md`、`references/thresholds.json`、G0 的命令与断言方式。

## 6. 风险清单

1. **证据 D 被 flow-check 跳过**：`flow-check.mjs:125` 用 `record(..., true)` 把跳过记成 PASS。当前 rubric 已在 D2 扣到 2、G3 证据里注明「跳过」，判定未被污染；但**任何「flow-check ok:true」的引用都不能当作全步骤通过的证明**。修好后必须确认 `unlockedEndings` 含 `replace` 才能把 D3 提到 3。
2. **审官为单代理顺序评审**：三殿评审由同一会话顺序完成，B 项与审官结论存在同源风险（分数未照抄，但视角重合）。验收侧的补偿是本轮独立看图复核 14 条证据；下一轮仍由验官独立填分。
3. **riverSide 侧视未复验**：`main.ts:29` 定义了 `riverSide` 机位（[8.2,1.9,-54.5] → [-0.4,1.6,-64]），但 `capture.mjs:31-35` 的 views 只采 medicine/palace/river 三张 → **C3 的「桥拱侧视」这一项是在没有侧视图的情况下判 ✗**，属证据不足。下一轮要么补采 `?view=riverSide`，要么把该项标 n/a 并说明。这直接影响 C3=3 的可信度，是本轮最需要补的采集缺口。
4. **G5 的唯一超限样本来自 dev 预览机位**：`?view=medicine` 的相机在 z=4.7 望向 z=-1.8，`camera.far=130`（`main.ts:31`），沿走廊会把五殿、六殿几何一起纳入视锥 → 1003 draws 可能高于玩家实际在四殿内的帧。palace=691、river=597 均达标。**按 §2 的口径（证据=capture.json）FAIL 成立，本轮不改判**；但下一轮必须在 capture 里补一个玩家入口机位样本，并把两个数都写进 E2/G5 证据，否则「draw calls 是否真的破 800」这个问题无法闭合。
5. **rework.md 缺「复验条件」**：grep「复验」= 0 次；`rework-owners.md` 有归责与动作也无复验条件。按验收交付要求，返工清单每条必须可判定完成。下一轮由验官重出。
6. **口径实现与文档的小偏差**（不改本轮结论，建议记入技能待办）：`score.py` 未实现 G2 的「文件 > 20KB」子句、未实现 §12 的维度级 P0；`rubric.template.json` 仍标 `version: 1.0` 而 rubric.md 是 v2.0。

## 7. 修正后总分（仅供记录，不改写 report.md）

| 口径 | raw | 分母 | 总分 |
|---|---:|---:|---:|
| 原报告 | 60.11 | 99 | **60.7** |
| 仅修 C2（2→3） | 61.11 | 99 | **61.7** |
| C2 修正 + D4 记 0（不再 n/a） | 61.11 | 100 | **61.1** |

三种口径全部 < 80，且 G5 FAIL → **结论一致：打回重改**。
