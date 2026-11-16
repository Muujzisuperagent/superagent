# 还魂路引 · 四五六殿验收报告

- 版本：`f33b1dd`
- 时间：2026-11-16T20:07:33
- 范围：acts 4-6 only; acts 1-3 excluded by product decision
- 结论：**打回重改**（73.0/100，通过线 95）

## 维度得分

| 维度 | 得分 | 满分 | 百分比 |
|---|---:|---:|---:|
| A 资产与自动画质 | 10.98 | 15 | 73.2% |
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
| G3 主流程可达 | PASS | game/artifacts/flow/flow-log.json：ranAt=2026-11-16T11:57:24.664Z（本地 19:57:24，晚于 HEAD f33b1dd 提交 19:52:18）；34/34 步 ok=true，failed=[]，pageErrors=[]；链路含四殿取药 danggui/yuanzhi/hehuan/wangyou→证据 C→半印④→出门、五殿误踩重置+跨格不误触+踩板 1→9→证据 D→半印⑤、六殿合符→结局解锁 [return,judge]→选择 return/judge→重开不残留→未齐印合符被拒；过程截图 game/artifacts/flow/01-medicine-solved.png、02-palace-solved.png、03-combined.png、04-ending-return.png、04-ending-judge.png（mtime 19:57）。命令：GAME_URL=http://127.0.0.1:5173 node.exe tests/flow-check.mjs，输出 {"ok":true,"failed":[],"pageErrors":[]} |
| G4 资产合规与不阻塞 | PASS | gltfErrors=0, glbFailures=0 |
| G5 性能底线 | PASS | minFps=58.9, maxDrawsPerFrame=248 |

## 自动指标

指标模式：`stats`；自动分只进 A4，不替代美术判断。

| 幕 | FPS | 主Draws/帧 | 总Draws/帧 | 加载 ms | 技术分 | MUSIQ | CLIP-IQA+ | NIQE | 亮度 | 近黑% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| medicine | 58.89815150418806 | 248 | 296 | 611 | 83.27 | None | None | None | 0.1253 | 19.82 |
| palace | 59.04528319028205 | 167 | 215 | 649 | 46.56 | None | None | None | 0.0851 | 28.76 |
| river | 59.779901272546944 | 88 | 136 | 608 | 48.95 | None | None | None | 0.1324 | 8.62 |

## 人工评分

