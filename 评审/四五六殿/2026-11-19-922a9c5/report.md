# 四五六殿 · 回归确认（922a9c5）

- 日期：2026-11-19T08:33
- 验官：验官 · 正式验收；目的：合并队友序厅/一殿（53120b9）后确认四五六殿无回归。
- 方式：run_auto.py 全量采集（构建+单测+截图+FPS/draws+GLB 校验+自动画质）；G3 流程另跑 flow-check.mjs。不重填审美 B（本轮未改四五六殿 src），引用 2026-11-17 终评：3894f94=96.7 通过、4a31a40=96.4 通过。

## G0–G5

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 | PASS | build=true, tests=true |
| G1 | PASS | canvas=1，pageErrors=0，consoleErrors=0，failedRequests=0 |
| G2 | PASS | 3 张截图非空白（blank=[]，b1=79.59） |
| G3 | PASS | game/artifacts/flow/flow-log.json 2026-11-19 新鲜重跑：34/34 PASS、failed=[]、pageErrors=[]（含五殿误踩重置/跨格不误触、六殿双结局/重开不残留/未齐印被拒） |
| G4 | PASS | 6 件 GLB errors=0 warnings=0，triangles=193,610 |
| G5 | PASS | fps 60.13–60.82，主 draws ≤254，加载 ≤774ms |

## 与终评基线对比

| 指标 | 3894f94（96.7 终评） | 922a9c5（本轮） | 判定 |
|---|---|---|---|
| FPS | 57.5 / 61.5 / 79.1 | 60.8 / 60.1 / 60.8 | 同量级 |
| 主 draws | 252 / 168 / 79 | 254 / 172 / 82 | +2~4（噪声） |
| GLB 校验 | 0 err | 0 err | 同 |
| src 变更 | — | 仅 scene.ts 二/三殿碰撞扩展（scale/archive），四五六殿路径未动 | 无回归 |

**结论：四五六殿无回归，维持终评 96.7/96.4 结论。**
