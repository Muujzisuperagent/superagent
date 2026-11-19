# 还魂路引 · 四五六殿验收报告

- 版本：`None`
- 时间：2026-11-19T08:55:16
- 范围：None
- 结论：**打回重改（硬门槛）**（63.5/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 6.47 | 15 | 43.1% |
| B 美术十项 | 30.0 | 50 | 60.0% |
| C 逐幕必检清单 | 13.0 | 15 | 86.7% |
| D 可玩流程 | 7.0 | 10 | 70.0% |
| E 性能与稳定 | 3 | 5 | 60.0% |
| F 交付与可复现 | 4.0 | 5 | 80.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | FAIL | canvas=1, pageErrors=0, criticalRequests=6 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | flow-prologue.json：序厅 4 步真实点击链 AUTOPICK machine->1 | ticket->2 | pass->3 | incense->4 FINAL=4（?probe=1 走 raycaster 命中点击）；walkgate 探针 title=WALKGATE opened=true veil=on crossed=pos target=first-hall；第一殿 solved=1 toast=半印① 从镜后落下·形已核。全程 pageErrors=[]。 |
| G4 资产合规与不阻塞 | FAIL | gltfErrors=0, glbFailures=6 |
| G5 性能底线 | PASS | minFps=64.0, maxDrawsPerFrame=763 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | None | None | None | None | None | None | None | None | None | 0 |
| palace | None | None | None | None | None | None | None | None | None | 0 |
| river | None | None | None | None | None | None | None | None | None | 0 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 1.0 | 1.0 | 4 | screens/check.json：__lux3dStatus total=9 mounted=3 missing=6；lux3d.js:24-46 源码：machine/ticket/bench/folk/lamp/pass 指向 ../models/prologue/S0-*.glb，全库 find 无 S0-* 文件（仅 public/models/low/ 存在 6 件 S1-*）；3 件复用件（S1-06 香炉/S1-09 账册/S1-08 柜门）已挂载且落位成立（prologue-start.png 右侧香炉在案上、账册成摞）。摇号机在 prologue-start.png 为程序化白盒回退。 |
| B1 | 3.0 | 3.75 | 5 | prologue-start.png：判官+木案位于中景偏右，长廊纵深把视线引向雾门；左列纸扎人作前景节奏；first-hall-entry.png：孽镜台大圆镜居中对称，前案后柱层次分明。 |
| B2 | 2.0 | 2.5 | 5 | prologue-start.png：顶部白灯笼+尽头雾门背光是主光源，暗部尚可读；prologue-judge.png：判官面部无轮廓光，黑帽黑袍吞掉肩线与五官层次，桌案区无任务书要求的低位青白轮廓光。 |
| B3 | 2.0 | 2.5 | 5 | prologue-start.png：纸扎人糊纸质感、石板地面、木柱木案可区分；prologue-judge.png：判官袍身为近纯黑无暗纹、帽为硬塑料反光，与『糊纸+淡墨』语汇脱节；first-hall-entry.png：青铜镜圈/纸卷/木桌材质区分成立。 |
| B4 | 3.0 | 3.75 | 5 | prologue-start.png 与 first-hall-entry.png 同为墨绿+纸色冷调，朱砂仅出现在 HUD 小印与对话强调；prologue-door.png 大面积青灰低饱和，符合阴司情绪。 |
| B5 | 2.0 | 2.5 | 5 | prologue-start.png：廊柱间距、案高、机器与人比例基本可信；prologue-judge.png：判官帽子相对头身比明显过大、坐姿与案面高度关系含糊；纸扎人头身比偏卡通（头大）。 |
| B6 | 2.0 | 2.5 | 5 | prologue-start.png：摇号机、竹签、木牌、香炉、纸扎人、生死簿共同构成『阴司便民司』叙事，生活痕迹足；prologue-judge.png：判官帽为西式圆顶礼帽形制，非幞头/乌纱，违反明清阴司衙署时代语汇（场景生图提示词_v3 基调）。 |
| B7 | 3.0 | 3.75 | 5 | prologue-start.png / first-hall-entry.png：同为冷青绿+纸色+深木，建材语汇（石板/木柱/纸幔）连贯；对照 act4-medicine.png（评审/四五六殿/2026-11-19-922a9c5/screens）：四殿暖棕暖光与序厅冷调形成殿间差异但材质语汇一致。 |
| B8 | 3.0 | 3.75 | 5 | prologue-start.png：底部任务行『先去察边跟判官说「我不认」（走近他就开口）』+WASD/E/R 键位；HUD 显示进度（第 1/4 步）与下一点提示（app.js:132 dbg next=PICKS[step]）；flow-prologue.json AUTOPICK 四步全部命中，说明交互物辨识无歧义。 |
| B9 | 2.0 | 2.5 | 5 | prologue-start.png：序厅 HUD 简洁（左上标题块+底部任务行+右下回廊按钮）；first-hall-entry.png：第一殿右侧『殿中陈设』大面板常驻展开，占画面约 1/4 宽，与序厅及四五六殿（act4-medicine.png 极简 HUD）风格断裂；first-hall-solved.png 反馈明确（半印① toast）。 |
| B10 | 2.0 | 2.5 | 5 | prologue-judge.png：判官手部无持笔/簿道具、身体剪影僵硬成块；prologue-start.png：摇号机程序化白盒+摇柄浮置感；纸扎人卡通眼珠与五官描边显假（与 README 空眼窝矛盾）；first-hall 三图未发现穿模/悬浮/接缝硬伤。 |
| C1 | 5 | 5.0 | 5 | prologue-start.png + flow-prologue.json：教学链 4 步物件（摇号机 machine→竹签 ticket→合牒 pass→香炉 incense）全部在场可点（AUTOPICK 命中）；判官+木案+簿册在场（judge 近景可触发对话，check.json probe dist=2.05）；纸扎人 5 具成列（prologue-start.png 左侧 5 具）；白灯笼+雾门+长廊+任务 HUD 在场。 |
| C2 | 5 | 5.0 | 5 | first-hall-entry.png：孽镜台大圆镜居中；flow-prologue.json buttons 列表：五处差异（烛台方位/经幡顺序/柜门开合/香炉有无/案上卷册）+重置陈设+摆成镜中样+保存PNG+居中构图+回殿中R 全部在场；first-hall-vision.png 照镜显影成立；first-hall-solved.png 半印① toast 落下。 |
| C3 | 3.0 | 3.0 | 5 | flow-prologue.json：序厅→第一殿真实跳转链路（walkgate opened=true veil=on crossed=pos target=first-hall；location.href ../first-hall/?from=prologue=1，app.js:279）；first-hall/app.js:772 有『← 回到便民司』返回序厅；但 922a9c5 基线 first-hall 全文仅此一处 location.href，无『入第二殿』跳根游戏的接续（flow-prologue.json buttons 无该按钮，links=[]）。 |
| D1 | 3 | 3.0 | 3 | flow-prologue.json：真实点击 4 步链 FINAL=4；prologue/app.js:548 WRONGPICK 探针证明点错顺序不推进且有提示；判官走近 2.2m 触发对话（check.json probe dist=2.05、prologue-judge.png 对话框+判官崔嵬台词+『我不认』按钮）；穿门过场 veil=on。 |
| D2 | 2.0 | 2.0 | 3 | flow-prologue.json：solved=1 态 toast『镜面「咔」地裂开一道细纹 半印① 从镜后落下·形已核』；五处差异按钮全部显示『合』；重置/摆成镜中样按钮在场（app.js:763 重置收起回厅入口）。未逐处真实点击五处差异。 |
| D3 | 1.0 | 1.0 | 3 | flow-prologue.json：半印①落下成功（toast 证据）；但基线 922a9c5 的 first-hall/app.js 无任何指向根游戏（第二殿）的跳转或按钮（grep location.href 仅 772 行 ../prologue/），links=[]。 |
| D4 | 1 | 1.0 | 1 | prologue-start.png：WASD 走动/点物件操作/E 交互/R 回廊中 键位行+右下『回廊中·R』按钮；first-hall-entry.png：底部键位行（WASD/Q/E/Shift/R/空格）+左下回殿中R；flow-prologue.json 全程 pageErrors=[]，重开/重置入口在场。 |
| F1 | 1.0 | 1.0 | 2 | 序厅/一殿经 Vite dev http://127.0.0.1:5173/prologue/index.html、/first-hall/index.html 可达（本验收全部截图即此路径）；但 922a9c5 基线无统一入口页（public/entry/ 为工作区新增未提交内容，不在基线），玩家需手动拼 URL。 |
| F2 | 3 | 3.0 | 3 | 本目录含 screens/6 图+check.json、flow-prologue.json、perf-prologue.json、visual-prologue.json、assets/low-glb-validation.json、auto.json、rubric.json、report.md；版本号 922a9c5 全程标注；复现命令（npm.cmd test / npm.cmd run build / node.exe tests/prologue-check.mjs --out ...）在报告中。 |

