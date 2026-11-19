# 返工清单

结论：**打回重改（硬门槛）**（63.5/100）

## P0 · A2 · 0/2 分

- 证据：{'glbFailures': ['http://127.0.0.1:5173/models/prologue/S0-07_elm_bench_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-12_ticket_machine_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-13_bamboo_tally_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-15_paper_lantern_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-21_blank_pass_A.glb', 'http://127.0.0.1:5173/models/prologue/S0-37_paper_effigy_A.glb']}
- 修复入口：game/public/assets/generated/, game/src/scene.ts

## P0 · A3 · 1.0/4 分

- 证据：screens/check.json：__lux3dStatus total=9 mounted=3 missing=6；lux3d.js:24-46 源码：machine/ticket/bench/folk/lamp/pass 指向 ../models/prologue/S0-*.glb，全库 find 无 S0-* 文件（仅 public/models/low/ 存在 6 件 S1-*）；3 件复用件（S1-06 香炉/S1-09 账册/S1-08 柜门）已挂载且落位成立（prologue-start.png 右侧香炉在案上、账册成摞）。摇号机在 prologue-start.png 为程序化白盒回退。
- 修复入口：game/src/scene.ts（GLB 尺度/朝向/材质/落位）

## P0 · A4 · 1.47/5 分

- 证据：{'score': 29.36, 'mode': 'stats', 'tech_score': None, 'state': 'scored'}
- 修复入口：game/src/scene.ts（灯光、材质、雾、清晰度）

## P0 · B10 · 2.5/5 分

- 证据：prologue-judge.png：判官手部无持笔/簿道具、身体剪影僵硬成块；prologue-start.png：摇号机程序化白盒+摇柄浮置感；纸扎人卡通眼珠与五官描边显假（与 README 空眼窝矛盾）；first-hall 三图未发现穿模/悬浮/接缝硬伤。
- 修复入口：game/src/scene.ts（穿模、悬浮、接缝、阴影错误）

## P0 · B2 · 2.5/5 分

- 证据：prologue-start.png：顶部白灯笼+尽头雾门背光是主光源，暗部尚可读；prologue-judge.png：判官面部无轮廓光，黑帽黑袍吞掉肩线与五官层次，桌案区无任务书要求的低位青白轮廓光。
- 修复入口：game/src/scene.ts（主辅光、暗部信息、雾/辉光）

## P0 · B3 · 2.5/5 分

- 证据：prologue-start.png：纸扎人糊纸质感、石板地面、木柱木案可区分；prologue-judge.png：判官袍身为近纯黑无暗纹、帽为硬塑料反光，与『糊纸+淡墨』语汇脱节；first-hall-entry.png：青铜镜圈/纸卷/木桌材质区分成立。
- 修复入口：game/src/scene.ts（石/木/纸/金属的粗糙度与磨损）

## P0 · B5 · 2.5/5 分

- 证据：prologue-start.png：廊柱间距、案高、机器与人比例基本可信；prologue-judge.png：判官帽子相对头身比明显过大、坐姿与案面高度关系含糊；纸扎人头身比偏卡通（头大）。
- 修复入口：game/src/scene.ts（建筑/家具/道具比例与遮挡）

## P0 · B6 · 2.5/5 分

- 证据：prologue-start.png：摇号机、竹签、木牌、香炉、纸扎人、生死簿共同构成『阴司便民司』叙事，生活痕迹足；prologue-judge.png：判官帽为西式圆顶礼帽形制，非幞头/乌纱，违反明清阴司衙署时代语汇（场景生图提示词_v3 基调）。
- 修复入口：game/src/scene.ts（剧情道具、建筑语汇、生活痕迹）

## P0 · B9 · 2.5/5 分

- 证据：prologue-start.png：序厅 HUD 简洁（左上标题块+底部任务行+右下回廊按钮）；first-hall-entry.png：第一殿右侧『殿中陈设』大面板常驻展开，占画面约 1/4 宽，与序厅及四五六殿（act4-medicine.png 极简 HUD）风格断裂；first-hall-solved.png 反馈明确（半印① toast）。
- 修复入口：game/src/main.ts, game/index.html（HUD 可读性与反馈）

