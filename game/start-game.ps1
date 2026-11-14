$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$url = 'http://127.0.0.1:5173'

function Test-Game {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

if (Test-Game) {
    Start-Process $url
    Write-Host '游戏已经在运行，已为你打开浏览器。'
    Start-Sleep -Seconds 1
    exit 0
}

$nodeCandidates = @()
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodeCandidates += $nodeCommand.Source }
$nodeCandidates += 'C:\Program Files\nodejs\node.exe'
$node = $nodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $node) {
    Write-Host '未找到 Node.js。请安装 Node.js 后重新双击启动密室.bat。'
    Read-Host '按回车关闭'
    exit 1
}

$vite = Join-Path $root 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $vite)) {
    $npm = Join-Path (Split-Path $node) 'npm.cmd'
    if (-not (Test-Path $npm)) {
        Write-Host '缺少游戏依赖，且未找到 npm。请安装 Node.js 后重试。'
        Read-Host '按回车关闭'
        exit 1
    }
    Write-Host '首次启动，正在安装游戏依赖...'
    & $npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $vite)) {
        Write-Host '依赖安装失败，请检查网络后重试。'
        Read-Host '按回车关闭'
        exit 1
    }
}

$stdout = Join-Path $root 'vite.log'
$stderr = Join-Path $root 'vite-error.log'
$process = Start-Process -FilePath $node -ArgumentList @($vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
    Start-Sleep -Milliseconds 500
    if (Test-Game) {
        Start-Process $url
        Write-Host '密室已启动，浏览器正在打开。'
        Start-Sleep -Seconds 1
        exit 0
    }
    if ($process.HasExited) { break }
}

Write-Host '游戏服务启动失败。下面是诊断信息：'
if (Test-Path $stdout) { Get-Content $stdout -Tail 20 }
if (Test-Path $stderr) { Get-Content $stderr -Tail 20 }
Read-Host '按回车关闭'
exit 1
