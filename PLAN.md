# KökXR — final planı (2 kişi, 4 iş hattı)

Güncelleme: 7 Kasım 2026, gece · Teslim: **8 Kasım Pazar 12.30 (Türkiye saati)** · Sunum: **5 dakika**.
Dal: `feature/maket-vr`. Önceki planlar: `docs/archive/2026-11-07-plan-final-review.md`, `docs/archive/2026-11-07-plan-before-final-review.md`.

## 1. Verilen kararlar

| Konu | Karar |
|---|---|
| Çalışma alanı | **Serbest (XR)** |
| Platform | Masaüstü web; mobil web desteği; Quest/WebXR yalnız cihazda doğrulanan kapsamda |
| Quest | Bu gece ve yarın sabah elde; VR düzeltmeleri cihazda doğrulanır |
| Ses | Yeni dosya yok; **mevcut 7 konumlu anlatım** (`public/sesler/*.mp3`) VR'da güvenilir çalışacak |
| Mermer | Şadırvan gövdesi, duvar/sütun/mihrap ve zemin döşeme yanlış görünüyor (doku/materyal) |
| Ekip | 2 kişi, her biri AI ile; iş 4 hat olarak düşünülür, hatlar 2 kişiye bölünür |

Değer önerisi: **“Bursa’nın vakıf eserlerini kaynaklarıyla keşfet; temsilî 3B mekânda gezerek yapı ayrıntılarıyla bağ kur.”**
Şartname 5.1.1: çoklu eser, tarihçe/görsel/kaynak, ekleme/düzenleme, canlı uçtan uca demo.
“Akademik onaylı”, “1:1 dijital ikiz”, “öğrenmeyi artırır” gibi doğrulanmamış iddialar kullanılmaz.

## 2. Durum (inceleme kaydı)

- `test:hizli` geçti. `test:tarayici` 3/4: `model-interior` 30 sn bekleme sınırına takıldı, nedeni ayrıştırılmadı.
- E2E başarısız (6/9, 7/9, 6/9). Testler yönlendirmeden sonra anlık `.count()` yapıyor; bekleyen ayrı kontrolde 280 kart, ekleme, düzenleme ve kalıcılık geçti. Büyük olasılıkla test zamanlaması; kesin değil.
- Hiçbir eserde `inventoryId` dolu değil; envanterden eser sayfasına bağlantı güvenilir değil.
- Yeni eser formu hâlâ 3 quiz sorusu istiyor; quiz arayüzden kaldırılmış.
- Quest denemesi, tarihsel doğrulama ve fotoğraf izin belgeleri yapılmadı.
- Kodda mermer: `uluMosqueFloor.ts` (üretilen doku), `uluMosqueTextures.ts` satır ~547–563 (`marble`, `marblePaving`, `innerMarble`; `lightDevice()` ise “lite” yolu). Ses: `xrNarration.ts`, 7 kayıt.

## 3. İş hatları ve kişi dağılımı

Her hat tek kişiye aittir. Aynı dosyada iki AI çalışmaz. `App.tsx` yalnız Kişi 2.

### Kişi 1 — VR / cihaz (hat A + hat C)

Dosya sınırı: `src/features/scale-models/`, `src/shared/xr/`, `src/features/workshops/`, `public/sesler/`, ilgili testler.

**Hat A — Mermer düzeltmesi (öncelik 1)**
- [ ] Sorunu tarif et: Quest ve masaüstünde şadırvan gövdesi, duvar/sütun/mihrap, zemin için ekran görüntüsü al; hangisinde ne yanlış (renk, parlaklık, tekrar deseni, damar yönü) yaz.
- [ ] `lightDevice()` (lite) yolu ile masaüstü yolunu karşılaştır; sorun yalnız Quest’te mi?
- [ ] `marbleBodyTexture` (şadırvan), `marblePavingTextures` (zemin), `marble`/`marbleDark` (duvar/sütun/mihrap) malzemelerini tek tek düzelt; birini düzeltince diğerini bozma.
- [ ] Doğrula: `test:hizli`, sonra Quest’te aynı noktalardan ikinci ekran görüntüsü.

**Hat C — VR ses + cihaz kalitesi (öncelik 2)**
- [ ] 7 anlatımın (kapı, şadırvan, minber, mihrap, kubbeler, hat, Kâbe örtüsü) Quest’te yakınlıkla tetiklenmesini, birbirini kesmemesini ve çıkışta durmasını dene.
- [ ] Duyulur ses seviyesi, oturum çıkışı + yeniden giriş, anlatım metin karşılığı (kartta yazı) kontrolü.
- [ ] Çalmayan veya geç başlayan kayıt varsa nedenini bul ve düzelt (`xrNarration.ts`, Web Audio açma).
- [ ] `model-interior` test zaman aşımını ayrıştır: ürün hatası mı, yazılım render yükü mü? Hatalıysa düzelt; değilse testin bekleme koşulunu düzelt.
- [ ] Cihazda duyulmayan sesi sunumda vaat etme.

### Kişi 2 — Ürün / veri / sunum (hat B + hat D)

Dosya sınırı: `src/features/admin/`, `src/domain/`, `src/content/artifacts/*.json`, `src/features/places/`, `src/features/artifacts/`, `src/app/App.tsx`, `e2e/`, sunum dosyaları.

