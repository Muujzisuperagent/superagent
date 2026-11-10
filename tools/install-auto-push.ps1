<#
.SYNOPSIS
    One-click install of the 'auto-push on file change' mechanism.
.DESCRIPTION
    Installs two layers:
      1. git post-commit hook - push after every commit.
      2. Background daemon auto-push.ps1 - polls workspace, auto commit+push.
      3. Scheduled task 'Superagent AutoPush' - starts daemon at login.

    No manual approval needed after install; credentials read by git-credential-manager.

.PARAMETER SkipTask
    Only install hook and hooksPath, skip scheduled task.
.PARAMETER IntervalSeconds
    Daemon poll interval, default 15 seconds.
#>
[CmdletBinding()]
param(
    [switch]$SkipTask,
    [int]$IntervalSeconds = 15
)

$ErrorActionPreference = 'Stop'

$RepoPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $RepoPath

$TaskName = 'Superagent AutoPush'
$WatchScript = Join-Path $RepoPath 'tools\auto-push.ps1'

Write-Host "Repository: $RepoPath"

# ---- 1. Enable repo-local hook path ----
if (Test-Path -LiteralPath (Join-Path $RepoPath '.git')) {
    & git config core.hooksPath .githooks
    if ($LASTEXITCODE -ne 0) { throw 'git config core.hooksPath failed' }
    Write-Host '[1/3] Enabled .githooks/post-commit (commit-then-push)'
} else {
    Write-Host '[1/3] Skipped: not a git repository'
}

# ---- 2. Verify origin ----
$remote = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $remote) {
    Write-Host '[2/3] WARNING: no origin remote configured. Local commits only.' -ForegroundColor Yellow
} else {
    Write-Host "[2/3] origin = $remote"
}

# ---- 3. Register and start scheduled task ----
if ($SkipTask) {
    Write-Host '[3/3] Skipped scheduled task (hook only)'
    return
}

$exePath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
Write-Host "      Using interpreter: $exePath"

$argString = "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$WatchScript`" -IntervalSeconds $IntervalSeconds -Quiet"

$action = New-ScheduledTaskAction -Execute $exePath -Argument $argString -WorkingDirectory $RepoPath
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host "[3/3] Registered scheduled task '$TaskName' (auto-start at login)"

    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 3
    $info = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
    Write-Host "      State: $((Get-ScheduledTask -TaskName $TaskName).State)  LastResult: $($info.LastTaskResult)"
} catch {
    Write-Host "[3/3] WARNING: Could not create scheduled task (permissions). Daemon can be started manually." -ForegroundColor Yellow
    Write-Host "      Error: $_" -ForegroundColor Yellow
    Write-Host "      Manual start: powershell -File `"$WatchScript`" -IntervalSeconds $IntervalSeconds -Quiet" -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Installation complete. Log: .git\auto-push.log' -ForegroundColor Green