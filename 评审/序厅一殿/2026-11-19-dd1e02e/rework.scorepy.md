# 返工清单

结论：**打回重改**（91.7/100）

## P0 · A4 · 1.45/5 分

- 证据：{'score': 29.08, 'mode': 'stats', 'tech_score': None, 'state': 'scored'}
- 修复入口：game/src/scene.ts（灯光、材质、雾、清晰度）

## P0 · E2 · 1/2 分

- 证据：{'maxDrawsPerFrame': 759, 'maxTotalDrawsPerFrame': 759}
- 修复入口：game/src/scene.ts（几何合并、实例化、剔除）

## P1 · B1 · 3.75/5 分

- 证据：prologue-start.png：判官+矮案中景、左列纸扎人前景节奏、纵深引向雾门，右侧主案+摇号机被画框裁切；prologue-door.png 远机位层次完整；first-hall-entry.png：孽镜台居中对称、前案后柱层次分明；prologue-judge.png：近景判官下半身被对话 UI 遮挡（交互态设计使然）。
- 修复入口：game/src/scene.ts（构图：主目标、前中后景、留白）

## P1 · B10 · 3.75/5 分

- 证据：prologue-start.png：无穿模/悬浮/接缝硬伤，判官接地、灯笼吊挂自然、纸扎人落地；prologue-judge.png：判官袖口与笔杆衔接为低模简化、近景下手部细节有限；prologue-door.png：地面纸钱平贴无裁切；first-hall 三图无异常。
- 修复入口：game/src/scene.ts（穿模、悬浮、接缝、阴影错误）

## P1 · B4 · 3.75/5 分

- 证据：prologue-start.png：墨绿+青灰+纸白+小面积朱砂（HUD 印/纸钱），情绪统一；visual-prologue.json：序厅 luma 0.2342/0.2284/0.2361；但宣纸族像素占比实测仅 0.22%（v1 为 1.14%），『灰白旧纸主调』在本场要求下量化偏弱，画面主调实为青灰绿。
- 修复入口：game/src/scene.ts（冷暖配比、朱砂点缀、情绪色）
