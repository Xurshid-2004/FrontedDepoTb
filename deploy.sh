#!/usr/bin/env bash
# =====================================================================
# TB tizimi — serverga bir buyruqda oʻrnatish (Ubuntu 22.04 / 24.04)
#
# Ishlatish (serverda root sifatida):
#   bash deploy.sh
#
# Oldindan: .env.production fayli tayyor boʻlishi kerak (.env.example dan)
# =====================================================================
set -euo pipefail

APP_DIR="/opt/tb"
REPO="${TB_REPO:-}"

say() { echo -e "\n\033[1;34m==> $*\033[0m"; }

say "1/6 Tizimni yangilash"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git ufw

say "2/6 Docker oʻrnatish"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "Docker allaqachon bor"
fi

say "3/6 Xavfsizlik devori"
ufw allow OpenSSH   >/dev/null 2>&1 || true
ufw allow 80/tcp    >/dev/null 2>&1 || true
ufw allow 443/tcp   >/dev/null 2>&1 || true
yes | ufw enable    >/dev/null 2>&1 || true
ufw status | head -5

say "4/6 Kodni olish"
mkdir -p "$APP_DIR"
if [ -n "$REPO" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" pull --ff-only
  else
    git clone "$REPO" "$APP_DIR"
  fi
else
  echo "TB_REPO koʻrsatilmagan — kod allaqachon $APP_DIR da deb hisoblanadi"
fi
cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "XATO: .env.production fayli yoʻq. .env.example dan nusxalab toʻldiring." >&2
  exit 1
fi

say "5/6 Konteynerlarni qurish va ishga tushirish"
docker compose --env-file .env.production up -d --build

say "6/6 Holatni tekshirish"
sleep 12
docker compose ps
echo
curl -fsS http://127.0.0.1/api/health || echo "Health hali javob bermayapti — 30 soniyadan keyin qayta urinib koʻring"

cat <<EOF

=====================================================================
Tayyor.

  Sayt:     https://\$TB_DOMAIN  (yoki http://<server-ip>)
  Loglar:   docker compose logs -f web
  Qayta:    docker compose restart web
  Yangilash: git pull && docker compose up -d --build

Keyingi qadam — seed:
  curl -X POST http://127.0.0.1/api/admin/seed -H "x-seed-token: \$SEED_TOKEN"
=====================================================================
EOF
