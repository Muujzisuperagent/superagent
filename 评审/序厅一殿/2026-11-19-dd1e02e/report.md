# 还魂路引 · 序厅+第一殿 复评报告（返工后全量重跑）

- 版本：`dd1e02e`（origin/main 已推）
- 时间：2026-11-19T10:10
- 验收官：验官 · 正式验收（huihun-eval v2.1）
- 结论：**打回重改**（91.7/100 < 95；硬门槛 G0–G5 全部 PASS，上轮 G1/G4 已修复）
- 口径扩展声明沿用 `评审/序厅一殿/2026-11-19-922a9c5/report.md`（本轮为全量重跑，非补评）。

## 四五六殿回归（dd1e02e）

| 门槛 | 结果 | 证据（评审/四五六殿/2026-11-19-dd1e02e/） |
|---|---|---|
| G0 | PASS | build=true, tests=true |
| G1 | PASS | canvas=1，pageErrors=0，consoleErrors=0，failedRequests=0 |
| G2 | PASS | 3 张截图非空白（blank=[]） |
| G3 | PASS | game/artifacts/flow/flow-log.json 本轮重跑 34/34 PASS、pageErrors=[] |
| G4 | PASS | 6 件 GLB errors=0 warnings=0，triangles=193,610 |
| G5 | PASS | fps 43.1–55.8，主 draws ≤256，加载 ≤737ms |

注：本轮 headless FPS（55.8/47.9/43.1）低于上轮（60.8/60.1/60.8），draws/加载/错误率不变；同一场景 post-load 活跃重采样均为 60.3（垂直同步封顶），判定为 headless 背景负载波动，非回归。**维持终评 96.7/96.4 结论。**

## 序厅+第一殿：硬门槛（全部 PASS，上轮两项 FAIL 已修复）

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 | PASS | build=true, tests=true |
| G1 | PASS | canvas=1、pageErrors=0、criticalRequests=0、consoleErrors=0（上轮 6 件 GLB 404 已清零） |
| G2 | PASS | 3 主截图非空白 |
| G3 | PASS | flow-prologue.json：4 步真实点击链 FINAL=4 → walkgate 穿门 → 五处差异逐点点击转合 → 半印① → 入第二殿落根游戏 HUD=第二殿·业秤；route-check.mjs 37 断言全 PASS；全程 pageErrors=[] |
| G4 | PASS | gltfErrors=0、glbFailures=0；序厅 9 件 GLB 全部 0 error 0 warning（判官坐像 S0-42=53,110 tri）；mounted=10/10 missing=0 |
| G5 | PASS | minFps=60.3（post-load 活跃采样），maxDrawsPerFrame=759 ≤800 |

## 上轮 P0 修复确认

| 上轮缺陷 | 状态 | 证据 |
|---|---|---|
| 6 件 S0-* GLB 缺失 | **已修** | game/public/models/prologue/ 8 件 GLB 入库，Validator 0 error；mounted=10/10 |
| 判官形象（圆顶礼帽/卡通脸/纯黑袍） | **已修** | prologue-judge.png：展脚幞头、清瘦长脸长须、绿官袍执笔按簿（S0-42 Lux3D 坐像） |
| 纸扎人卡通眼珠 | **已修** | prologue-start.png 五具空眼窝无五官 |
| 一殿→二殿动线断裂 | **已修** | 点"入第二殿"落 http://127.0.0.1:5173/?from=hall1=1，HUD=第二殿·业秤 |
| 一殿大面板 HUD | **已修** | 抽屉化默认收起（first-hall-entry.png 仅 ☰ 小按钮），route-check 37 断言护航 |
| 统一入口缺失 | **已修** | route-check：入口页 7 节点 + 起点浮层全 PASS |

## 分维度（总分 91.7/100）

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 11.45 | 15 | 76.3%（A1=4 A2=2 A3=4 A4=1.45） |
| B 美术十项 | 46.25 | 50 | 92.5%（B2/B3/B5/B6/B7/B8/B9=4；B1/B4/B10=3） |
| C 逐幕清单 | 15.0 | 15 | 100% |
| D 可玩流程 | 10.0 | 10 | 100% |
| E 性能与稳定 | 4.0 | 5 | 80%（E2=1：单帧 759 draws） |
| F 交付与可复现 | 5.0 | 5 | 100% |

## 为什么 91.7 打回：差 3.3 分的三处可修项

1. **E2（+1.0）**：序厅单帧 759 draw calls（纸钱/纸扎人/窗格未合批）→ ≤300 即 +1。
2. **B4（+1.25）**：宣纸族占比 0.22%（v1 为 1.14%），"灰白旧纸主调"量化不足 → 提纸色元素白度/面积至 0.5–1.2%，**保持 luma 0.20–0.26**（不许反向提亮全场景）。
3. **B1（+1.25）**：判官近景下半身被对话 UI 占据、远景主案右缘裁切 → 机位微调。

三项修满任意两项 + E2 即过线（详见过线账本与「位置→动作→复验条件」：rework.md）。

## 性能数据（perf-prologue.json + 活跃重采样 + draws 补测）

| 视图 | post-load FPS | 单帧 draws（全 pass） | 加载 ms | pageErrors |
|---|---:|---:|---:|---:|
| prologue-start | 60.3 | 759 | 5952 | 0 |
| prologue-judge | 60.3 | 759 | 5361 | 0 |
| first-hall-entry | 60.3 | 332 | 5442 | 0 |
| first-hall-solved(vision) | 60.3 | 636 | 5198 | 0 |

序厅判官 GLB 入场后（+114k 三角）帧率仍稳定在 60.3（垂直同步封顶）；上轮 perf 脚本采样含加载期，本轮以活跃重采样为准。

## 集成风险（不评分）

- 四五六殿本轮 headless FPS 读数偏低（43–56），活跃重采样 60.3，判定为采集波动；下一轮如持续 <45 需在独显机人工复测。
- 判官 S0-41（立像 60,920 tri）已入库但当前场景只用 S0-42 坐像；S0-41 未挂载不占 draws，无风险。

## 复现命令

```bash
cd D:\群核科技黑客松
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\run_auto.py --out 评审\四五六殿\2026-11-19-dd1e02e
cd game
npm.cmd test && npm.cmd run build
node.exe tests/prologue-check.mjs --out ..\评审\序厅一殿\2026-11-19-dd1e02e\screens
node.exe tests/route-check.mjs
node.exe ..\评审\序厅一殿\2026-11-19-dd1e02e\flow-prologue.mjs   # 在 game 目录下运行
C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe .agents\skills\huihun-eval\scripts\score.py --dir 评审/序厅一殿/2026-11-19-dd1e02e
```
