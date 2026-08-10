# Arxiv — eski tuzilma

Bu papkadagi fayllar **ishlatilmaydi**. Faqat tarix uchun saqlanmoqda.

## `eski-supabase-sxema/`

Loyihaning avvalgi maʼlumot qatlami: Supabase (PostgreSQL) uchun qoʻlda
yozilgan SQL migratsiyalari — 33 jadval, RLS siyosatlari, triggerlar.

**Nega olib tashlandi:** sxemani endi Django boshqaradi
(`Bacend/core/models.py` → `Bacend/core/migrations/`). Ikkita parallel
sxema manbasi boʻlishi mumkin emas.

**Nega oʻchirilmadi:** bu fayllar git'da kuzatilmagan edi, shuning uchun
oʻchirilsa butunlay yoʻqolardi. Eski maʼlumotni koʻchirish kerak boʻlsa
yoki qaysidir maydonning maʼnosini tekshirmoqchi boʻlsangiz shu yerda
turibdi.

Ishonchingiz komil boʻlsa, butun `arxiv/` papkasini oʻchirib tashlashingiz
mumkin — ilova ishlashiga taʼsir qilmaydi.