**Hat B — Ürün ve veri (öncelik 1)**
- [ ] Demo eserlerini seç: Ulu Camii + kaynakları kontrol edilmiş ikinci eser.
- [ ] Demo kayıtlarının tarihçe ve kaynak sayfalarını sağlanan kitapla elle doğrula; envanter bağlantılarını açık `inventoryId` ile düzelt. Topluca isim tahminiyle bağlama.
- [ ] Formdaki zorunlu 3 quiz sorusunu kaldır; mevcut kayıtlar ve içe aktarma uyumlu kalsın.
- [ ] Ekle → listede gör → düzenle → yenile → gör akışını doğrula; demo kaydı “Temsilî demo kaydı” olarak işaretli.
- [ ] Eksik zorunlu alanla kayıt engellenir; kaynaksız “Kaynaklı bilgi” seçilemez.
- [ ] Fotoğraf izinleri: izni belirsiz görseli kamuya açık dosyada bırakma. Yayın yapılmaz.
- [ ] E2E yönlendirme sonrası bekleme düzeltmesi (anlık `.count()` yerine koşul bekle).

**Hat D — Sunum ve prova (öncelik 2, ama erken başlar)**
- [ ] 6 slaytlık sunumu ürünle eşitle (aşağıda §6); takım görevleri, gerçek 42 kampüsü, bağlantılar.
- [ ] Eski PPTX’ten çıkarılacaklar: 1:1 dijital ikiz, zaman slider’ı, “akademisyen onaylı”, AR/öğretmen paneli/KökMobil (yol haritasına), “her cihaz”.
- [ ] Şartnamenin eksik başlığı **moderasyon akışı**: yerel `/admin` bir prototiptir; yayın öncesi moderasyon “planlı” olarak yaz, “var” deme.
- [ ] 60–90 sn yedek video (Kişi 1’den cihaz kaydı alınır), yerel build, ikinci bilgisayar kopyası.
- [ ] Süre tutarak 3 prova; jüri soruları (§7).

Not: Kişi 2 yoğun; **zaman daralırsa kes**: Eserler’e arama, kılıç atölyesi, ikinci eser doğrulamasından kalan yarısı.

## 4. Sıra

1. **Hemen (ortak, 15 dk):** demo eserleri, kimin hangi hattı aldığı, Quest erişimi. Kişi 1 bu gece mermere başlar.
2. **Bu gece:** Kişi 1 hat A; Kişi 2 hat B (form + veri). Her küçük değişiklikten sonra `test:hizli`.
3. **Gece sonu:** kodlar birleşir (Kişi 2 koordine eder), tam test turu başlar, yeni özellik durur.
4. **Pazar 08.30–10.15:** Kişi 1 hat C Quest’te; Kişi 2 başarısız testler + slaytlar.
5. **10.15–11.15:** süre tutarak 3 prova.
6. **11.15–11.45:** PPTX/PDF, video, kablo, görüntü aktarımı, son kontrol.
7. **11.45:** sürüm kilidi. Sonrası yalnız sunumu engelleyen arıza.
8. **12.30:** sunum.

## 5. Kabul ölçütleri

- Mermer: şadırvan, duvar/sütun/mihrap, zemin Quest’te ve masaüstünde doğru görünür (önce/sonra ekran görüntüsü).
- Ses: 7 anlatım Quest’te duyuldu, birbirini kesmedi, çıkış/yeniden girişte çalıştı. Doğrulanmadıysa sunumda ses vaadi yok.
- Ürün: çoklu keşif + fotoğraf/kaynak + ekleme/düzenleme kesintisiz.
- Testler: `test:hizli` yeşil; `test:tarayici` ve `test:e2e` yeşil ya da başarısız akış demodan çıkarıldı.
- Sunum çalışan ürünle aynı şeyi söylüyor; yedek video ve ikinci kopya hazır.

## 6. Sunum — 5 dakika, 6 slayt

| Süre | Bölüm | Şartname başlığı |
|---|---|---|
| 00.00–00.25 | Künye, Serbest (XR), takım, kampüs | Künye ve takım |
| 00.25–00.55 | Katalogdan mekânsal ve kaynaklı keşfe geçiş | Problem, vizyon |
| 00.55–01.20 | Akış şeması; klavye, alt metin, okunurluk | UX, erişilebilirlik |
| 01.20–03.50 | **Canlı demo** | MVP |
| 03.50–04.30 | React/TS/Vite + Three.js/WebXR; JSON/kaynak ilişkisi; localStorage sınırı; test | Mimari, veri, kalite |
| 04.30–05.00 | Çalışan/gelecek ayrımı, yol haritası (yeni şehir, moderasyon, AR) | Yol haritası, kapanış |

Canlı demo (150 sn): Bursa + ilçe/tür filtresi (25) → eser, fotoğraf, kaynak (25) → Ulu Camii iç mekân + mermer + bir sesli anlatım (45) → vazo etkileşimi (20) → önceden hazır temsilî kaydı ekle/düzenle (35).
Quest geçişi sığmazsa masaüstü; VR doğrulama durumu açıkça söylenir.

## 7. Jüri soruları (hazırlık)

- Veri nereden, doğrulama nasıl? → Sağlanan kitap, kaynak/sayfa alanı; bu geceki kontrol kapsamı kadar söyle.
- Yeni şehir nasıl eklenir? → Aynı JSON modeli; boş şehir “içerik yok” der.
- Moderasyon/güvenlik? → Form doğrulaması var; merkezî moderasyon planlı.
- 3B model gerçek mi? → Temsilî, kodla üretilmiş; tarama veya belgelenmiş rekonstrüksiyon değil.
- Ölçeklenebilirlik: SQL/sunucu yok; bunu yol haritasına koy.

## 8. P2 — finalden sonra

Yeni şehir içeriği, AR, zaman katmanı, yeni 3B model, 360° tur, öğretmen paneli, öğrenme analitiği, sunuculu tam admin paneli (`docs/admin-panel-plan.md` korunur, iptal edilmez).
`master` birleştirmesi ve kamuya yayın bu plan kapsamında değil; önce sorulur.
