# 《还魂路引》3D 密室 · 团队交接说明

> 写于 2026-11-16 10:05 · Qoder
> 基线提交：`38f5ea9`（已同步 `origin/main`）
> 项目根：`D:\群核科技黑客松` · 游戏目录：`D:\群核科技黑客松\game`
> 远端：<https://github.com/Muujzisuperagent/superagent>

---

## 1. 一句话现状

Three.js 第一人称密室，**第二殿到第六殿可连续游玩**（第一殿未做）；26 个单测通过，G3 主流程验收通过；六殿画面完成第二轮改造，视觉评审 24/36，结论仍是“修改后复审”。

---

## 2. 技术栈与架构

| 项 | 选型 |
|---|---|
| 引擎 | Three.js `0.181.0`（纯 WebGL，无 Babylon/Unity/PlayCanvas） |
| 语言 | TypeScript `5.9.3` |
| 构建 | Vite `7.3.8` + `tsc --noEmit` |
| 单测 | Vitest `4.1.12`，3 个文件 26 用例 |
| 截图/流程 | Playwright `1.65` + 本机 Edge |
| 物理 | 无物理引擎，`scene.ts` 的 `constrain()` 手写碰撞与高度 |
| 构建产物 | `three` 分块 629.60 kB（gzip 165.54）· 主入口 59.04 kB（gzip 23.07） |

### 关键文件

| 文件 | 职责 |
|---|---|
| `game/index.html` | 页面骨架、HUD、直接打开时的启动器提示 |
| `game/src/main.ts` | 相机、指针锁定、交互射线、剧情推进、HUD |
| `game/src/scene.ts` | 全部程序化场景（约 87 KB）：各殿建筑、GLB 挂载、灯光、动画、碰撞约束 |
| `game/src/story.ts` | 殿定义、配药/九宫/结局的纯逻辑状态 |
| `game/src/puzzle.ts` | 原密码锁（现主要被后续谜题替代，仍保留单测） |
| `game/src/puzzles_act23.ts` | 二殿业秤、三殿簿库谜题逻辑 |
| `game/src/style.css` | HUD 与覆盖层样式 |
| `game/src/worker-gltf.ts` | **半成品**：计划把 WebP 解码放进 Worker，目前未被引用 |

### 可玩流程

第二殿业秤（配平 + 未时）→ 第三殿簿库（检索 + 显影 + 朱笔）→ 第四殿药局（君臣佐使配不忘汤）→ 第五殿九宫阵（洛书 1→9）→ 第六殿忘川桥（合符 + 三结局）。

---

## 3. 运行与验证

> 本机 PATH 里没有 `pnpm`，统一用 `npm.cmd`。

```powershell
cd D:\群核科技黑客松\game
npm.cmd install          # 首次
npm.cmd run start        # http://127.0.0.1:5173
```

也可双击 `game\启动密室.bat`。**不要直接双击 `index.html`**，ES 模块和 GLB 会被浏览器拦截。

