# 还魂路引 · 序厅+第一殿 验收报告（含四五六殿回归）

- 版本：`922a9c5`（origin/main 已推）
- 时间：2026-11-19T08:55
- 验收官：验官 · 正式验收（huihun-eval v2.1）
- 结论：**打回重改（硬门槛 G1/G4 失败，63.5/100，通过线 95）**

## 口径扩展声明（报告开头，按任务要求写明）

huihun-eval v2.1 原口径只评第四、五、六殿。本轮按队长指令扩展验收对象为**新增并入的序厅 + 第一殿**：用户要求"合并队友作品后按同一打分机制迭代优化"，故序厅/一殿必须与四五六殿同一把尺子验收。评分表结构、十项锚点、硬门槛、阈值**均未改动**（references/rubric.md 与 thresholds.json 未动、旧版保留），仅做了三处对象映射：

- C1=序厅清单（摇号机/竹签/合牒/香炉/判官/纸扎人5/灯/雾门/HUD）、C2=第一殿清单（孽镜台/五处差异/照镜/半印①/旁白）、C3=衔接清单（序厅↔一殿↔二殿动线）；
- D1=序厅流程、D2=第一殿流程、D3=半印①→第二殿接续、D4=控制与重开；
- A3 逐件对象=序厅 9 件 Lux3D 槽位（lux3d.js:24-46 映射）。

通过线沿用 v2.1 的 95 分，硬门槛 G0–G5 原样。序厅/前三殿"不计分不扣分"旧条款对本轮不适用（本轮它们就是验收对象）；二、三殿仍不评，仅在集成风险提一句。

## 第一步：四五六殿回归（先确认无回归）

| 门槛 | 结果 | 证据（评审/四五六殿/2026-11-19-922a9c5/） |
|---|---|---|
| G0 构建/单测 | PASS | run_auto.py：build=true, tests=true |
| G1 页面启动 | PASS | capture.json：canvas=1，pageErrors=0，consoleErrors=0，failedRequests=0 |
| G2 三幕截图 | PASS | 3 张非空白（visual_ok=true，blank=[]，b1=79.59） |
| G3 主流程 | PASS | game/artifacts/flow/flow-log.json 本轮新鲜重跑：34/34 步 PASS、failed=[]、pageErrors=[]（四殿四味→证据C→半印④、五殿1→9+误踩重置+跨格不误触、六殿合符→return/judge 双结局→重开不残留→未齐印被拒） |
| G4 资产 | PASS | 6 件 GLB：errors=0, warnings=0, triangles=193,610 |
| G5 性能 | PASS | FPS 60.1–60.8，主 draws ≤254，加载 ≤774ms |

- `git diff 3894f94..922a9c5 -- game/src`：仅 scene.ts 二/三殿碰撞扩展（scale/archive 加入 hallActs），四五六殿代码路径未动；本轮合并只新增 public/prologue、public/first-hall、public/models/low。
- 指标与 96.7 终评（3894f94：57.5–79.1 fps、252 draws）同量级（60.1–60.8 fps、≤254 draws），差异在噪声内。
- **回归结论：四五六殿无回归，维持 2026-11-17 终评 96.7（3894f94）/ 96.4（4a31a40）结论。本轮未改四五六殿 src。**

## 第二步：序厅+第一殿验收

采集条件：工作区干净于 922a9c5；Vite dev http://127.0.0.1:5173；headless Edge 1440×900。证据目录：评审/序厅一殿/2026-11-19-922a9c5/（screens/、flow-prologue.json、perf-prologue.json、visual-prologue.json、assets/low-glb-validation.json、auto.json、rubric.json、scores.json）。

### 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | 全仓 build=true, tests=true（同 run_auto） |
| G1 页面启动 | **FAIL** | canvas=1、pageErrors=0，但 6 件关键 GLB 404：S0-07/S0-12/S0-13/S0-15/S0-21/S0-37（lux3d.js:24-46 映射 ../models/prologue/S0-*.glb，文件系统 find 确认不存在；__lux3dStatus missing=6；prologue-check.mjs ERRORS 记录 console 404） |
| G2 截图有效 | PASS | 3 主截图非空白、blank=[] |
| G3 主流程 | PASS | flow-prologue.json：序厅 4 步真实点击链 AUTOPICK machine→1 ticket→2 pass→3 incense→4 FINAL=4；walkgate opened=true veil=on crossed=pos target=first-hall；一殿 solved toast 半印①落下；全程 pageErrors=[] |
| G4 资产合规 | **FAIL** | 6 件复用件 GLB Validator errors=0（各 1 warning）；但 glbFailures=6（S0 缺失）。场景不崩溃（程序化回退兜住），按 score.py 口径仍判 FAIL |
| G5 性能底线 | PASS | minFps=64（first-hall-entry；solved 态活跃采样 92–110），maxDrawsPerFrame=763（含后期 pass 总数）≤800 |

