# Test Görevi — Antigravity

**Atanan:** Antigravity (`agy`)
**Önce oku:** `AGENTS.md`, `docs/plan.md`

Uygulama http://localhost:4173 adresinde çalışıyor (üretim build'i, `vite preview`).
Sunucuyu başlatma veya durdurma; çalışmıyorsa bunu raporla.

## Kurallar

- **Kod dosyalarını değiştirme.** Yalnızca `docs/test-raporu.md` dosyasını yaz.
- Tarayıcı aracın varsa uygulamayı gerçekten tarayıcıda kullan. Yoksa bunu raporun başında açıkça yaz
  ve yalnızca kod incelemesiyle yapabildiğin kontrolleri işaretle; tarayıcıda yapılmamış bir kontrolü "geçti" diye yazma.
- Ekran görüntüsü alabiliyorsan `docs/test-ekranlari/` altına kaydet.

## Test senaryosu

Her adımı hem masaüstü (1280 px) hem telefon (360 px) genişliğinde dene.

1. **Ana sayfa:** "KökXR" başlığı, slogan, iki eser kartı ve kapak görselleri görünüyor.
2. **Eser seçimi:** Ulu Camii kartına tıkla → eser sayfası açılıyor. Muradiye için tekrarla.
3. **Galeri:** Görseller yükleniyor; küçük resme tıklayınca büyük görsel değişiyor;
   tam ekran açılıyor, ok tuşlarıyla geçiliyor, Esc ile kapanıyor.
4. **Keşif noktaları:** Fotoğraf üzerindeki numaralı düğmeler doğru yerde (ör. şadırvan noktası havuzun üstünde,
   minber noktası minberin üstünde). Tıklayınca başlık, metin ve kaynak görünüyor.
   Ulu Camii'de "Güdük Minare" fotoğraf altındaki listede görünüyor.
5. **Kaynaklar:** Bilgi noktalarında ve sayfa sonunda "Kaynak: …, s. …" satırları var.
6. **Test:** 3 soruyu bir kez yanlış, bir kez tam doğru çöz. Doğru/yanlış bildirimi metinle de veriliyor,
   açıklama ve kaynak görünüyor, sonuç "3 sorudan X doğru". 3/3'te rozet kazanılıyor.
7. **Rozet:** Ana sayfaya dön → ilgili kartta "Rozet kazanıldı" var. Sayfayı yenile → rozet duruyor.
8. **Bulunamayan sayfa:** `/eser/yok` ve `/rastgele` → "Sayfa bulunamadı".
9. **Klavye:** Yalnızca Tab / Shift+Tab / Enter / Esc / ok tuşlarıyla 2–7. adımlar yapılabiliyor, odak her zaman görünür.
10. **Görsel kalite:** Yatay kaydırma yok, yazılar okunur (en az 16 px), kontrast yeterli, taşan veya üst üste binen öğe yok.
11. **Konsol:** Tarayıcı konsolunda hata veya 404 yok.

## Rapor biçimi (`docs/test-raporu.md`)

```markdown
# Test Raporu — <tarih saat>
Tarayıcıda test edildi mi: evet / hayır (neden)

| # | Adım | Masaüstü | Telefon | Not |
|---|------|----------|---------|-----|
| 1 | Ana sayfa | ✅/❌/— | ✅/❌/— | … |

## Hatalar (önem sırasıyla)
1. **[Kritik/Orta/Düşük]** Ne oldu — nasıl tekrarlanır — beklenen

## Tasarım önerileri (en fazla 5)
```
