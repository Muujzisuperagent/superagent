# 还魂路引 · 四五六殿验收报告

- 版本：`4a31a40`
- 时间：2026-11-17T09:59:30
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**通过**（96.4/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 13.9 | 15 | 92.7% |
| B 美术十项 | 47.5 | 50 | 95.0% |
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
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：ranAt=2026-11-17T01:55:50.222Z（本地 09:55:50，晚于 HEAD 4a31a40 提交 09:45:02）；34/34 步 ok=true，failed=[]，pageErrors=[]；四殿四味→证据 C→半印④→出门、五殿误踩重置+跨格不误触+1→9→证据 D→半印⑤、六殿合符→[return,judge]→选择 return/judge→重开不残留→未齐印被拒；过程图 01/02/03/04-return/04-judge/05-ending-panel（mtime 09:55）。命令 GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs 输出 {"ok":true,"failed":[],"pageErrors":[]}；idle-check.ps1 采样无活跃 node/msedge CPU |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=48.47, maxDrawsPerFrame=254 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 56.59181455992295 | 254 | 254 | 675 | 80.17 | None | None | None | 0.1155 | 30.89 |
| palace | 48.466730081075774 | 172 | 172 | 685 | 65.03 | None | None | None | 0.1074 | 31.22 |
| river | 65.7357874694044 | 82 | 82 | 646 | 88.81 | None | None | None | 0.4425 | 8.23 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 4 | 4.0 | 4 | nav-act6-bridge/side/mid.png 桥栏连续+拱洞完整+引桥二级过渡平台（crops/act6_bridge_steps.png 落脚平台消除断阶）；crops/act6_combine_top.png 合符台全顶可指认（木顶+朱砂圆+金边）且亡魂已侧移无遮挡；crops/act4_bowl.png 纸包盒贴 shelf 面+接触阴影；crops/act4_cabinet_left.png 开抽屉有体积；assets-share.json 50.56/97.09/99.42%、seam=[] |
| B1 | 3.0 | 3.75 | 5 | screens/act4-medicine.png 药案+戥子主焦点、前中后景成立；act5 低机位九宫+匾额+暗木顶；act6 亭左桥右对角线+雾层；无压顶/抢焦点/破碎 |
| B2 | 4 | 5.0 | 5 | act4 暖棕主光+柜冷光+门内雾光（nav-act4-exit）；act5 幽绿盏光+黑位层次（nb 31.22%、centerDark 实测达标）+暗木顶；act6 乳白雾垂直梯度（顶 0.811/horizon 0.701 差 0.11，上轮实测口径）+河面灯影倒影（nav-act6-side）；crops/act5_flames.png 竖直青焰 |
| B3 | 4 | 5.0 | 5 | crops/act4_cabinet_left.png 老榆木磨损+铜环、crops/act4_bowl.png 青瓷碗+褐药渍环、crops/act5_slab_texture.png 湿青灰石水膜高光+裂口+脚印、crops/act6_bridge_steps.png 石桥栏板+落脚平台、crops/act6_combine_top.png 木顶+朱砂印泥 |
| B4 | 4 | 5.0 | 5 | act4 暖像素 63%+ vs 冷≈0（暖棕药草绿）；act5 冷青黑+幽绿+墨绿幡、luma 0.1074∈[0.08,0.11]、nb 31.22%∈[25,35]；act6 乳白雾+彼岸红唯一高饱和强调（冷像素 ~10%）、天空有垂直梯度 |
| B5 | 3.0 | 3.75 | 5 | nav-act4-entry.png 柜 4.35m 人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例可信 |
| B6 | 4 | 5.0 | 5 | crops/act4_desk_traces.png 案面药渣散点+戥砣/纸包散放+药签棒捆（带接触阴影）；crops/act5_altar_traces.png 问案台插香两支+香灰痕；crops/act6_bridge_steps.png 桥面湿脚印+黄色纸钱散点、crops/act6_soup_traces.png 孟婆汤锅+四只青瓷残汤碗；半印/路引/证据链+对白+三路径文案齐全 |
| B7 | 4 | 5.0 | 5 | 三幕共用青铜/老榆木/青石/宣纸语汇；crops/act6_bridge_steps.png 河岸新增灯柱/石灯+成片彼岸花+纸钱，细节密度向四殿拉齐（river draws 82 与 79→82 自报一致）；五殿墨绿幡归本幕族；HUD 三幕同版式 |
| B8 | 4 | 5.0 | 5 | nav 十张重拍全过（visual-check errors=[] 含 frame<85%、center<40% 判据）；nav-act5-center 低机位见九宫+出口牌、nav-act6-mid 朝桥终点且右缘无魂、crops/act6_combine_top.png 合符台全顶可指认、nav-act4-bench.png nearby-list 物名+距离、crops/05-ending-panel.png 三路径 |
| B9 | 4 | 5.0 | 5 | 操作前 screens/act4「半印 0/6 未配 证据 A」→ flow/01「半印 1/6 已收 证据 A/C」+toast+孟婆对白+nearby 3 条；flow/03「半印 3/6 证据 A/C/D」+toast；crops/05-ending-panel.png 选择前三路径+prompt「E·顶名（未解锁：不忘汤+证据 A/B/D）」+nearby 2 条 |
| B10 | 4 | 5.0 | 5 | 三项全清：crops/act6_combine_top.png 亡魂侧移后台体全顶无遮挡；crops/act6_bridge_steps.png 引桥二级过渡平台无生硬断阶；crops/act5_slab_texture.png 刻字 8/1/6 清晰、3/5/7 近景可辨；crops/act4_bowl.png 纸包贴合；无白刺/黑洞/灰板/红窄幡/硬边雾片（nav-act6-* 与 05 对照） |
| C1 | 5 | 5.0 | 5 | 9/9：百子柜主立面分格+铜环+真实开抽屉、药案台面+腿层次、戥子杆盘砣贴桌、药材≥3 类+纸包、青瓷碗碗体碗沿+褐药渍环、碗上局部蒸汽、左壁灯笼暖光+柜冷光、左门雾+纵深（nav-act4-bench/exit）、右木柜台+罐 |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 与 flow 踩板一致、湿青灰石板非发光色块、刻字九格近景可辨、脚印磨痕、侧墙宽墨绿布幡垂坠带破洞、八盏铜盏 7 亮 1 熄竖直青焰、低机位前景石栏（nav-act5-entry/center）、冷青黑+幽绿黑位有层次 |
| C3 | 5 | 5.0 | 5 | 8/8：桥拱侧视跨度厚度+拱洞完整（nav-act6-side）、桥面连续石面+引桥过渡平台（nav-act6-mid/bridge）、孟婆亭瓦垄起翘、六道轮盘位置尺度成立（雾中轮影+05 光门内轮）、光门白框光区、彼岸花成片+根盘接地、亡魂戴帽黑袍队列有衣纹、河面无竖幡且有灯影倒影 |
| D1 | 3 | 3.0 | 3 | flow-log 步骤 4-10 四味顺序+戥子平反馈+证据 C+半印④+北门已开；flow/01 孟婆剧情对白 |
| D2 | 3 | 3.0 | 3 | flow-log 步骤 11-24 误踩重置+重置续行+跨格不误触 toast可见=false+1→9 每步反馈+九板同亮 |
| D3 | 3 | 3.0 | 3 | flow-log 步骤 25-33 合符+结局矩阵 return/judge 解锁、replace 未解锁带条件提示+选择 return=还阳/judge=留司；05 选择前面板三路径 |
| D4 | 1 | 1.0 | 1 | flow-log 步骤 1-3 锁定/Esc/重锁 pointerLockElement=true hint=true；步骤 31 重开半印清零+面板隐藏；步骤 34 收尾 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat:4 调 start-game.ps1；ps1:26-40 缺 Node/缺依赖中文提示+pause；本轮 npm.cmd run dev --host 127.0.0.1 --port 5173 --strictPort 启动 curl 200 |
| F2 | 3 | 3.0 | 3 | 本目录 auto/capture/assets/visual/assets-share.json（本轮重测 50.56/97.09/99.42%、seam=[]）/assets-v2.json/screens 三张/crops/nav 十张重拍（mtime 09:54-55）/flow-log+6 过程图/idle-check.ps1；commit 4a31a40 写入 auto.json.meta；run_auto(--settle-ms 12000)/visual-check/flow-check/measure-share/score 可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P1 | A4 | 3.9/5 分 | {'score': 78.0, 'mode': 'stats', 'tech_score': 78.0, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P1 | B1 | 3.75/5 分 | screens/act4-medicine.png 药案+戥子主焦点、前中后景成立；act5 低机位九宫+匾额+暗木顶；act6 亭左桥右对角线+雾层；无压顶/抢焦点/破碎 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B5 | 3.75/5 分 | nav-act4-entry.png 柜 4.35m 人体参照、nav-act6-side.png 桥拱跨度厚度、nav-act5-center.png 九宫 6.05m 与眼高 1.65m、nav-act6-end.png 锅碗比例可信 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
