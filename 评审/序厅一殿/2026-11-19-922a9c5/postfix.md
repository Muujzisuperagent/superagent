# 返工执行记录 · 序厅+第一殿（基线 922a9c5 之后）

> 性质：**返工自检记录，不是正式验收分数**。正式 100 分制复评需验官按 huihun-eval v2.1 全量重跑后另出 `report.md`。

## 已闭合的 P0

| 项 | 基线问题 | 本轮证据 | 状态 |
|---|---|---|---|
| P0-1 六件 S0 GLB 缺失 | G1/G4 FAIL，`mounted=3/9` | 6 件 S0 GLB 已由 Aholo Lux3D G1-Turbo 生成入库：`game/public/models/prologue/`，manifest 记 taskId/sha256；Khronos validator **0 error / 0 warning**，三角 85,770；`__lux3dStatus mounted=9 missing=0` | 工程门槛闭合 |
| P0-2 判官形象 | 圆顶礼帽、扁平卡通脸、纯黑袍 | 幞头/乌纱+展脚、窄长脸球面壳、连续长须、深灰绿官袍+蔽膝、案侧青白轮廓光、右手朱笔/左手生死簿；契约回归 5 条路径全过 | **部分闭合：近景仍有脸贴片与帽形问题，见下** |
| P0-3 纸扎人点睛 | 卡通眼珠/描边违反“不点睛” | 改为空眼窝、低对比眉骨，去瞳孔与朱砂 | 闭合（视觉待复审） |
| P0-4 一殿→二殿断点 | 半印①后无去处 | 通关显示“入第二殿 · 业秤”→ 根游戏二殿；`route-check.mjs` 33 项断言全 PASS | 闭合 |
| P0-5 一殿大面板 | 常驻 306px 面板 | 改右上角抽屉，默认收起；顶栏与根游戏同构；功能全保留 | 闭合（视觉待复审） |

## 本轮验证命令与结果

```text
npm.cmd test                    3 files / 26 tests passed
npm.cmd run build               tsc --noEmit 通过；vite build 1.37s；three 661.43 kB
node tests/visual-check.mjs     errors=[] canvas=1
node tests/flow-check.mjs       {"ok":true,"failed":[],"pageErrors":[]}
node tests/prologue-check.mjs   lux mounted=9 missing=0；6 图 loadingDone=true；ERRORS 空；HTTP>=400 空
node tests/route-check.mjs      PASS … FAILURES: 0
Khronos glTF Validator          S0×6 0 error/0 warning；S1 low×6 0 error/1 warning；合计 194,228 tri
```

## 仍未闭合 / 下一轮必须处理

1. **判官近景仍不够**：`closeup/head-3q.png` 可见脸部仍是一块高对比白面具贴片（五官像简笔），幞头冠体偏“碗/盔”，展脚与帽檐比例仍可再收。玩家在 `?dlgapproach=1` 的 2.05 m 机位能看清，属于用户点名项，不能算完成。
2. **生成资产的语义质量**：S0-12 取号机读作大木柜、体量偏大；S0-37 纸扎人袍色偏米白，与程序化纸壳的冷灰绿仍有色差。需要重生成或二次调尺寸/染色。
3. **序厅旧纸色占比**：审官量测旧纸色族 <1.5%，与“灰白与旧纸色主调”有偏差；本轮把色温拉向四五六殿青绿后更偏冷，需在旧纸/青绿之间重新配比。
4. **正式复评未跑**：基线 63.5/100 < 95，硬门槛 G1/G4 已具备解锁证据，但未做全量 100 分复评；不得据此宣称通过。
5. **四五六殿回归**：本轮只确认 96.7（3894f94）/96.4（4a31a40）结论，四五六殿 src 未改；返工后的最终提交仍需跑一次 `run_auto.py` 回归留档。

## 证据路径

- 改造前后：`game/artifacts/prologue/judge-rework/before|after|closeup/`
- 序厅/一殿回归：`game/artifacts/prologue/final-check/`、`game/artifacts/prologue/flow-rework/`
- 动线与入口：`game/artifacts/route-flow/`
- 验收基线：`评审/序厅一殿/2026-11-19-922a9c5/`
- 四五六殿回归：`评审/四五六殿/2026-11-19-922a9c5/`
- 视觉评审：`评审/序厅/v1/`、`评审/第一殿/v1/`、`评审/序厅一殿/v1/consistency.md`
