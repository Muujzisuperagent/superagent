# 返工清单 · c923b0a（84.0/100，打回重改）

结论：**打回重改**（v2.1 通过线 95）。84.0 ≥80 但 <95；G0–G5 全 PASS；无维度 <60%，但 A3、B10 单项 50% 触发 P0。
与上轮 71.9 差 **+12.1**：B 26.25→37.5（+11.25）、A 10.61→11.45（+0.84）；C/D/E/F 维持满分。
owner：甲 = 匠人 · 场景实现（game/src/scene.ts）；乙 = 匠人乙 · 交互流程（main.ts/style.css）。
复验口径：新 HEAD 全量重跑 run_auto + visual-check + flow-check + measure-share + score，idle 采样后采 G5，不补评单项。

## 裁量记录（不口头放宽）
- b1 实测 **69.05**（甲报 69.9，运行方差内）；palace tech 实测 **50.98**（甲报 53.7）；river 75.28、medicine 80.89。
- palace luma **0.0832** ∈[0.08,0.11] ✓、nb **31.36%** ∈[25,35] ✓ 双达标。
- **A4 = 3.45/5 如实记**（5×69.05/100）。stats 回退模式下 b1 要到 95 才拿 4.75，天花板低；可选路径=按 SKILL.md 建 3.12 venv 装 pyiqa 换 MUSIQ/CLIP-IQA+ 口径（属增强不改评分结构），或把分数缺口在 A3/B 项补满。不因此放宽本轮。
- G5 以 idle 全量为准：minFps **54.47**（medicine）、maxMainDraws **246**；idle-check.ps1 3s 采样无活跃 node/msedge CPU；5174 旧 preview 为 idle 服务未动。

## P0

### P0-1 · B10+A3 · 05 机位左右硬边梯形雾片（上轮遗留未修）
- 位置：crops/05-ending-panel.png 左 x∈[40,350]、右 x∈[1090,1400] 两块硬边灰梯形雾 billboard；nav-act6-end 同族。
- 动作（甲）：雾片改软边 alpha 衰减（径向 gradient texture 或深度雾），或撤掉这两片改用全局雾分层。
- 复验条件：05-ending-panel 与 nav-act6-end 重拍无硬边梯形；雾边界像素梯度连续（无单像素级跳变边）。

### P0-2 · B10+A3 · 四殿纸包盒穿 shelf 面
- 位置：crops/act4_bowl.png 米色纸包盒底 y≈360 低于 shelf 面 y≈250，盒体穿过托板。
- 动作（甲）：纸包落位到 shelf 顶面（实测托板 y 后设底面贴合），或改放柜台面。
- 复验条件：crop 盒底与托板接触无穿插、无悬空间隙，有接触阴影。

## P1

### P1-1 · A4 · 技术分 69.05<75、palace tech 50.98<60
- 位置：visual.json palace entropy 3.54 / sharpness 0.005323 / contrast 偏低。
- 动作（甲）：五殿在保持 nb∈[25,35]、luma∈band 前提下加局部光层次（盏光衰减梯度、石板水膜高光变化、幡面破洞透光），提升熵与清晰度；不为分数加噪点。
- 复验条件：b1 ≥75 且 palace tech ≥60，nb/luma 仍双达标；或按 SKILL.md 装 pyiqa 换口径后重测并留档。

### P1-2 · B3 · 灯焰白绿扁盘
- 位置：screens/act5-palace.png 八盏灯焰读作白绿扁椭圆盘（crops/act5_lamps 区）。
- 动作（甲）：火苗 cone 加高度/摇曳动画或双层焰（内白外青绿），减小光晕盘半径。
- 复验条件：crop 灯焰可辨竖直火苗形态而非扁盘，青绿为主色。

### P1-3 · B2+B4 · 六殿天空平灰无层次
- 位置：screens/act6-reincarnation.png 天空 RGB(145,148,140) 近乎均匀，luma 0.3407 偏亮。
- 动作（甲）：天空加远近雾浓度梯度/低云纹或微暖白顶光，压一点整体曝光保留乳白。
- 复验条件：act6 天空垂直方向 luma 梯度可测（顶/ horizon 差 ≥0.05），仍为乳白族。

### P1-4 · B8 · nav-act6-mid 右前景亡魂遮缘
- 位置：nav-act6-mid.png 右缘约 12% 被近机位亡魂黑锥占据。
- 动作（甲）：该亡魂实例沿桥侧移 0.6–1m 或降剪影高度，避免贴脸机位遮缘。
- 复验条件：nav-act6-mid 右缘 10% 区域无亡魂主体遮挡。

### P1-5 · B1/B5/B6/B7 · 接触阴影与细节密度补强（3→4 档缺口）
- 位置：crops/act4_yaoqian 区药签架与墙接触阴影不可辨；nav-act6-end 锅/碗与亭台接触阴影弱；六殿亡魂衣纹仍偏剪影。
- 动作（甲）：补 baked 接触阴影贴片或 AO 贴图；亡魂加衣褶法线/布片层次。
- 复验条件：crop 药签架/锅碗底部可见接触暗环；nav 亡魂近看有衣褶层次。

## P2

### P2-1 · C3 观感 · 引桥踏步与连续桥面过渡
- 位置：screens/act6-reincarnation.png 近端引桥为踏步级，与中段连续桥面衔接生硬。
- 动作（甲）：引桥改缓坡或加过渡石级收边。
- 复验条件：nav-act6-bridge 引桥与桥面过渡无生硬断阶。
