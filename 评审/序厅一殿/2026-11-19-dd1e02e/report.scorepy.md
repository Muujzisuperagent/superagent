# 还魂路引 · 四五六殿验收报告

- 版本：`None`
- 时间：2026-11-19T16:31:13
- 范围：None
- 结论：**打回重改**（91.7/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 11.45 | 15 | 76.3% |
| B 美术十项 | 46.25 | 50 | 92.5% |
| C 逐幕必检清单 | 15.0 | 15 | 100.0% |
| D 可玩流程 | 10.0 | 10 | 100.0% |
| E 性能与稳定 | 4 | 5 | 80.0% |
| F 交付与可复现 | 5.0 | 5 | 100.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | PASS | canvas=1, pageErrors=0, criticalRequests=0 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | flow-prologue.json：序厅 4 步真实点击链 AUTOPICK machine->1 | ticket->2 | pass->3 | incense->4 FINAL=4；walkgate opened=true veil=on crossed=pos target=first-hall；一殿五处差异逐点点击（5 次点击逐个转『合』，clicks[4].after 全 ok=true）→ toast 半印①落下；点『入第二殿』落到 http://127.0.0.1:5173/?from=hall1=1 且 HUD=第二殿·业秤；全程 pageErrors=[]。route-check.mjs 37 断言全 PASS（FAILURES=0），含入口页 7 节点/起点浮层/抽屉收起/串联态/窄屏。 |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=60.3, maxDrawsPerFrame=759 |

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
| A3 | 4 | 4.0 | 4 | mounted=10/10（screens/check.json）。prologue-start.png：判官坐像（S0-42，53,110 tri）伏案于矮案后、笔在手簿在案、接地无悬浮；摇号机 S0-12 木盒+铜饰+摇柄立在主案上、接触面成立；香炉 S1-06 在案、账册 S1-09 成摞、灯笼 S0-15 悬挂带灯泡光源；prologue-door.png：长凳 S0-07 在判官案后、纸扎人 S0-37 五具落地成列；比例朝向与场景尺度一致。 |
| B1 | 3.0 | 3.75 | 5 | prologue-start.png：判官+矮案中景、左列纸扎人前景节奏、纵深引向雾门，右侧主案+摇号机被画框裁切；prologue-door.png 远机位层次完整；first-hall-entry.png：孽镜台居中对称、前案后柱层次分明；prologue-judge.png：近景判官下半身被对话 UI 遮挡（交互态设计使然）。 |
| B2 | 4 | 5.0 | 5 | prologue-start.png：灯笼真光源（灯泡发光）+右侧窗光+尽头雾门背光三源有据；prologue-judge.png：判官面部有窗侧冷光、帽沿投影自然、袍褶可读（上轮缺失的轮廓光已生效）；first-hall-entry.png：烛台多点点光+镜面环境反射，暗部信息保留；序厅 luma 0.2342 暗调恢复、雾不吞线索。 |
| B3 | 4 | 5.0 | 5 | prologue-judge.png：判官像乌纱/布袍/皮肤/灰白须发材质可辨；prologue-start.png：纸扎人糊纸哑光、木案木纹、摇号机木盒+铜饰件、地面青灰石板分格；first-hall-entry.png：青铜镜圈、纸卷、布幔、烛台铜件各自成立。 |
| B4 | 3.0 | 3.75 | 5 | prologue-start.png：墨绿+青灰+纸白+小面积朱砂（HUD 印/纸钱），情绪统一；visual-prologue.json：序厅 luma 0.2342/0.2284/0.2361；但宣纸族像素占比实测仅 0.22%（v1 为 1.14%），『灰白旧纸主调』在本场要求下量化偏弱，画面主调实为青灰绿。 |
| B5 | 4 | 5.0 | 5 | prologue-start.png：判官坐像与矮案/坐凳比例自然、接地；纸扎人瘦长头身比成立；主案、长凳、灯笼与廊柱尺度一致；prologue-door.png：五具纸扎人与柱距、窗台高度关系可信；first-hall-entry.png：镜体/案/幔/烛台尺度协调。 |
| B6 | 4 | 5.0 | 5 | prologue-judge.png：判官戴展脚幞头（形制正确，上轮圆顶礼帽已修）、着绿官袍、执笔按簿，符合崔珏『清瘦长者/唐国相/照章办事』；prologue-start.png：摇号机/竹签筒/木牌/香炉/生死簿/纸钱/纸扎人共同构成『阴司便民司』叙事；纸扎人空眼窝合规（上轮卡通眼珠已修）。 |
| B7 | 4 | 5.0 | 5 | prologue-start.png / first-hall-entry.png：同为冷青绿+纸白+深木语汇；对照 act4-medicine.png（评审/四五六殿/2026-11-19-dd1e02e/screens）：序厅/一殿与四殿材质语汇连贯、殿间色温有差异（四殿暖棕 vs 序厅冷绿）；判官坐像质量与场景密度匹配。 |
| B8 | 4 | 5.0 | 5 | prologue-start.png：底部任务行『先去察边跟判官说「我不认」（走近他就开口）』+WASD/E/R 键位+进度点；flow-prologue.json：AUTOPICK 四步全命中（交互物辨识无歧义）；prologue-door.png：雾门出口在强雾中轮廓仍可辨；first-hall 键位行『点镜子·雾中照见旧景·空格透视实景·WASD 走动·Q/E 升降·R 回殿中』。 |
| B9 | 4 | 5.0 | 5 | first-hall-entry.png：右侧大面板已抽屉化（默认收起，仅右上角 ☰ 小按钮），顶部小标题块（殿名+目标句『把五处陈设摆回镜中的样子。镜裂，半印① 落下。』）与根游戏同构，底部一行键位；first-hall-solved.png：通关出现『入第二殿 · 业秤 →』出口按钮；route-check.mjs 37 断言（抽屉展开/功能件齐全/窄屏不遮挡/浮层逻辑）全 PASS。 |
| B10 | 3.0 | 3.75 | 5 | prologue-start.png：无穿模/悬浮/接缝硬伤，判官接地、灯笼吊挂自然、纸扎人落地；prologue-judge.png：判官袖口与笔杆衔接为低模简化、近景下手部细节有限；prologue-door.png：地面纸钱平贴无裁切；first-hall 三图无异常。 |
| C1 | 5 | 5.0 | 5 | prologue-start.png + flow-prologue.json：摇号机/竹签/合牒木牌/香炉四步物件全在场可点（AUTOPICK 命中）；判官+矮案+簿册在场且走近 2.2m 触发对话（check.json probe dist=2.05）；纸扎人五具成列（左列 1+3+背身 1）；灯笼/雾门/长廊/任务 HUD 全在场；9 件 Lux3D 全挂载（mounted=10/10）。 |
| C2 | 5 | 5.0 | 5 | first-hall-entry.png：孽镜台大圆镜居中；flow-prologue.json：五处差异（烛台/经幡/柜门/香炉/卷册）逐点点击全部转合；first-hall-vision.png 照镜显影；first-hall-solved.png 半印①+入第二殿出口；旁白/保存PNG/居中/重置/抽屉全在场（route-check 抽屉功能件齐全 missing=[]）。 |
| C3 | 5 | 5.0 | 5 | flow-prologue.json：序厅→（walkgate）→第一殿→（点入第二殿）→http://127.0.0.1:5173/?from=hall1=1 且 HUD=第二殿·业秤；route-check.mjs：入口页 7 节点（序厅/一殿/二至六殿）、起点浮层两按钮、串联态回便民司+入第二殿双出口、?clean=1/?shots=1 无浮层——37 断言全 PASS。 |
| D1 | 3 | 3.0 | 3 | flow-prologue.json：真实点击 4 步链 FINAL=4；序厅/app.js WRONGPICK 错序不推进提示保留；判官走近对话触发（probe dist=2.05、对话框+『我不认』按钮）；穿门过场 veil=on、WALKGATE crossed=pos。 |
| D2 | 3 | 3.0 | 3 | flow-prologue.json clicks[0..4]：五处差异逐点真实点击，每处点击后状态累积转『合』，第 5 次点击后全 ok=true，随即 toast『镜面「咔」地裂开一道细纹 半印① 从镜后落下 · 形已核』；重置/摆成镜中样/抽屉功能齐全（route-check missing=[]）。 |
| D3 | 3 | 3.0 | 3 | flow-prologue.json：点『入第二殿』后 waitForURL(?from=hall1=1) 命中、HUD=『第二殿 · 业秤』、不再弹起点浮层；route-check 同断言 PASS；串联态下回便民司/入第二殿双按钮可见。 |
| D4 | 1 | 1.0 | 1 | route-check.mjs：键位提示、起点浮层、?clean=1/?shots=1 回退、窄屏不遮挡（hintDisplay=none、宽度不超）、重置/重开入口全 PASS；flow-prologue.json 全程 pageErrors=[]。 |
| F1 | 2 | 2.0 | 2 | route-check.mjs：入口页（还魂路引 · 路线图）7 节点链接全对（序厅/一殿→显式 index.html、二至六殿→../../）、起点浮层资产就位后可点、主按钮跳序厅、次按钮直入二殿；双路径入口成立。 |
| F2 | 3 | 3.0 | 3 | 本目录含 screens/6 图+check.json、flow-prologue.json、route-check 输出、perf-prologue.json、visual-prologue.json、assets/glb-validation.json、auto.json、rubric.json、report.md；版本 dd1e02e 全程标注；复现命令在报告中。 |

