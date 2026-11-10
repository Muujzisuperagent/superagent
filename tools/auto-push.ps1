<#
.SYNOPSIS
    项目自动推送守护进程：检测到任何文件改动 -> 自动 commit -> 自动 push。

.DESCRIPTION
    以固定间隔轮询 `git status --porcelain`。只要工作区出现任何改动（新增/修改/删除，
    包括未跟踪文件），就自动 add -A、commit、push 到远端。

    设计要点：
      - 全程非交互。设置 GIT_TERMINAL_PROMPT=0 / GCM_INTERACTIVE=never，
        凭据由 git-credential-manager 从系统钥匙串读取，绝不弹窗等待，因此不需要人工批准。
      - 幂等。同一改动只提交一次；推送失败的提交会在下一轮重试，不会产生重复提交。
      - 网络/远端异常不退出。记录日志后继续轮询，恢复后自动补推。
      - 提交信息带时间戳，便于追溯。

.PARAMETER RepoPath
    仓库根目录。默认取本脚本所在目录的上一级。

.PARAMETER IntervalSeconds
    轮询间隔秒数，默认 15。

.PARAMETER Quiet
    只写日志，不输出到控制台（计划任务里用）。
#>
[CmdletBinding()]
param(
    [string]$RepoPath,
    [int]$IntervalSeconds = 15,
    [switch]$Quiet
)

$ErrorActionPreference = 'Continue'

if (-not $RepoPath) {
    $RepoPath = Split-Path -Parent $PSScriptRoot
}
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path

# ---- 非交互凭据环境：绝不让 git 停下来等输入 ----
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE      = 'never'
$env:GIT_ASKPASS          = 'echo'
$env:AUTO_PUSH_SKIP       = '1'   # 让 post-commit hook 不再重复 push
$env:LC_ALL               = 'C'

$LogFile = Join-Path $RepoPath '.git\auto-push.log'
$LockFile = Join-Path $RepoPath '.git\auto-push.pid'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    try {
        Add-Content -LiteralPath $LogFile -Value $line -Encoding utf8 -ErrorAction SilentlyContinue
    } catch { }
    if (-not $Quiet) {
        if ($Level -eq 'ERROR') { Write-Host $line -ForegroundColor Red }
        elseif ($Level -eq 'WARN') { Write-Host $line -ForegroundColor Yellow }
        else { Write-Host $line }
    }
}

function Invoke-Git {
    param([string[]]$Arguments)
    $out = & git @Arguments 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n").Trim() }
}

# ---- 单实例锁：避免计划任务重复拉起多个守护进程 ----
if (Test-Path -LiteralPath $LockFile) {
    $oldPid = (Get-Content -LiteralPath $LockFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($oldPid -and ($oldPid -as [int]) -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
        Write-Log "另一个守护进程已在运行 (PID $oldPid)，本实例退出。"
        return
    }
}
Set-Content -LiteralPath $LockFile -Value $PID -Encoding ascii

Set-Location -LiteralPath $RepoPath

# ---- 启动自检 ----
$isRepo = Invoke-Git @('rev-parse', '--is-inside-work-tree')
if ($isRepo.ExitCode -ne 0) {
    Write-Log "不是 git 仓库：$RepoPath" 'ERROR'
    Remove-Item -LiteralPath $LockFile -ErrorAction SilentlyContinue
    return
}

$remote = (Invoke-Git @('remote', 'get-url', 'origin')).Output
if (-not $remote) {
    Write-Log '未配置 origin 远端。当前只在本地提交，不会推送。' 'WARN'
} else {
    Write-Log "守护启动：仓库=$RepoPath origin=$remote 间隔=${IntervalSeconds}s PID=$PID"
}

$pushFailures = 0

try {
    while ($true) {
        $status = Invoke-Git @('status', '--porcelain')

        if ($status.ExitCode -ne 0) {
            Write-Log ("git status 失败：" + $status.Output) 'ERROR'
        }
        elseif ($status.Output) {
            # 有一处或多处改动 —— 提交
            $changedLines = ($status.Output -split "`n" | Where-Object { $_.Trim() }).Count
            $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

            $null = Invoke-Git @('add', '-A')
            $staged = Invoke-Git @('diff', '--cached', '--name-only')
            $stagedCount = if ($staged.Output) { ($staged.Output -split "`n" | Where-Object { $_.Trim() }).Count } else { 0 }

            if ($stagedCount -gt 0) {
                $msg = "chore(auto): 自动同步 $changedLines 处文件改动 @ $stamp"
                $commit = Invoke-Git @('commit', '-m', $msg, '--no-verify')
                if ($commit.ExitCode -eq 0) {
                    Write-Log "已提交：$msg"
                }
                else {
                    Write-Log ("提交失败：" + $commit.Output) 'ERROR'
                }
            }
        }

        # ---- 推送（无论本轮是否提交，都确保本地提交已推到远端）----
        if ($remote) {
            $ahead = Invoke-Git @('rev-list', '--count', '@{u}..HEAD')
            $needsPush = $false
            if ($ahead.ExitCode -ne 0) {
                # 没有上游分支，也尝试 push
                $needsPush = $true
            }
            elseif (([int]($ahead.Output)) -gt 0) {
                $needsPush = $true
            }

            if ($needsPush) {
                $push = Invoke-Git @('push', 'origin', 'HEAD')
                if ($push.ExitCode -eq 0) {
                    Write-Log '推送成功。'
                    $pushFailures = 0
                }
                else {
                    $pushFailures++
                    $level = if ($pushFailures -le 2) { 'WARN' } else { 'ERROR' }
                    Write-Log ("推送失败(第 $pushFailures 次)，下轮重试：" + ($push.Output -split "`n" | Select-Object -First 3) -join ' | ') $level
                    # 指数退避，最多 5 分钟
                    $backoff = [Math]::Min(300, 15 * [Math]::Pow(2, [Math]::Min($pushFailures, 5)))
                    Start-Sleep -Seconds $backoff
                }
            }
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
}
finally {
    Remove-Item -LiteralPath $LockFile -ErrorAction SilentlyContinue
    Write-Log '守护进程退出。'
}
