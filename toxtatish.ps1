# =====================================================================
#  TB tizimi - barcha xizmatlarni to'xtatish
#     3000 - Next.js (sahifalar)
#     8000 - Django (API)
#     8001 - FaceID (yuz tanish)
# =====================================================================
$Host.UI.RawUI.WindowTitle = "TB tizimi - to'xtatish"

Write-Host ""
Write-Host "  TB tizimi to'xtatilmoqda..." -ForegroundColor Yellow

$topildi = $false
foreach ($port in 3000, 8000, 8001) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "    port $port - $($p.ProcessName) (PID $($p.Id))" -ForegroundColor DarkGray
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                $topildi = $true
            }
        }
    } catch { }
}

# node jarayonlari qolgan bo'lsa
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*nodejs*" -or $_.Path -like "*node.exe"
} | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $topildi = $true
}

if ($topildi) {
    Write-Host "  Server to'xtatildi." -ForegroundColor Green
} else {
    Write-Host "  Ishlab turgan server topilmadi." -ForegroundColor DarkGray
}
Start-Sleep -Seconds 2
