# 还魂路引 · 四五六殿验收报告

- 版本：`3894f94`
- 时间：2026-11-17T15:27:59
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**通过**（96.7/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 14.18 | 15 | 94.5% |
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
| G3 主流程可达 | PASS | flow-log.json（本目录，自 game/artifacts/flow 拷贝）：ranAt=2026-11-17T07:20:26.931Z（本地 15:20:26，晚于 HEAD 3894f94 提交 15:04:18）；33 步 ok，failed=0；flow-check 输出 {"ok":true,"failed":[],"pageErrors":[]}，含四味药→证据C→半印④、五殿踩板→证据D→半印⑤→北门、六殿合符→还阳/留司选择→未齐印被拒→重开清零；04-ending-return.png / 04-ending-judge.png / 05-ending-panel.png 过程图齐全 |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=61.29, maxDrawsPerFrame=254 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 61.28563646266313 | 254 | 254 | 612 | 80.55 | None | None | None | 0.1113 | 29.17 |
| palace | 69.08148888785553 | 172 | 172 | 654 | 70.53 | None | None | None | 0.1067 | 31.75 |
| river | 71.73340597470857 | 82 | 82 | 571 | 100.0 | None | None | None | 0.4023 | 12.07 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 4 | 4.0 | 4 | nav-act4-bench.png 戥子杆盘砣贴桌面+药签棒捆+纸包散放有接触阴影、青瓷碗落右柜台；nav-act4-exit.png 百子柜抽屉+铜环贴立面；nav-act6-side.png 桥拱跨度厚度+栏板连续+水面倒影同轴；nav-act6-end.png 孟婆汤锅+青瓷碗接地；probes.json colliderCount=317（GLB 落位后稳定） |
| B1 | 3.0 | 3.75 | 5 | screens/act4-medicine.png 药案+戥子为主焦点、百子柜中景、右柜台前景层次；act5-palace.png 低机位九宫+匾额+暗木顶压边；act6-reincarnation.png 亭左桥右对角线+雾层纵深；无抢焦点/压顶/破碎 |
| B2 | 4 | 5.0 | 5 | act4-medicine.png 柜体暖光+门洞冷绿雾光（nav-act4-exit.png 门内青绿辉光纵深）；act5-palace.png 幽绿盏光+黑位层次+暗木顶；act6-reincarnation.png 乳白雾垂直梯度+nav-act6-side.png 河面灯影倒影同色；无高光/雾吞线索 |
| B3 | 4 | 5.0 | 5 | nav-act4-exit.png 老榆木纹理+抽屉铜环近景；nav-act4-bench.png 戥子铜/杆木/药草绿红黄三堆/纸包/青瓷碗材质互异；nav-act5-center.png 湿青石斑点+水膜高光+脚印磨痕；nav-act6-side.png 石桥栏板+水面反射 |
| B4 | 4 | 5.0 | 5 | act4-medicine.png 暖棕+药草绿主调、近黑地板压重；act5-palace.png 冷青黑+幽绿点光、luma 0.1067∈设计带（visual.json）；act6-reincarnation.png 乳白雾+彼岸红唯一高饱和强调（mean_saturation 0.2408，visual.json）；三幕主辅色与来源情绪一致 |
| B5 | 3.0 | 3.75 | 5 | nav-act4-entry.png 百子柜与门洞人体比例参照；nav-act6-side.png 桥拱跨度/厚度与眼高参照；nav-act5-center.png 九宫 2.05m 格距与前景铜盏尺度可信；act6 三结局台 1.2m 面板比例（05-ending-panel.png） |
| B6 | 4 | 5.0 | 5 | nav-act4-bench.png 案面药渣散点+药签棒捆+纸包（带接触阴影）；nav-act5-center.png 问案台香器+香灰+匾额「戴九履一·左三右七」；nav-act6-end.png 汤锅+四只青瓷碗+彼岸花根盘接地；act6-reincarnation.png 桥面纸钱散点；半印/路引/证据链+崔珏对白（05-ending-panel.png）齐全 |
| B7 | 4 | 5.0 | 5 | 三幕共用老榆木/青石/青铜/宣纸语汇（nav-act4-exit vs nav-act6-side vs nav-act5-center）；分幕色板差异保留（暖棕/冷青黑/乳白+红）；HUD 三幕同版式（左上标题+右上目标+底部提示条） |
| B8 | 4 | 5.0 | 5 | tests/visual-check.mjs 输出 {"errors":[],"canvas":1}（nav 近黑/中心遮挡判据全过）；nav-act4-entry/act5-entry/act6-bridge.png 入口机位见路线与目标；nav-act4-exit.png 北门可辨；05-ending-panel.png 三路径牌+prompt「E·顶名（未解锁…）」+nearby 3.3m；nav-act4-bench.png nearby 列表带距离 |
| B9 | 4 | 5.0 | 5 | 操作前 act4-medicine.png「半印 0/6 · 不忘汤 · 未配 · 证据 A」→ flow 过程 03-combined.png 合符后状态；05-ending-panel.png 选择前面板三路径+未解锁条件 prompt+崔珏对白+nearby 2 条；免锁提示「按住左键拖动 · 环视；WASD 移动，E 交互」可读（probes.json lockState） |
| B10 | 4 | 5.0 | 5 | nav-act5-center.png 刻字 1/3/5/7/8/6 清晰可辨、脚印无错位；nav-act6-side.png 桥面连续无断阶、栏板无破面；三幕截图无穿模/悬浮/贴图拉伸/硬边雾片；capture.json 三幕 pageErrors/consoleErrors/failedRequests 均 [] |
| C1 | 5 | 5.0 | 5 | 8/8 项达（蒸汽在本轮机位不可辨，n/a 剔除分母）：百子柜主立面分格+铜环（nav-act4-exit.png）、药案台面+桌腿层次（act4-medicine.png）、戥子杆盘砣贴桌（nav-act4-bench.png）、药材≥3 类+纸包（nav-act4-bench.png 绿/红/黄三堆）、青瓷碗碗体碗沿（nav-act4-bench.png 右柜台）、左壁暖光+柜冷光有来源（act4-medicine.png）、左门雾纵深（nav-act4-exit.png 门洞青绿辉光）、右木柜台+罐（act4-medicine.png 右侧） |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 石板与 flow 踩板一致（nav-act5-center.png + scene.ts:1938 layout 同源）、湿青石斑点高光非发光色块、刻字九格可辨、脚印磨痕（5 号板等）、侧墙宽墨绿布幡垂坠（act5-palace.png 两侧）、八盏铜盏青绿火苗（act5-palace.png/nav-act5-center.png 多盏可见）、低机位+前景铜盏（nav-act5-center.png）、冷青黑+幽绿黑位有层次 |
| C3 | 5 | 5.0 | 5 | 8/8：桥拱侧视跨度厚度（nav-act6-side.png）、桥面连续石面（act6-reincarnation.png）、孟婆亭瓦垄起翘（act6-reincarnation.png 左上亭顶）、六道轮盘雾中轮影（nav-act6-side.png）、光门白框光区+轮影（05-ending-panel.png）、彼岸花成片+根盘接地（nav-act6-end.png）、亡魂戴帽队列（act6-reincarnation.png 桥上黑袍人影）、河面无竖幡+灯影倒影（nav-act6-side.png） |
| D1 | 3 | 3.0 | 3 | flow-log.json 33 步 0 failed：四味按君臣佐使顺序+戥子反馈+证据 C+半印④+北门开；探针 act4 未配药停 z=-7.8、配药后绕药案达北门 z=-15.94（probes.json） |
| D2 | 3 | 3.0 | 3 | flow-check.mjs 全 PASS（含误踩重置/跨格不误触/1→9）；探针 9/9 格心可达（probes.json cellResults 全 ok=true）；收印⑤北门 z=-37.5、未收印停门线 z≥-36 |
| D3 | 3 | 3.0 | 3 | flow-log.json 合符+还阳/留司选择+未齐印被拒（「骑缝未合。先取得第四、第五殿的半印。」）+重开清零；04-ending-return.png / 04-ending-judge.png / 05-ending-panel.png 三路径面板与未解锁条件文案；探针三结局台 (-2.7/0/+2.7,-77.6) 全可达 |
| D4 | 1 | 1.0 | 1 | pointerlock-restore.mjs 6/6（人工浏览器点击上锁/锁定提示/Esc 释放/夸克二次 Esc 刷新 navigations=1/webdriver 免锁/提示拖动）；draglook.mjs 7/7；flow-log 重开半印清零 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat 存在（ls game/*.bat 命中），调 start-game.ps1 缺依赖中文提示（4a31a40 轮核实，本轮文件未改：git log 无该文件变更）；本轮 npm.cmd run dev --port 5196 --strictPort 启动 curl 200 |
| F2 | 3 | 3.0 | 3 | 本目录 auto.json/capture.json/assets.json/visual.json/probes.json/rubric.json/screens 13 张（三幕+nav 十张）/flow-log.json+4 张过程图/dev-5196.log；auto.json.meta.commit=3894f94；run_auto/visual-check/flow-check/flow-act23/pointerlock-restore/draglook/probe.mjs 命令均可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P1 | B1 | 3.75/5 分 | screens/act4-medicine.png 药案+戥子为主焦点、百子柜中景、右柜台前景层次；act5-palace.png 低机位九宫+匾额+暗木顶压边；act6-reincarnation.png 亭左桥右对角线+雾层纵深；无抢焦点/压顶/破碎 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B5 | 3.75/5 分 | nav-act4-entry.png 百子柜与门洞人体比例参照；nav-act6-side.png 桥拱跨度/厚度与眼高参照；nav-act5-center.png 九宫 2.05m 格距与前景铜盏尺度可信；act6 三结局台 1.2m 面板比例（05-ending-panel.png） | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P2 | A4 | 4.18/5 分 | {'score': 83.69, 'mode': 'stats', 'tech_score': 83.69, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
