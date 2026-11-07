# Test Raporu 2 — 3 Kasım 2026, 15:30

**Test eden:** Claude (Playwright ile otomatik; Antigravity bu oturumda izin gerektirdiği için çalıştırılmadı)
**Tarayıcılar:** Chromium 156 (yazılımsal WebGL, SwiftShader) · Firefox 157
**Betik:** `tests/uctan-uca.mjs` — `npm run test:e2e` ile tekrar çalıştırılabilir

## Sonuç: 15/15 adım, 3 yapılandırmanın üçünde de geçti

| # | Adım | Chromium 1280 | Chromium 360 | Firefox 1280 |
|---|------|:-:|:-:|:-:|
| 1a | İlk Tab "Ana içeriğe geç" bağlantısına gidiyor (önceki hata #3) | ✅ | ✅ | ✅ |
| 1b | favicon 200 (önceki hata #4) | ✅ | ✅ | ✅ |
| — | Ana sayfa: başlık, 2 kart, taşma yok | ✅ | ✅ | ✅ |
| 1c | Test yalnız klavyeyle 3/3 çözülüyor (önceki kritik hata #1) | ✅ | ✅ | ✅ |
| 1d | Fotoğraftaki keşif noktasına tıklayınca kart görünür alanda (önceki hata #2) | ✅ | ✅ | ✅ |
| 2 | Maket: aç, sürükle-çevir, tekerlek, Parçala/Birleştir, ok tuşları/+, sıfırla, temsili etiketi | ✅ | ✅ | ✅ |
| 3 | 360° tur: 360TR oynatıcısı yükleniyor (3 canvas), yedek bağlantı var | ✅ | ✅ | ✅ |
| 4 | Gezinti Ulu Camii: Giriş kapısı → İbadet alanı → Şadırvan → Minber, dürüstlük etiketi | ✅ | ✅ | ✅ |
| 4 | Gezinti Muradiye: Caminin giriş kapısı → İç mekân → Mihrap → İç mekân | ✅ | ✅ | ✅ |
| 5 | Restorasyon: klavyeyle yerleştir + R ile döndür; panoyu tamamla, kaynaklı bilgi | ✅ | ✅ | ✅ |
| 6 | Yönetim: Ulu Camii özetini değiştir → ana sayfada görünüyor → varsayılana döndür | ✅ | ✅ | ✅ |
| 6b | Yönetim: kaynaksız "Kaynaklı bilgi" seçilemiyor; yeni eser ekle → ana sayfa + eser sayfası → sil | ✅ | ✅ | ✅ |
| 7 | Rozetler: test rozeti + restorasyon rozeti kaydediliyor, kartta görünüyor | ✅ | ✅ | ✅ |
| 7b | `/eser/yok` → "Sayfa bulunamadı" | ✅ | ✅ | ✅ |
| 7c | Yatay taşma yok: `/`, iki eser, `/yonetim`, `/yonetim/yeni` | ✅ | ✅ | ✅ |

**Konsol:** Uygulamaya ait hata yok, uygulama adreslerinde 4xx/5xx yok.
360TR oynatıcısı kendi içinde `krpano.get is not a function` hataları veriyor (iframe içi, bizim kod değil; oynatıcı çalışıyor).

## Bulunan küçük sorunlar

1. **[Düşük]** Yönetim listesindeki bağlantıların erişilebilir adında fazladan boşluk: ekran okuyucu "Düzenle : Bursa Ulu Camii" okuyor
   (`src/pages/Yonetim.tsx`, `sr-only` span). İşlevi etkilemiyor.
2. **[Bilgi]** 360° tur internet gerektiriyor; Brave Shields gibi engelleyiciler iframe'i durdurabiliyor (yedek bağlantı mevcut).
3. **[Bilgi]** Three.js parçası 568 kB (gzip 143 kB); yalnızca maket/gezinti açılınca yükleniyor, ana sayfa etkilenmiyor.

## Test edilmeyenler

- Gerçek telefon ve iOS eğim (jiroskop) izni — yalnız tarayıcı benzetimiyle
- Gerçek GPU'lu cihazda performans (testler yazılımsal WebGL ile yapıldı; gerçek cihazda daha hızlı olmalı)
- Ekran okuyucuyla (NVDA/VoiceOver) manuel dinleme

## Demo akışı önerisi (3 dk)

1. Ana sayfa (10 sn) → **Ulu Camii**: "Maketi eline al" → çevir → **Parçala** (payeler, şadırvan) → Birleştir (40 sn)
2. "360° turu başlat" → mihraptan abdest havuzuna geç (30 sn) — *internet şart; yedek video hazır olsun*
3. **Muradiye**: Sanal gezinti → avlu → türbeler bahçesi → Cem Sultan Türbesi (30 sn)
4. Restorasyon görevi: 2–3 parça yerleştir, ipucunu göster (önceden çoğunu çözülmüş tutmak zaman kazandırır) (30 sn)
5. **Yönetim**: bir özeti değiştir → ana sayfada anında görünür → "kaynaksız içerik kaynaklı işaretlenemez" kuralı (30 sn)
