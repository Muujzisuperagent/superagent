# 还魂路引 · 3D 密室原型

Three.js + TypeScript + Vite 的连续三殿原型。药局、九宫阵、轮回门沿同一轴线连接，玩家直接走过门洞和短廊，不加载黑屏。建筑与反馈由代码生成，关键 GLB 道具由群核科技 Aholo / Lux3D 生成。

## 运行

Windows 用户双击 `启动密室.bat`。不要直接双击 `index.html`，浏览器会拦截 Vite 模块和 3D 模型资源。

启动器优先使用系统 Node 和项目内的 Vite，不依赖全局 `pnpm`。首次运行缺少 `node_modules` 时，会用系统 `npm` 安装依赖。服务地址固定为 `http://127.0.0.1:5173`。

注意：本机 Vite 默认只绑 IPv6 的 `::1`，直接用 `127.0.0.1:5173` 会连不上。用下面的命令显式绑定：

```sh
cd game
npm install
npm run start -- --host 127.0.0.1
```

`tests/visual-check.mjs` 与 `tests/flow-check.mjs` 的默认 base URL 是 `http://localhost:5173`，可用环境变量 `GAME_URL` 覆盖，例如 `GAME_URL=http://127.0.0.1:5173 node tests/flow-check.mjs`。

浏览器打开 Vite 输出的地址，点击画面锁定鼠标。

## 操作

- `WASD` / 方向键：移动
- 鼠标：环视
- `E`：取药、查看药碗、收取半印、合符、选择结局
- `Esc`：释放鼠标 / 关闭输入框

四殿按当归、远志、合欢、忘忧（君臣佐使）配药；五殿按石板 1→9 步罡；六殿合符后选择结局。

## 资产与交付几何

四五六殿的**交付版本是程序几何**：百子柜、九宫石板阵、忘川桥拱都由 `src/scene.ts` 用代码生成，含湿石 / 旧木 / 铜器分族材质、刻字、踩板与半印动画。

`public/assets/generated/` 下的 6 件群核 Lux3D GLB 仍在运行期异步加载，作用是道具增强与失败回退：加载成功时只替换物件外观，加载失败或属于被程序版本接管的部件（`herbal-cabinet.glb`、`nine-palace.glb`、`stone-bridge.glb`）时保持 `visible=false`，不覆盖程序几何。因此截图与验收以程序几何呈现的画面为准。

## 预览机位

截图与评审用 `?view=<name>&clean=1`（`clean=1` 关开场对白）：

| 机位 | 说明 |
|---|---|
| `medicine` / `medicineEntry` / `medicineBench` / `medicineExit` | 四殿主视角 / 入口 / 药案交互点 / 北门出口 |
| `palace` / `palaceEntry` / `palaceCenter` / `palaceExit` | 五殿主视角 / 入口 / 阵心俯视 / 出口台阶 |
| `river` / `riverSide` / `riverBridge` / `riverMid` / `riverEnd` | 六殿桥头 / 右岸侧视 / 桥头 / 桥中回望 / 亭内结局点 |

导航组图由 `node tests/visual-check.mjs` 自动拍进 `artifacts/nav/`；该脚本对每张图做近黑采样，暗像素超过 95% 会记入 errors，避免机位嵌进实体几何时静默产出黑帧。

## 结构

```text
game/
  src/puzzle.ts   纯逻辑：密码、尝试次数、锁死、重置（可单测）
  src/scene.ts    三殿、连接走廊、忘川、交互物、GLB 加载
  src/story.ts    药局、九宫、结局的纯逻辑状态
  src/main.ts     第一人称控制、交互、剧情、HUD
  public/assets/generated/  群核科技生成的 GLB 与来源清单
  tests/          Vitest 单测
```

## 验证

```sh
cd game
npm test
npm run build
```

## 下一步

- 第二关场景与谜题 JSON 化
- 背包与物品组合
- 音效与过场
- Playwright 截图回归（Worker 可视化验收）
