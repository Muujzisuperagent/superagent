# 还魂路引 · 3D 密室原型

Three.js + TypeScript + Vite 的最小可玩原型。没有外部模型或贴图，房间、门、密码锁全部由代码生成，方便版本管理和自动验收。

## 运行

```sh
cd game
pnpm install
pnpm dev
```

浏览器打开 Vite 输出的地址，点击画面锁定鼠标。

## 操作

- `WASD` / 方向键：移动
- 鼠标：环视
- `E`：靠近密码锁时打开输入框
- 密码：`0427`（原型线索：墙上划痕）
- `Esc`：释放鼠标 / 关闭输入框

输对后门会打开并显示通关提示。

## 结构

```text
game/
  src/puzzle.ts   纯逻辑：密码、尝试次数、锁死、重置（可单测）
  src/scene.ts    房间、门、密码锁、火把和灯光
  src/main.ts     第一人称控制、射线交互、输入框和通关流程
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
