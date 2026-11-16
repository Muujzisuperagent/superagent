# 还魂路引 · 四五六殿验收报告

- 版本：`998d014`
- 时间：2026-11-16T15:21:00
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（72.7/100，通过线 80；硬门槛 6/6 PASS，但总分不足 80）
- 执行：验官 · 正式验收，口径 `huihun-eval`（rubric.md v2.0 + thresholds.json）

> 判定说明（不改口径，只对齐文档）：`score.py` 内置把 70–79 映射为「有条件通过」，但 `references/rubric.md` §12「打回条件：总分 < 80 或存在 P0」且本技能强制禁止写「有条件通过」。故本报告采用 §12 口径判「打回重改」；`scores.json` 的数值与 `passed:false` 不受影响，未修改评分表、阈值或任何分数。

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 10.69 | 15 | 71.3% |
| B 美术十项 | 30.0 | 50 | 60.0% |
| C 逐幕必检清单 | 12.0 | 15 | 80.0% |
| D 可玩流程 | 10.0 | 10 | 100.0% |
| E 性能与稳定 | 5 | 5 | 100.0% |
| F 交付与可复现 | 5.0 | 5 | 100.0% |

## 硬门槛

| 门槛 | 结果 | 证据 |
|---|---|---|
| G0 构建与单测 | PASS | build=True, tests=True |
| G1 页面启动 | PASS | canvas=1, pageErrors=0, criticalRequests=0 |
| G2 三幕截图有效 | PASS | screens=3, blank=[] |
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：34 步全部 ok=true，pageErrors=[]，unlockedEndings=["return","judge"]。链路：四殿取药 danggui/yuanzhi/hehuan/wangyou → 收证据 C → 收半印⑥ → 出门 → 五殿踩板 1..9（含误踩重置、重置后可续、跨格不误触）→ 收证据 D → 收半印⑤ → 六殿合符 → 结局矩阵 return/judge 解锁 + replace 未解锁守卫 → 重开不残留。 |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=59.72, maxDrawsPerFrame=244 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 60.15921838249105 | 244 | 293 | 627 | 49.94 | None | None | None | 0.0803 | 30.28 |
| palace | 60.3147249557945 | 175 | 224 | 578 | 61.14 | None | None | None | 0.1162 | 26.939999999999998 |
| river | 59.72310198172866 | 81 | 130 | 585 | 50.63 | None | None | None | 0.1355 | 8.61 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 2.0 | 2.0 | 4 | assets.json：6 件 GLB 全部 errors=0 / warnings=0。但 scene.ts:1984 把 herbal-cabinet / nine-palace / stone-bridge 三件 wrapper.visible=false，画面实际走程序几何，这三件的落位无法在交付帧里验证。可见的：crops/a4_table.png 桌面左侧 dengzi-scale 呈黑色圆盘+横杆，读不出戥杆与秤盘，且直径≈桌面 1/6，比例失真；crops/a4_right.png celadon-bowl 落在台边木托上，碗沿与内外壁成立；crops/a6_wheel.png six-realm-wheel 在距桥 26 m 的雾里只剩白色轮廓线，材质与细节几乎不可辨。 |
| B1 | 3.0 | 3.75 | 5 | act4-medicine.png：中央药案为主焦点，两侧百子柜夹持，背部门洞带乳白雾幕形成纵深，主次清楚；act5-palace.png：九宫板居中、灯池环绕，焦点明确；act6-reincarnation.png：孟婆亭左前景 + 石桥向右上对角线 + 雾中轮盘，有三层纵深。减分：crops/a4_left.png 左上约 1/4 画面是空白素墙，act5 下 1/3 为无信息前景空地。 |
| B2 | 2.0 | 2.5 | 5 | visual.json 近黑比：medicine 30.3% / palace 26.9% / river 8.6%。crops/a4_left.png 白纸灯笼是唯一可辨光源，墙面没有受光衰减，向下直接并进纯黑；crops/a4_right.png 右柜台下半整块黑，看不出横板层次；crops/a5_lamps.png 灯焰为白球，灯池边缘硬切；crops/a6_bridge.png 桥面近景两处高光成纯白块，顶部雾把远景对比压成一片灰。 |
| B3 | 2.0 | 2.5 | 5 | crops/a4_cabinet.png 抽屉面为同一哑光绿灰，木纹/金属/纸/石区分不开；crops/a5_lamps.png 铜盏（scene.ts:1342 BRONZE）渲染成白釉小盏，没有金属高光与锈色；crops/a6_pavilion.png 亭顶为纯黑剪影，无瓦垄面材质；crops/a4_table.png 药材是零厚度叶片贴片，无纤维感。 |
| B4 | 2.0 | 2.5 | 5 | visual.json：medicine mean_saturation 0.4693、主色相全绿，而 rubric.md 规定四殿为暖棕 + 药草绿、柜台暖光；act4-medicine.png 实际整幅被青绿环境光统一，暖棕只剩药案下方阴影。act5-palace.png 冷青黑 + 局部幽绿符合本场。act6-reincarnation.png 乳白雾 + 彼岸红符合本场，红色面积克制（近黑 8.6%）。 |
| B5 | 2.0 | 2.5 | 5 | act4-medicine.png 药案宽约画面 1/5，殿宽 13.6 m（scene.ts:644 附近 room 参数），桌偏小；crops/a4_table.png 戥子圆盘直径≈桌面 1/6 远超实物。scene.ts:1599-1601 六道轮盘半径 2.0×1.95≈3.9 m，而桥宽 4.3 m（scene.ts:1442 createBridge width 4.3），轮盘直径几乎是桥宽两倍；crops/a6_bridge.png 桥上连续 4 座同尺寸小亭，把 20.4 m 的桥压成通道感。 |
| B6 | 3.0 | 3.75 | 5 | 四殿：crops/a4_cabinet.png 百子柜（抽屉分格+标签+铜环）、戥子、crops/a4_right.png 青瓷碗与陶罐、四类药材、scene.ts:972 北门洞乳白雾幕；五殿：crops/a5_board.png 洛书刻字、脚印、两侧布幡、scene.ts:1332-1357 八盏铜灯、案台半印⑤；六殿：crops/a6_pavilion.png 孟婆亭+陶鼎+六只青瓷碗、scene.ts:1583 十二个亡魂、六道轮盘、彼岸花。三幕未见现代物件或违约道具。 |
| B7 | 2.0 | 2.5 | 5 | 三幕共用同一低多边形语汇与同一青绿基调（visual.json 近黑 medicine 30.3% / palace 26.9%，色相均为绿）；四殿要求暖棕、五殿要求近黑、六殿要求乳白雾+彼岸红。实际 act4 与 act5 的画面观感几乎同色同光，只有 act6 因雾和花拉开差异。 |
| B8 | 3.0 | 3.75 | 5 | act5-palace.png：脚印 + 刻字 + 灯池把踩点与路线讲得很清楚；act6-reincarnation.png：桥面栏杆扶手 + 连续灯笼构成明确前进路径；act4-medicine.png 桌面交互物无明显辨识——crops/a4_table.png 黑色圆盘戥子与暗部混色、药材是俯视叶片，既无局部高亮也无 E 提示，玩家难以判断哪件能按 E（HUD 只给“E 交互”总说明）。 |
| B9 | 3.0 | 3.75 | 5 | 三幕 HUD 均可读：左上殿名+目标+路引/半印/证据行、右上罗盘与距离、右下“音·待启 (M)”，字号与描边克制，未遮挡主焦点。减分：act5-palace.png 中央“点击画面 · 锁定鼠标”提示框正压在下排中间石板上（crops/a5_board.png 底部），未锁鼠标时读不到该格的 1 号刻字。 |
| B10 | 2.0 | 2.5 | 5 | crops/a4_cabinet.png 百子柜 8×7 抽屉完全同款重复，无抽拉错位、无缺板；crops/a6_bridge.png 桥上 4 座小亭同款、12 个亡魂是同一锥形剪影（scene.ts:1583 addSoulSilhouette 同参数）；crops/a6_pavilion.png 彼岸花是无厚度红色叶片剪影，部分花头与细茎错位、看似悬空；crops/a4_right.png 蒸汽是双股硬折线而非体积雾；crops/a4_left.png 左墙素色纸片无内容、无贴墙阴影；crops/a6_bridge.png 桥面两处高光白斑。 |
| C1 | 4.0 | 4.0 | 5 | 逐项数 act4-medicine.png + crops（9 项）：百子柜✓（crops/a4_cabinet.png 抽屉分格+标签+铜环）；药案✓（台面/围板/腿/抽屉盒分层）；戥子✗（crops/a4_table.png 只见黑色圆盘，比例不合理，读不出戥子）；药材✓（crops/a4_table.png 绿叶/粉花/黄叶/红果 4 类可辨）；青瓷碗✓（crops/a4_right.png 台边木托上，碗沿与旧渍成立）；蒸汽/雾✓（crops/a4_right.png 青瓷罐上双股白汽 + scene.ts:972 门洞乳白雾幕，非全屏灰雾）；灯笼✓（crops/a4_left.png 白纸灯笼）；左门见雾✗（左墙是实墙，门洞在正中）；右柜台✓（crops/a4_right.png 横板柜台+陶罐+纸包）。达标 7/9。 |
| C2 | 5 | 5.0 | 5 | 逐项数 act5-palace.png + crops（8 项）：洛书✓（crops/a5_board.png 读到 4/9/2 · 3/5/7 · 8/1/6，且 flow-log 五殿踩板 1..9 全 PASS，与踩板逻辑一致）；石板材质✓（斑驳青石纹理+低光泽，非发光色块）；刻字✓（4/9/8/6 可辨）；脚印✓（每块石板一枚深色脚印）；布幡✓（两侧宽幅垂坠、下摆破口）；八盏灯✓（scene.ts:1332-1357 八个灯位，7 盏有焰 + 前中盏熄灭冒青烟）；氛围✓（灯池 + 近黑 26.9% + 黑位分层）。机位✗（相机俯角大、前景为空地，无案桌/石栏，属俯视全景而非低机位）。达标 7/8。 |
| C3 | 3.0 | 3.0 | 5 | 逐项数 act6-reincarnation.png + crops（8 项）：桥面✓（连续石板 + 两侧栏杆 + 灯笼）；孟婆亭✓（crops/a6_pavilion.png 层叠起翘檐 + 宝顶 + 陶鼎 + 六只青瓷碗）；六道轮盘✓（scene.ts:1596-1615，画面中约 7.8 m 轮盘带六辐）；彼岸花✓（两岸与桥头成排红色花丛）；亡魂队列✓（scene.ts:1583 十二个，桥面成列有密度）；河面布幡✓（布幡挂在岸侧与桥栏，未误置成水面深色竖块）。桥拱侧视✗（本帧只见桥面纵深，拱腹侧影被亭体与雾挡掉，看不出跨度与厚度）；光门✗（game/src 内无轮回门/光门物件，只剩雾中亮斑，无轮廓）。达标 6/8。 |
| D1 | 3 | 3.0 | 3 | flow-log.json：四殿取药 danggui / yuanzhi / hehuan / wangyou 四步均 ok=true 且带剧情文案（“当归·君，已入药碾”），四殿收证据 C ok=true，四殿收半印⑥ ok=true（不忘汤入手，北门已开），四殿出门 ok=true。 |
| D2 | 3 | 3.0 | 3 | flow-log.json：五殿踩板 1→9 九步连续 PASS（石板 n 下沉，还剩 9-n 步）；五殿误踩重置 ok=true（“错了。一盏幽灯灭了。重来。”）；重置后可继续 ok=true（“石板 1 下沉。还剩 8 步。”）；跨格不误触 ok=true（toast 不可见）。 |
| D3 | 3 | 3.0 | 3 | flow-log.json：六殿合符 ok=true（“六印合成。朱字浮出——那是你的笔迹。三条路已亮。”）；结局矩阵 return 已解锁、judge 已解锁、replace 未解锁并给出提示（“结局未解锁：不忘汤 + 证据 A / B / D”）；未齐印合符被挡 ok=true；选择结局 return/judge 分别 ok=true；重开不残留 ok=true（半印清零、结局面板隐藏）。 |
| D4 | 1 | 1.0 | 1 | flow-log.json：锁定鼠标 ok=true（pointerLockElement=true）；Esc 释放 ok=true（released=true, hint=true）；释放后重锁 ok=true；重开不残留 ok=true。三张交付帧 HUD 提示“点击画面 · 锁定鼠标，开始引路”与“音·待启 (M)”可读。 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat 存在（cd /d %~dp0 后调用 start-game.ps1，出错 pause）；game/README.md:7 写明 Windows 双击启动、不要直接开 index.html，README.md:9 写明缺 node_modules 时自动用系统 npm 安装、服务固定 http://127.0.0.1:5173。 |
| F2 | 3 | 3.0 | 3 | 评审/四五六殿/2026-11-16-998d014/ 内含 auto.json（build / tests / capture / assets / visual 五步命令与耗时）、capture.json、assets.json、visual.json、screens/act4-medicine.png 等三张 1440×900 交付帧、rubric.json、report.md；提交号 998d014 记录在 auto.json.meta.commit 与 rubic 内；run_auto.py 命令与参数可复现。 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A3 | 2.0/4 分 | assets.json：6 件 GLB 全部 errors=0 / warnings=0。但 scene.ts:1984 把 herbal-cabinet / nine-palace / stone-bridge 三件 wrapper.visible=false，画面实际走程序几何，这三件的落位无法在交付帧里验证。可见的：crops/a4_table.png 桌面左侧 dengzi-scale 呈黑色圆盘+横杆，读不出戥杆与秤盘，且直径≈桌面 1/6，比例失真；crops/a4_right.png celadon-bowl 落在台边木托上，碗沿与内外壁成立；crops/a6_wheel.png six-realm-wheel 在距桥 26 m 的雾里只剩白色轮廓线，材质与细节几乎不可辨。 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | A4 | 2.69/5 分 | {'score': 53.9, 'mode': 'stats', 'tech_score': 53.9, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P0 | B10 | 2.5/5 分 | crops/a4_cabinet.png 百子柜 8×7 抽屉完全同款重复，无抽拉错位、无缺板；crops/a6_bridge.png 桥上 4 座小亭同款、12 个亡魂是同一锥形剪影（scene.ts:1583 addSoulSilhouette 同参数）；crops/a6_pavilion.png 彼岸花是无厚度红色叶片剪影，部分花头与细茎错位、看似悬空；crops/a4_right.png 蒸汽是双股硬折线而非体积雾；crops/a4_left.png 左墙素色纸片无内容、无贴墙阴影；crops/a6_bridge.png 桥面两处高光白斑。 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P0 | B2 | 2.5/5 分 | visual.json 近黑比：medicine 30.3% / palace 26.9% / river 8.6%。crops/a4_left.png 白纸灯笼是唯一可辨光源，墙面没有受光衰减，向下直接并进纯黑；crops/a4_right.png 右柜台下半整块黑，看不出横板层次；crops/a5_lamps.png 灯焰为白球，灯池边缘硬切；crops/a6_bridge.png 桥面近景两处高光成纯白块，顶部雾把远景对比压成一片灰。 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P0 | B3 | 2.5/5 分 | crops/a4_cabinet.png 抽屉面为同一哑光绿灰，木纹/金属/纸/石区分不开；crops/a5_lamps.png 铜盏（scene.ts:1342 BRONZE）渲染成白釉小盏，没有金属高光与锈色；crops/a6_pavilion.png 亭顶为纯黑剪影，无瓦垄面材质；crops/a4_table.png 药材是零厚度叶片贴片，无纤维感。 | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P0 | B4 | 2.5/5 分 | visual.json：medicine mean_saturation 0.4693、主色相全绿，而 rubric.md 规定四殿为暖棕 + 药草绿、柜台暖光；act4-medicine.png 实际整幅被青绿环境光统一，暖棕只剩药案下方阴影。act5-palace.png 冷青黑 + 局部幽绿符合本场。act6-reincarnation.png 乳白雾 + 彼岸红符合本场，红色面积克制（近黑 8.6%）。 | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P0 | B5 | 2.5/5 分 | act4-medicine.png 药案宽约画面 1/5，殿宽 13.6 m（scene.ts:644 附近 room 参数），桌偏小；crops/a4_table.png 戥子圆盘直径≈桌面 1/6 远超实物。scene.ts:1599-1601 六道轮盘半径 2.0×1.95≈3.9 m，而桥宽 4.3 m（scene.ts:1442 createBridge width 4.3），轮盘直径几乎是桥宽两倍；crops/a6_bridge.png 桥上连续 4 座同尺寸小亭，把 20.4 m 的桥压成通道感。 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P0 | B7 | 2.5/5 分 | 三幕共用同一低多边形语汇与同一青绿基调（visual.json 近黑 medicine 30.3% / palace 26.9%，色相均为绿）；四殿要求暖棕、五殿要求近黑、六殿要求乳白雾+彼岸红。实际 act4 与 act5 的画面观感几乎同色同光，只有 act6 因雾和花拉开差异。 | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B1 | 3.75/5 分 | act4-medicine.png：中央药案为主焦点，两侧百子柜夹持，背部门洞带乳白雾幕形成纵深，主次清楚；act5-palace.png：九宫板居中、灯池环绕，焦点明确；act6-reincarnation.png：孟婆亭左前景 + 石桥向右上对角线 + 雾中轮盘，有三层纵深。减分：crops/a4_left.png 左上约 1/4 画面是空白素墙，act5 下 1/3 为无信息前景空地。 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B6 | 3.75/5 分 | 四殿：crops/a4_cabinet.png 百子柜（抽屉分格+标签+铜环）、戥子、crops/a4_right.png 青瓷碗与陶罐、四类药材、scene.ts:972 北门洞乳白雾幕；五殿：crops/a5_board.png 洛书刻字、脚印、两侧布幡、scene.ts:1332-1357 八盏铜灯、案台半印⑤；六殿：crops/a6_pavilion.png 孟婆亭+陶鼎+六只青瓷碗、scene.ts:1583 十二个亡魂、六道轮盘、彼岸花。三幕未见现代物件或违约道具。 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P1 | B8 | 3.75/5 分 | act5-palace.png：脚印 + 刻字 + 灯池把踩点与路线讲得很清楚；act6-reincarnation.png：桥面栏杆扶手 + 连续灯笼构成明确前进路径；act4-medicine.png 桌面交互物无明显辨识——crops/a4_table.png 黑色圆盘戥子与暗部混色、药材是俯视叶片，既无局部高亮也无 E 提示，玩家难以判断哪件能按 E（HUD 只给“E 交互”总说明）。 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P1 | B9 | 3.75/5 分 | 三幕 HUD 均可读：左上殿名+目标+路引/半印/证据行、右上罗盘与距离、右下“音·待启 (M)”，字号与描边克制，未遮挡主焦点。减分：act5-palace.png 中央“点击画面 · 锁定鼠标”提示框正压在下排中间石板上（crops/a5_board.png 底部），未锁鼠标时读不到该格的 1 号刻字。 | game/src/main.ts, game/index.html（HUD 可读性与反馈） |
| P1 | C3 | 3.0/5 分 | 逐项数 act6-reincarnation.png + crops（8 项）：桥面✓（连续石板 + 两侧栏杆 + 灯笼）；孟婆亭✓（crops/a6_pavilion.png 层叠起翘檐 + 宝顶 + 陶鼎 + 六只青瓷碗）；六道轮盘✓（scene.ts:1596-1615，画面中约 7.8 m 轮盘带六辐）；彼岸花✓（两岸与桥头成排红色花丛）；亡魂队列✓（scene.ts:1583 十二个，桥面成列有密度）；河面布幡✓（布幡挂在岸侧与桥栏，未误置成水面深色竖块）。桥拱侧视✗（本帧只见桥面纵深，拱腹侧影被亭体与雾挡掉，看不出跨度与厚度）；光门✗（game/src 内无轮回门/光门物件，只剩雾中亮斑，无轮廓）。达标 6/8。 | game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂） |
| P2 | C1 | 4.0/5 分 | 逐项数 act4-medicine.png + crops（9 项）：百子柜✓（crops/a4_cabinet.png 抽屉分格+标签+铜环）；药案✓（台面/围板/腿/抽屉盒分层）；戥子✗（crops/a4_table.png 只见黑色圆盘，比例不合理，读不出戥子）；药材✓（crops/a4_table.png 绿叶/粉花/黄叶/红果 4 类可辨）；青瓷碗✓（crops/a4_right.png 台边木托上，碗沿与旧渍成立）；蒸汽/雾✓（crops/a4_right.png 青瓷罐上双股白汽 + scene.ts:972 门洞乳白雾幕，非全屏灰雾）；灯笼✓（crops/a4_left.png 白纸灯笼）；左门见雾✗（左墙是实墙，门洞在正中）；右柜台✓（crops/a4_right.png 横板柜台+陶罐+纸包）。达标 7/9。 | game/src/scene.ts（四殿药局道具与灯位） |

## 集成风险（不计分，仅提示）

- 序厅与前三殿由队友负责，本报告**不评、不扣分**。仅提示一句：本次流程脚本从四殿起走（`flow-log.json` 34 步不含前三殿），四殿入口 `archive→medicine` 的门洞切换（`scene.ts:1822/1849/1863`）依赖前三殿完成态，若前三殿后续改动 `completed` 判定，需回归一次四殿进入。

## 证据索引

- 交付帧：`screens/act4-medicine.png`、`act5-palace.png`、`act6-reincarnation.png`（1440×900）
- 局部 2× 放大（本次评审新增，供复核）：`crops/a4_table.png`、`a4_cabinet.png`、`a4_right.png`、`a4_left.png`、`a5_board.png`、`a5_lamps.png`、`a6_pavilion.png`、`a6_wheel.png`、`a6_bridge.png`
- 机器数据：`auto.json`（五步采集）、`capture.json`（FPS/draws/加载/错误）、`assets.json`（glTF Validator）、`visual.json`（技术画质）
- 流程证据：`game/artifacts/flow/flow-log.json`（34 步，`ok:true`）
- 代码证据：`game/src/scene.ts`（1932-1990 GLB 接入与可见性、1332-1357 八盏灯、1583-1589 亡魂、1596-1615 轮盘、972 门洞雾）

## 规则

- 通过线 80 分；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
