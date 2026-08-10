FROM python:3.11-slim

# DIQQAT — model qayerda saqlanadi:
#   insightface 1.0.1 `INSIGHTFACE_HOME` ni EʼTIBORSIZ qoldiradi va modelni
#   doim `$HOME/.insightface/models` ga yuklaydi. Shuning uchun compose'dagi
#   volume ham aynan shu yoʻlga ulanadi (/root/.insightface).
#   Oʻzgaruvchi kelajakdagi versiyalar uchun qoldirilgan.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOME=/root \
    INSIGHTFACE_HOME=/root/.insightface

RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Modelni image ichiga oldindan yuklab qoʻyish (birinchi soʻrov tez boʻlishi uchun)
RUN python -c "from insightface.app import FaceAnalysis; \
    m=FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
    m.prepare(ctx_id=0, det_size=(640,640))" || true

COPY app.py .

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/health" || exit 1

# Shell shakli — Railway/Fly portni $PORT orqali beradi.
#
# --host :: — Railway'ning ichki tarmogʻi (*.railway.internal) IPv6 da
# ishlaydi, 0.0.0.0 esa faqat IPv4 ni tinglaydi va Django ulana olmaydi.
# Linux'da :: ikkala oilani ham qabul qiladi, shuning uchun public
# domen ham shu bilan ishlayveradi.
#
# Bitta worker: har bir worker buffalo_l modelini alohida xotiraga
# yuklaydi (~1.2 GB). Ikkita worker konteynerni xotira limitidan
# chiqarib yuboradi. Yuklama ortsa WEB_CONCURRENCY bilan koʻtariladi.
CMD uvicorn app:app \
      --host :: \
      --port "${PORT:-8000}" \
      --workers "${WEB_CONCURRENCY:-1}"
