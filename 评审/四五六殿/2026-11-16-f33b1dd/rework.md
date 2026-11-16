# 返工清单 · f33b1dd（73.0/100，打回重改）

结论：**打回重改**。总分 73.0 < 95；硬门槛 G0–G5 全 PASS，但 B 维度 60.0%、A 维度 73.2%，且 7 个单项 <60% 触发 P0。
owner：甲 = 匠人 · 场景实现（game/src/scene.ts）；乙 = 匠人乙 · 交互流程（game/src/main.ts、style.css）。
复验统一口径：修完在新一 HEAD 上全量重跑 `run_auto.py` + `visual-check.mjs` + `flow-check.mjs` + `score.py`，不补评单项。

## P0

### P0-1 · B10 · 天花上沿亮竖缝 x≈718（上轮遗留未修）
- 位置：screens/act4-medicine.png 顶部 x∈[700,740]、y∈[0,160]；crops/act4_ceiling_seam.png 整条亮竖带。
- 动作（甲）：scene.ts 四殿天花/梁构件里去掉该自发光竖条或把其亮度压到与梁同色；若是灯带漏光则补遮挡。
- 复验条件：act4 交付帧该区域无 luma>0.6 的连续竖条（像素实测），nav-act4-entry 同区域一致。

### P0-2 · B10 · 双柜 7×7 同款、抽屉面药签空白（上轮遗留未修）
- 位置：crops/act4_cabinet_left.png 与 crops/act4_cabinet_right.png，两柜均 7 列×7 行同拉手同纹理，抽屉面无字。
- 动作（甲）：第二柜换抽屉分格变体（列数/错位/开合状态）或镜像+换签面；抽屉面补药签贴图（复用左墙药签字族）。
- 复验条件：两柜放大 crop 可指出≥3 处结构或签面差异；不再出现整面空白抽屉。

### P0-3 · B10+A3 · 九宫石板贴图拉伸、塑料感
- 位置：crops/act5_slab_texture.png 蓝灰大理石纹横拉；nav-act5-center.png 整帧单块拉伸纹理。
- 动作（甲）：scene.ts:2261-2265 nine-palace-v2 layFlat 后按 6.05m 见方重设 UV/tiling（禁止 in-plane 40× 单轴缩放），或换湿青石贴图；保留刻字/脚印层。
- 复验条件：nav-act5-center 与交付帧石板纹理颗粒尺度与柜木/桥石一致，无方向性拉伸条纹。

### P0-4 · B8 · 五殿中心机位贴脸、六殿 mid 机位朝后
- 位置：main.ts:46 `palaceCenter position [0,1.65,-27.75] target [0,0.15,-27.75]`（垂直俯视贴脸）；main.ts:50 `riverMid target [-0.4,2.2,-38]` 朝 +z 回看。
- 动作（乙）：palaceCenter 改站在阵缘低机位斜视全阵（target 指向阵心远端）；riverMid 改朝桥终点/光门（-z 方向）。
- 复验条件：重拍 nav-act5-center 一帧内≥5 块石板+出口牌可见；nav-act6-mid 看到桥面延伸与光门，而非回看入口。

### P0-5 · B2+B10 · 六殿矩形雾边与 side 死黑
- 位置：nav-act6-mid.png 光门外 x∈[480,950] 硬边矩形雾块；nav-act6-side.png 左侧约 28% 画面纯黑竖块遮桥拱。
- 动作（甲）：雾改分层软边（多片衰减或深度雾），删除/贴水误置的深色竖幡（side 左黑块）。
- 复验条件：nav-act6-mid/side 无硬边矩形雾；side 左 1/3 区域 RGB<15 占比 <20% 且桥拱完整可见。

