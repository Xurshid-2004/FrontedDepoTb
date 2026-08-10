# =====================================================================
#  TB tizimi - lokal ishga tushirish (Windows)
#  Buxoro lokomotiv deposi (TCH-6)
#
#  Ikkita xizmat koʻtariladi:
#    1) Django backend  - http://127.0.0.1:8000  (maʼlumot va mantiq)
#    2) Next.js frontend - http://localhost:3000  (sahifalar)
# =====================================================================

$ErrorActionPreference = "Stop"
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
$bacend = Join-Path $proj "Bacend"
$url = "http://localhost:3000"

$Host.UI.RawUI.WindowTitle = "TB tizimi"

function Yoz($m, $c = "White") { Write-Host $m -ForegroundColor $c }

Clear-Host
Yoz ""
Yoz "   =============================================" Cyan
Yoz "      TB TIZIMI - Buxoro lokomotiv deposi" Cyan
Yoz "   =============================================" Cyan
Yoz ""

Set-Location $proj

# --- 1. Node.js ---
try { $null = & node -v 2>$null } catch {
    Yoz "  XATO: Node.js o'rnatilmagan." Red
    Yoz "  https://nodejs.org saytidan LTS versiyani o'rnating." Yellow
    Read-Host "`n  Yopish uchun Enter"
    exit 1
}

# --- 2. Python ---
try { $null = & python --version 2>$null } catch {
    Yoz "  XATO: Python o'rnatilmagan." Red
    Yoz "  https://python.org saytidan 3.12+ versiyani o'rnating." Yellow
    Read-Host "`n  Yopish uchun Enter"
    exit 1
}

# --- 2b. Virtual muhit (Bacend\.venv) ---
# Backend paketlari tizim Python'iga emas, shu muhitga o'rnatiladi.
$py = Join-Path $bacend ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Yoz "  Virtual muhit yaratilmoqda (bir marta)..." Yellow
    & python -m venv (Join-Path $bacend ".venv")
    if ($LASTEXITCODE -ne 0) { Yoz "  XATO: venv yaratilmadi." Red; Read-Host; exit 1 }
}

# --- 3. Sozlama fayllari ---
if (-not (Test-Path ".env.local")) {
    Yoz "  XATO: .env.local fayli yo'q." Red
    Yoz "  .env.example dan nusxa oling." Yellow
    Read-Host "`n  Yopish uchun Enter"
    exit 1
}
if (-not (Test-Path (Join-Path $bacend ".env"))) {
    Yoz "  DIQQAT: Bacend\.env yo'q - Bacend\.env.example dan nusxa olinmoqda..." Yellow
    Copy-Item (Join-Path $bacend ".env.example") (Join-Path $bacend ".env")
}

# --- 4. Bog'liqliklar ---
if (-not (Test-Path "node_modules")) {
    Yoz "  Frontend bog'liqliklari o'rnatilmoqda (bir marta)..." Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) { Yoz "  XATO: npm install muvaffaqiyatsiz." Red; Read-Host; exit 1 }
}

Yoz "  Backend bog'liqliklari tekshirilmoqda..." Gray
& $py -m pip install -q -r (Join-Path $bacend "requirements.txt")
if ($LASTEXITCODE -ne 0) { Yoz "  XATO: pip install muvaffaqiyatsiz." Red; Read-Host; exit 1 }

# --- 5. Baza migratsiyalari ---
Yoz "  Ma'lumotlar bazasi tayyorlanmoqda..." Gray
Push-Location $bacend
$env:PYTHONIOENCODING = "utf-8"
& $py manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) {
    Yoz "  XATO: migratsiya bajarilmadi." Red
    Yoz "  Bacend\.env dagi DATABASE_URL to'g'rimi? Postgres ishlayaptimi?" Yellow
    Yoz "  Postgres yo'q bo'lsa sinov uchun: DATABASE_URL=sqlite://dev.sqlite3" Yellow
    Pop-Location; Read-Host "`n  Yopish uchun Enter"; exit 1
}

# --- 6. Boshlang'ich normativ ma'lumot ---
& $py manage.py seed
Pop-Location

# --- 7. Ikkala xizmatni ishga tushirish ---
Yoz ""
Yoz "  Django backend ishga tushmoqda (port 8000)..." Green
Start-Process -FilePath $py -ArgumentList "manage.py","runserver","127.0.0.1:8000" `
    -WorkingDirectory $bacend -WindowStyle Minimized

# --- FaceID xizmati (ixtiyoriy) ---
# Virtual muhiti tayyor boʻlsagina koʻtariladi. Birinchi marta uni
# face-ishga-tushirish.ps1 orqali qoʻlda ishga tushirish kerak —
# model ~350 MB yuklab olinadi va bu asosiy ishga tushishni kutdirmasligi kerak.
$facePy = Join-Path $proj "face-service\.venv\Scripts\python.exe"
if (Test-Path $facePy) {
    Yoz "  FaceID xizmati ishga tushmoqda (port 8001)..." Green
    $tok = "tb-face-lokal-2026"
    $satr = Select-String -Path (Join-Path $bacend ".env") -Pattern '^\s*FACE_SERVICE_TOKEN\s*=\s*(.+)$' | Select-Object -First 1
    if ($satr) { $tok = $satr.Matches[0].Groups[1].Value.Trim() }
    $env:FACE_TOKEN = $tok
    Start-Process -FilePath $facePy `
        -ArgumentList "-m","uvicorn","app:app","--host","127.0.0.1","--port","8001" `
        -WorkingDirectory (Join-Path $proj "face-service") -WindowStyle Minimized
} else {
    Yoz "  FaceID xizmati oʻrnatilmagan — tizim PIN bilan ishlaydi." Gray
    Yoz "  Yoqish uchun: face-ishga-tushirish.ps1" Gray
}

Start-Sleep -Seconds 3

Yoz "  Next.js frontend ishga tushmoqda (port 3000)..." Green
Start-Process -FilePath "cmd" -ArgumentList "/c","npm run dev" `
    -WorkingDirectory $proj -WindowStyle Minimized

Yoz ""
Yoz "  Kutilmoqda..." Gray
Start-Sleep -Seconds 6

Start-Process $url

Yoz ""
Yoz "   =============================================" Cyan
Yoz "     TAYYOR" Green
Yoz "   =============================================" Cyan
Yoz ""
Yoz "     Sayt:         $url" White
Yoz "     Admin panel:  http://127.0.0.1:8000/admin/" White
Yoz ""
Yoz "     To'xtatish uchun: toxtatish.ps1" Gray
Yoz ""
Read-Host "  Yopish uchun Enter"
