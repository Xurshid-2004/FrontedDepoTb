"use client";
/* ------------------------------------------------------------------
   Qurilmani tanish — bu telefonmi yoki kompyutermi.

   Nima uchun kerak: ishchi oʻz telefonidan bir marta kirgach, keyingi
   safar PIN qayta soʻralmasligi kerak. Depodagi kompyuter esa UMUMIY —
   undan 4-5 kishi kiradi, shuning uchun u yerda har safar tabel + PIN
   soʻraladi.

   Bu yerdagi xulosa YAKUNIY EMAS. Server uni User-Agent bilan mustaqil
   tekshiradi va faqat ikkalasi rozi boʻlsa qurilma ishonchli deb tan
   olinadi (Bacend/core/qurilma.py). Shuning uchun brauzerning «Request
   Desktop Site» rejimi yoki qoʻlbola oʻzgartirish umumiy kompyuterda
   seansni ochiq qoldirib keta olmaydi.
------------------------------------------------------------------ */

const IDKEY = "tb_qurilma_id";

/* ------------------------------------------------------------------
   Barqaror qurilma identifikatori
------------------------------------------------------------------ */

/**
 * Har bir brauzer uchun bir marta yaratiladigan tasodifiy UUID.
 *
 * Bu MAXFIY QIYMAT EMAS — u faqat «qaysi qurilma» degan savolga javob
 * beradi. Kirish huquqini refresh token beradi, u esa alohida saqlanadi.
 * Shuning uchun uni localStorage'da saqlash xavfsiz.
 */
export function qurilmaId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(IDKEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(IDKEY, id);
    }
    return id;
  } catch {
    // Maxfiy oyna yoki saqlash oʻchirilgan — qurilma eslab qolinmaydi,
    // ilova esa oddiy holatda (har safar PIN soʻrab) ishlayveradi.
    return "";
  }
}

/* ------------------------------------------------------------------
   Telefonmi?
------------------------------------------------------------------ */

type UAData = { mobile?: boolean };

/**
 * Uch signal, ishonchlilik tartibida:
 *
 *   1. navigator.userAgentData.mobile — Chromium (Android Chrome, Edge).
 *      Brauzerning oʻz javobi, eng aniq manba.
 *   2. User-Agent matni — Safari va Firefox uchun.
 *   3. Sensorli ekran + `pointer: coarse` — iPad uchun SHART, chunki
 *      iPadOS Safari oʻzini standart holatda kompyuter deb tanishtiradi.
 *
 * Sensorli ekranning oʻzi yetarli emas: sensorli monitorli kompyuter
 * ham `maxTouchPoints > 0` beradi. Shuning uchun u `pointer: coarse`
 * bilan birga tekshiriladi — sichqoncha bor joyda pointer «fine»
 * boʻladi.
 */
export function mobilmi(): boolean {
  if (typeof navigator === "undefined") return false;

  const uaData = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile;

  const ua = navigator.userAgent || "";
  if (/android|iphone|ipod|ipad|mobile safari|windows phone|iemobile/i.test(ua)) {
    return true;
  }

  const sensor = (navigator.maxTouchPoints ?? 0) > 0;
  const qoPointer =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)").matches
      : false;

  return sensor && qoPointer;
}

/* ------------------------------------------------------------------
   Qurilma nomi — «Qurilmalarim» roʻyxatida tanib olish uchun
------------------------------------------------------------------ */

export function qurilmaNomi(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent || "";

  let tizim = "Qurilma";
  for (const [kalit, atama] of [
    ["Android", "Android"],
    ["iPhone", "iPhone"],
    ["iPad", "iPad"],
    ["Windows", "Windows"],
    ["Mac", "Mac"],
    ["Linux", "Linux"],
  ] as const) {
    if (ua.includes(kalit)) {
      tizim = atama;
      break;
    }
  }

  let brauzer = "";
  // Tartib muhim: Edge va Opera oʻzini Chrome deb ham atashadi.
  for (const [kalit, atama] of [
    ["Edg/", "Edge"],
    ["OPR/", "Opera"],
    ["SamsungBrowser", "Samsung Browser"],
    ["Firefox", "Firefox"],
    ["Chrome", "Chrome"],
    ["Safari", "Safari"],
  ] as const) {
    if (ua.includes(kalit)) {
      brauzer = atama;
      break;
    }
  }

  return brauzer ? `${tizim} · ${brauzer}` : tizim;
}

/* ------------------------------------------------------------------
   Har bir soʻrovga qoʻshiladigan sarlavhalar
------------------------------------------------------------------ */

export function qurilmaSarlavhalari(): Record<string, string> {
  const id = qurilmaId();
  if (!id) return {};
  return {
    "x-qurilma-id": id,
    "x-qurilma-tur": mobilmi() ? "mobil" : "kompyuter",
    "x-qurilma-nom": qurilmaNomi(),
  };
}
