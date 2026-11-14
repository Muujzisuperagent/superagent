# 会话交接区

这个目录是 Codex 与 Qoder 的共用交接区。任何一方接手前先读 `STATE.md`，做完后追加自己的会话记录，并更新 `STATE.md`。

## 目录约定

```text
sessions/
  README.md                        本文件：规则与索引
  STATE.md                         唯一事实源：当前状态、已验证结果、遗留问题、下一步
  codex/2026-11-14-handoff.md      Codex 截至 2026-11-14 的完整工作记录
  qoder/README.md                  Qoder 记录模板与写入规则
```

后续记录按 `sessions/<harness>/YYYY-MM-DD-<主题>.md` 命名新建，不覆盖旧记录。

## 写入规则

1. 先读根目录 `AGENTS.md`，遵守“任何改动必须提交并推送”的仓库规则。
2. 每轮结束前更新 `STATE.md`：改了哪个文件、跑了什么命令、结果如何、还剩什么。
3. 会话记录写清四件事：用户原话/目标、实际动作、验证证据、未完成项。
4. 不写凭据、Token、私钥。`AHOLO_API_KEY` 只通过环境变量传递。
5. 不要把“计划”写成“已完成”。没跑过的验证标“未验证”。

## 项目一句话

《还魂路引》—— 中国阴司主题的 3D AI 密室逃脱。当前仓库同时承载剧本/美术文档、3D 资产清单、生图提示词、Three.js 可玩原型、3D 审美评审技能，以及若干本机工具链。

## 时间线

| 日期 | 工作 |
|---|---|
| 2026-11-07 / 11-08 | 原始剧本 v1.7 进入仓库；初始化 `superagent` 仓库；加入 3D 密室设计文档 |
| 2026-11-10 | 仓库初始化大提交：自动推送机制、`3d-critique` 技能、DOCX 生成/提取/校验脚本、NoteExpress 工作台、生图提示词 v2/v3、剧本通俗版 v1.8、画风选择卡 |
| 2026-11-11 | Three.js + TypeScript + Vite 第一人称密室原型（密码锁 `0427`，6 个单测） |
| 2026-11-12 | 生成《剧本全文·纯净版 v1.0》与《3D 资产清单·分场景 v1.0》（197 条）；整理七段可直接复制的生图提示词；安装 Aholo MCP；修复 magpie 奇绩创坛 400 |
| 2026-11-14 | Codex 建立本交接区，复验文档、单测与构建 |

## 快速接续

```powershell
cd D:\群核科技黑客松
git log --oneline -10
Get-Content sessions\STATE.md

cd game
pnpm test
pnpm build
```

当前远端：`https://github.com/Muujzisuperagent/superagent.git`，分支 `main`。