| 命令 | 用途 | 当前结果 |
|---|---|---|
| `npm.cmd test` | 单测 | 26/26 通过 |
| `npm.cmd run build` | 类型检查 + 构建 | 通过，仅 three 分块 >500 kB 警告 |
| `node node_modules/typescript/bin/tsc --noEmit` | 只做类型检查 | 通过 |
| `node.exe tests\visual-check.mjs` | 三幕截图 → `game\artifacts\` | 页面 0 错误、1 canvas |
| `node.exe tests\flow-check.mjs` | G3 主流程验收（四→六殿） | `ok: true`，drawCalls 38，triangles 104,162 |

`flow-check.mjs` 会用 Playwright 拦截并注入 `window.__camera/__world/__renderer/__journey`，靠真实射线 + E 键走流程，不是绕过交互。

### 预览机位（截图/评审用）

| 查询参数 | 机位 |
|---|---|
| `?view=scale&clean=1` | 二殿业秤 |
| `?view=archive&clean=1` | 三殿簿库 |
| `?view=medicine&clean=1` | 四殿药局 |
| `?view=palace&clean=1` | 五殿九宫阵 |
| `?view=river&clean=1` | 六殿桥头四分之三视角 |
| `?view=riverSide&clean=1` | 六殿右岸侧视，专门露桥拱 |

`clean=1` 关掉开场对白。

---

## 4. 美术资源

| 类型 | 格式 | 路径 | 规模 |
|---|---|---|---|
| 模型原件 | GLB | `game\public\assets\generated\*.glb` | 6 件 / 57.16 MB |
| 模型 WebP 版 | GLB（`EXT_texture_webp`） | `game\public\assets\generated\webp\*.glb` | 6 件 / 10.47 MB |
| 资产清单 | JSON | `game\public\assets\generated\manifest.json` | taskId、sha256、worldId |
| 场景截图 | PNG | `game\artifacts\act4/5/6-*.png` | 1440×900 |
| 流程截图 | PNG + JSON | `game\artifacts\flow\` | 4 张 + `flow-log.json` |
| 评审截图 | PNG + JSON | `评审\<殿>\<版本>\` | 多版本 |
| 音效 / BGM | — | — | **没有** |
| 3DGS 空间 | PLY / SPZ / 全景 | 仅在群核 Aholo 云端 | 3 个 world，未入库 |

- 6 件 GLB 由群核 Aholo / Lux3D 生成，taskId：7400735、7400753、7400776、7400806、7402698、7402772。
- 每件只有 baseColor + metallicRoughness 两张 2048² 贴图，无 normal map、无动画；贴图内嵌在 GLB，没有独立贴图文件。
- 材质纹理、石面、木纹、布纹、雾都是 `scene.ts` 用 Canvas 程序生成的。
- WebP 版只转贴图，不压几何、不减面；原件保留。加载失败自动回退原件。
- 3DGS world：`3FO4K4RD9C2P` 药局、`3FO4K4RD9FEQ` 九宫庭院、`3FO4K4RD95DN` 雾中石桥花园，三者在云端均已完成，**未接入引擎**。

---

## 5. 文档索引

### 剧本与美术

| 文档 | 路径 |
|---|---|
| 剧本全文 · 纯净版 v1.0 | `还魂路引_剧本全文_纯净版_v1.0.docx` |
| 3D 资产清单 · 分场景 v1.0（197 条，P0/P1/P2 = 100/71/26） | `还魂路引_3D资产清单_分场景_v1.0.docx` |
| 剧本通俗生动版 v1.8 | `还魂路引_阴曹地府密室剧本_通俗生动版_v1.8.docx` |
| 画风选择卡 | `阴曹地府_画风选择卡_优化版.docx` |
| 七场景生图提示词（恐怖版） | `场景生图提示词_v3_恐怖版.md` |
| 群核 MCP 四五六殿提示词 | `design\群核MCP_四五六殿_提示词_v1.md` |
| 剧本/画风提取文本 | `design\*_提取.txt` |
| 文档生成器 | `build_docs.py`、`build_script_and_assets.py` |
| 文档校验器 | `verify_docs.py`（`check/reverse/card2` 全 PASS） |

### 评审

- 目录规范：`评审\<殿>\<版本>\review.md` + `pixels.json`，**新版本另开目录，不覆盖旧版**。
- 已有：四殿 v1、五殿 v1、六殿 v1/v2、二殿/三殿参考图 v1、四五六殿整体评测 JSON。
- 六殿 v2：**24/36**（v1 为 16/36），结论“修改后复审”；桥拱、瓦顶、队列、布幡四项已达标。
- 评审技能：`.agents\skills\3d-critique\`（`scripts\audit_img.py` + 5 个单测）。
- 工程验收技能：`.agents\skills\huihun-eval\`（构建、截图、glTF 校验、画质评分）。

### 交接记录

`sessions\` 下的 `STATE.md`、`codex\*`、`qoder\*` 是历史交接，**已被 `.gitignore` 排除**，只在本机可见；需要共享的内容请写进本文件或 `评审\`。

---

## 6. 未提交改动（接手第一件事）

当前工作区不是干净的：

| 状态 | 文件 | 说明 |
|---|---|---|
| `M` | `game/src/scene.ts` | 加载改造：`fetch` 分块读取 + `assets-progress` 事件 + 进度统计；已过 `tsc`，**未在浏览器复测** |
| `??` | `game/src/worker-gltf.ts` | 半成品，未被任何文件 import；里面仍调用 `super.loadTextureImage`，等于没接管解码 |
| `M` | `game/artifacts/act4-medicine.png`、`act5-palace.png`、`act6-reincarnation.png` | 重新截图后的三幕画面，与已提交版本有差异；确认无误后一并提交 |
| `??` | `game/tests/flow-check.mjs` | 已跑通 `ok: true`，建议提交 |
| `??` | `game/artifacts/flow/` | 流程截图与 `flow-log.json`，建议随测试一起提交 |
| `??` | `game/preview-qoder.log`、`game/vite-qoder.log` | 临时日志，**不要提交**，直接删 |
| `??` | `HANDOFF.md` | 本文件，尚未提交；团队共享前需要提交推送 |

处理建议（二选一，不要拖着）：

1. **推荐**：提交 `flow-check.mjs` + `artifacts/flow/`，把 `scene.ts` 的加载改动和 `worker-gltf.ts` 一起修完再提交；先删两个日志。
2. 若不想继续加载优化：`git checkout -- game/src/scene.ts`，删 `worker-gltf.ts`，只提交 flow 测试。

本地开发服务器 5173 目前在运行；5180 的 preview 已退出。

---

## 7. 已知问题（按优先级）

| 级别 | 问题 | 证据 / 位置 |
|---|---|---|
| P1 | **证据 D 坐标错位**：世界坐标 `z=-68.50`，落在六殿桥面（`scene.ts` altar 双重 z 偏移）；`replace` 结局拿不到 D | `artifacts\flow\flow-log.json` → `knownIssues` |
| P1 | **石桥 GLB 遮住程序拱腹**：默认游玩视角加载 `stone-bridge.glb`，新做的拱洞只在 `?view=river*` 预览时可见 | `scene.ts` `proceduralBridge` 分支 |
| P1 | **加载优化停在半成品**：`worker-gltf.ts` 未接线；`scene.ts` 的新加载路径没做浏览器回归 | 见第 6 节 |
| P2 | **完全没有声音**：无环境音、交互音、BGM | 全仓库 0 个音频文件 |
| P2 | **首屏 3.9–4.3 s**：3 件大 GLB 各约 3.7–4.2 s；无加载遮罩，玩家可能先看到空场景 | Playwright 生产/开发各测一次 |
| P2 | **3DGS 未接入**：已有 PLY/SPZ 与全景，但引擎只用 GLB + 程序几何 | `sessions\STATE.md`、`manifest.json` |
| P2 | **three 分块 629.60 kB**：Vite 仍警告 >500 kB | `npm run build` |
| P3 | **彼岸花花形偏星芒**：近景像放射尖刺，不像细长蕊瓣 | 六殿 v2 评审 P2 |
| P3 | **布幡仍偏硬片**：有破边与垂坠，但缺织物纹理 | 六殿 v2 评审 P3 |
| P3 | **六殿侧视偏暗**：近黑像素 39.18%，下轮补光依据 | `评审\六殿忘川桥\v2\pixels.json` |
| P3 | **顶部空雾占比高**：主机位约三分之一画面无信息 | 六殿 v2 评审 P3 |

---

## 8. 接手优先级建议

1. **清工作区**：按第 6 节二选一，先让 `git status` 干净。
2. **修证据 D**：查 `scene.ts` 里 altar 的 z 偏移，让 `replace` 结局可达；复跑 `flow-check.mjs`。
3. **首屏**：加载遮罩 + 进度（`assets-progress` 事件已经准备好，直接监听即可），再用 Playwright 量一次；不要在 Vite 与评测并发时测，数字会失真。
4. **声音**：Web Audio 程序化环境音，首次点击解锁，按殿切换；不需要外部音频文件。
5. **六殿 v3**：修花形、布纹、侧视补光，另开 `评审\六殿忘川桥\v3\`。
6. **3DGS**：先做独立试渲染页，确认坐标、尺度、色彩，再谈接进 `scene.ts`。
7. **第一殿**：目前缺第一殿，剧情从第二殿开始，需要补关卡与场景。

---

## 9. 协作规则（必须遵守）

- **任何文件改动都要提交并推送** `origin/main`；本机自动推送守护进程当前未运行，需手动 `git add` / `commit` / `push`。
- 提交信息用 Conventional Commits：`feat:` / `fix:` / `docs:` / `perf:` / `chore:` / `test:` / `refactor:`。
- **不要 `git add -A` 一把梭**：`sessions\` 被忽略没事，但 `评审\`、临时日志、他人的半成品容易被误提交；按路径显式添加。
- 不要提交任何 Token、Key、密码、私钥；不要 `git push --force`。
- 评审新版本另开目录，不覆盖历史；`review.md` 与 `pixels.json` 必须同目录。
- 改模型/供应商配置（magpie 等）不属于本项目范围，不要动。

---

## 10. 本机环境

| 项 | 值 |
|---|---|
| Node | `v24.19.0` |
| npm | `11.17.0`（PATH 无 pnpm） |
| Python | `3.14.4`，已装 `python-docx`、`Pillow`、`numpy` |
| Edge | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |
| Blender | `4.5.9 LTS`，`C:\Users\lenovo\Tools\blender-4.5.9-windows-x64`（已加入用户 PATH） |
| gltf-transform | `4.5.1`（npm 全局） |
| GPU | RTX 5060 Laptop + Intel 集显 |

Blender 与 gltf-transform 目前只用于资产体检/压缩，引擎运行不依赖它们。

---

## 11. 快速自检清单

```powershell
cd D:\群核科技黑客松
git status --short
git log --oneline -3

cd game
npm.cmd test                 # 期望 26 passed
npm.cmd run build            # 期望 built，只有 chunk 警告
npm.cmd run start            # 打开 http://127.0.0.1:5173

# 另开一个终端
node.exe tests\flow-check.mjs   # 期望 ok: true
```

三条都过，才算接手完成。
