# Afrosiyob kirish videosi — AI promptlari

Bu fayl AI video generatorlarga (Sora, Veo, Runway, Kling, Hailuo, Pika) beriladigan
tayyor promptlarni saqlaydi. Promptlar ingliz tilida — barcha modellar ingliz tilini
eng yaxshi tushunadi.

**Natija shu yerga saqlanadi:** `public/afrosiyob.mp4`

---

## Qanday ishlatiladi

1. AI vositasida **Image-to-Video** rejimini tanlang (matndan emas — rasmdan!)
2. Afrosiyob suratini yuklang (eng yaxshisi — old tomondan, kunduzi olingan)
3. Quyidagi promptlardan birini nusxalab qoʻying
4. Sozlamalar: **16:9 gorizontal**, **1080p**, **8–10 soniya**, **24 yoki 30 fps**
5. Yuklab olib `public/afrosiyob.mp4` nomi bilan saqlang

> Nima uchun Image-to-Video: siz bergan surat aynan Afrosiyob boʻlgani uchun model
> boshqa poyezd oʻylab topmaydi. Faqat matndan generatsiya qilsangiz, natija
> Afrosiyobga oʻxshamasligi mumkin.

---

## PROMPT 1 — Asosiy (poyezd yaqinlashadi) ⭐ tavsiya etiladi

```
Cinematic hero shot of a modern high-speed passenger train (Talgo-250 "Afrosiyob",
white and deep blue livery) approaching the camera head-on along straight railway
tracks. Bright clear daylight, golden morning sun, crisp blue sky with soft clouds.

Camera: locked low angle near the rails, slow forward dolly push-in toward the
train's nose. Shallow depth of field, subtle motion blur on the ballast and sleepers
rushing past. The train grows steadily larger and fills the frame in the final two
seconds. Headlights glowing bright, sunlight glinting off the polished nose and the
blue windshield.

Environment: catenary poles and overhead wires sweeping past on both sides, warm
desert-steppe landscape of Central Asia in the background, heat shimmer near the
horizon.

Style: photorealistic, cinematic commercial advertisement, ARRI Alexa look, anamorphic
lens flare, high dynamic range, rich contrast, film grain, 4K, smooth camera motion,
no camera shake.

Duration 8 seconds. No text, no logos, no people, no titles.
```

---

## PROMPT 2 — Yon tomondan uchib oʻtish (dinamik)

```
Cinematic tracking shot of a modern white and blue high-speed train (Talgo-250
"Afrosiyob") speeding across a bright sunlit plain. Camera flies alongside the train
at high speed, parallel to the carriages, then slowly arcs toward the sliding
passenger door.

Bright daylight, clear sky, strong sun reflections rolling along the polished body
panels, blue window band mirroring the sky. Catenary poles whip past creating
rhythmic light flicker. Ground and rails streak with natural motion blur.

Style: photorealistic, high-end commercial cinematography, smooth gimbal drone
movement, anamorphic flares, shallow depth of field, vivid but natural colors,
high dynamic range, 4K, 24fps.

Duration 8 seconds. No text, no logos, no people.
```

---

## PROMPT 3 — Eshikdan ichkariga kirish (reel'dagi effekt)

Bu — siz yuborgan reel'dagi asosiy gʻoya: kamera transport vositasi ichiga uchib
kiradi. Ikkinchi klip sifatida ishlatiladi.

```
Cinematic shot: camera moves toward the side sliding door of a modern high-speed
train. The polished white and blue door panels slide apart smoothly, revealing a
bright, clean, softly lit interior corridor. The camera glides forward through the
open doorway into the interior, the light growing brighter until it fills the frame
and blooms into pure white.

Bright natural daylight outside, warm soft light inside. Reflections on brushed metal
and glass. Smooth continuous forward camera movement, no cuts, no shake.

Style: photorealistic, premium commercial advertisement, cinematic depth of field,
subtle lens bloom, high dynamic range, 4K.

Duration 6 seconds. No text, no logos, no people.
```

Saqlash nomi: `public/afrosiyob-ichi.mp4`

---

## NEGATIVE PROMPT (qoʻllab-quvvatlaydigan vositalarda)

```
cartoon, anime, illustration, 3d render look, plastic, toy train, cgi game graphics,
low quality, blurry, distorted geometry, warped wheels, extra carriages, text,
watermark, logo, subtitles, people, crowd, night, rain, snow, fog, dark, gloomy,
camera shake, jitter, fisheye distortion, oversaturated
```

---

## Sozlamalar (vosita boʻyicha)

| Vosita | Rejim | Sozlama |
|---|---|---|
| **Sora** | Image-to-video | 1080p, 16:9, 10 s, "Cinematic" preset |
| **Google Veo** | Image-to-video | 16:9, 8 s, high motion |
| **Runway Gen-4** | Image-to-video | Camera: "Push in", Motion 6–7, 10 s |
| **Kling 2.x** | Image-to-video | Professional rejim, CFG 0.5, 10 s |
| **Hailuo / MiniMax** | Image-to-video | Director rejimi: `[Push in]` `[Truck left]` |
| **Pika** | Image-to-video | Motion 3, 16:9 |

---

## Muhim shartlar

Video sayt uchun quyidagilarga javob berishi kerak:

- **Gorizontal 16:9** — vertikal (9:16) yaramaydi, ekranni toʻldirmaydi
- **Kunduzgi, yorqin** — qorongʻi kadr saytning yorugʻ temasiga qarshi chiqadi
- **Kameraning oldinga harakati** — bu kirish hissini beradi
- **Matn, logotip, odam yoʻq** — ustiga sayt yozuvlari tushadi
- **6–12 soniya** — oʻtish 5.2 soniya davom etadi, ortigʻi kerak emas
- **Silliq, titroqsiz** — titroq kamera arzon koʻrinadi

---

## Fayl hajmini kamaytirish (agar 10 MB dan katta boʻlsa)

PowerShell'da (ffmpeg oʻrnatilgan boʻlsa):

```
ffmpeg -i kirish.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow -an -movflags +faststart public\afrosiyob.mp4
```

`-an` — ovozni olib tashlaydi (sayt videoni ovozsiz oʻynatadi, keraksiz hajm).

---

## Suratlar bilan qanday ishlaymiz

Agar sizda faqat **suratlar** boʻlsa (video yoʻq) — ular ham foydali:

1. Eng yaxshi 3–5 ta suratni `public/afrosiyob/` papkasiga qoʻying
2. Menga ayting — suratlardan **Ken Burns** effekti bilan kinematik slayd yasab beraman
   (sekin zoom, panorama, parallaks, oʻtishlar) — bu ham juda taʼsirchan chiqadi va
   videosiz ishlaydi

---

## Natijani qanday tekshiraman

Video joyiga tushgach `npm run dev` ni ishga tushiring va tizimga kiring —
PIN tasdiqlangach video avtomatik ishga tushadi. Yoqmasa, promptni oʻzgartirib
qayta generatsiya qilamiz.
