<#
.SYNOPSIS
    Project auto-push daemon: detect file changes -> auto commit -> auto push.
.DESCRIPTION
    Polls `git status --porcelain` at fixed intervals. Any workspace change
    (new/modified/deleted, including untracked files) triggers
    add -A, commit, push to remote.
.PARAMETER RepoPath
    Repository root. Defaults to the parent of this script's directory.
.PARAMETER IntervalSeconds
    Poll interval in seconds, default 15.
.PARAMETER Quiet
    Write only to log file, not console (for scheduled tasks).
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

# ---- Non-interactive credential environment ----
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE      = 'never'
$env:GIT_ASKPASS          = 'echo'
$env:AUTO_PUSH_SKIP       = '1'
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

# ---- Single instance lock ----
if (Test-Path -LiteralPath $LockFile) {
    $oldPid = (Get-Content -LiteralPath $LockFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($oldPid -and ($oldPid -as [int]) -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
        Write-Log ("Another daemon is already running (PID $oldPid), this instance exits.")
        return
    }
}
Set-Content -LiteralPath $LockFile -Value $PID -Encoding ascii

Set-Location -LiteralPath $RepoPath

# ---- Startup check ----
$isRepo = Invoke-Git @('rev-parse', '--is-inside-work-tree')
if ($isRepo.ExitCode -ne 0) {
    Write-Log "Not a git repository: $RepoPath" 'ERROR'
    Remove-Item -LiteralPath $LockFile -ErrorAction SilentlyContinue
    return
}

$remote = (Invoke-Git @('remote', 'get-url', 'origin')).Output
if (-not $remote) {
    Write-Log 'No origin remote configured. Local commits only, no push.' 'WARN'
} else {
    Write-Log "Daemon started: repo=$RepoPath origin=$remote interval=${IntervalSeconds}s PID=$PID"
}

$pushFailures = 0

try {
    while ($true) {
        $status = Invoke-Git @('status', '--porcelain')

        if ($status.ExitCode -ne 0) {
            Write-Log ("git status failed: " + $status.Output) 'ERROR'
        } elseif ($status.Output) {
            # Changes detected - commit
            $changedLines = ($status.Output -split "`n" | Where-Object { $_.Trim() }).Count
            $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

            $null = Invoke-Git @('add', '-A')
            $staged = Invoke-Git @('diff', '--cached', '--name-only')
            $stagedCount = if ($staged.Output) { ($staged.Output -split "`n" | Where-Object { $_.Trim() }).Count } else { 0 }

            if ($stagedCount -gt 0) {
                $msg = "chore(auto): sync $changedLines file(s) @ $stamp"
                $commit = Invoke-Git @('commit', '-m', $msg, '--no-verify')
                if ($commit.ExitCode -eq 0) {
                    Write-Log "Committed: $msg"
                } else {
                    Write-Log ("Commit failed: " + $commit.Output) 'ERROR'
                }
            }
        }

        # ---- Push (always try, in case previous commits need pushing) ----
        if ($remote) {
            $ahead = Invoke-Git @('rev-list', '--count', '@{u}..HEAD')
            $needsPush = $false
            if ($ahead.ExitCode -ne 0) {
                $needsPush = $true
            } elseif (([int]($ahead.Output)) -gt 0) {
                $needsPush = $true
            }

            if ($needsPush) {
                $push = Invoke-Git @('push', 'origin', 'HEAD')
                if ($push.ExitCode -eq 0) {
                    Write-Log 'Push successful.'
                    $pushFailures = 0
                } else {
                    $pushFailures++
                    $level = if ($pushFailures -le 2) { 'WARN' } else { 'ERROR' }
                    $shortOut = ($push.Output -split "`n" | Select-Object -First 3) -join ' | '
                    Write-Log ("Push failed (attempt $pushFailures), retry: $shortOut") $level
                    # Exponential backoff, max 5 minutes
                    $backoff = [Math]::Min(300, 15 * [Math]::Pow(2, [Math]::Min($pushFailures, 5)))
                    Start-Sleep -Seconds $backoff
                }
            }
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
} finally {
    Remove-Item -LiteralPath $LockFile -ErrorAction SilentlyContinue
    Write-Log 'Daemon exited.'
}