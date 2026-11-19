# 返工清单 · 序厅+第一殿（基线 922a9c5）

结论：**打回重改（硬门槛 G1/G4 失败）**，63.5/100 < 95。逐条「位置 → 动作 → 复验条件」。修完全部 P0 后**全量重跑**（构建+单测+截图+流程+评分），不得只补评修改项。

## P0-1 · 六件 S0-* GLB 缺失（G1、G4、A2、A3、E3 的根因）

- **位置**：`game/public/models/prologue/`（目录不存在）+ `game/public/prologue/lux3d.js:24-35` 的 NEW 映射。
- **动作**：用 Aholo/Lux3D（MCP 工具 lux3d_*）按原 S0 清单补生成 6 件：`S0-12_ticket_machine_A`、`S0-13_bamboo_tally_A`、`S0-07_elm_bench_A`、`S0-37_paper_effigy_A`、`S0-15_paper_lantern_A`、`S0-21_blank_pass_A`；落位到 `game/public/models/prologue/`；跑 Khronos glTF Validator 0 error 后入库。生成物尺寸参照 S1-* 低模口径（≤2.2MB、约 1.5–2.2 万三角），网页端不炸显存。
- **复验条件**：`__lux3dStatus.mounted=9 missing=0`；prologue-check.mjs ERRORS 与 HTTP≥400 均空；摇号机不再是白盒回退（prologue-start.png 左中部出现带竹签口的真机）。
- **状态**：分数影响 A2 0→2、A3 1→3~4、A1 维持 4；G1/G4 解锁。

## P0-2 · 判官崔珏形象重塑（B2/B3/B5/B6/B10，用户点名"很丑"）

- **位置**：`game/public/prologue/scene.js`（判官构建/材质/灯光段）。
- **动作**：①帽改幞头/乌纱（圆润冠体+后倾+展脚，哑光乌纱，去圆顶礼帽）；②脸改窄长清瘦、颧骨下颌转折、眼窝微陷、八字须+长须（灰黑），CanvasTexture 画层次，去大眼珠卡通贴片；③袍改交领右衽宽袖深灰绿官袍+腰带蔽膝，云纹暗纹低对比，去纯黑块；④加右手执朱笔、左手按生死簿的伏案道具；⑤案侧加一盏低位冷白/青白轮廓光（与序厅灯笼同色系），脸与袍褶可读。
- **复验条件**：prologue-judge.png（?dlgapproach=1 机位）：帽形可辨为幞头、面部明暗三层以上、袍身非纯黑、手部有笔/簿；远景 prologue-start.png 仍读得出"一官坐案后"。接口契约不动：LAYOUT/judgeAt、refs.judge/judgeGlow、pick "judge"、?nojudge=1/?v28judge=1、走近 2.2m 触发对话。
- **状态**：匠人甲本轮已领同类任务；复验按此判据。

## P0-3 · 纸扎人卡通眼珠违约（B10）

- **位置**：`game/public/prologue/scene.js`（纸扎人头部构建）。
- **动作**：按 README"不点睛、空眼窝"改为糊纸空眼窝/低对比眉骨，去卡通眼珠与五官描边、去朱砂点睛；保留五具姿态差异。
- **复验条件**：prologue-start.png 左列五具近看无眼珠高光点、无描边；与判官同属"糊纸+淡墨"语汇。

## P0-4 · 一殿→二殿动线断裂（C3、D3）

- **位置**：`game/public/first-hall/app.js`（won 分支，约 719-740 行）+ `first-hall/index.html`。
- **动作**：won 时显示"入第二殿 · 业秤"按钮，链接 `../../`（根游戏，开局即二殿）；保留"回到便民司"；样式与现有 .btn 一致；不破坏 ?clean=1/?vision=1/?solved=1。
- **复验条件**：flow 脚本 buttons 含"入第二殿"、hasSecondHallLink=true；点击后落地根游戏且 HUD=第二殿·业秤。
- **状态**：工作区改动版已出现该按钮（flow 第二次复测 links=[../entry/index.html]），待匠人乙提交后按新 commit 复验。

## P0-5 · 第一殿大面板 HUD 断裂（B9）

- **位置**：`game/public/first-hall/index.html` + `app.js`（右侧"殿中陈设"面板）。
- **动作**：改默认收起的右上角小按钮抽屉，保留重置/保存PNG/居中/照镜/五处差异全部功能；顶部改与根游戏同构的小标题块；窄屏不遮挡。
- **复验条件**：first-hall-entry.png 右侧无常驻大面板；五处差异列表仍可达；对照 act4-medicine.png 风格接近同一作品。
- **状态**：同属匠人乙本轮任务范围。

## P1-1 · 序厅判官近景面部无轮廓光（B2）

随 P0-2 第⑤点一并修；单独判据：近景图面部能看到独立于灯笼主光的方向性轮廓。

## P1-2 · 五处差异缺真实点击过程证据（D2）

- **位置**：无代码问题，缺验收证据。
- **动作**：下轮验收用 Playwright 逐处真实点击五处差异（含点错反馈）留过程日志。
- **复验条件**：flow 日志含五处逐点记录与 toast 反馈。

## P1-3 · 统一入口缺失（F1）

- **位置**：`game/public/entry/index.html`（新建）+ 根游戏起点浮层。
- **动作**：动线页（序厅→一殿→二至六殿）+ 根游戏首屏起点浮层。
- **复验条件**：从任一入口 2 次点击内可达全部六殿；?clean=1/?shots=1 无浮层。
- **状态**：匠人乙本轮任务范围，工作区已见 entry/，待提交复验。

## P2 · 序厅加载 6.0s 压线（E3）

- **位置**：`game/public/prologue/scene.js`（加载与首帧）。
- **动作**：P0-1 补件后复测；若仍 >6s，延迟非首屏构件（纸扎人细节、簿册堆）到首帧后异步加载。
- **复验条件**：prologue-start loadMs ≤6000 且 ERRORS 空。
