# 返工清单 · f41831c（71.9/100，打回重改）

结论：**打回重改**。71.9 < 95；G0–G5 全 PASS，但 B 维度 52.5%（<60% 触发 P0）、8 个单项 <60%。
与上轮 73.0 差 **-1.1**：C 维度 12→15（+3，清单全达）、B9 3.75→5（+1.25），但桥 GLB 破碎回归把 B10 打到 0、B3 打到 1.25、A3 打到 1.0，净回落。
owner：甲 = 匠人 · 场景实现（game/src/scene.ts）；乙 = 匠人乙 · 交互流程（main.ts/style.css）。
复验口径：新 HEAD 全量重跑 run_auto + visual-check + flow-check + score，不补评单项。

## 裁量记录（甲的 trade-off，不放宽）
- 五殿 mean_luma 实测 0.1147，超 band [0.08,0.11] 0.0047；near_black 32.23% ∈[25,35] ✓。
- palace tech 58.1 <60；三幕 b1 72.11 <75 → **A4 = 3.61/5（<3.75）如实记**，不因口头「帕累托」放宽。
- 灰天花是 luma 出 band 的直接原因（crops/act5_ceiling.png RGB 69/77/71），修 P0-3 后应自然回 band。

## P0

### P0-1 · B10+B3+A3 · 桥 GLB 栏板/桥面破碎（本轮新回归，最重）
- 位置：nav-act6-bridge.png 栏板白色半透明竖刺+穿孔；nav-act6-mid.png 桥面黑色三角黑洞碎片；nav-act6-side.png 栏板锯齿白块；flow/03-combined.png 桥顶视白底+黑碎片；crops/act6_bridge_rail.png。
- 动作（甲）：回查 f41831c 对 stone-bridge-v2 的材质/UV/法线改动（scene.ts:2266-2270 与材质覆盖段）；恢复石质不透明材质、修双面/法线或 UV 溢出；必要时回退该件到 af8b6cd 版本再单独修雾。
- 复验条件：nav-act6-bridge/mid/side 与 flow/03 四帧无白刺、无黑洞碎片，栏板为连续石栏、桥面为连续石面。

### P0-2 · B10+A3+B8 · 合符台埋入桥面（穿模）
- 位置：crops/act6_combine_top.png 木盒只露一条边；scene.ts:2172 combine y=1.25 低于桥面顶。
- 动作（甲）：实测桥面顶 y 后把合符台抬到其上（或桥面局部开凹槽），保留 woodTexture 材质与暖金 BoxHelper。
- 复验条件：flow/03 与新增合符机位 nav 帧可见完整木台+金线框，prompt「E·将六枚半印合于路引」指向可见台体。

### P0-3 · B10+B1+B2 · 五殿灰平板天花（本轮新回归）
- 位置：screens/act5-palace.png 上缘约 26% 为无纹理灰绿平板；crops/act5_ceiling.png RGB(69,77,71)；直接导致 mean_luma 0.1147 出 band。
- 动作（甲）：天花改深色木梁/瓦底或降低其受光；不得用无纹理灰板补顶。
- 复验条件：act5 交付帧上缘区域 mean luma ≤0.06，全帧 mean_luma 回 [0.08,0.11]，nb 仍 ∈[25,35]。

### P0-4 · B10+B4+B7 · 五殿匾额两侧纯红窄幡（本轮新回归）
- 位置：crops/act5_red_banners.png 两条硬边纯红竖矩形，无垂坠无破旧；挪用六殿彼岸红语汇。
- 动作（甲）：撤掉或改为宽幅青黑破幡（与侧墙绿幡同族）。
- 复验条件：匾额两侧 crop 无纯红窄条；五殿暖/红像素占比回到点缀级。

### P0-5 · B10 · 四柜「开抽屉」为贴面黑/棕方块
- 位置：crops/act4_cabinet_left.png 黑方块 (490-585,300-400)、棕盒无侧板；crops/act4_cabinet_right.png 同类。
- 动作（甲）：开抽屉改真实抽屉体（侧板+内腔+滑出位移）或撤掉黑块只留签面差异。
- 复验条件：两柜 crop 无贴面纯黑方块；开合状态有体积与接触阴影。

### P0-6 · B2 · 六殿雾无层次+硬边梯形雾片+河面纯黑
- 位置：crops/05-ending-panel.png 左右硬边灰梯形雾片；nav-act6-side/bridge 下约 35% 河面纯黑无信息；screens/act6 天空为均匀灰无远近层次。
- 动作（甲）：雾改多层深度衰减（软边 billboard 或深度雾），河面加微光/倒影/流纹。
- 复验条件：05 与 act6 无硬边梯形；side 下 1/3 RGB<15 占比 <20% 且可见水面细节。

### P0-7 · B3 · 五殿石板 painted 绿面失湿石质感
- 位置：screens/act5-palace.png 与 nav-act5-center.png 石板为均匀绿面+白字，无石纹/湿反光（上轮大理石拉伸修掉后矫枉过正）。
- 动作（甲）：补湿青石纹理与粗糙度变化（边缘磨损、水膜高光），保留刻字/脚印层。
- 复验条件：crop 石板可见石纹颗粒与局部湿反光，非纯色 painted 面。

## P1

### P1-1 · A4 · 技术分 72.11<75、palace tech 58.1<60
- 位置：visual.json palace tech 58.1、river 77.03、medicine 81.19。
- 动作（甲）：随 P0-3/6/7 修复后重测；不为分数加噪点。
- 复验条件：b1 ≥75 且三幕 tech 均 ≥60；palace luma 回 band。

### P1-2 · B5+B6 · 亡魂衣纹与簿纸页
- 位置：nav-act6-mid.png 亡魂仍黑锥剪影；nav-act5-exit.png 簿为绿立方。
- 动作（甲）：亡魂加衣冠层次剪影，簿加纸页/封面贴图。
- 复验条件：nav 重拍可辨衣冠与纸页。

## P2

### P2-1 · B10 · 四殿纸包盒悬浮感
- 位置：crops/act4_bowl.png 碗旁米色纸包盒底与 shelf 之间有间隙。
- 动作（甲）：纸包落位到 shelf 面或加支撑。
- 复验条件：crop 盒底与 shelf 接触无间隙。
