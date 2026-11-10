<#
.SYNOPSIS
    一键安装「文件改动自动推送」机制。

.DESCRIPTION
    安装两层保障：
      1. git post-commit hook —— 任何一次提交后立刻 push。
      2. 后台守护进程 auto-push.ps1 —— 轮询工作区，任何文件改动都会自动 commit + push
         （不依赖你是否手动提交）。
      3. 计划任务「Superagent AutoPush」—— 开机登录时自动拉起守护进程，重启不失效。

    安装后全程无需人工批准：凭据由 git-credential-manager 从系统钥匙串非交互读取。

.PARAMETER SkipTask
    只装 hook 和 hooksPath，不注册计划任务（也就不常驻后台）。

.PARAMETER IntervalSeconds
    守护进程轮询间隔，默认 15 秒。
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

Write-Host "仓库：$RepoPath"

# ---- 1. 启用仓库内 hook ----
if (Test-Path -LiteralPath (Join-Path $RepoPath '.git')) {
    & git config core.hooksPath .githooks
    if ($LASTEXITCODE -ne 0) { throw 'git config core.hooksPath 失败' }
    Write-Host '[1/3] 已启用 .githooks/post-commit（提交即推送）'
}
else {
    Write-Host '[1/3] 跳过：当前目录不是 git 仓库'
}

# ---- 2. 确保 origin 存在 ----
$remote = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $remote) {
    Write-Host '[2/3] 警告：未配置 origin 远端，推送会跳过（本地仍会自动提交）' -ForegroundColor Yellow
}
else {
    Write-Host "[2/3] origin = $remote"
}

# ---- 3. 注册并启动计划任务 ----
if ($SkipTask) {
    Write-Host '[3/3] 已跳过计划任务（仅 hook 生效）'
    return
}

$pwshExe = (Get-Command pwsh.exe -ErrorAction SilentlyContinue)
if (-not $pwshExe) { $pwshExe = (Get-Command pwsh -ErrorAction SilentlyContinue) }
$exePath = if ($pwshExe) { $pwshExe.Source } else { Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe' }
Write-Host "      使用解释器：$exePath"

$argString = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -IntervalSeconds {1} -Quiet' -f $WatchScript, $IntervalSeconds

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

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "[3/3] 已注册计划任务「$TaskName」（登录自启动，无限时长）"

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3
$info = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
Write-Host "      运行状态：$((Get-ScheduledTask -TaskName $TaskName).State)  上次结果：$($info.LastTaskResult)"

Write-Host ''
Write-Host '安装完成。日志：.git\auto-push.log' -ForegroundColor Green
