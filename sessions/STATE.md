# 项目状态

最后更新：2026-11-14 18:45 · Codex（四五六殿参考图重做）
仓库：`D:\群核科技黑客松`
远端：`https://github.com/Muujzisuperagent/superagent.git`（`origin/main`）
当前 HEAD：`18d7359`；上一交接提交：`335a136`

## 当前结论

本轮按用户给出的三张参考图（左到右：四殿药局、五殿九宫阵、六殿忘川桥）重做四五六殿：统一冷青黑 / 旧木 / 湿石材质，重做药柜、药案、九宫石阵、忘川桥拱与孟婆亭，接入 6 件群核 Lux3D GLB，并保留程序几何兜底。四五六殿连续可玩，12/12 测试通过，构建成功，三幕预览截图已生成。详见 `sessions/codex/2026-11-14-acts-4-6-reference-rework.md`。

项目已有完整的剧本与美术文档、197 条分场景 3D 资产清单、七场景生图提示词、三殿可玩的 Three.js 密室原型，以及一套 3D 截图审美评审技能。与参考图仍有明显美术差距，尚未形成正式的 `评审/<殿>/<版本>/review.md`。

## 交付物状态

| 交付物 | 路径 | 状态 | 证据 |
|---|---|---|---|
| 剧本全文·纯净版 v1.0 | `还魂路引_剧本全文_纯净版_v1.0.docx` | 已生成并提交 | commit `5a24139` |
| 3D 资产清单·分场景 v1.0 | `还魂路引_3D资产清单_分场景_v1.0.docx` | 已生成并提交 | 197 条（场景 181 + 共享 16）；P0/P1/P2 = 100/71/26 |
| 剧本通俗生动版 v1.8 | `还魂路引_阴曹地府密室剧本_通俗生动版_v1.8.docx` | 已生成并提交 | `verify_docs.py`：`check: PASS` / `reverse: PASS` / `card2: PASS` |
| 画风选择卡 | `阴曹地府_画风选择卡_优化版.docx` | 已生成并提交 | 同上 |
| 七场景生图提示词·恐怖版 | `场景生图提示词_v3_恐怖版.md` | 已完成 | 连贯锁 + 七段本场 + 共用负面 + 拼图检查 |
| Three.js 密室原型 | `game/` | 四五六殿连续可玩、可构建 | `npm.cmd test` 12/12；`npm.cmd run build` 成功；JS 661.17 kB（gzip 179.01 kB） |
| 三幕预览截图 | `game/artifacts/act4-medicine.png` 等 | 已生成 | Playwright + 本机 Edge；页面 0 错误、1 个 canvas |
| 群核 GLB 资产 | `game/public/assets/generated/` | 6 件已接入 | 异步加载，失败时回退程序几何；清单见 `manifest.json` |
| 会话交接区 | `sessions/` | 已更新 | 本文件 + 两份 Codex 记录 + Qoder 模板 |
| 3D 审美评审技能 | `.agents/skills/3d-critique/` | 工具链可用 | 5 个单测全部通过 |
| 文档生成器 | `build_script_and_assets.py` / `build_docs.py` | 可重跑 | 生成两份 v1.0 文档 |
| 文档校验器 | `verify_docs.py` | 通过 | 2026-11-14 复跑 PASS |

## 已验证命令

```powershell
# 文档内容
cd D:\群核科技黑客松
python verify_docs.py
# check: PASS / reverse: PASS / card2: PASS

# 3D 原型（本轮 pnpm 不在 PATH，使用 npm.cmd）
cd D:\群核科技黑客松\game
npm.cmd test
# Test Files 2 passed / Tests 12 passed
npm.cmd run build
# tsc --noEmit 通过；vite build 成功；JS 661.17 kB（gzip 179.01 kB）
node.exe tests\visual-check.mjs
# 三幕截图生成；page errors 0；canvas 1

# 审美评审工具
cd D:\群核科技黑客松\.agents\skills\3d-critique\scripts
python -m unittest test_audit_img -v
# Ran 5 tests / OK
```

## 环境状态

- 系统 Python：`C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe`，已装 `python-docx`、`Pillow`、`numpy`。
- Node 可用；普通 PATH 没有 `pnpm`，本轮用 `C:\Program Files\nodejs\npm.cmd`。`game/node_modules` 已安装，`dist/` 已生成（两者均被 git 忽略）。
- Aholo MCP：已全局安装 `@manycore/aholo-sdk-mcp@1.9.0` 并写入 Codex 全局配置；握手 26 个 tools；`AHOLO_API_KEY` 仍未设置，因此服务启动会提示并退出。
- magpie：`imported-5/claude-opus-5-5`、`claude-sonnet-5-5`、`deepseek-v4-1-flash-261017` 已固定为 Chat 路由，修复 `/v1/responses` 400。配置在 `C:\Users\lenovo\.config\magpie\settings.json`，不在本仓库。

## 已知问题

1. 与参考图仍有明显差距：四殿缺左门 / 右柜台 / 桌面戥子与药材层次；五殿机位过高、石板像发光垫；六殿桥拱侧面未入画、亭顶无瓦、河面布幡误置。详见 `sessions/codex/2026-11-14-acts-4-6-reference-rework.md`。
2. 尚未形成正式的 `3d-critique` 评分与评审文件；三幕预览截图只是引擎画面，不等于概念图验收。
3. 前三殿尚未接入本段流程；证据 A/B 仍是本段测试初始值。
4. 3DGS 空间未接入渲染器；当前只用 GLB + 程序化建筑。
5. 构建产物单 chunk 661.17 kB，Vite 有“超过 500 kB”警告，功能不受影响。
6. NoteExpress 工作台是仓库内的独立子项目；COM 连接与 PDF 提取通过，但原生正文写入被 `System Error Code 5` 拒绝，UI 实际渲染未完成验收。
7. 自动推送计划任务未注册成功，目前依赖手动启动的 `tools/auto-push.ps1` 守护进程；该进程可能已退出。
8. 2026-11-14 本机 Codex 沙箱初始化报 ACL 锁错误（`helper_sandbox_lock_failed`），命令需在沙箱外执行。Qoder 不受此限制时可忽略。

## 下一步建议

1. 优先修六殿：删河面布幡、重做亭顶瓦作与桥拱侧视、加密亡魂队列与彼岸花。
2. 再修五殿：低机位 + 前景案桌、湿石刻字、宽大破布幡、铜盏青绿火。
3. 再修四殿：开左门见雾、右柜台、桌面戥子 / 药材 / 纸签、暖木与冷光对比。
4. 按 `3d-critique` 落盘正式评审到 `评审/<殿>/<版本>/`，再决定是否进入前三殿。
5. 3DGS 与 SPZ 只在前三殿流程稳定后再评估接入。
6. 每次改动后更新本文件，并提交推送到 `origin/main`。

## 接续检查清单

- [ ] 读根目录 `AGENTS.md`
- [ ] 读 `sessions/STATE.md`（本文件）
- [ ] `git log --oneline -10` 确认没有漏掉的提交
- [ ] 跑一遍与本次任务相关的验证命令
- [ ] 在 `sessions/qoder/` 新建当天记录
- [ ] 更新本文件的“最后更新”、状态、遗留问题
- [ ] `git add -A && git commit && git push origin HEAD`
