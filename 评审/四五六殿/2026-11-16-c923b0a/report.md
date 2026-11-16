# 还魂路引 · 四五六殿验收报告

- 版本：`c923b0a`
- 时间：2026-11-16T21:59:51
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（84.0/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 11.45 | 15 | 76.3% |
| B 美术十项 | 37.5 | 50 | 75.0% |
| C 逐幕必检清单 | 15.0 | 15 | 100.0% |
| D 可玩流程 | 10.0 | 10 | 100.0% |
| E 性能与稳定 | 5 | 5 | 100.0% |
| F 交付与可复现 | 5.0 | 5 | 100.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | PASS | canvas=1, pageErrors=0, criticalRequests=0 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：ranAt=2026-11-16T13:56:01.768Z（本地 21:56:01，晚于 HEAD c923b0a 提交 21:49:20）；34/34 步 ok=true，failed=[]，pageErrors=[]；四殿四味→证据 C→半印④→出门、五殿误踩重置+跨格不误触+1→9→证据 D→半印⑤、六殿合符→[return,judge]→选择 return/judge→重开不残留→未齐印被拒；过程图 01/02/03/04-return/04-judge/05-ending-panel（mtime 21:55）。命令 GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs 输出 {"ok":true,"failed":[],"pageErrors":[]}；idle 采样 idle-check.ps1 无活跃 node/msedge CPU |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=54.47, maxDrawsPerFrame=246 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 54.47364837263661 | 246 | 298 | 647 | 80.89 | None | None | None | 0.1173 | 30.830000000000002 |
| palace | 55.90146798171459 | 165 | 217 | 573 | 50.98 | None | None | None | 0.0832 | 31.36 |
| river | 59.8286724379982 | 77 | 129 | 564 | 75.28 | None | None | None | 0.3407 | 9.3 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 2.0 | 2.0 | 4 | nav-act6-bridge/side/mid.png 桥栏连续石栏+拱洞完整、无白刺黑洞（c923b0a 回退几何）；crops/act6_combine_top.png 合符台抬出桥面、木顶+朱砂圆+金边可指认；crops/act4_cabinet_left.png 开抽屉有侧板体积+接触阴影；crops/act6_flowers 根盘接地；剩 crops/act4_bowl.png 纸包盒底穿过 shelf 面、crops/05-ending-panel.png 左右硬边梯形雾片 |
| B1 | 3.0 | 3.75 | 5 | screens/act4-medicine.png 药案+戥子主焦点、前中后景（案/柜/门洞）；act5 低机位九宫+匾额主焦点、暗木顶不再压顶；act6 亭左桥右对角线、桥体完整不再抢焦点 |
| B2 | 3.0 | 3.75 | 5 | act4 暖棕主光+柜冷光+门内雾光（nav-act4-exit）；act5 暗木顶+八盏幽绿、centerDark 29.1%、nb 31.36% 黑位有层次；act6 乳白雾 RGB(145,148,140)+河面灯影倒影（nav-act6-side 水面竖向光斑）；剩 05 机位硬边梯形雾片与天空平灰 |
| B3 | 3.0 | 3.75 | 5 | crops/act4_cabinet_left.png 老榆木磨损+铜环、crops/act4_bowl.png 青瓷碗+褐药渍环、crops/act5_slab_texture.png 湿青灰石带水膜高光+裂口+脚印、nav-act6-side.png 石桥栏板石质可信；灯焰仍读作白绿扁盘（cone 小+光晕） |
| B4 | 3.0 | 3.75 | 5 | act4 暖像素 63.5% vs 冷 0.0%；act5 冷青黑+幽绿+墨绿幡（红窄幡已撤）、luma 0.0832∈[0.08,0.11]、nb 31.36%∈[25,35]；act6 乳白雾+彼岸红唯一高饱和强调（冷像素 10.8%）；天空平灰白略失远近层次 |
| B5 | 3.0 | 3.75 | 5 | nav-act4-entry.png 柜 4.35m 与人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例均可信 |
| B6 | 3.0 | 3.75 | 5 | 药签真字（当归/黄芪/陈皮/桂枝…）、戥子君臣佐使、半印/路引/证据链、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径+未解锁条件文案；合符台朱砂圆呼应「朱字浮出」 |
| B7 | 3.0 | 3.75 | 5 | 三幕共用青铜/老榆木/青石/宣纸语汇；五殿墨绿幡回归本幕族、六殿桥石与四殿柜台石一致；HUD 三幕同版式；分幕冷暖差异为设计意图 |
| B8 | 3.0 | 3.75 | 5 | nav-act5-center.png 低机位见九宫+出口牌、nav-act6-mid.png 朝桥终点且桥面可走路线清晰、crops/act6_combine_top.png 合符台可指认+金边、nav-act4-bench.png nearby-list 物名+距离、crops/05-ending-panel.png 三路径可指认；nav-act6-mid 右前景亡魂黑锥遮缘约 12% |
| B9 | 4 | 5.0 | 5 | 操作前 screens/act4「半印 0/6 未配 证据 A」→ flow/01「半印 1/6 已收 证据 A/C」+toast+孟婆对白+nearby 3 条；flow/03「半印 3/6 证据 A/C/D」+toast；crops/05-ending-panel.png 选择前三路径+prompt「E·顶名（未解锁：不忘汤+证据 A/B/D）」+nearby 2 条；lock-hint 不压刻字 |
| B10 | 2.0 | 2.5 | 5 | crops/05-ending-panel.png 左右硬边梯形雾片（上轮遗留）；crops/act4_bowl.png 纸包盒底穿 shelf 面；screens/act5 灯焰白绿扁盘；screens/act6 天空平灰无云层次；桥/柜/合符台/石板本轮缺陷已修（nav-act6-* 与 crops 对照） |
| C1 | 5 | 5.0 | 5 | 9/9：百子柜主立面分格+铜环+真实开抽屉、药案台面+腿层次、戥子杆盘砣贴桌、药材≥3 类+纸包、青瓷碗碗体碗沿+褐药渍环、碗上局部蒸汽、左壁灯笼暖光+柜冷光、左门雾+纵深（nav-act4-bench/exit）、右木柜台+罐 |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 与 flow 踩板一致、湿青灰石板非发光色块、刻字近看可辨、脚印磨痕、侧墙宽墨绿布幡垂坠带破洞、八盏铜盏 7 亮 1 熄、低机位前景石栏（nav-act5-entry/center）、冷青黑+幽绿黑位有层次（centerDark 29.1%） |
| C3 | 5 | 5.0 | 5 | 8/8：桥拱侧视跨度厚度+拱洞完整（nav-act6-side）、桥面连续石面（nav-act6-mid）、孟婆亭瓦垄起翘、六道轮盘位置尺度可读、光门白框光区（05）、彼岸花成片+根盘接地、亡魂戴帽黑袍队列有衣纹层次（nav-act6-mid）、河面竖幡已撤且水面有倒影 |
| D1 | 3 | 3.0 | 3 | flow-log 步骤 4-10 四味顺序+戥子平反馈+证据 C+半印④+北门已开；flow/01 孟婆剧情对白 |
| D2 | 3 | 3.0 | 3 | flow-log 步骤 11-24 误踩重置+重置续行+跨格不误触 toast可见=false+1→9 每步反馈+九板同亮 |
| D3 | 3 | 3.0 | 3 | flow-log 步骤 25-33 合符+结局矩阵 return/judge 解锁、replace 未解锁带条件提示+选择 return=还阳/judge=留司；05 选择前面板三路径 |
| D4 | 1 | 1.0 | 1 | flow-log 步骤 1-3 锁定/Esc/重锁 pointerLockElement=true hint=true；步骤 31 重开半印清零+面板隐藏；步骤 34 收尾 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat:4 调 start-game.ps1；ps1:26-40 缺 Node/缺依赖中文提示+pause；本轮 npm.cmd run dev --host 127.0.0.1 --port 5173 --strictPort 启动 curl 200 |
| F2 | 3 | 3.0 | 3 | 本目录 auto/capture/assets/visual/assets-share.json（本轮重测 50.86/97.09/99.42%、seam=[]）/screens 三张/crops/nav 十张重拍（mtime 21:54-55）/flow-log+6 过程图/idle-check.ps1；commit c923b0a 写入 auto.json.meta；run_auto/visual-check/flow-check/measure-share/score 命令可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A3 | 2.0/4 分 | nav-act6-bridge/side/mid.png 桥栏连续石栏+拱洞完整、无白刺黑洞（c923b0a 回退几何）；crops/act6_combine_top.png 合符台抬出桥面、木顶+朱砂圆+金边可指认；crops/act4_cabinet_left.png 开抽屉有侧板体积+接触阴影；crops/act6_flowers 根盘接地；剩 crops/act4_bowl.png 纸包盒底穿过 shelf 面、crops/05-ending-panel.png 左右硬边梯形雾片 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | B10 | 2.5/5 分 | crops/05-ending-panel.png 左右硬边梯形雾片（上轮遗留）；crops/act4_bowl.png 纸包盒底穿 shelf 面；screens/act5 灯焰白绿扁盘；screens/act6 天空平灰无云层次；桥/柜/合符台/石板本轮缺陷已修（nav-act6-* 与 crops 对照） | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P1 | A4 | 3.45/5 分 | {'score': 69.05, 'mode': 'stats', 'tech_score': 69.05, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P1 | B1 | 3.75/5 分 | screens/act4-medicine.png 药案+戥子主焦点、前中后景（案/柜/门洞）；act5 低机位九宫+匾额主焦点、暗木顶不再压顶；act6 亭左桥右对角线、桥体完整不再抢焦点 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B2 | 3.75/5 分 | act4 暖棕主光+柜冷光+门内雾光（nav-act4-exit）；act5 暗木顶+八盏幽绿、centerDark 29.1%、nb 31.36% 黑位有层次；act6 乳白雾 RGB(145,148,140)+河面灯影倒影（nav-act6-side 水面竖向光斑）；剩 05 机位硬边梯形雾片与天空平灰 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P1 | B3 | 3.75/5 分 | crops/act4_cabinet_left.png 老榆木磨损+铜环、crops/act4_bowl.png 青瓷碗+褐药渍环、crops/act5_slab_texture.png 湿青灰石带水膜高光+裂口+脚印、nav-act6-side.png 石桥栏板石质可信；灯焰仍读作白绿扁盘（cone 小+光晕） | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P1 | B4 | 3.75/5 分 | act4 暖像素 63.5% vs 冷 0.0%；act5 冷青黑+幽绿+墨绿幡（红窄幡已撤）、luma 0.0832∈[0.08,0.11]、nb 31.36%∈[25,35]；act6 乳白雾+彼岸红唯一高饱和强调（冷像素 10.8%）；天空平灰白略失远近层次 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P1 | B5 | 3.75/5 分 | nav-act4-entry.png 柜 4.35m 与人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例均可信 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P1 | B6 | 3.75/5 分 | 药签真字（当归/黄芪/陈皮/桂枝…）、戥子君臣佐使、半印/路引/证据链、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径+未解锁条件文案；合符台朱砂圆呼应「朱字浮出」 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P1 | B7 | 3.75/5 分 | 三幕共用青铜/老榆木/青石/宣纸语汇；五殿墨绿幡回归本幕族、六殿桥石与四殿柜台石一致；HUD 三幕同版式；分幕冷暖差异为设计意图 | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B8 | 3.75/5 分 | nav-act5-center.png 低机位见九宫+出口牌、nav-act6-mid.png 朝桥终点且桥面可走路线清晰、crops/act6_combine_top.png 合符台可指认+金边、nav-act4-bench.png nearby-list 物名+距离、crops/05-ending-panel.png 三路径可指认；nav-act6-mid 右前景亡魂黑锥遮缘约 12% | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
