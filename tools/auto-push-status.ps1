<#
.SYNOPSIS
    View / stop the 'auto-push on file change' daemon.
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
    Write-Host "Stopped: scheduled task '$TaskName' and daemon removed." -ForegroundColor Yellow
    return
}

Write-Host '=== Scheduled Task ===' -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    $info = $task | Get-ScheduledTaskInfo
    Write-Host ("State: {0}    LastResult: {1}    NextRun: {2}" -f $task.State, $info.LastTaskResult, $info.NextRunTime)
} else {
    Write-Host 'Not registered (run tools\install-auto-push.ps1 to install)' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== git hook ===' -ForegroundColor Cyan
$hooksPath = (& git -C $RepoPath config core.hooksPath 2>$null)
Write-Host "core.hooksPath = $(if ($hooksPath) { $hooksPath } else { '(not set)' })"

Write-Host ''
Write-Host '=== Remote ===' -ForegroundColor Cyan
$remote = (& git -C $RepoPath remote get-url origin 2>$null)
Write-Host "origin = $(if ($remote) { $remote } else { '(not set)' })"

Write-Host ''
Write-Host '=== Workspace ===' -ForegroundColor Cyan
$status = (& git -C $RepoPath status --porcelain 2>$null)
if ($status) {
    $count = (($status | Measure-Object).Count)
    Write-Host "$count unsynced change(s):"
    $status
} else {
    Write-Host 'Clean, no pending changes.' -ForegroundColor Green
}

Write-Host ''
Write-Host '=== Recent log (20 lines) ===' -ForegroundColor Cyan
if (Test-Path -LiteralPath $LogFile) {
    Get-Content -LiteralPath $LogFile -Tail 20
} else {
    Write-Host '(no log yet)'
}