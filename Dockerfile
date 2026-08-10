# =====================================================================
# TB tizimi — Next.js (sahifalar + hujjat generatori)
#
# Backend Django'da (Bacend/Dockerfile). Bu konteyner faqat UI va
# PDF/DOCX chizishni bajaradi.
# =====================================================================

# ---------- 1. Bogʻliqliklar ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# ---------- 2. Build ----------
FROM node:22-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* oʻzgaruvchilar Next.js tomonidan BUILD vaqtida mijoz
# bundle'iga qotiriladi — shuning uchun runtime env_file emas, aynan
# shu yerda ARG/ENV sifatida kerak (docker-compose.yml → build.args).
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_DEPO_KOD
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEMO
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    NEXT_PUBLIC_DEPO_KOD=$NEXT_PUBLIC_DEPO_KOD \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEMO=$NEXT_PUBLIC_DEMO
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 3. Ishga tushirish ----------
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN apk add --no-cache curl && addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

COPY --from=build /app/public ./public
COPY --from=build /app/assets ./assets
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Sogʻliq tekshiruvi — bosh sahifa javob berayotganini tekshiradi
# (/api/health endi Django'da, Caddy uni api:8000 ga yoʻnaltiradi)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
