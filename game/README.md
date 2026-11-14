# 还魂路引 · 3D 密室原型

Three.js + TypeScript + Vite 的连续三殿原型。药局、九宫阵、轮回门沿同一轴线连接，玩家直接走过门洞和短廊，不加载黑屏。建筑与反馈由代码生成，关键 GLB 道具由群核科技 Aholo / Lux3D 生成。

## 运行

Windows 用户双击 `启动密室.bat`。不要直接双击 `index.html`，浏览器会拦截 Vite 模块和 3D 模型资源。

```sh
cd game
pnpm install
pnpm start
```

浏览器打开 Vite 输出的地址，点击画面锁定鼠标。

## 操作

- `WASD` / 方向键：移动
- 鼠标：环视
- `E`：取药、查看药碗、收取半印、合符、选择结局
- `Esc`：释放鼠标 / 关闭输入框

四殿按当归、远志、合欢、忘忧（君臣佐使）配药；五殿按石板 1→9 步罡；六殿合符后选择结局。

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
pnpm test    # 谜题逻辑
pnpm build   # 类型检查 + 生产构建
```

## 下一步

- 第二关场景与谜题 JSON 化
- 背包与物品组合
- 音效与过场
- Playwright 截图回归（Worker 可视化验收）