| ID | 原始分 | 折算分 | 满分 | 证据 |
|---|---:|---:|---:|---|
| A3 | 2.0 | 2.0 | 4 | scene.ts:2253-2286 GLB 主资产落位；assets-v2.json 4 件 v2 0 error 0 warning；nav-act4-bench.png 戥子杆/盘/砣贴桌面、柜体接地；但 nav-act5-center.png 整帧为拉伸大理石纹（nine-palace layFlat 后 in-plane 缩放）、crops/act6_flowers_right.png 花瓣簇茎悬空、flow/03-combined.png 桥顶视熔融塑料感+合符台无贴图绿盒 |
| B1 | 3.0 | 3.75 | 5 | screens/act4-medicine.png 主焦点药案+戥子居中、前中后景（案/柜/门）成立；act5-palace.png 低机位九宫入画、匾额为主焦点；act6-reincarnation.png 亭左桥右对角线；缺陷 crops/act4_ceiling_seam.png 天花亮竖缝 x≈718 与 crops/act4_yaoqian.png 灯笼遮药签字 |
| B2 | 2.0 | 2.5 | 5 | act4 暖棕主光+柜面冷光、nav-act4-exit.png 门内雾光有来源；act5 八盏铜盏幽绿、中央 1/3 暗 27.7%（RGB<15 实测）黑位有层次；但 nav-act6-mid.png 光门外矩形雾块硬边、nav-act6-side.png 左侧约 28% 画面死黑遮桥拱 |
| B3 | 2.0 | 2.5 | 5 | crops/act4_cabinet_left.png 老榆木磨损+铜环拉手、crops/act4_dengzi.png 青铜杆盘砣、crops/act4_yaoqian.png 宣纸药签可区分；但 crops/act5_slab_texture.png 石板呈蓝灰大理石纹塑料感、flow/03-combined.png 合符台为无贴图橄榄绿盒、桥顶视熔融块 |
| B4 | 2.0 | 2.5 | 5 | act4 暖像素(R>B+8) 62.3% vs 冷 0.1%（中央带实测）符合暖棕药草绿；act5 冷青黑+幽绿+彼岸红点缀、near_black 28.76%∈[25,35]、luma 0.0851∈[0.08,0.11]；但 act6 冷像素 54.6%，雾为青灰而非来源要求的乳白（rubric.md §10 六殿乳白雾） |
| B5 | 3.0 | 3.75 | 5 | scene.ts:2254 柜 size 4.0×4.35×0.76 与nav-act4-entry.png 人体尺度参照可信；nav-act6-side.png 桥拱跨度与厚度可读；act5 九宫 6.05m 见方与玩家 1.65m 眼高比例成立；nav-act6-end.png 孟婆汤锅与碗比例可信 |
| B6 | 3.0 | 3.75 | 5 | crops/act4_yaoqian.png 当归/黄芪/陈皮/桂枝等药签、crops/act4_dengzi.png 戥子君臣佐使、flow/01-medicine-solved.png 孟婆对白「别人求忘，你求记。稀奇。」、flow/03-combined.png 崔珏结案对白；半印/路引/证据链齐全，无违约物件 |
| B7 | 3.0 | 3.75 | 5 | 三幕共用青铜/老榆木/青石/宣纸语汇（act4 柜与戥子、act5 铜盏与石板的铜件、act6 亭柱铜箍与桥石）；HUD 三幕同版式同色；四殿暖棕与五六殿冷青为分幕设计意图（rubric.md §10） |
| B8 | 2.0 | 2.5 | 5 | nav 十张本轮干净重拍（mtime 19:56，visual-check errors=[]）；nav-act4-bench.png 右下 nearby-list「取药·当归（君）·2.2m」等 3 条、flow/03-combined.png 合符台暖金 BoxHelper 线框可指认；但 main.ts:46 palaceCenter target 与 position 同 x/z 只低 1.5m → nav-act5-center.png 贴脸石板看不出路线；main.ts:50 riverMid 朝 +z 回看；nav-act6-side.png 左 28% 死黑；nav-act5-exit.png 问案台牌遮匾额 |
| B9 | 3.0 | 3.75 | 5 | 操作前 screens/act4-medicine.png HUD「半印 0/6 不忘汤·未配 证据 A」vs 操作后 flow/01-medicine-solved.png「半印 1/6 不忘汤·已收 证据 A/C」+toast「半印④落下。不忘汤入手。北门已开。」+nearby 3 条+prompt「E·收取半印④」；flow/03-combined.png「半印 3/6 证据 A/C/D」+toast「六印合成…」；style.css:337-344 lock-hint bottom 9% 不压九宫刻字 |
| B10 | 1.0 | 1.25 | 5 | crops/act4_ceiling_seam.png 天花上沿亮竖缝 x≈718 仍在；crops/act4_cabinet_left.png 与 _right.png 双柜 7×7 同款抽屉、抽屉面药签空白；crops/act5_slab_texture.png 贴图拉伸；crops/act6_flowers_right.png 浮瓣；nav-act6-mid.png 矩形雾边；nav-act6-side.png 死黑块；flow/03-combined.png 合符台绿盒；nav-act5-center.png 贴脸 |
| C1 | 4.0 | 4.0 | 5 | 8/9 达标：百子柜主立面 7×7 分格+铜环（act4 中央）、药案台面+腿层次（nav-act4-bench）、戥子杆盘砣贴桌（crops/act4_dengzi）、药材≥3 类绿/粉/黄堆+纸包（同 crop）、蒸汽局部碗上（act4 右碗白烟）、灯笼左壁暖光+柜冷光（nav-act4-entry）、左门雾+纵深（nav-act4-bench/exit）、右柜台木台+罐（act4 右）；缺：青瓷碗旧药渍不可辨（nav-act4-bench 碗内仅浅绿残汤） |
| C2 | 5 | 5.0 | 5 | 8/8：洛书 8 1 6/3 5 7/4 9 2 刻字与 flow 踩板 1→9 一致（crops/act5_slab_texture 见 8/1/6）、石板非发光色块、刻字近看可辨、脚印暗椭圆磨痕（同 crop）、布幡宽大垂坠带破洞（act5 两侧）、八盏铜盏 7 亮 1 熄冒青烟（scene.ts:1588-1612 lampSpots 8 项、前景中盏熄）、低机位前景石栏入下角（nav-act5-entry）、冷青黑+幽绿黑位有层次（centerDark 27.7%） |
| C3 | 3.0 | 3.0 | 5 | 6/8：桥拱侧视跨度厚度（nav-act6-side）、孟婆亭瓦垄起翘（crops/act6_pavilion）、六道轮盘位置尺度可读（act6 中后）、光门有光区轮廓（nav-act6-mid）、彼岸花成片（act6 两岸）、亡魂队列戴帽黑袍有层次（nav-act6-bridge/side）；缺：桥面为 uphill 台阶而非连续石桥面（nav-act6-bridge 明显踏步）、河面布幡误置深色竖块（nav-act6-side 左黑块+水中竖幡） |
| D1 | 3 | 3.0 | 3 | flow-log 步骤 4-10：四味君臣佐使顺序取药、戥子平反馈「药末落进碗里，汤色由白转清」、证据 C、半印④、北门已开；flow/01-medicine-solved.png 孟婆剧情对白 |
| D2 | 3 | 3.0 | 3 | flow-log 步骤 11-24：误踩重置「错了。一盏幽冥灯灭了。重来。」、重置后可续行、跨格不误触 toast可见=false、踩板 1→9 每步「石板 N 下沉。还剩 X 步」、九板同亮 |
| D3 | 3 | 3.0 | 3 | flow-log 步骤 25-33：合符「六印合成。朱字浮出——那是你的笔迹。三条路已亮。」、结局矩阵 return/judge 已解锁、replace 未解锁带提示「结局未解锁：不忘汤 + 证据 A / B / D」、选择 return=还阳 / judge=留司；flow/04-ending-return.png、04-ending-judge.png |
| D4 | 1 | 1.0 | 1 | flow-log 步骤 1-3 锁定/Esc 释放/重新锁定 pointerLockElement=true、hint=true；步骤 31 重开不残留 半印清零=true 结局面板隐藏=true；步骤 34 收尾 半印 0/6 |
| F1 | 2 | 2.0 | 2 | game/启动密室.bat:4 调 start-game.ps1；ps1:26-40 缺 Node/缺依赖均有中文提示并 pause；本轮 npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort 启动成功（curl 200） |
| F2 | 3 | 3.0 | 3 | 本目录 auto.json/capture.json/assets.json/assets-v2.json/visual.json/screens 三张/crops/nav 重拍十张（game/artifacts/nav mtime 19:56）/flow-log+5 张过程图；commit f33b1dd 写入 auto.json.meta；命令 run_auto.py、visual-check.mjs、flow-check.mjs、score.py 均可复现 |