## 截图

- prologue-start: [prologue-start.png](screens/prologue-start.png)
- prologue-judge: [prologue-judge.png](screens/prologue-judge.png)
- first-hall-entry: [first-hall-entry.png](screens/first-hall-entry.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A2 | 0/2 分 | {'glbFailures': ['http://127.0.0.1:5173/models/prologue/S0-07_elm_bench_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-12_ticket_machine_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-13_bamboo_tally_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-15_paper_lantern_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-21_blank_pass_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-37_paper_effigy_A.glb']} | game/public/assets/generated/, game/src/scene.ts |
| P0 | A3 | 1.0/4 分 | screens/check.json：__lux3dStatus total=9 mounted=3 missing=6；lux3d.js:24-46 源码：machine/ticket/bench/folk/lamp/pass 指向 ../models/prologue/S0-*.glb，全库 find 无 S0-* 文件（仅 public/models/low/ 存在 6 件 S1-*）；3 件复用件（S1-06 香炉/S1-09 账册/S1-08 柜门）已挂载且落位成立（prologue-start.png 右侧香炉在案上、账册成摞）。摇号机在 prologue-start.png 为程序化白盒回退。 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | A4 | 1.47/5 分 | {'score': 29.36, 'mode': 'stats', 'tech_score': None, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P0 | B10 | 2.5/5 分 | prologue-judge.png：判官手部无持笔/簿道具、身体剪影僵硬成块；prologue-start.png：摇号机程序化白盒+摇柄浮置感；纸扎人卡通眼珠与五官描边显假（与 README 空眼窝矛盾）；first-hall 三图未发现穿模/悬浮/接缝硬伤。 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P0 | B2 | 2.5/5 分 | prologue-start.png：顶部白灯笼+尽头雾门背光是主光源，暗部尚可读；prologue-judge.png：判官面部无轮廓光，黑帽黑袍吞掉肩线与五官层次，桌案区无任务书要求的低位青白轮廓光。 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P0 | B3 | 2.5/5 分 | prologue-start.png：纸扎人糊纸质感、石板地面、木柱木案可区分；prologue-judge.png：判官袍身为近纯黑无暗纹、帽为硬塑料反光，与『糊纸+淡墨』语汇脱节；first-hall-entry.png：青铜镜圈/纸卷/木桌材质区分成立。 | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P0 | B5 | 2.5/5 分 | prologue-start.png：廊柱间距、案高、机器与人比例基本可信；prologue-judge.png：判官帽子相对头身比明显过大、坐姿与案面高度关系含糊；纸扎人头身比偏卡通（头大）。 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P0 | B6 | 2.5/5 分 | prologue-start.png：摇号机、竹签、木牌、香炉、纸扎人、生死簿共同构成『阴司便民司』叙事，生活痕迹足；prologue-judge.png：判官帽为西式圆顶礼帽形制，非幞头/乌纱，违反明清阴司衙署时代语汇（场景生图提示词_v3 基调）。 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P0 | B9 | 2.5/5 分 | prologue-start.png：序厅 HUD 简洁（左上标题块+底部任务行+右下回廊按钮）；first-hall-entry.png：第一殿右侧『殿中陈设』大面板常驻展开，占画面约 1/4 宽，与序厅及四五六殿（act4-medicine.png 极简 HUD）风格断裂；first-hall-solved.png 反馈明确（半印① toast）。 | game/src/main.ts, game/index.html（HUD 可读性与反馈） |
| P0 | D3 | 1.0/3 分 | flow-prologue.json：半印①落下成功（toast 证据）；但基线 922a9c5 的 first-hall/app.js 无任何指向根游戏（第二殿）的跳转或按钮（grep location.href 仅 772 行 ../prologue/），links=[]。 | game/src/main.ts, game/src/story.ts（六殿合符与结局） |
| P0 | E2 | 1/2 分 | {'maxDrawsPerFrame': 763, 'maxTotalDrawsPerFrame': 763} | game/src/scene.ts（几何合并、实例化、剔除） |
| P0 | E3 | 0/1 分 | {'maxLoadMs': 6016, 'pageErrors': 0, 'consoleErrors': 1} | game/src/main.ts, game/src/scene.ts（资源异步加载） |
| P0 | F1 | 1.0/2 分 | 序厅/一殿经 Vite dev http://127.0.0.1:5173/prologue/index.html、/first-hall/index.html 可达（本验收全部截图即此路径）；但 922a9c5 基线无统一入口页（public/entry/ 为工作区新增未提交内容，不在基线），玩家需手动拼 URL。 | game/启动密室.bat, game/start-game.ps1, game/README.md |
| P0 | G1 | 页面启动 | canvas=1, pageErrors=0, criticalRequests=6 | 先修硬门槛，再复评 |
| P0 | G4 | 资产合规与不阻塞 | gltfErrors=0, glbFailures=6 | 先修硬门槛，再复评 |
| P1 | B1 | 3.75/5 分 | prologue-start.png：判官+木案位于中景偏右，长廊纵深把视线引向雾门；左列纸扎人作前景节奏；first-hall-entry.png：孽镜台大圆镜居中对称，前案后柱层次分明。 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B4 | 3.75/5 分 | prologue-start.png 与 first-hall-entry.png 同为墨绿+纸色冷调，朱砂仅出现在 HUD 小印与对话强调；prologue-door.png 大面积青灰低饱和，符合阴司情绪。 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P1 | B7 | 3.75/5 分 | prologue-start.png / first-hall-entry.png：同为冷青绿+纸色+深木，建材语汇（石板/木柱/纸幔）连贯；对照 act4-medicine.png（评审/四五六殿/2026-11-19-922a9c5/screens）：四殿暖棕暖光与序厅冷调形成殿间差异但材质语汇一致。 | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B8 | 3.75/5 分 | prologue-start.png：底部任务行『先去察边跟判官说「我不认」（走近他就开口）』+WASD/E/R 键位；HUD 显示进度（第 1/4 步）与下一点提示（app.js:132 dbg next=PICKS[step]）；flow-prologue.json AUTOPICK 四步全部命中，说明交互物辨识无歧义。 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P1 | C3 | 3.0/5 分 | flow-prologue.json：序厅→第一殿真实跳转链路（walkgate opened=true veil=on crossed=pos target=first-hall；location.href ../first-hall/?from=prologue=1，app.js:279）；first-hall/app.js:772 有『← 回到便民司』返回序厅；但 922a9c5 基线 first-hall 全文仅此一处 location.href，无『入第二殿』跳根游戏的接续（flow-prologue.json buttons 无该按钮，links=[]）。 | game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂） |
| P1 | D2 | 2.0/3 分 | flow-prologue.json：solved=1 态 toast『镜面「咔」地裂开一道细纹 半印① 从镜后落下·形已核』；五处差异按钮全部显示『合』；重置/摆成镜中样按钮在场（app.js:763 重置收起回厅入口）。未逐处真实点击五处差异。 | game/src/main.ts, game/src/story.ts（五殿踩板） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