## P0 · D3 · 1.0/3 分

- 证据：flow-prologue.json：半印①落下成功（toast 证据）；但基线 922a9c5 的 first-hall/app.js 无任何指向根游戏（第二殿）的跳转或按钮（grep location.href 仅 772 行 ../prologue/），links=[]。
- 修复入口：game/src/main.ts, game/src/story.ts（六殿合符与结局）

## P0 · E2 · 1/2 分

- 证据：{'maxDrawsPerFrame': 763, 'maxTotalDrawsPerFrame': 763}
- 修复入口：game/src/scene.ts（几何合并、实例化、剔除）

## P0 · E3 · 0/1 分

- 证据：{'maxLoadMs': 6016, 'pageErrors': 0, 'consoleErrors': 1}
- 修复入口：game/src/main.ts, game/src/scene.ts（资源异步加载）

## P0 · F1 · 1.0/2 分

- 证据：序厅/一殿经 Vite dev http://127.0.0.1:5173/prologue/index.html、/first-hall/index.html 可达（本验收全部截图即此路径）；但 922a9c5 基线无统一入口页（public/entry/ 为工作区新增未提交内容，不在基线），玩家需手动拼 URL。
- 修复入口：game/启动密室.bat, game/start-game.ps1, game/README.md

## P0 · G1 · 页面启动

- 证据：canvas=1, pageErrors=0, criticalRequests=6
- 修复入口：先修硬门槛，再复评

## P0 · G4 · 资产合规与不阻塞

- 证据：gltfErrors=0, glbFailures=6
- 修复入口：先修硬门槛，再复评

## P1 · B1 · 3.75/5 分

- 证据：prologue-start.png：判官+木案位于中景偏右，长廊纵深把视线引向雾门；左列纸扎人作前景节奏；first-hall-entry.png：孽镜台大圆镜居中对称，前案后柱层次分明。
- 修复入口：game/src/scene.ts（构图：主目标、前中后景、留白）

## P1 · B4 · 3.75/5 分

- 证据：prologue-start.png 与 first-hall-entry.png 同为墨绿+纸色冷调，朱砂仅出现在 HUD 小印与对话强调；prologue-door.png 大面积青灰低饱和，符合阴司情绪。
- 修复入口：game/src/scene.ts（冷暖配比、朱砂点缀、情绪色）

## P1 · B7 · 3.75/5 分

- 证据：prologue-start.png / first-hall-entry.png：同为冷青绿+纸色+深木，建材语汇（石板/木柱/纸幔）连贯；对照 act4-medicine.png（评审/四五六殿/2026-11-19-922a9c5/screens）：四殿暖棕暖光与序厅冷调形成殿间差异但材质语汇一致。
- 修复入口：game/src/scene.ts（四五六殿材质与细节密度一致性）

## P1 · B8 · 3.75/5 分

- 证据：prologue-start.png：底部任务行『先去察边跟判官说「我不认」（走近他就开口）』+WASD/E/R 键位；HUD 显示进度（第 1/4 步）与下一点提示（app.js:132 dbg next=PICKS[step]）；flow-prologue.json AUTOPICK 四步全部命中，说明交互物辨识无歧义。
- 修复入口：game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识）

## P1 · C3 · 3.0/5 分

- 证据：flow-prologue.json：序厅→第一殿真实跳转链路（walkgate opened=true veil=on crossed=pos target=first-hall；location.href ../first-hall/?from=prologue=1，app.js:279）；first-hall/app.js:772 有『← 回到便民司』返回序厅；但 922a9c5 基线 first-hall 全文仅此一处 location.href，无『入第二殿』跳根游戏的接续（flow-prologue.json buttons 无该按钮，links=[]）。
- 修复入口：game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂）

## P1 · D2 · 2.0/3 分

- 证据：flow-prologue.json：solved=1 态 toast『镜面「咔」地裂开一道细纹 半印① 从镜后落下·形已核』；五处差异按钮全部显示『合』；重置/摆成镜中样按钮在场（app.js:763 重置收起回厅入口）。未逐处真实点击五处差异。
- 修复入口：game/src/main.ts, game/src/story.ts（五殿踩板）
