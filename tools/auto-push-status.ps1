<#
.SYNOPSIS
    查看 / 停止「文件改动自动推送」守护进程。
#>
[CmdletBinding()]
param(
    [switch]$Stop
)

$RepoPath = Split-Path -Parent $PSScriptRoot
$TaskName = 'Superagent AutoPush'
$LogFile = Join-Path $RepoPath '.git\auto-push.log'
$LockFile = Join-Path $RepoPath '.git\auto-push.pid'

if ($Stop) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    $pidFile = Get-Content -LiteralPath $LockFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pidFile) {
        Stop-Process -Id ([int]$pidFile) -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $LockFile -ErrorAction SilentlyContinue
    }
    Write-Host "已停止：计划任务「$TaskName」与守护进程均已移除。" -ForegroundColor Yellow
    return
}

Write-Host '=== 计划任务 ===' -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    $info = $task | Get-ScheduledTaskInfo
    Write-Host ("状态：{0}   上次结果：{1}   下次运行：{2}" -f $task.State, $info.LastTaskResult, $info.NextRunTime)
}
else {
    Write-Host '未注册（运行 tools\install-auto-push.ps1 安装）' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== git hook ===' -ForegroundColor Cyan
$hooksPath = (& git -C $RepoPath config core.hooksPath 2>$null)
Write-Host "core.hooksPath = $(if ($hooksPath) { $hooksPath } else { '(未设置)' })"

Write-Host ''
Write-Host '=== 远端 ===' -ForegroundColor Cyan
$remote = (& git -C $RepoPath remote get-url origin 2>$null)
Write-Host "origin = $(if ($remote) { $remote } else { '(未设置)' })"

Write-Host ''
Write-Host '=== 工作区 ===' -ForegroundColor Cyan
$status = (& git -C $RepoPath status --porcelain 2>$null)
if ($status) { Write-Host "有 $(($status | Measure-Object).Count) 处未同步改动"; $status }
else { Write-Host '干净，无待推送改动。' -ForegroundColor Green }

Write-Host ''
Write-Host '=== 最近日志（20 行） ===' -ForegroundColor Cyan
if (Test-Path -LiteralPath $LogFile) {
    Get-Content -LiteralPath $LogFile -Tail 20
}
else {
    Write-Host '(暂无日志)'
}
