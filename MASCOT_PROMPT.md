# Login mascot — Afrosiyob 3D render promptlari

Login sahifasidagi lokomotiv mascot hozir SVG (chizma). Uni **fotorealistik 3D render**
bilan almashtiramiz.

**Natija shu yerga saqlanadi:** `public/mascot.png`

---

## Muhim: nega faqat BITTA rasm kerak

Mascot jonli boʻlishi kerak — faralar kursorni kuzatadi, PIN kiritilganda oʻchadi.
AI ikki marta **aynan bir xil rakursda** rasm chiza olmaydi, shuning uchun:

- AI faqat **bitta** render beradi — faralar **oʻchiq yoki neytral** holatda
- Faralarning yonishi, nur konusi, kursorni kuzatishi va oʻchishi — **kodda** qilinadi
  (CSS yorugʻlik qatlami sifatida)

Shuning uchun promptda **"headlights off"** deb yozilgan. Buni oʻzgartirmang.

---

## PROMPT A — Old tomondan (asosiy) ⭐ tavsiya etiladi

```
Photorealistic 3D product render of the front of a modern Uzbek high-speed passenger
train "Afrosiyob" (Talgo-250). Straight head-on front view, slightly above eye level,
symmetrical composition, centered in frame.

Design: deep blue upper cab section with a wide dark tinted panoramic windshield,
glossy white and silver lower nose with smooth aerodynamic curves, a horizontal
chrome trim line separating the blue and white sections, recessed headlight housings
low on the white nose (headlights switched OFF, dark glass), small red marker lights
on the outer edges, a brushed metal coupler grille in the center, pantograph visible
on the roof.

Lighting: bright clean studio lighting, soft large softbox from above front, subtle
rim light from both sides, gentle reflections and specular highlights on the glossy
paint, soft contact shadow beneath.

Background: plain solid pure white background, completely empty, no environment,
no rails, no ground detail.

Style: high-end automotive CGI product visualization, Octane render, 8K, ultra sharp,
clean edges, physically based materials, no motion blur.

No text, no logos, no people, no watermark.
```

---

## PROMPT B — 3/4 rakurs (dinamikroq, muqobil)

```
Photorealistic 3D render of a modern Uzbek high-speed train "Afrosiyob" (Talgo-250)
front car, three-quarter front-left view, low hero camera angle, centered.

Deep blue cab roof, wide dark panoramic windshield, glossy white-silver aerodynamic
nose, chrome separation line, headlight housings switched OFF, red marker lights,
blue livery stripe running along the side, roof pantograph.

Clean bright studio lighting, soft reflections, subtle floor contact shadow,
plain solid white background, no environment.

High-end automotive CGI, Octane render, 8K, ultra sharp, physically based materials.
No text, no logos, no people.
```

---

## NEGATIVE PROMPT

```
cartoon, anime, toy, plastic, low poly, game asset, illustration, drawing, sketch,
blurry, distorted, warped, asymmetric, extra headlights, glowing headlights,
lens flare, text, watermark, logo, signature, people, background scenery, rails,
station, sky, ground texture, dark, night, moody lighting
```

---

## Sozlamalar

| Vosita | Sozlama |
|---|---|
| **Midjourney** | `--ar 4:3 --style raw --stylize 200 --v 7` |
| **Flux / Ideogram** | 4:3 yoki 1:1, "Realistic" preset, guidance 3.5 |
| **DALL·E / GPT Image** | Kvadrat yoki 4:3, "photorealistic render" |
| **Leonardo** | Model: Phoenix / Lightning XL, PhotoReal ON |

Oʻlcham: kamida **1500 px** kenglikda.

---

## Fondan ajratish (background removal)

AI oq fon bilan beradi — uni shaffofga aylantirish kerak.

**Eng oson:** [remove.bg](https://www.remove.bg) yoki Photoshop / Photopea
→ PNG shaffof fon bilan eksport → `public/mascot.png`

**PowerShell orqali (ImageMagick oʻrnatilgan boʻlsa):**

```
magick kirish.png -fuzz 12% -transparent white -trim +repage public\mascot.png
```

Shaffof fon boʻlmasa ham ishlaydi, lekin karta ustida chekkalari koʻrinib qoladi —
shaffof qilgan maʼqul.

---

## Kod tomondan nima qoʻshiladi

Fayl joyiga tushishi bilan avtomatik ishga tushadi (`components/Locomotive.tsx`):

| Effekt | Tavsif |
|---|---|
| **Parallaks** | Rasm kursor ortidan yengil siljiydi va qiyalanadi (3D chuqurlik hissi) |
| **Far nuri** | Kursor tomonga buriluvchi ikkita yorugʻ konus — CSS gradient, rasm ustida |
| **Far yonishi** | Faralar ustida yumshoq yorugʻ dogʻ — nafas olgandek pulsatsiya qiladi |
| **`blind` rejimi** | PIN kiritilganda faralar oʻchadi, rasm sal qorayadi va soviydi |
| **`happy` rejimi** | Muvaffaqiyatli kirishda faralar yashil yonadi |
| **Suzish** | Sekin yuqoriga-pastga tebranish (allaqachon bor) |

Fayl boʻlmasa — hozirgi SVG mascot ishlayveradi. Sayt buzilmaydi.

---

## Faralarning joyini sozlash

Rasm kelgach far nurlari toʻgʻri joyda turishi uchun ikkita raqamni sozlash kerak
boʻlishi mumkin — `components/Locomotive.tsx` faylining boshidagi:

```ts
const LAMP_L = { x: 34, y: 74 }; // chap far — rasmning % da
const LAMP_R = { x: 66, y: 74 }; // oʻng far
```

Menga ayting — rasmni koʻrib, oʻzim aniq joyiga qoʻyaman.

---

## Ixtiyoriy: video mascot

Agar 3–4 soniyalik **jonli** mascot xohlasangiz (poyezd sal tebranadi, faralar
miltillaydi), Image-to-Video bilan shu promptni ishlating:

```
Subtle idle animation of the train front: very slow gentle breathing motion,
soft light shimmer moving across the glossy paint, faint heat haze, camera
completely static, seamless loop, no camera movement, no zoom.
```

Saqlash: `public/mascot.mp4` — menga ayting, kodni videoga moslashtiraman.
