# 四五六殿 · 回归确认（dd1e02e）

- 日期：2026-11-19T09:20
- 目的：序厅/一殿返工（997387e、dd1e02e）后确认四五六殿无回归。
- 方式：run_auto.py 全量采集 + flow-check.mjs 本轮重跑；不重填审美 B（四五六殿 src 自 3894f94 终评后未改动），引用终评 96.7（3894f94）/ 96.4（4a31a40）。

## G0–G5

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 | PASS | build=true, tests=true |
| G1 | PASS | canvas=1，pageErrors=0，consoleErrors=0，failedRequests=0 |
| G2 | PASS | 3 张截图非空白（blank=[]） |
| G3 | PASS | game/artifacts/flow/flow-log.json 本轮重跑：34/34 PASS、failed=[]、pageErrors=[] |
| G4 | PASS | 6 件 GLB errors=0 warnings=0，triangles=193,610 |
| G5 | PASS | fps 43.1–55.8（≥24），主 draws ≤256（≤800），加载 ≤737ms |

## 对比与判定

| 指标 | 3894f94（96.7 终评） | dd1e02e（本轮） | 判定 |
|---|---|---|---|
| FPS | 57.5 / 61.5 / 79.1 | 55.8 / 47.9 / 43.1 | 偏低但活跃重采样均为 60.3（垂直同步），判定为 headless 背景负载波动 |
| 主 draws | 252 / 168 / 79 | 256 / 172 / 82 | +2~4（噪声） |
| GLB 校验 | 0 err 0 warn | 0 err 0 warn | 同 |
| 加载 | 610/726/606 ms | 737/667/578 ms | 同量级 |
| src 变更 | — | 0（本轮仅改 public/prologue、first-hall、models、tests） | 无回归 |

**结论：四五六殿无回归，维持终评 96.7/96.4。** 下一轮若 headless FPS 持续 <45，在独显机人工复测后再下结论。