## 截图

- medicine: [act4-medicine.png](screens/act4-medicine.png)
- palace: [act5-palace.png](screens/act5-palace.png)
- river: [act6-reincarnation.png](screens/act6-reincarnation.png)

## 返工清单

| 优先级 | ID | 问题 | 证据 | 修复入口 |
|---|---|---|---|---|
| P0 | A3 | 2.0/4 分 | scene.ts:2253-2286 GLB 主资产落位；assets-v2.json 4 件 v2 0 error 0 warning；nav-act4-bench.png 戥子杆/盘/砣贴桌面、柜体接地；但 nav-act5-center.png 整帧为拉伸大理石纹（nine-palace layFlat 后 in-plane 缩放）、crops/act6_flowers_right.png 花瓣簇茎悬空、flow/03-combined.png 桥顶视熔融塑料感+合符台无贴图绿盒 | game/src/scene.ts（GLB 尺度/朝向/材质/落位） |
| P0 | A4 | 2.98/5 分 | {'score': 59.59, 'mode': 'stats', 'tech_score': 59.59, 'state': 'scored'} | game/src/scene.ts（灯光、材质、雾、清晰度） |
| P0 | B10 | 1.25/5 分 | crops/act4_ceiling_seam.png 天花上沿亮竖缝 x≈718 仍在；crops/act4_cabinet_left.png 与 _right.png 双柜 7×7 同款抽屉、抽屉面药签空白；crops/act5_slab_texture.png 贴图拉伸；crops/act6_flowers_right.png 浮瓣；nav-act6-mid.png 矩形雾边；nav-act6-side.png 死黑块；flow/03-combined.png 合符台绿盒；nav-act5-center.png 贴脸 | game/src/scene.ts（穿模、悬浮、接缝、阴影错误） |
| P0 | B2 | 2.5/5 分 | act4 暖棕主光+柜面冷光、nav-act4-exit.png 门内雾光有来源；act5 八盏铜盏幽绿、中央 1/3 暗 27.7%（RGB<15 实测）黑位有层次；但 nav-act6-mid.png 光门外矩形雾块硬边、nav-act6-side.png 左侧约 28% 画面死黑遮桥拱 | game/src/scene.ts（主辅光、暗部信息、雾/辉光） |
| P0 | B3 | 2.5/5 分 | crops/act4_cabinet_left.png 老榆木磨损+铜环拉手、crops/act4_dengzi.png 青铜杆盘砣、crops/act4_yaoqian.png 宣纸药签可区分；但 crops/act5_slab_texture.png 石板呈蓝灰大理石纹塑料感、flow/03-combined.png 合符台为无贴图橄榄绿盒、桥顶视熔融块 | game/src/scene.ts（石/木/纸/金属的粗糙度与磨损） |
| P0 | B4 | 2.5/5 分 | act4 暖像素(R>B+8) 62.3% vs 冷 0.1%（中央带实测）符合暖棕药草绿；act5 冷青黑+幽绿+彼岸红点缀、near_black 28.76%∈[25,35]、luma 0.0851∈[0.08,0.11]；但 act6 冷像素 54.6%，雾为青灰而非来源要求的乳白（rubric.md §10 六殿乳白雾） | game/src/scene.ts（冷暖配比、朱砂点缀、情绪色） |
| P0 | B8 | 2.5/5 分 | nav 十张本轮干净重拍（mtime 19:56，visual-check errors=[]）；nav-act4-bench.png 右下 nearby-list「取药·当归（君）·2.2m」等 3 条、flow/03-combined.png 合符台暖金 BoxHelper 线框可指认；但 main.ts:46 palaceCenter target 与 position 同 x/z 只低 1.5m → nav-act5-center.png 贴脸石板看不出路线；main.ts:50 riverMid 朝 +z 回看；nav-act6-side.png 左 28% 死黑；nav-act5-exit.png 问案台牌遮匾额 | game/src/scene.ts, game/src/main.ts（路线、出口、交互物辨识） |
| P1 | B1 | 3.75/5 分 | screens/act4-medicine.png 主焦点药案+戥子居中、前中后景（案/柜/门）成立；act5-palace.png 低机位九宫入画、匾额为主焦点；act6-reincarnation.png 亭左桥右对角线；缺陷 crops/act4_ceiling_seam.png 天花亮竖缝 x≈718 与 crops/act4_yaoqian.png 灯笼遮药签字 | game/src/scene.ts（构图：主目标、前中后景、留白） |
| P1 | B5 | 3.75/5 分 | scene.ts:2254 柜 size 4.0×4.35×0.76 与nav-act4-entry.png 人体尺度参照可信；nav-act6-side.png 桥拱跨度与厚度可读；act5 九宫 6.05m 见方与玩家 1.65m 眼高比例成立；nav-act6-end.png 孟婆汤锅与碗比例可信 | game/src/scene.ts（建筑/家具/道具比例与遮挡） |
| P1 | B6 | 3.75/5 分 | crops/act4_yaoqian.png 当归/黄芪/陈皮/桂枝等药签、crops/act4_dengzi.png 戥子君臣佐使、flow/01-medicine-solved.png 孟婆对白「别人求忘，你求记。稀奇。」、flow/03-combined.png 崔珏结案对白；半印/路引/证据链齐全，无违约物件 | game/src/scene.ts（剧情道具、建筑语汇、生活痕迹） |
| P1 | B7 | 3.75/5 分 | 三幕共用青铜/老榆木/青石/宣纸语汇（act4 柜与戥子、act5 铜盏与石板的铜件、act6 亭柱铜箍与桥石）；HUD 三幕同版式同色；四殿暖棕与五六殿冷青为分幕设计意图（rubric.md §10） | game/src/scene.ts（四五六殿材质与细节密度一致性） |
| P1 | B9 | 3.75/5 分 | 操作前 screens/act4-medicine.png HUD「半印 0/6 不忘汤·未配 证据 A」vs 操作后 flow/01-medicine-solved.png「半印 1/6 不忘汤·已收 证据 A/C」+toast「半印④落下。不忘汤入手。北门已开。」+nearby 3 条+prompt「E·收取半印④」；flow/03-combined.png「半印 3/6 证据 A/C/D」+toast「六印合成…」；style.css:337-344 lock-hint bottom 9% 不压九宫刻字 | game/src/main.ts, game/index.html（HUD 可读性与反馈） |
| P1 | C3 | 3.0/5 分 | 6/8：桥拱侧视跨度厚度（nav-act6-side）、孟婆亭瓦垄起翘（crops/act6_pavilion）、六道轮盘位置尺度可读（act6 中后）、光门有光区轮廓（nav-act6-mid）、彼岸花成片（act6 两岸）、亡魂队列戴帽黑袍有层次（nav-act6-bridge/side）；缺：桥面为 uphill 台阶而非连续石桥面（nav-act6-bridge 明显踏步）、河面布幡误置深色竖块（nav-act6-side 左黑块+水中竖幡） | game/src/scene.ts（六殿桥拱、亭顶、彼岸花、亡魂） |
| P2 | C1 | 4.0/5 分 | 8/9 达标：百子柜主立面 7×7 分格+铜环（act4 中央）、药案台面+腿层次（nav-act4-bench）、戥子杆盘砣贴桌（crops/act4_dengzi）、药材≥3 类绿/粉/黄堆+纸包（同 crop）、蒸汽局部碗上（act4 右碗白烟）、灯笼左壁暖光+柜冷光（nav-act4-entry）、左门雾+纵深（nav-act4-bench/exit）、右柜台木台+罐（act4 右）；缺：青瓷碗旧药渍不可辨（nav-act4-bench 碗内仅浅绿残汤） | game/src/scene.ts（四殿药局道具与灯位） |

## 规则

- 通过线 95 分（口径 v2.1）；任一硬门槛失败直接打回。
- 只评四五六殿；前三殿由队友负责，不计分。
- 每项分数必须有证据；无证据的分数按无效处理。
