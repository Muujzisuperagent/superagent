# 还魂路引 · 四五六殿验收报告

- 版本：`1cb1e3a`
- 时间：2026-11-17T09:01:52
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（92.7/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 13.94 | 15 | 92.9% |
| B 美术十项 | 43.75 | 50 | 87.5% |
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
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：ranAt=2026-11-17T00:58:52.921Z（本地 08:58:52，晚于 HEAD 1cb1e3a 提交 08:51:50）；34/34 步 ok=true，failed=[]，pageErrors=[]；四殿四味→证据 C→半印④→出门、五殿误踩重置+跨格不误触+1→9→证据 D→半印⑤、六殿合符→[return,judge]→选择 return/judge→重开不残留→未齐印被拒；过程图 01/02/03/04-return/04-judge/05-ending-panel（mtime 08:58）。命令 GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs 输出 {"ok":true,"failed":[],"pageErrors":[]}；idle-check.ps1 采样无活跃 node/msedge CPU |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=57.55, maxDrawsPerFrame=252 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 57.54678508315074 | 252 | 252 | 610 | 80.92 | None | None | None | 0.1167 | 31.4 |
| palace | 61.53289295085899 | 168 | 168 | 726 | 67.07 | None | None | None | 0.1077 | 31.630000000000003 |
| river | 79.0693447241628 | 79 | 79 | 606 | 88.72 | None | None | None | 0.4244 | 11.200000000000001 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 4 | 4.0 | 4 | nav-act6-bridge/side/mid.png 桥栏连续+拱洞完整+桥面连续；crops/act6_combine_top.png 合符台木顶+朱砂圆+金边抬出桥面；crops/act4_cabinet_left.png 开抽屉有侧板体积+接触阴影；crops/act4_bowl.png 纸包盒落位 shelf 面贴合+接触阴影；crops/act6_flowers 根盘接地；assets-share.json 重测 50.77/97.09/99.42%、seam=[] |
| B1 | 3.0 | 3.75 | 5 | screens/act4-medicine.png 药案+戥子主焦点、前中后景成立；act5 低机位九宫+匾额+暗木顶；act6 亭左桥右对角线+雾中层叠；无压顶/抢焦点/破碎 |
| B2 | 4 | 5.0 | 5 | act4 暖棕主光+柜冷光+门内雾光（nav-act4-exit）；act5 幽绿盏光+黑位层次（nb 31.63%、centerDark 28.8%）+暗木顶；act6 乳白雾垂直梯度（顶 0.811/horizon 0.701，差 0.11 实测）+河面竖向灯影倒影（nav-act6-side）；灯焰竖直 cone（crops/act5_flames.png） |
| B3 | 4 | 5.0 | 5 | crops/act4_cabinet_left.png 老榆木磨损+铜环、crops/act4_bowl.png 青瓷碗+褐药渍环、crops/act5_slab_texture.png 湿青灰石水膜高光+裂口+脚印、nav-act6-side.png 石桥栏板、crops/act6_combine_top.png 木顶+朱砂印泥、crops/act5_flames.png 青绿竖焰 |
| B4 | 4 | 5.0 | 5 | act4 暖像素 63.4% vs 冷 0.0%（暖棕药草绿）；act5 冷青黑+幽绿+墨绿幡、luma 0.1077∈[0.08,0.11]、nb 31.63%∈[25,35]；act6 乳白雾+彼岸红唯一高饱和强调（冷像素 10.6%）、天空有垂直梯度 |
| B5 | 3.0 | 3.75 | 5 | nav-act4-entry.png 柜 4.35m 人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例可信 |
| B6 | 3.0 | 3.75 | 5 | 药签真字、戥子君臣佐使、半印/路引/证据链、合符台朱砂圆、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径+未解锁条件 |
| B7 | 3.0 | 3.75 | 5 | 三幕共用青铜/老榆木/青石/宣纸语汇；六殿桥石与四殿柜台石一致、五殿墨绿幡归本幕族、HUD 三幕同版式；分幕冷暖为设计意图 |
| B8 | 4 | 5.0 | 5 | nav 十张重拍全过（visual-check errors=[] 含 frame<85%、center<40% 判据）；nav-act5-center 低机位见九宫+出口牌、nav-act6-mid 朝桥终点且右缘无魂遮挡、crops/act6_combine_top.png 合符台可指认、nav-act4-bench.png nearby-list 物名+距离、crops/05-ending-panel.png 三路径 |
| B9 | 4 | 5.0 | 5 | 操作前 screens/act4「半印 0/6 未配 证据 A」→ flow/01「半印 1/6 已收 证据 A/C」+toast+孟婆对白+nearby 3 条；flow/03「半印 3/6 证据 A/C/D」+toast；crops/05-ending-panel.png 选择前三路径+prompt「E·顶名（未解锁：不忘汤+证据 A/B/D）」+nearby 2 条 |
| B10 | 3.0 | 3.75 | 5 | 上轮 P0 全清：crops/05-ending-panel.png 雾片软边融入天空、crops/act4_bowl.png 纸包贴合、crops/act5_flames.png 焰竖直、nav-act6-* 桥无破碎、seam=[]；剩三处小瑕疵：crops/act6_combine_top.png 左半被近机位亡魂遮、screens/act6 引桥踏步与桥面过渡生硬、act5 石板刻字 5/3/7 近景偏淡 |
| C1 | 5 | 5.0 | 5 | 9/9：百子柜主立面分格+铜环+真实开抽屉、药案台面+腿层次、戥子杆盘砣贴桌、药材≥3 类+纸包、青瓷碗碗体碗沿+褐药渍环、碗上局部蒸汽、左壁灯笼暖光+柜冷光、左门雾+纵深（nav-act4-bench/exit）、右木柜台+罐 |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 与 flow 踩板一致、湿青灰石板非发光色块、刻字 8/1/6 近看可辨、脚印磨痕、侧墙宽墨绿布幡垂坠带破洞、八盏铜盏 7 亮 1 熄竖直青焰、低机位前景石栏（nav-act5-entry/center）、冷青黑+幽绿黑位有层次（centerDark 28.8%） |
| C3 | 5 | 5.0 | 5 | 8/8：桥拱侧视跨度厚度+拱洞完整（nav-act6-side）、桥面连续石面（nav-act6-mid）、孟婆亭瓦垄起翘、六道轮盘位置尺度成立（雾中轮影+05 光门内轮）、光门白框光区、彼岸花成片+根盘接地、亡魂戴帽黑袍队列有衣纹（nav-act6-mid）、河面无竖幡且有灯影倒影 |
| D1 | 3 | 3.0 | 3 | flow-log 步骤 4-10 四味顺序+戥子平反馈+证据 C+半印④+北门已开；flow/01 孟婆剧情对白 |
| D2 | 3 | 3.0 | 3 | flow-log 步骤 11-24 误踩重置+重置续行+跨格不误触 toast可见=false+1→9 每步反馈+九板同亮 |
| D3 | 3 | 3.0 | 3 | flow-log 步骤 25-33 合符+结局矩阵 return/judge 解锁、replace 未解锁带条件提示+选择 return=还阳/judge=留司；05 选择前面板三路径 |
| D4 | 1 | 1.0 | 1 | flow-log 步骤 1-3 锁定/Esc/重锁 pointerLockElement=true hint=true；步骤 31 重开半印清零+面板隐藏；步骤 34 收尾 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat:4 调 start-game.ps1；ps1:26-40 缺 Node/缺依赖中文提示+pause；本轮 npm.cmd run dev --host 127.0.0.1 --port 5173 --strictPort 启动 curl 200 |
| F2 | 3 | 3.0 | 3 | 本目录 auto/capture/assets/visual/assets-share.json（本轮重测 50.77/97.09/99.42%、seam=[]）/assets-v2.json/screens 三张/crops/nav 十张重拍（mtime 08:57-58）/flow-log+6 过程图/idle-check.ps1；commit 1cb1e3a 写入 auto.json.meta；run_auto/visual-check/flow-check/measure-share/score 可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P1 | A4 | 3.94/5 分 | {'score': 78.9, 'mode': 'stats', 'tech_score': 78.9, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P1 | B1 | 3.75/5 分 | screens/act4-medicine.png 药案+戥子主焦点、前中后景成立；act5 低机位九宫+匾额+暗木顶；act6 亭左桥右对角线+雾中层叠；无压顶/抢焦点/破碎 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B10 | 3.75/5 分 | 上轮 P0 全清：crops/05-ending-panel.png 雾片软边融入天空、crops/act4_bowl.png 纸包贴合、crops/act5_flames.png 焰竖直、nav-act6-* 桥无破碎、seam=[]；剩三处小瑕疵：crops/act6_combine_top.png 左半被近机位亡魂遮、screens/act6 引桥踏步与桥面过渡生硬、act5 石板刻字 5/3/7 近景偏淡 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P1 | B5 | 3.75/5 分 | nav-act4-entry.png 柜 4.35m 人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例可信 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P1 | B6 | 3.75/5 分 | 药签真字、戥子君臣佐使、半印/路引/证据链、合符台朱砂圆、flow/01 孟婆对白、flow/03 崔珏结案、crops/05-ending-panel.png 三路径+未解锁条件 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P1 | B7 | 3.75/5 分 | 三幕共用青铜/老榆木/青石/宣纸语汇；六殿桥石与四殿柜台石一致、五殿墨绿幡归本幕族、HUD 三幕同版式；分幕冷暖为设计意图 | game/src/scene.ts（四五六殿材质与细节密度一致性） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
