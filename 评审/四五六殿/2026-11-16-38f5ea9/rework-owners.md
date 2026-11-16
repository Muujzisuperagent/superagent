# 返工归责清单 · 2026-11-16-38f5ea9

- 总分 60.7/100，硬门槛 G5（性能底线）FAIL：`maxDrawsPerFrame=1003 > 800`，FPS 60.18 达标。
- 来源：`rework.md`（脚本生成，19 条：P0 12 / P1 6 / P2 1），本文件只做归责，不改分数。
- 归责口径：画面/几何/材质/光照/交互物 → 匠人甲（`game/src/scene.ts`）；指针锁定、Esc、E 键反馈、HUD、剧情推进 → 匠人乙（`game/src/main.ts`、`src/style.css`）；跨人或不属二人文件 → 集成风险。

## 匠人甲 · game/src/scene.ts（15 条）

| 优先级 | ID | 问题 | 证据 | 动作 |
|---|---|---|---|---|
| P0 | G5 | 性能底线：主 pass draw calls 1003/帧 > 800 | `capture.json` medicine.mainDrawsPerFrame=1003, drawsPerFrame=1186 | 合并药柜百子格/纸张/灯笼为 InstancedMesh 或合批 |
| P0 | E2 | 0/2，主 pass draw calls 超 800 | `scores.json` auto.E2 = {maxDrawsPerFrame:1003} | 同上，先砍四殿，其次五殿 691 |
| P0 | B1 | 四殿主焦点被倾斜大平板遮挡 | `screens/act4-medicine.png` 中央偏上 250×180 px 斜板压住百子柜 | 找到该 plane（疑似错位纸包/纸签）修旋转与位置或删除 |
| P0 | B10 | 多处悬浮与穿模：4+ 纸片悬空、斜板、六殿布幡深色竖块 | 同图左墙/柜前/右侧；`act6-reincarnation.png` 右侧 | 纸片贴墙/落地，布幡改贴水或撤掉 |
| P0 | A3 | 碗纯黑半球、九宫石板自发光色块、轮盘只剩薄环 | 三张 screens；`assets.json` 6 件 0 error | 修 GLB 材质（碗釉面）、石板不用 emissive、轮盘加厚 |
| P0 | A4 | 自动技术分 37.29/100（清晰度/对比/熵偏低） | `visual.json` b1=37.29 | 提对比、降雾吞细节、提高材质纹理信息 |
| P0 | B2 | 药案桌面近黑，碗沿不可辨 | `act4-medicine.png`；`visual.json` medicine.mean_luma=0.0896 | 给药案补台面辅光，保留暗部层次 |
| P0 | B3 | 石板/碗无粗糙度与磨损，纯色面 | `act5-palace.png` 石板；`act4` 碗 | 加程序纹理/法线，区分石、木、瓷 |
| P0 | B4 | 五殿石板青绿/靛蓝染色像 UI 高亮 | `act5-palace.png` 1/6 与 2/4 格 | 改湿青石基色，选中态再另做 |
| P0 | B5 | 左墙锯齿纸板「楼梯」比例失真 | `act4-medicine.png` 左墙 | 换真实木梯或楼梯间结构 |
| P0 | C2 | 五殿 3/8 缺项：石板材质、布幡形态、八灯样式 | `act5-palace.png` | 布幡加宽加长垂坠；八灯改铜盏 + 青绿火苗 |
| P1 | C3 | 六殿缺桥拱侧视、布幡深色竖块 | `act6-reincarnation.png` | 桥改拱桥并把侧面纳入机位；布幡重做 |
| P1 | B6 | 剧情物件齐但精度不足 | 三张 screens | 随 A3/B3 一并提升，不单独排期 |
| P1 | B7 | 三幕细节密度一致偏低 | 三张 screens | 统一提升材质与细节密度 |
| P2 | C1 | 四殿戥子仅见细杆、左门见雾未入镜 | `act4-medicine.png` | 戥子放大到可辨；开左门加雾与纵深 |

## 匠人乙 · game/src/main.ts（3 条）

| 优先级 | ID | 问题 | 证据 | 动作 |
|---|---|---|---|---|
| P1 | B9 | HUD 可读但缺错误/命中失败态对照 | 三张 screens HUD；`flow-check.mjs` toast 日志 | 补未命中、条件不足时的提示文案与样式 |
| P1 | D2 | 五殿 1→9 可过，但错步重置/跨格误触未验证；证据 D 交互点被跳过 | `node.exe tests/flow-check.mjs` 输出 | 补错步重置与跨格用例；配合修证据 D 命中 |
| P1 | D3 | 只解锁 2/3 结局（return、judge） | flow-check 结局列表 | 补第三结局条件与入口，验证三结局文案 |

## 集成风险（不属于单一匠人，需 leader 裁决）

1. **B8 导航与交互辨识**（2.5/5）：既是 scene.ts 的出口/楼梯/交互物造型问题，也是 main.ts 的准星与提示问题。建议下轮先由匠人甲改造型，再由匠人乙补准星高亮；`flow-check.mjs` 需要传送到交互点才命中，说明实际机位可辨识度不足。
2. **五殿「收证据 D」坐标 bug**：`tests/flow-check.mjs` 打印「跳过：坐标 bug，见 knownIssues」。若交互点世界坐标由 scene.ts 写入，归匠人甲；若拾取半径判定在 main.ts，归匠人乙。下轮先定位再分工。
3. **`game/src/story.ts` 不在二人所有权内**：D2/D3 的判定与结局分支很可能落在 story.ts，需 leader 授权后指派，否则返工条目无法闭环。
4. **`game/tests/flow-check.mjs` 与 `HANDOFF.md` 当前未提交**：本轮已随产物一起提交；测试脚本属验收资产，后续改动需同步更新期望值。