## 截图

- prologue-start: [prologue-start.png](screens/prologue-start.png)
- prologue-judge: [prologue-judge.png](screens/prologue-judge.png)
- first-hall-entry: [first-hall-entry.png](screens/first-hall-entry.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A4 | 1.45/5 分 | {'score': 29.08, 'mode': 'stats', 'tech_score': None, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P0 | E2 | 1/2 分 | {'maxDrawsPerFrame': 759, 'maxTotalDrawsPerFrame': 759} | game/src/scene.ts（几何合并、实例化、剔除） |
| P1 | B1 | 3.75/5 分 | prologue-start.png：判官+矮案中景、左列纸扎人前景节奏、纵深引向雾门，右侧主案+摇号机被画框裁切；prologue-door.png 远机位层次完整；first-hall-entry.png：孽镜台居中对称、前案后柱层次分明；prologue-judge.png：近景判官下半身被对话 UI 遮挡（交互态设计使然）。 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B10 | 3.75/5 分 | prologue-start.png：无穿模/悬浮/接缝硬伤，判官接地、灯笼吊挂自然、纸扎人落地；prologue-judge.png：判官袖口与笔杆衔接为低模简化、近景下手部细节有限；prologue-door.png：地面纸钱平贴无裁切；first-hall 三图无异常。 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P1 | B4 | 3.75/5 分 | prologue-start.png：墨绿+青灰+纸白+小面积朱砂（HUD 印/纸钱），情绪统一；visual-prologue.json：序厅 luma 0.2342/0.2284/0.2361；但宣纸族像素占比实测仅 0.22%（v1 为 1.14%），『灰白旧纸主调』在本场要求下量化偏弱，画面主调实为青灰绿。 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
