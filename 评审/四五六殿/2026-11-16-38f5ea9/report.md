# 还魂路引 · 四五六殿验收报告

- 版本：`38f5ea9`
- 时间：2026-11-16T10:22:53
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改（硬门槛）**（60.7/100，通过线 80）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 9.86 | 15 | 65.7% |
| B 美术十项 | 26.25 | 50 | 52.5% |
| C 逐幕必检清单 | 9.0 | 15 | 60.0% |
| D 可玩流程 | 7.0 | 9 | 77.8% |
| E 性能与稳定 | 3 | 5 | 60.0% |
| F 交付与可复现 | 5.0 | 5 | 100.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | PASS | canvas=1, pageErrors=0, criticalRequests=0 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | cd game && node.exe tests/flow-check.mjs（5173 dev server）：PASS 锁定鼠标 pointerLockElement=true；PASS 四殿取药 当归/远志/合欢/王不留行 四味；PASS 收证据 C；PASS 半印④落下·北门已开；PASS 五殿踩板 1→9；PASS 六殿合符·三条路已亮；PASS 结局列表 ["return","judge"]；PASS 选择结局 还阳；末行 {"ok":true,"failed":[],"pageErrors":[]}。注：五殿收证据 D 被跳过，脚本打印「跳过：坐标 bug，见 knownIssues」。 |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | FAIL | minFps=60.18, maxDrawsPerFrame=1003 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 60.1755497240018 | 1003 | 1186 | 709 | 51.76 | None | None | None | 0.0896 | 29.54 |
| palace | 60.298317994282435 | 691 | 874 | 623 | 28.92 | None | None | None | 0.0483 | 65.59 |
| river | 60.32019592724275 | 597 | 780 | 566 | 31.19 | None | None | None | 0.1179 | 15.14 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 2.0 | 2.0 | 4 | screens/act4-medicine.png 中央药案：碗体为纯黑半球、无碗沿/釉面层次；screens/act5-palace.png：九宫石板呈青绿/靛蓝自发光色块，非湿青石；screens/act6-reincarnation.png：六道轮盘只剩两层薄环。assets.json：6 件 GLB 均加载、0 error。 |
| B1 | 1.0 | 1.25 | 5 | screens/act4-medicine.png 中央偏上：一块倾斜深色大平板（约 250×180 px）横挡百子柜立面并遮挡柜体；screens/act6-reincarnation.png 中景：六道轮盘薄环与雾同亮度，抢不过桥面。 |
| B2 | 2.0 | 2.5 | 5 | visual.json palace.near_black_ratio=65.6%、mean_luma=0.048；screens/act5-palace.png 数字 8/1/6/5/3/7 可读、八盏灯有可见发光点；screens/act4-medicine.png 药案台面近黑，碗沿不可辨。 |
| B3 | 2.0 | 2.5 | 5 | screens/act4-medicine.png：百子柜木框与铜环可辨、地砖有缝线；碗为纯黑无高光。screens/act5-palace.png：石板为纯色发光面，无湿青石纹理。screens/act6-reincarnation.png：桥面石缝与灯笼金属可辨。 |
| B4 | 2.0 | 2.5 | 5 | screens/act4-medicine.png 冷青墙面 + 暖黄柜光，符合药局；screens/act5-palace.png 近黑底 + 幽绿，但 1/6 石板呈青绿、2/4 呈靛蓝染色，非光源可解释；screens/act6-reincarnation.png 灰绿雾 + 朱红彼岸花。 |
| B5 | 2.0 | 2.5 | 5 | screens/act4-medicine.png：百子柜占主立面、药案有台面/桌腿/下层隔板三层；左墙可见由悬浮纸板拼成的锯齿状「楼梯」，与梁柱比例不符；screens/act6-reincarnation.png 亭与桥尺度大致成立。 |
| B6 | 3.0 | 3.75 | 5 | screens/act4-medicine.png：百子柜+药案+戥子杆+粉/白/绿三类药材+碗+蒸汽；screens/act5-palace.png：匾额「戴九履一·左三右七」+ 洛书数字；screens/act6-reincarnation.png：孟婆亭+汤锅+灯笼+六道轮盘+彼岸花+亡魂队列。 |
| B7 | 3.0 | 3.75 | 5 | 三张 screens 统一冷青主色 + 局部暖光/朱红点缀，均低面数平涂材质；差异保留：药局暖柜光、九宫近黑、忘川灰雾。 |
| B8 | 2.0 | 2.5 | 5 | screens/act5-palace.png：远端案桌与出口无标识，只能靠数字与匾额推断；screens/act4-medicine.png：左墙悬浮纸板易误读为可走楼梯；game/tests/flow-check.mjs 注释「机位传送只改变相机坐标，交互仍走真实射线聚焦」，实测需传送到交互点才命中。 |
| B9 | 3.0 | 3.75 | 5 | 三张 screens 左上 HUD 同版式：殿名、目标句、路引·半印 0/6、不忘汤·未配、证据 A、WASD/鼠标/E/Esc 提示均清晰；flow-check 输出显示 E 交互后 toast 逐步变化（「当归·君，已入药碾」→「半印④落下。不忘汤入手。北门已开。」）。 |
| B10 | 1.0 | 1.25 | 5 | screens/act4-medicine.png：倾斜大平板穿在百子柜前，左墙/柜前/右侧共 5 片以上纸张悬浮半空；screens/act5-palace.png 下缘纸片贴地悬空；screens/act6-reincarnation.png 彼岸花为交叉细杆星形、右侧布幡为深色竖块。 |
| C1 | 4.0 | 4.0 | 5 | screens/act4-medicine.png：百子柜(抽屉+铜环)✓、药案(台面+桌腿+下层隔板)✓、药材≥3类(粉/白/绿)✓、碗(右架青瓷碗+案上碗)✓、蒸汽(右侧细缕)✓、灯笼/光源(柜前暖点+冷环境)✓、右柜台(木箱堆叠)✓、戥子仅见桌面细杆△、左门见雾未入镜✗。 |
| C2 | 2.0 | 2.0 | 5 | screens/act5-palace.png：洛书 8 1 6 / 3 5 7 / 4 9 2 与踩板一致✓、石面数字✓、脚印/磨痕✓、低机位+前景台阶✓、冷青黑+幽绿✓；石板为青绿/靛蓝发光面✗、布幡为窄条硬板✗、八灯为白色光球(非铜盏青绿火苗)✗。 |
| C3 | 3.0 | 3.0 | 5 | screens/act6-reincarnation.png：桥面连续✓、孟婆亭层叠起翘瓦顶✓、六道轮盘薄环可辨✓、光门有微光拱✓、彼岸花成片(交叉杆形态)✓、亡魂队列✓；桥拱侧视未见跨度与厚度✗、右侧布幡为深色竖块✗。 |
| D1 | 3 | 3.0 | 3 | node.exe tests/flow-check.mjs：当归(君)→远志(臣)→合欢(佐)→王不留行(戥子平) 四味依次入药碾，toast 逐句反馈；收证据 C；半印④落下、不忘汤入手、北门已开。 |
| D2 | 2.0 | 2.0 | 3 | 同一次 flow-check：石板 1→9 全部 PASS，「九块石板同时亮了」。日志中无错步重置与跨格误触用例；「收证据 D」被跳过（坐标 bug）。 |
| D3 | 2.0 | 2.0 | 3 | flow-check：六殿合符 PASS，结局解锁列表 ["return","judge"]，选择还阳 PASS；未见第三个结局被解锁。 |
| D4 | n/a | None | 1 | flow-check 仅证明「锁定鼠标 pointerLockElement=true」；无 Esc 释放、无重开用例输出。 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat(138 B)、game/start-game.ps1(2441 B)、game/README.md 均存在；game/index.html 含 file:// 启动警告（tests/visual-check.mjs 断言文案「请用启动器打开密室」）；本轮以 npm.cmd run start 起动 5173 成功。 |
| F2 | 3 | 3.0 | 3 | 评审/四五六殿/2026-11-16-38f5ea9/ 含 auto.json、capture.json、visual.json、assets.json、screens/(3 张 1440×900)、rubric.json、scores.json、report.md；auto.json.meta.commit=38f5ea9，命令与参数完整记录。 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A3 | 2.0/4 分 | screens/act4-medicine.png 中央药案：碗体为纯黑半球、无碗沿/釉面层次；screens/act5-palace.png：九宫石板呈青绿/靛蓝自发光色块，非湿青石；screens/act6-reincarnation.png：六道轮盘只剩两层薄环。assets.json：6 件 GLB 均加载、0 error。 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | A4 | 1.86/5 分 | {'score': 37.29, 'mode': 'stats', 'tech_score': 37.29, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P0 | B1 | 1.25/5 分 | screens/act4-medicine.png 中央偏上：一块倾斜深色大平板（约 250×180 px）横挡百子柜立面并遮挡柜体；screens/act6-reincarnation.png 中景：六道轮盘薄环与雾同亮度，抢不过桥面。 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P0 | B10 | 1.25/5 分 | screens/act4-medicine.png：倾斜大平板穿在百子柜前，左墙/柜前/右侧共 5 片以上纸张悬浮半空；screens/act5-palace.png 下缘纸片贴地悬空；screens/act6-reincarnation.png 彼岸花为交叉细杆星形、右侧布幡为深色竖块。 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P0 | B2 | 2.5/5 分 | visual.json palace.near_black_ratio=65.6%、mean_luma=0.048；screens/act5-palace.png 数字 8/1/6/5/3/7 可读、八盏灯有可见发光点；screens/act4-medicine.png 药案台面近黑，碗沿不可辨。 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P0 | B3 | 2.5/5 分 | screens/act4-medicine.png：百子柜木框与铜环可辨、地砖有缝线；碗为纯黑无高光。screens/act5-palace.png：石板为纯色发光面，无湿青石纹理。screens/act6-reincarnation.png：桥面石缝与灯笼金属可辨。 | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P0 | B4 | 2.5/5 分 | screens/act4-medicine.png 冷青墙面 + 暖黄柜光，符合药局；screens/act5-palace.png 近黑底 + 幽绿，但 1/6 石板呈青绿、2/4 呈靛蓝染色，非光源可解释；screens/act6-reincarnation.png 灰绿雾 + 朱红彼岸花。 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P0 | B5 | 2.5/5 分 | screens/act4-medicine.png：百子柜占主立面、药案有台面/桌腿/下层隔板三层；左墙可见由悬浮纸板拼成的锯齿状「楼梯」，与梁柱比例不符；screens/act6-reincarnation.png 亭与桥尺度大致成立。 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P0 | B8 | 2.5/5 分 | screens/act5-palace.png：远端案桌与出口无标识，只能靠数字与匾额推断；screens/act4-medicine.png：左墙悬浮纸板易误读为可走楼梯；game/tests/flow-check.mjs 注释「机位传送只改变相机坐标，交互仍走真实射线聚焦」，实测需传送到交互点才命中。 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P0 | C2 | 2.0/5 分 | screens/act5-palace.png：洛书 8 1 6 / 3 5 7 / 4 9 2 与踩板一致✓、石面数字✓、脚印/磨痕✓、低机位+前景台阶✓、冷青黑+幽绿✓；石板为青绿/靛蓝发光面✗、布幡为窄条硬板✗、八灯为白色光球(非铜盏青绿火苗)✗。 | game/src/scene.ts（五殿石板、布幡、铜盏、机位） |
| P0 | E2 | 0/2 分 | {'maxDrawsPerFrame': 1003, 'maxTotalDrawsPerFrame': 1186} | game/src/scene.ts（几何合并、实例化、剔除） |
| P0 | G5 | 性能底线 | minFps=60.18, maxDrawsPerFrame=1003 | 先修硬门槛，再复评 |
| P1 | B6 | 3.75/5 分 | screens/act4-medicine.png：百子柜+药案+戥子杆+粉/白/绿三类药材+碗+蒸汽；screens/act5-palace.png：匾额「戴九履一·左三右七」+ 洛书数字；screens/act6-reincarnation.png：孟婆亭+汤锅+灯笼+六道轮盘+彼岸花+亡魂队列。 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P1 | B7 | 3.75/5 分 | 三张 screens 统一冷青主色 + 局部暖光/朱红点缀，均低面数平涂材质；差异保留：药局暖柜光、九宫近黑、忘川灰雾。 | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B9 | 3.75/5 分 | 三张 screens 左上 HUD 同版式：殿名、目标句、路引·半印 0/6、不忘汤·未配、证据 A、WASD/鼠标/E/Esc 提示均清晰；flow-check 输出显示 E 交互后 toast 逐步变化（「当归·君，已入药碾」→「半印④落下。不忘汤入手。北门已开。」）。 | game/src/main.ts, game/index.html（HUD 可读性与反馈） |
| P1 | C3 | 3.0/5 分 | screens/act6-reincarnation.png：桥面连续✓、孟婆亭层叠起翘瓦顶✓、六道轮盘薄环可辨✓、光门有微光拱✓、彼岸花成片(交叉杆形态)✓、亡魂队列✓；桥拱侧视未见跨度与厚度✗、右侧布幡为深色竖块✗。 | game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂） |
| P1 | D2 | 2.0/3 分 | 同一次 flow-check：石板 1→9 全部 PASS，「九块石板同时亮了」。日志中无错步重置与跨格误触用例；「收证据 D」被跳过（坐标 bug）。 | game/src/main.ts, game/src/story.ts（五殿踩板） |
| P1 | D3 | 2.0/3 分 | flow-check：六殿合符 PASS，结局解锁列表 ["return","judge"]，选择还阳 PASS；未见第三个结局被解锁。 | game/src/main.ts, game/src/story.ts（六殿合符与结局） |
| P2 | C1 | 4.0/5 分 | screens/act4-medicine.png：百子柜(抽屉+铜环)✓、药案(台面+桌腿+下层隔板)✓、药材≥3类(粉/白/绿)✓、碗(右架青瓷碗+案上碗)✓、蒸汽(右侧细缕)✓、灯笼/光源(柜前暖点+冷环境)✓、右柜台(木箱堆叠)✓、戥子仅见桌面细杆△、左门见雾未入镜✗。 | game/src/scene.ts（四殿药局道具与灯位） |

## 规则

- 通过线 80 分；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
