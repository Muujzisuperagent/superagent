# 四五六殿参考图重做 · 2026-11-14

## 用户目标

用户确认三张参考图从左到右分别对应第四幕、第五幕、第六幕，并要求把原本粗糙的密室重新做过。三幕要连续衔接，参考图的统一风格是电影感写实、冷青黑、深色旧木、湿青石、旧布幡、幽绿火、悬浮纸片和浓雾。

三张参考图：

- 四殿药局：`64f3e652ae6a5fe82b053d1ba45571e5.jpg`
- 五殿九宫阵：`f40310229f647db72d2539b41e25d80d.jpg`
- 六殿忘川桥：`b2bc965cc94f97fe205efe04cde50cfc.jpg`

参考图没有上传到群核或其他外部服务；本轮是在本地按图重做程序化场景。

## 改动

- `game/src/scene.ts`：重做木 / 石 / 布 / 纸程序纹理与色板；四殿重做百子柜、抽屉拉手与标签、药案、药碾、药材、青瓷碗、蒸汽与灯笼；五殿重做九宫石板、刻字、脚印、布幡与八盏灯；六殿重做连续桥面、桥拱高度、孟婆亭、六道轮盘、光门、彼岸花、纸灯笼与亡魂队列。
- `game/src/main.ts`：新增 `?view=medicine|palace|river&clean=1` 预览机位；加入场景氛围过渡；九宫踩板反馈；桥面移动高度。
- `game/src/story.ts`：第六幕标题改为“忘川桥”，副标题“孟婆亭 · 轮回门”。
- `game/tests/visual-check.mjs`：逐幕截图，文件仍为 `act4-medicine.png`、`act5-palace.png`、`act6-reincarnation.png`。
- `game/public/assets/generated/`：6 件群核 Lux3D GLB 已接入，包含百子柜、戥子、青瓷碗、九宫石板、石桥、六道轮盘；异步加载失败时保留程序几何。

## 验证

- `npm.cmd test`：2 个测试文件，12 个测试通过。
- `npm.cmd run build`：`tsc --noEmit` 与 `vite build` 通过；JS 661.17 kB（gzip 179.01 kB），仅有 chunk 体积警告。
- `node.exe tests/visual-check.mjs`：三幕截图生成；page errors 0；canvas 1。
- 截图：`game/artifacts/act4-medicine.png`、`game/artifacts/act5-palace.png`、`game/artifacts/act6-reincarnation.png`。
- 提交：`18d7359 feat: refine acts 4-6 scenes`，已推送 `origin/main`。

## 与参考图的差距

已做目视对比，但没有形成正式 `3d-critique` 评分文件。主要差距：

1. 四殿是正面对称机位，缺参考图左侧开门见雾、右侧木柜台与大白纸灯笼；药案道具偏少；左侧符纸排成了“楼梯”形状。
2. 五殿机位过高，缺前景案桌；石板仍是发光色块，不是湿青石刻字；布幡太窄太干净；灯是白球黑锥，不是铜盏火苗。
3. 六殿桥拱侧面没有进入画面，桥像上坡石板；孟婆亭是黑色四棱锥顶，无瓦垄起翘；河面布幡误置成深色竖块；亡魂偏黑偏散；彼岸花过稀。
4. 三幕共同缺体积雾、bloom、景深、暗角、颗粒与材质贴图层；程序几何的轮廓仍偏白盒。

## 未完成

- 六殿构图优先修正，其次五殿，再四殿。
- 正式 `3d-critique` 评审与 `评审/<殿>/<版本>/review.md` 尚未落盘。
- 前三殿尚未接入本段流程。
- 3DGS / SPZ 尚未接入渲染器。
