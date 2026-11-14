@echo off
setlocal
cd /d "%~dp0"

where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo 未找到 pnpm。请先安装 Node.js 和 pnpm，然后重新双击本文件。
  pause
  exit /b 1
)

if not exist node_modules (
  echo 首次启动，正在安装游戏依赖...
  call pnpm.cmd install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

call pnpm.cmd start
pause
