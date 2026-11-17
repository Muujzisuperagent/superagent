$a = Get-Process node,msedge -ErrorAction SilentlyContinue | Select-Object Id,CPU
Start-Sleep -Seconds 3
$b = Get-Process node,msedge -ErrorAction SilentlyContinue | Select-Object Id,CPU
foreach ($p in $b) {
  $o = $a | Where-Object Id -eq $p.Id
  if ($o) {
    $d = $p.CPU - $o.CPU
    if ($d -gt 0.3) { Write-Output ("ACTIVE {0} deltaCPU={1:N2}" -f $p.Id, $d) }
  }
}
Write-Output IDLE_CHECK_DONE
