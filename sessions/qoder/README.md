# Qoder 记录区

Qoder 的每轮工作记录写在这里，文件名：`YYYY-MM-DD-<主题>.md`。不要覆盖 Codex 的已有记录。

## 每份记录必须包含

```markdown
# Qoder 工作记录 · YYYY-MM-DD

## 任务
用户原话或明确目标。

## 改动
- 文件路径：改了什么，为什么。

## 验证
- 命令：
- 结果：
- 未验证项：

## 遗留
- 没做完的事、已知问题、需要用户决定的事。

## 下一步
- 建议的下一轮入口。
```

## 收尾动作

1. 更新 `sessions/STATE.md` 的“最后更新”、交付物状态、已知问题、下一步。
2. 检查 diff，确认没有凭据、Token、私钥、本机 ACL 备份。
3. 按根目录 `AGENTS.md` 提交并推送：

```powershell
git add -A
git commit -m "docs: qoder session record YYYY-MM-DD"
git push origin HEAD
```

4. 推送失败必须重试并报告原因，不允许静默忽略。

## 交接边界

- Codex 的记录在 `sessions/codex/`，只读，不改写。
- `sessions/STATE.md` 是双方共用的唯一事实源，可以更新，但不要删除历史结论。
- 业务交付物仍放在仓库原有位置；`sessions/` 只放记录，不放生成资产。
