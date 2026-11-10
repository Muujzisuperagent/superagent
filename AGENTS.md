# AGENTS.md — 本项目强制规则

## 规则一：任何文件改动都必须自动推送到 GitHub

**这条规则是强制的，不因会话、任务、执行者（AI 或人）而改变。**

- 仓库：<https://github.com/Muujzisuperagent/superagent>
- 分支：`main`
- 远端名：`origin`

### 执行要求

1. 任何文件的新建、修改、删除、重命名，都必须在**当轮动作结束前**完成提交并推送：
   ```bash
   git add -A
   git commit -m "<type>: <说明>"
   git push origin HEAD
   ```
2. 提交信息遵循 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`。
3. 推送失败**必须**重试（网络抖动时退避重试），并在回复中明确报告失败原因；**不允许静默忽略、不允许假装已推送**。
4. 不得为了让 `git status` 变干净而删除用户文件；不得使用 `git push --force` 覆盖远端历史。
5. 不得提交任何凭据、Token、密码、私钥。提交前检查 diff。

### 已安装的自动机制（正常情况下无需手动操作）

| 层 | 位置 | 作用 |
|---|---|---|
| git hook | `.githooks/post-commit` | 每次提交后自动 `push`（含人工/AI 手动 commit） |
| 守护进程 | `tools/auto-push.ps1` | 每 15 秒轮询 `git status`，**只要有改动就自动 commit + push**，不依赖是否有人提交 |
| 计划任务 | Windows「Superagent AutoPush」 | 登录时自启动守护进程，重启后依然生效 |

运行日志：`.git/auto-push.log`

### 常用命令

```powershell
# 安装（或重装）自动推送机制
pwsh -File tools\install-auto-push.ps1

# 查看状态 / 最近日志
pwsh -File tools\auto-push-status.ps1

# 停止守护进程并移除计划任务
pwsh -File tools\auto-push-status.ps1 -Stop
```

### 例外

`.gitignore` 中列出的内容不进入仓库：`acl-recovery/`（本机 ACL 备份）、`__pycache__/`、`node_modules/`、Office 临时锁文件、编辑器与系统杂物。

---

## 规则二：不要提交本机产物

本仓库面向「可分发」，下列内容视为本机产物，不进版本库：ACL 备份与修复报告、Python 字节码缓存、依赖目录、Office 锁文件。