### P0-6 · B3+A3 · 合符台无贴图绿盒、桥顶视熔融塑料
- 位置：flow/03-combined.png 中央橄榄绿扁盒（合符台）与四周熔融青块（桥顶视）。
- 动作（甲）：合符台换木/石材质并加磨损与印泥痕迹；stone-bridge-v2 顶视材质 roughness/法线修正，消除熔融高光。
- 复验条件：flow/03-combined 合符台可辨材质纹理与厚度；桥顶视无大面积镜面熔融块。

### P0-7 · B4 · 六殿雾青灰而非乳白
- 位置：screens/act6-reincarnation.png 全幕冷像素 54.6%（实测 R<B+8），雾色青灰；rubric.md §10 要求乳白雾。
- 动作（甲）：六殿 fog/雾片颜色改乳白（暖白低饱和）并保留彼岸红对比；分层浓度做出远近层次。
- 复验条件：act6 雾区采样 R≈G≈B 且偏暖白，冷像素占比明显下降；花红仍为唯一高饱和强调色。

### P0-8 · B10+A3 · 彼岸花浮瓣
- 位置：crops/act6_flowers_right.png 花瓣簇茎底悬空于岸面之上；crops/act6_flowers_left.png 水面之上散瓣。
- 动作（甲）：scene.ts:2271-2284 spider-lily clones 的 y 与岸面高度对齐（岸面 y 实测后落位），删除水面散瓣或改贴水。
- 复验条件：右岸/左岸 crop 中每簇茎底与岸面接触，无悬空花瓣。

### P0-9 · A4 · 自动技术分 59.59（<60%）
- 位置：visual.json palace tech 46.56、river 48.95（对比/熵/色彩偏低）。
- 动作（甲）：配合 P0-3/5/7 提升五殿黑位层次与六殿雾色对比后重测；不单独为分数加噪点。
- 复验条件：visual.json b1 ≥75 且三幕 tech 均 ≥60。

## P1

### P1-1 · C3 · 桥面为 uphill 台阶、河面布幡误置
- 位置：nav-act6-bridge.png 桥面明显踏步；nav-act6-side.png 水中深色竖幡。
- 动作（甲）：桥面改连续石板坡面（保留拱侧厚度）；河面布幡撤掉或贴水横置。
- 复验条件：C3 清单 8/8（桥面连续+布幡不竖块），nav-act6-bridge/side 重拍确认。

### P1-2 · B1 · 左墙药签被灯笼遮字
- 位置：crops/act4_yaoqian.png 灯笼压在「远志/合欢」等签格上。
- 动作（甲）：灯笼左移或药签架右移，使签面全字可读。
- 复验条件：crop 内 20 格药签无遮挡缺字。

### P1-3 · B5/B6/B7 · 细节密度与质感补齐
- 位置：六殿亡魂低模黑锥（nav-act6-bridge）、五殿簿为无贴图绿立方（nav-act5-exit）。
- 动作（甲）：亡魂加衣纹/层次剪影，簿加纸页/封面贴图。
- 复验条件：nav 重拍亡魂可辨衣冠层次、簿可辨纸页。

### P1-4 · B9 · 结局选择前后对照补一张
- 位置：flow/04-ending-return.png 与 04-ending-judge.png 已有，但缺「选择前」三路径面板帧。
- 动作（乙）：flow-check 增补选择前三路径面板截图。
- 复验条件：flow 目录含选择前面板帧，HUD 半印/证据状态与选择后对照完整。

## P2

### P2-1 · C1 · 青瓷碗旧药渍
- 位置：nav-act4-bench.png 碗内仅浅绿残汤，无旧渍。
- 动作（甲）：碗内壁加褐色药渍环贴图。
- 复验条件：crop 碗内可见渍环，C1 达 9/9。

### P2-2 · 证据缺口 · GLB 占比未定量
- 位置：本轮仅定性确认 GLB 主资产生效（failedRequests=[]、scene.ts:2253-2286 七类 17 实例）。
- 动作（甲）：补一次逐幕 renderer.info 三角面拆分采集，证明 GLB ≥50%。
- 复验条件：评审目录含 per-act GLB/程序几何三角面占比表。
