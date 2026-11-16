# 还魂路引 · 四五六殿验收报告

- 版本：`f41831c`
- 时间：2026-11-16T21:18:29
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（71.9/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 10.61 | 15 | 70.7% |
| B 美术十项 | 26.25 | 50 | 52.5% |
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
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：ranAt=2026-11-16T13:12:38.947Z（本地 21:12:38，晚于 HEAD f41831c 提交 21:06:21）；34/34 步 ok=true，failed=[]，pageErrors=[]；四殿取四味→证据 C→半印④→出门、五殿误踩重置+跨格不误触+1→9→证据 D→半印⑤、六殿合符→[return,judge] 解锁→选择 return/judge→重开不残留→未齐印被拒；过程图 01/02/03/04-return/04-judge/05-ending-panel.png（mtime 21:12）。命令 GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs 输出 {"ok":true,"failed":[],"pageErrors":[]} |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=58.1, maxDrawsPerFrame=258 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 59.880239520998565 | 258 | 310 | 589 | 81.19 | None | None | None | 0.1215 | 27.3 |
| palace | 58.09995007031611 | 153 | 205 | 665 | 58.1 | None | None | None | 0.1147 | 32.23 |
| river | 60.2709928853242 | 73 | 125 | 556 | 77.03 | None | None | None | 0.2961 | 10.639999999999999 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 1.0 | 1.0 | 4 | nav-act6-bridge.png/nav-act6-mid.png/flow/03-combined.png 桥 GLB 栏板与桥面呈白色半透明竖刺+黑色三角黑洞碎片；crops/act6_combine_top.png 合符台木盒埋入桥面只露一条边（scene.ts:2172 y=1.25 低于桥面）；crops/act4_cabinet_left.png 开抽屉为贴面黑/棕方块无抽屉体；柜/戥子/碗/花落地仍成立（nav-act4-bench、crops/act6_flowers_left 根盘接地） |
| B1 | 2.0 | 2.5 | 5 | screens/act4-medicine.png 主焦点药案+戥子、act5 九宫+匾额、act6 亭左桥右对角线仍成立；但 crops/act5_ceiling.png 灰平板天花占交付帧上缘约 26% 压顶、act6 桥破碎白刺抢走主焦点 |
| B2 | 2.0 | 2.5 | 5 | act4 暖棕主光+柜冷光、nav-act4-exit 门内雾光✓；act5 铜盏幽绿、centerDark 27.6%✓但灰天花 RGB(69,77,71) 抬亮破坏近黑；act6 雾改乳白 RGB(119,122,115) 无矩形边✓但雾无层次、nav-act6-side/bridge 河面下约 35% 纯黑无信息、桥白刺过曝 |
| B3 | 1.0 | 1.25 | 5 | crops/act6_bridge_rail.png 栏板白色玻璃刺+穿孔、nav-act6-mid.png 桥面黑色碎片洞；crops/act5_slab 区（screens/act5）石板为 painted 绿面无湿石纹理；crops/act4_cabinet_left.png 贴面黑方块；木/铜/纸/碗渍仍可信（crops/act4_bowl.png 褐渍环） |
| B4 | 2.0 | 2.5 | 5 | act4 暖像素 62.5% vs 冷 0.0%✓；act6 冷像素 10.6%（上轮 54.6%）乳白雾+彼岸红✓；但 crops/act5_red_banners.png 五殿匾额两侧新增纯红窄幡（六殿语汇）、act5 灰天花偏离冷青黑 |
| B5 | 3.0 | 3.75 | 5 | nav-act4-entry.png 柜 4.35m 与人体参照可信；nav-act6-side.png 桥拱跨度厚度可读；nav-act5-center.png 九宫 6.05m 与 1.65m 眼高比例成立；nav-act6-end.png 锅碗比例可信 |
| B6 | 3.0 | 3.75 | 5 | crops/act4_yaoqian 区药签真字、戥子君臣佐使、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径「还阳/顶名/留司」+未解锁条件文案；半印/路引/证据链齐全 |
| B7 | 2.0 | 2.5 | 5 | 四殿暖木石/五殿冷青/六殿乳白红本应分幕连贯；但五殿红窄幡挪用六殿彼岸红、五殿灰天花与四殿暖天花语汇断裂、六殿桥白刺与四殿木石细节密度断裂（screens 三幕对照） |
| B8 | 2.0 | 2.5 | 5 | nav-act5-center.png 修好低机位见九宫+出口牌、nav-act6-mid.png 朝桥终点✓；nav-act4-bench.png nearby-list 物名+距离✓；crops/05-ending-panel.png 三路径可指认✓；但 crops/act6_combine_top.png 合符台埋入桥面不可指认、nav-act6-mid 桥面碎片误导可走路线 |
| B9 | 4 | 5.0 | 5 | 操作前 screens/act4「半印 0/6 未配 证据 A」→ flow/01「半印 1/6 已收 证据 A/C」+toast+孟婆对白+nearby 3 条；flow/03「半印 3/6 证据 A/C/D」+toast；crops/05-ending-panel.png 选择前三路径面板+prompt「E·顶名（未解锁：不忘汤+证据 A/B/D）」+nearby 2 条；style.css lock-hint 不压刻字 |
| B10 | 0 | 0.0 | 5 | nav-act6-bridge/mid/side 与 flow/03 桥栏白刺+桥面黑洞碎片（严重）；crops/act6_combine_top.png 合符台穿模埋没；crops/act4_cabinet_left/right.png 开抽屉贴面黑/棕方块；crops/act5_ceiling.png 灰平板天花；crops/act5_red_banners.png 红窄幡硬边无垂坠；crops/05-ending-panel.png 左右硬边梯形雾片 |
| C1 | 5 | 5.0 | 5 | 9/9：百子柜主立面分格+铜环（screens/act4）、药案台面+腿层次（nav-act4-bench）、戥子杆盘砣贴桌、药材≥3 类+纸包、青瓷碗碗体碗沿+褐药渍环（crops/act4_bowl.png）、碗上局部蒸汽、左壁灯笼暖光+柜冷光、左门雾+纵深（nav-act4-bench/exit）、右木柜台+罐 |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 与 flow 踩板一致（nav-act5-center 刻字）、石板非发光色块、刻字近看可辨、脚印磨痕、侧墙宽绿布幡垂坠带破洞（screens/act5 两侧）、八盏铜盏 7 亮 1 熄（scene.ts lampSpots）、低机位前景石栏（nav-act5-entry/center）、冷青黑+幽绿黑位有层次（centerDark 27.6%、nb 32.23%） |
| C3 | 5 | 5.0 | 5 | 8/8：桥拱侧视跨度厚度（nav-act6-side）、桥面连续无台阶（nav-act6-bridge）、孟婆亭瓦垄起翘（screens/act6 左）、六道轮盘位置尺度可读、光门白框光区（crops/05-ending-panel）、彼岸花成片+根盘接地（crops/act6_flowers_left）、亡魂戴帽黑袍队列（nav-act6-mid）、河面竖幡已撤（nav-act6-side/bridge 水中无竖块） |
| D1 | 3 | 3.0 | 3 | flow-log 步骤 4-10 四味顺序+戥子平反馈+证据 C+半印④+北门已开；flow/01 孟婆剧情对白 |
| D2 | 3 | 3.0 | 3 | flow-log 步骤 11-24 误踩重置+重置续行+跨格不误触 toast可见=false+1→9 每步反馈+九板同亮 |
| D3 | 3 | 3.0 | 3 | flow-log 步骤 25-33 合符+结局矩阵 return/judge 解锁、replace 未解锁带条件提示+选择 return=还阳/judge=留司；crops/05-ending-panel.png 选择前面板三路径 |
| D4 | 1 | 1.0 | 1 | flow-log 步骤 1-3 锁定/Esc/重锁 pointerLockElement=true hint=true；步骤 31 重开半印清零+面板隐藏；步骤 34 收尾 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat:4 调 start-game.ps1；ps1:26-40 缺 Node/缺依赖中文提示+pause；本轮 npm.cmd run dev --host 127.0.0.1 --port 5173 --strictPort 启动 curl 200 |
| F2 | 3 | 3.0 | 3 | 本目录 auto/capture/assets/assets-v2 沿用/visual/assets-share.json/screens 三张/crops/nav 十张重拍（mtime 21:11）/flow-log+6 张过程图含 05-ending-panel；commit f41831c 写入 auto.json.meta；run_auto/visual-check/flow-check/score 命令可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A3 | 1.0/4 分 | nav-act6-bridge.png/nav-act6-mid.png/flow/03-combined.png 桥 GLB 栏板与桥面呈白色半透明竖刺+黑色三角黑洞碎片；crops/act6_combine_top.png 合符台木盒埋入桥面只露一条边（scene.ts:2172 y=1.25 低于桥面）；crops/act4_cabinet_left.png 开抽屉为贴面黑/棕方块无抽屉体；柜/戥子/碗/花落地仍成立（nav-act4-bench、crops/act6_flowers_left 根盘接地） | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | B1 | 2.5/5 分 | screens/act4-medicine.png 主焦点药案+戥子、act5 九宫+匾额、act6 亭左桥右对角线仍成立；但 crops/act5_ceiling.png 灰平板天花占交付帧上缘约 26% 压顶、act6 桥破碎白刺抢走主焦点 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P0 | B10 | 0.0/5 分 | nav-act6-bridge/mid/side 与 flow/03 桥栏白刺+桥面黑洞碎片（严重）；crops/act6_combine_top.png 合符台穿模埋没；crops/act4_cabinet_left/right.png 开抽屉贴面黑/棕方块；crops/act5_ceiling.png 灰平板天花；crops/act5_red_banners.png 红窄幡硬边无垂坠；crops/05-ending-panel.png 左右硬边梯形雾片 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P0 | B2 | 2.5/5 分 | act4 暖棕主光+柜冷光、nav-act4-exit 门内雾光✓；act5 铜盏幽绿、centerDark 27.6%✓但灰天花 RGB(69,77,71) 抬亮破坏近黑；act6 雾改乳白 RGB(119,122,115) 无矩形边✓但雾无层次、nav-act6-side/bridge 河面下约 35% 纯黑无信息、桥白刺过曝 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P0 | B3 | 1.25/5 分 | crops/act6_bridge_rail.png 栏板白色玻璃刺+穿孔、nav-act6-mid.png 桥面黑色碎片洞；crops/act5_slab 区（screens/act5）石板为 painted 绿面无湿石纹理；crops/act4_cabinet_left.png 贴面黑方块；木/铜/纸/碗渍仍可信（crops/act4_bowl.png 褐渍环） | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P0 | B4 | 2.5/5 分 | act4 暖像素 62.5% vs 冷 0.0%✓；act6 冷像素 10.6%（上轮 54.6%）乳白雾+彼岸红✓；但 crops/act5_red_banners.png 五殿匾额两侧新增纯红窄幡（六殿语汇）、act5 灰天花偏离冷青黑 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P0 | B7 | 2.5/5 分 | 四殿暖木石/五殿冷青/六殿乳白红本应分幕连贯；但五殿红窄幡挪用六殿彼岸红、五殿灰天花与四殿暖天花语汇断裂、六殿桥白刺与四殿木石细节密度断裂（screens 三幕对照） | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P0 | B8 | 2.5/5 分 | nav-act5-center.png 修好低机位见九宫+出口牌、nav-act6-mid.png 朝桥终点✓；nav-act4-bench.png nearby-list 物名+距离✓；crops/05-ending-panel.png 三路径可指认✓；但 crops/act6_combine_top.png 合符台埋入桥面不可指认、nav-act6-mid 桥面碎片误导可走路线 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P1 | A4 | 3.61/5 分 | {'score': 72.11, 'mode': 'stats', 'tech_score': 72.11, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P1 | B5 | 3.75/5 分 | nav-act4-entry.png 柜 4.35m 与人体参照可信；nav-act6-side.png 桥拱跨度厚度可读；nav-act5-center.png 九宫 6.05m 与 1.65m 眼高比例成立；nav-act6-end.png 锅碗比例可信 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P1 | B6 | 3.75/5 分 | crops/act4_yaoqian 区药签真字、戥子君臣佐使、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径「还阳/顶名/留司」+未解锁条件文案；半印/路引/证据链齐全 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
