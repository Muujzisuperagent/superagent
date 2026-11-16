# 还魂路引 · 四五六殿验收报告

- 版本：`68c3504`
- 时间：2026-11-16T16:01:41
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（84.8/100，通过线 95）

> **口径 v2.1**：通过线 95，取消「有条件通过」档，低于 95 一律打回（`references/rubric.md` v2.1 + `scripts/score.py` `PASS_LINE=95`；v2.0 留档在 `references/archive/`）。目标基线见 `评审/四五六殿/target-95.md`。
>
> **本轮与上一轮的对比（同一口径、同一评审人）**：72.7 → **84.8**（+12.1）。A 10.69→12.10、B 30.00→38.75、C 12.0→14.0、D/E/F 保持满分。六项扩展（光门、轮盘比例、暖榆木、花海、熄灯青烟、提示框下移）在截图里都能找到对应证据，不是自称。**距 95 还差 10.2 分**，精确预算见 `rework.md`。
>
> **本轮新增的一处硬伤**：`crops/a5_altar.png` 在五殿案台正上方悬着一个巨大的纯黑四棱锥，无依托，并把匾额「戴九履一 · 左三右七」从中间截断——玩家读不全规则提示。这条按 B10 计，已列为必删项。

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 12.1 | 15 | 80.7% |
| B 美术十项 | 38.75 | 50 | 77.5% |
| C 逐幕必检清单 | 14.0 | 15 | 93.3% |
| D 可玩流程 | 10.0 | 10 | 100.0% |
| E 性能与稳定 | 5 | 5 | 100.0% |
| F 交付与可复现 | 5.0 | 5 | 100.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | PASS | canvas=1, pageErrors=0, criticalRequests=0 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json（ranAt 2026-11-16T07:52:21Z，晚于 68c3504）：34 步全部 ok=true，failSteps=0，pageErrors=[]，unlockedEndings=["return","judge"]，endingMatrix return/judge 已解锁、replace 未解锁且带提示「结局未解锁：不忘汤 + 证据 A / B / D」。链路含四殿取药四味→证据 C→半印⑥→出门、五殿 1→9 与误踩重置、跨格不误触、六殿合符、重开不残留。 |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=59.97, maxDrawsPerFrame=233 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 60.27099288529876 | 233 | 283 | 623 | 56.38 | None | None | None | 0.0887 | 24.099999999999998 |
| palace | 59.972739663789184 | 170 | 220 | 560 | 66.03 | None | None | None | 0.1466 | 13.11 |
| river | 60.298317994282435 | 80 | 130 | 568 | 63.84 | None | None | None | 0.1334 | 8.18 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 3.0 | 3.0 | 4 | game/README.md:34/36 已书面声明「四五六殿交付版本是程序几何，herbal-cabinet / nine-palace / stone-bridge 三件保持 visible=false，截图与验收以程序几何为准」，满足「书面声明交付形态」这一支。可见证据：crops/a6_arch.png 六道轮盘缩到约 4.7 m、6 根辐条与内外环可数；crops/a4_right.png celadon-bowl 落在台边木托、碗沿成立；crops/a4_cabinet.png 百子柜抽屉分格+铜环+药签成立。仍不合格：crops/a4_table.png 桌面左端戥子是一个黑色圆盘（直径≈桌面 1/6）加一块黑色圆枕形底座，读不出杆—盘—砣，匠人声称的「杆—盘—砣程序几何」在交付帧里看不到。 |
| B1 | 3.0 | 3.75 | 5 | act6-reincarnation.png：孟婆亭左前景 + 石桥右上对角线 + 雾中光门与轮盘，三层景深完整；act5-palace.png：九宫板呈透视铺满中景、后方案台与匾额收束视线、两侧布幡夹持，构图成立；act4-medicine.png：药案居中、两侧柜墙夹持、北门洞带雾纵深。减分：crops/a4_left.png 左侧约 1/4 仍是空白墙 + 一张悬空素色纸片；act4 下 40% 是几乎无信息的深色地板；act5 下沿除熄灭灯盏外仍是空地。 |
| B2 | 3.0 | 3.75 | 5 | 改善证据：crops/a4_right.png 右柜台横板有明确暖光与受光衰减，crops/a4_cabinet.png 抽屉铜环有高光对比；act5 灯池在地面形成可读光斑。未达标证据：crops/a5_altar.png 底部铜盏的火焰仍是纯白亮球（不是青绿），灯池边缘硬切；act6-reincarnation.png 桥面 x≈1000–1120 / y≈500–610 与 x≈860–960 / y≈590–650 两处仍是纯白过曝块；crops/a4_left.png 左墙向下直接并进纯黑（visual.json near_black 24.1%）。 |
| B3 | 3.0 | 3.75 | 5 | 改善证据：crops/a4_right.png 老榆木柜台有木色与横板层次，crops/a4_table.png 药案为暖木面且台面/围板/腿分层，crops/a5_floor.png 九宫石板有斑驳纹理与低光泽，crops/a6_flower.png 陶鼎为哑光青褐。未达标证据：crops/a5_altar.png 铜盏（BRONZE）仍读作白釉小盏，无锈色与金属高光；crops/a6_arch.png 孟婆亭顶仍是近黑剪影，看不出瓦垄；两侧布幡（act5-palace.png 左右）为uniform 淡绿薄片，无织物经纬。 |
| B4 | 3.0 | 3.75 | 5 | 四殿：act4-medicine.png 药案与右柜台已呈暖棕木色（对照上一版整幅青绿），青绿退到柜体与墙面，暖冷两个色区可数。五殿：act5-palace.png 转为全屏幽绿 + 白焰灯池，visual.json mean_luma 0.048→0.147、near_black 65.8%→13.1%，比上一版明显变亮；但 rubric §10 五殿基调是「近黑与九盏灯点、孤独安静」，现在更像均匀绿场，情绪偏离。六殿：act6-reincarnation.png 乳白雾 + 血红彼岸花，符合本场。 |
| B5 | 3.0 | 3.75 | 5 | 已修：crops/a6_arch.png 六道轮盘直径约 4.7 m，与桥宽 4.3 m（scene.ts:1442）比例约 1.1，不再两倍于桥。仍偏：crops/a4_table.png 戥子圆盘约为桌面宽度 1/6、明显大于实物；crops/a6_arch.png / nav-act6-side.png 桥上仍能数出 ≥4 个同类小亭顶盖（匠人称 4→2 未在画面成立）；act4-medicine.png 药案宽度仍只占殿宽 1/5（scene.ts room 宽 13.6 m）。 |
| B6 | 4 | 5.0 | 5 | 五殿：crops/a5_altar.png 匾额「戴九履一 · 左三右七」可读、案台挂牌「问案台 · 取簿」、桌上半印与簿册，底部熄灭灯盏冒青烟（act5-palace.png y≈760 处的烟丝），布幡整体朝内垂坠——熄灯、青烟、幡向三项都落到了画面。六殿：crops/a6_flower.png 孟婆亭陶鼎 + 6 只青瓷碗 + 双股蒸汽，crops/a6_flower.png 两岸成片血红彼岸花，crops/a6_arch.png 亡魂有佝偻/抱物差异、成列过桥，桥头挂布幡。四殿：药签、药材四类、戥子、青瓷碗、北门雾幕齐备。三幕未见现代物件或违约道具。 |
| B7 | 3.0 | 3.75 | 5 | 三幕共用同一低多边形尺度与同一套木/石/陶材质语汇，跨场景连贯；差异已拉开：四殿暖棕、五殿幽绿亮场、六殿乳白+血红。仍偏：act4-medicine.png 与 act5-palace.png 的环境色相都在同一绿域，四殿的暖棕只在桌面与柜台局部，两场并排仍有「同一套绿」的观感。 |
| B8 | 3.0 | 3.75 | 5 | act5-palace.png：刻字 4/9/2·3/5/7·8/1/6 + 每块石板脚印 + 灯池，踩点与路线一眼可读（nav-act5-center.png 近距还能读到 5 号刻字）。act6-reincarnation.png：桥面栏杆 + 连续灯笼 + 花海边界形成明确前进路径。未达标证据：act4-medicine.png 与 act5-palace.png 右下角各有一个空的圆角框（#nearby-list 容器），框内没有任何物名；交付帧里也看不到准星线框高亮，匠人乙声称的 B8 两层反馈在三张交付帧里无法验证。 |
| B9 | 4 | 5.0 | 5 | act5-palace.png：提示框已下移到 y≈795（bottom 9%），九宫下排中间石板的「1」在 y≈650 完整可读，不再被遮；act4/act5/act6 左上殿名+目标+路引行、右上罗盘与距离、右下「音·待启 (M)」均清晰，字号与描边克制。锁定前后反馈由 flow-log 的 toast 步骤（石板 n 下沉/还剩 n 步）佐证。 |
| B10 | 2.0 | 2.5 | 5 | 严重缺陷（新引入）：crops/a5_altar.png 正上方悬着一个巨大纯黑四棱锥（crop 内 x≈400–560 / y≈0–300），悬空无依托，且把匾额「戴九履一 · 左三右七」从中间截断，玩家读不全规则提示。其他：crops/a4_cabinet.png 百子柜仍是 8×7 完全同款阵列（个别抽屉有铜环高光，但无缺板/半开差异），抽屉面上还有 4 张发光白卡与 2 个漂浮白点；act6-reincarnation.png 桥面两处纯白斑未清；crops/a6_flower.png 彼岸花为无厚度红色薄片，左下角一朵悬在桥面边缘之上；crops/a6_arch.png 桥上同类小亭顶盖 ≥4 个；crops/a4_left.png 左墙素色纸片仍无内容。 |
| C1 | 4.0 | 4.0 | 5 | 逐项数 act4-medicine.png + crops（9 项）：百子柜✓（crops/a4_cabinet.png 抽屉分格 + 铜环 + 药签）；药案✓（crops/a4_table.png 台面/围板/腿/抽屉盒分层）；戥子✗（黑圆盘 + 黑枕形底座，比例失真，读不出戥子）；药材✓（crops/a4_table.png 线香束/淡黄叶片两堆/粉红花堆 4 类可辨）；青瓷碗✓（crops/a4_right.png 台边木托）；蒸汽/雾✓（crops/a4_right.png 青瓷罐上双股白汽 + 北门洞雾幕）；灯笼✓（crops/a4_left.png 白纸灯笼 + 纸笺）；左门见雾✗（左墙仍是实墙 + 悬空素纸，门洞只在正中）；右柜台✓（crops/a4_right.png 暖木横板柜 + 陶罐 + 纸包）。达标 7/9。 |
| C2 | 5 | 5.0 | 5 | 逐项数 act5-palace.png + crops（8 项）：洛书✓（crops/a5_floor.png 读到 4/9/2 · 3/5/7 · 8/1/6，且 flow-log 五殿 1..9 全 PASS，与踩板逻辑一致）；石板材质✓（斑驳青石纹理 + 低光泽）；刻字✓（4/9/8/6/1 均可辨，nav-act5-center.png 近距更清楚）；脚印✓（每块石板一枚深色脚印）；布幡✓（两侧宽幅、下摆破口、整体朝内）；八盏灯✓（scene.ts:1332-1357 八个灯位，7 盏有焰 + 前中盏熄灭冒青烟，crops/a5_altar.png 可见烟丝）；氛围✓（冷青主调 + 局部幽绿灯池，near_black 13.1%）；机位✗（相机俯角仍大、前景无案桌/石栏，仍属俯视全景）。达标 7/8。 |
| C3 | 5 | 5.0 | 5 | 逐项数 act6-reincarnation.png + crops（8 项）：桥面✓（连续石板 + 两侧栏杆 + 灯笼）；孟婆亭✓（crops/a6_flower.png 层叠起翘檐 + 宝顶 + 陶鼎 + 6 只青瓷碗 + 双股蒸汽）；六道轮盘✓（crops/a6_arch.png 6 辐条 + 内外环可数，直径约 4.7 m）；光门✓（crops/a6_arch.png 双门柱 + 门楣 + 门内暖白亮区，轮廓与亮区都成立）；彼岸花✓（crops/a6_flower.png 两岸 240 株成片，非零星几朵）；亡魂队列✓（crops/a6_arch.png 成列、有佝偻与抱物差异）；河面布幡✓（布幡挂在岸侧杆上，未误置成水面深色竖块）；桥拱侧视✗（本帧只见桥面纵深，nav-act6-side.png 侧视仍是黑块，拱腹跨度与厚度读不出）。达标 7/8。 |
| D1 | 3 | 3.0 | 3 | flow-log.json：四殿取药 danggui / yuanzhi / hehuan / wangyou 四步 ok=true 且带剧情文案；四殿收证据 C、收半印⑥、出门均 ok=true（「半印⑥落下。不忘汤入手。北门已开。」）。 |
| D2 | 3 | 3.0 | 3 | flow-log.json：五殿踩板 1→9 九步连续 PASS；误踩重置 ok=true（「错了。一盏幽灯灭了。重来。」）；重置后可续 ok=true；跨格不误触 ok=true（toast 不可见）。 |
| D3 | 3 | 3.0 | 3 | flow-log.json：六殿合符 ok=true；endingMatrix return/judge 已解锁、replace 未解锁并提示缺「不忘汤 + 证据 A / B / D」；未齐印合符被挡 ok=true；选择结局 return/judge 均 ok=true；重开不残留 ok=true（半印清零、结局面板隐藏）。 |
| D4 | 1 | 1.0 | 1 | flow-log.json：锁定鼠标、Esc 释放（released=true, hint=true）、释放后重锁、重开不残留全部 ok=true；三张交付帧 HUD 提示与「音·待启 (M)」可读。 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat 调用 start-game.ps1 且出错 pause；game/README.md:7 写明双击启动、不要直接开 index.html；README 新版补充了 Vite 只绑 ::1 的坑、--host 127.0.0.1 与 GAME_URL 用法，依赖缺失有自动 npm 安装说明。 |
| F2 | 3 | 3.0 | 3 | 评审/四五六殿/2026-11-16-68c3504/ 内含 auto.json（五步采集命令与耗时）、capture.json、assets.json、visual.json、三张 1440×900 交付帧、rubric.json、report.md；提交号 68c3504 在 auto.json.meta.commit；另有 game/artifacts/nav/ 十张导航组图与 game/artifacts/flow/flow-log.json（ranAt 07:52:21Z）可复现。 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | B10 | 2.5/5 分 | 严重缺陷（新引入）：crops/a5_altar.png 正上方悬着一个巨大纯黑四棱锥（crop 内 x≈400–560 / y≈0–300），悬空无依托，且把匾额「戴九履一 · 左三右七」从中间截断，玩家读不全规则提示。其他：crops/a4_cabinet.png 百子柜仍是 8×7 完全同款阵列（个别抽屉有铜环高光，但无缺板/半开差异），抽屉面上还有 4 张发光白卡与 2 个漂浮白点；act6-reincarnation.png 桥面两处纯白斑未清；crops/a6_flower.png 彼岸花为无厚度红色薄片，左下角一朵悬在桥面边缘之上；crops/a6_arch.png 桥上同类小亭顶盖 ≥4 个；crops/a4_left.png 左墙素色纸片仍无内容。 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P1 | A3 | 3.0/4 分 | game/README.md:34/36 已书面声明「四五六殿交付版本是程序几何，herbal-cabinet / nine-palace / stone-bridge 三件保持 visible=false，截图与验收以程序几何为准」，满足「书面声明交付形态」这一支。可见证据：crops/a6_arch.png 六道轮盘缩到约 4.7 m、6 根辐条与内外环可数；crops/a4_right.png celadon-bowl 落在台边木托、碗沿成立；crops/a4_cabinet.png 百子柜抽屉分格+铜环+药签成立。仍不合格：crops/a4_table.png 桌面左端戥子是一个黑色圆盘（直径≈桌面 1/6）加一块黑色圆枕形底座，读不出杆—盘—砣，匠人声称的「杆—盘—砣程序几何」在交付帧里看不到。 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P1 | A4 | 3.1/5 分 | {'score': 62.08, 'mode': 'stats', 'tech_score': 62.08, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P1 | B1 | 3.75/5 分 | act6-reincarnation.png：孟婆亭左前景 + 石桥右上对角线 + 雾中光门与轮盘，三层景深完整；act5-palace.png：九宫板呈透视铺满中景、后方案台与匾额收束视线、两侧布幡夹持，构图成立；act4-medicine.png：药案居中、两侧柜墙夹持、北门洞带雾纵深。减分：crops/a4_left.png 左侧约 1/4 仍是空白墙 + 一张悬空素色纸片；act4 下 40% 是几乎无信息的深色地板；act5 下沿除熄灭灯盏外仍是空地。 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B2 | 3.75/5 分 | 改善证据：crops/a4_right.png 右柜台横板有明确暖光与受光衰减，crops/a4_cabinet.png 抽屉铜环有高光对比；act5 灯池在地面形成可读光斑。未达标证据：crops/a5_altar.png 底部铜盏的火焰仍是纯白亮球（不是青绿），灯池边缘硬切；act6-reincarnation.png 桥面 x≈1000–1120 / y≈500–610 与 x≈860–960 / y≈590–650 两处仍是纯白过曝块；crops/a4_left.png 左墙向下直接并进纯黑（visual.json near_black 24.1%）。 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P1 | B3 | 3.75/5 分 | 改善证据：crops/a4_right.png 老榆木柜台有木色与横板层次，crops/a4_table.png 药案为暖木面且台面/围板/腿分层，crops/a5_floor.png 九宫石板有斑驳纹理与低光泽，crops/a6_flower.png 陶鼎为哑光青褐。未达标证据：crops/a5_altar.png 铜盏（BRONZE）仍读作白釉小盏，无锈色与金属高光；crops/a6_arch.png 孟婆亭顶仍是近黑剪影，看不出瓦垄；两侧布幡（act5-palace.png 左右）为uniform 淡绿薄片，无织物经纬。 | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P1 | B4 | 3.75/5 分 | 四殿：act4-medicine.png 药案与右柜台已呈暖棕木色（对照上一版整幅青绿），青绿退到柜体与墙面，暖冷两个色区可数。五殿：act5-palace.png 转为全屏幽绿 + 白焰灯池，visual.json mean_luma 0.048→0.147、near_black 65.8%→13.1%，比上一版明显变亮；但 rubric §10 五殿基调是「近黑与九盏灯点、孤独安静」，现在更像均匀绿场，情绪偏离。六殿：act6-reincarnation.png 乳白雾 + 血红彼岸花，符合本场。 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P1 | B5 | 3.75/5 分 | 已修：crops/a6_arch.png 六道轮盘直径约 4.7 m，与桥宽 4.3 m（scene.ts:1442）比例约 1.1，不再两倍于桥。仍偏：crops/a4_table.png 戥子圆盘约为桌面宽度 1/6、明显大于实物；crops/a6_arch.png / nav-act6-side.png 桥上仍能数出 ≥4 个同类小亭顶盖（匠人称 4→2 未在画面成立）；act4-medicine.png 药案宽度仍只占殿宽 1/5（scene.ts room 宽 13.6 m）。 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P1 | B7 | 3.75/5 分 | 三幕共用同一低多边形尺度与同一套木/石/陶材质语汇，跨场景连贯；差异已拉开：四殿暖棕、五殿幽绿亮场、六殿乳白+血红。仍偏：act4-medicine.png 与 act5-palace.png 的环境色相都在同一绿域，四殿的暖棕只在桌面与柜台局部，两场并排仍有「同一套绿」的观感。 | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B8 | 3.75/5 分 | act5-palace.png：刻字 4/9/2·3/5/7·8/1/6 + 每块石板脚印 + 灯池，踩点与路线一眼可读（nav-act5-center.png 近距还能读到 5 号刻字）。act6-reincarnation.png：桥面栏杆 + 连续灯笼 + 花海边界形成明确前进路径。未达标证据：act4-medicine.png 与 act5-palace.png 右下角各有一个空的圆角框（#nearby-list 容器），框内没有任何物名；交付帧里也看不到准星线框高亮，匠人乙声称的 B8 两层反馈在三张交付帧里无法验证。 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P2 | C1 | 4.0/5 分 | 逐项数 act4-medicine.png + crops（9 项）：百子柜✓（crops/a4_cabinet.png 抽屉分格 + 铜环 + 药签）；药案✓（crops/a4_table.png 台面/围板/腿/抽屉盒分层）；戥子✗（黑圆盘 + 黑枕形底座，比例失真，读不出戥子）；药材✓（crops/a4_table.png 线香束/淡黄叶片两堆/粉红花堆 4 类可辨）；青瓷碗✓（crops/a4_right.png 台边木托）；蒸汽/雾✓（crops/a4_right.png 青瓷罐上双股白汽 + 北门洞雾幕）；灯笼✓（crops/a4_left.png 白纸灯笼 + 纸笺）；左门见雾✗（左墙仍是实墙 + 悬空素纸，门洞只在正中）；右柜台✓（crops/a4_right.png 暖木横板柜 + 陶罐 + 纸包）。达标 7/9。 | game/src/scene.ts（四殿药局道具与灯位） |

## 集成风险（不计分，仅提示）

- 序厅与前三殿由队友负责，本报告**不评、不扣分**。仅提示一句：`flow-log.json` 的 34 步从四殿起走，不含前三殿；四殿入口依赖 `completed` 判定（`scene.ts` 的 `archive→medicine` 门洞切换），前三殿若改动完成态需回归一次四殿进入。

## 证据索引

- 交付帧：`screens/act4-medicine.png`、`act5-palace.png`、`act6-reincarnation.png`（1440×900）
- 局部 2× 放大（本轮新增）：`crops/a4_table.png`、`a4_left.png`、`a4_right.png`、`a5_altar.png`、`a5_floor.png`、`a6_arch.png`、`a6_far.png`、`a6_flower.png`
- 玩家机位佐证：`game/artifacts/nav/nav-act5-center.png`（俯视 5 号石板可读）、`nav-act6-side.png`（侧视桥，拱腹仍黑块）
- 机器数据：`auto.json`、`capture.json`、`assets.json`、`visual.json`（本目录）
- 流程证据：`game/artifacts/flow/flow-log.json`（ranAt 2026-11-16T07:52:21Z，34 步 ok=true）
- 资产交付声明：`game/README.md:34/36`（程序几何为交付版本，三件 GLB 保持 `visible=false`）

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
