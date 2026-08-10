# =====================================================================
#  TB tizimi — FaceID xizmati (lokal)
#
#  Yuz tanish alohida jarayonda ishlaydi: InsightFace modeli ogʻir
#  (~350 MB) va uni Django ichiga qoʻshish butun tizimni sekinlashtiradi.
#
#  Port 8001 (Django 8000 ni band qilgan).
#  Toʻxtatish: shu oynani yoping yoki Ctrl+C.
# =====================================================================

$ErrorActionPreference = "Stop"
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
$svc = Join-Path $proj "face-service"
$py = Join-Path $svc ".venv\Scripts\python.exe"

$Host.UI.RawUI.WindowTitle = "TB — FaceID xizmati"

function Yoz($m, $c = "White") { Write-Host $m -ForegroundColor $c }

Yoz ""
Yoz "   =============================================" Cyan
Yoz "      TB — FaceID xizmati (yuz tanish)" Cyan
Yoz "   =============================================" Cyan
Yoz ""

# --- Virtual muhit ---
if (-not (Test-Path $py)) {
    Yoz "  Virtual muhit yaratilmoqda (bir marta)..." Yellow
    & python -m venv (Join-Path $svc ".venv")
    if ($LASTEXITCODE -ne 0) { Yoz "  XATO: venv yaratilmadi." Red; Read-Host; exit 1 }
}

Yoz "  Bogʻliqliklar tekshirilmoqda..." Gray
& $py -m pip install -q -r (Join-Path $svc "requirements.txt")
if ($LASTEXITCODE -ne 0) { Yoz "  XATO: pip install muvaffaqiyatsiz." Red; Read-Host; exit 1 }

# --- Token: Bacend\.env dagi qiymat bilan bir xil boʻlishi SHART ---
$token = "tb-face-lokal-2026"
$envFile = Join-Path $proj "Bacend\.env"
if (Test-Path $envFile) {
    $satr = Select-String -Path $envFile -Pattern '^\s*FACE_SERVICE_TOKEN\s*=\s*(.+)$' | Select-Object -First 1
    if ($satr) { $token = $satr.Matches[0].Groups[1].Value.Trim() }
}

$env:FACE_TOKEN = $token
$env:FACE_THRESHOLD = "0.62"

Yoz ""
Yoz "  Model birinchi ishga tushishda yuklanadi (~350 MB, bir marta)." Gray
Yoz "  Xizmat manzili: http://127.0.0.1:8001" Green
Yoz "  Holat tekshirish: http://127.0.0.1:8001/health" Gray
Yoz ""
Yoz "  DIQQAT: Bacend\.env da FACE_SERVICE_URL=http://127.0.0.1:8001" Yellow
Yoz "  boʻlishi va Django QAYTA ishga tushirilgan boʻlishi kerak." Yellow
Yoz ""

Push-Location $svc
& $py -m uvicorn app:app --host 127.0.0.1 --port 8001
Pop-Location