### 分维度得分（总分 63.5/100）

| 维度 | 得分 | 满分 | 百分比 | 主因 |
|---|---:|---:|---:|---|
| A 资产与自动画质 | 6.47 | 15 | 43.1% | A2=0（6 件 GLB 404）、A3=1（9 槽位缺 6 件，主交互物程序化回退） |
| B 美术十项 | 30.0 | 50 | 60.0% | 判官形象专项全线失分（见下） |
| C 逐幕清单 | 13.0 | 15 | 86.7% | C3=3：一殿→二殿接续缺失 |
| D 可玩流程 | 7.0 | 10 | 70.0% | D3=1：动线在半印①后断裂 |
| E 性能与稳定 | 3.0 | 5 | 60.0% | E3=0：console 404 + 加载 6.0s 压线 |
| F 交付与可复现 | 4.0 | 5 | 80.0% | F1=1：基线无统一入口页 |

### 判官形象专项（用户点名"做得很丑"，逐条证据）

1. **帽制违约**：prologue-judge.png 帽为西式圆顶礼帽+两侧横杆，非幞头/乌纱 → B6 2/4。
2. **脸型扁平卡通**：prologue-judge.png 大眼珠、平眉、无颧骨/下颌转折，"清瘦长者/唐国相"气质缺失 → B5/B10 失分主因。
3. **身体纯黑块**：袍身无暗纹无层次，肩部垫肩感、剪影僵硬，手部无朱笔/生死簿道具 → B3 2/4、B10 2/4。
4. **主体无轮廓光**：近景脸被黑帽吞掉层次，无任务书要求的低位青白轮廓光 → B2 2/4。
5. **帽/头比例过大**：头身比失真 → B5 2/4。
（匠人甲本轮已领判官重塑任务，返工以该任务为准；复验条件见 rework.md R1。）

### 纸扎人违约

prologue-start.png/prologue-judge.png 纸扎人有明显卡通眼珠与五官描边，违反 README"不点睛、空眼窝"；五具姿态差异成立。计入 B10。

### 性能补充数据（perf-prologue.json + 补测）

| 视图 | 活跃 FPS | 总 draws/帧（含后期） | 加载 ms | pageErrors |
|---|---:|---:|---:|---:|
| prologue-start | 167 | 763 | 6016 | 0 |
| prologue-judge | 104 | 760 | 5322 | 0 |
| first-hall-entry | 64 | 332 | 5683 | 0 |
| first-hall-solved(vision) | 92–110 | 636 | 5271 | 0 |

注：序厅为按需渲染（invalidate），空闲期不渲染；draws 为 WebGL 全 pass 总数（root 游戏 capture 口径的主 pass 数更低）。

## 集成风险（不评分，只提示）

- 二、三殿属队友范围本轮未评；但 922a9c5 对二/三殿补了实体碰撞（d1f09d3），如需正式口径请另行安排二/三殿验收。
- 评估期间工作区出现匠人乙在改的 game/index.html、src/main.ts、src/style.css、public/first-hall/*（加"入第二殿"按钮与统一入口 entry/）。**本报告全部基线证据在工作区改动前采集，评的是 922a9c5。** 工作区改动版 flow 复测显示"入第二殿 · 业秤 →"按钮已出现（links=[../entry/index.html]），C3/D3 两项缺陷预计已在其本轮修复中，复评时以新 commit 重跑。
- 序厅 Lux3D 只有 6 件复用件入库、6 件 S0-* 生成物不在源分支（feat/huanhun-prologue-hall 96868ab 亦无），需用 Lux3D（Aholo）补生成后入库，这是 G1/G4 解锁的唯一路径。

## 复现命令

```bash
cd D:\群核科技黑客松
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\run_auto.py --out 评审\四五六殿\2026-11-19-922a9c5
cd game
npm.cmd test && npm.cmd run build
node.exe tests/prologue-check.mjs --out ..\评审\序厅一殿\2026-11-19-922a9c5\screens
GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs
node.exe ..\评审\序厅一殿\2026-11-19-922a9c5\flow-prologue.mjs   # 需先复制进 game/tests 或 game 目录下运行
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\score.py --dir 评审/序厅一殿/2026-11-19-922a9c5
```
