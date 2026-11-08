# KökXR — final planı (2 kişi, 4 iş hattı)

Güncelleme: 8 Kasım 2026, sabah · Teslim: **8 Kasım Pazar 12.30 (Türkiye saati)** · Sunum: **5 dakika**.
Dal: `main` (`feature/maket-vr` ve UX yenilemesi birleşti). Önceki planlar: `docs/archive/2026-11-07-plan-final-review.md`, `docs/archive/2026-11-07-plan-before-final-review.md`.
İşaretler: `[x]` yapıldı ve doğrulandı · `[~]` yapıldı, cihazda/canlıda doğrulanmadı · `[ ]` açık · `[-]` artık gerekmiyor.

## 1. Verilen kararlar

| Konu | Karar |
|---|---|
| Çalışma alanı | **Serbest (XR)** |
| Platform | Masaüstü web; mobil web desteği; Quest/WebXR ve AR yalnız cihazda doğrulanan kapsamda |
| Quest | Bu gece ve yarın sabah elde; VR düzeltmeleri cihazda doğrulanır |
| Ses | Yeni dosya yok; **mevcut 7 konumlu anlatım** (`public/sesler/*.mp3`), VR'da ve masaüstü iç mekânda |
| Mermer | Şadırvan, duvar/sütun/mihrap ve zemin döşeme yanlış görünüyordu (üst üste binme) |
| Ekip | 2 kişi, her biri AI ile; iş 4 hat olarak düşünülür, hatlar 2 kişiye bölünür |

Değer önerisi: **“Bursa’nın vakıf eserlerini kaynaklarıyla keşfet; temsilî 3B mekânda gezerek yapı ayrıntılarıyla bağ kur.”**
Şartname 5.1.1: çoklu eser, tarihçe/görsel/kaynak, ekleme/düzenleme, canlı uçtan uca demo.
“Akademik onaylı”, “1:1 dijital ikiz”, “öğrenmeyi artırır” gibi doğrulanmamış iddialar kullanılmaz.

## 2. Durum (8 Kasım 2026, `main` 641ebcb sonrası)

**Yapıldı**
- Canlı: `kokxr.vercel.app` Vercel'de Ready (Production). Vercel yalnız yetkili commit yazarının commit'ini yayınlıyor (`metaskin`); `selamisimsek` ve `Muhammet Ali Divan` commit'leri Blocked olur. Geçici çözüm: yetkili yazarla commit + push. Kalıcı çözüm panelde (Settings → Members/Git).
- 706 eser kaydı; 340 yapılık envanter; 39 eserde açık `inventoryId`, kalanı `inventoryLinks.ts` ile bağlanır.
- Eserler sayfası: şehir/ilçe/tür filtresi, arama, sayfalama. Tür verisi `src/content/artifact-types.json`.
- Quiz arayüzde (`Quiz.tsx`); formdaki 3 soru zorunluluğu bununla tutarlı, kaldırılmayacak.
- Neon Postgres + API: 706 eser veritabanında; editör/küratör girişi, onay/ret/geri al/sil, işlem kaydı, sunucu tarafı doğrulama. Admin: panel, eserler, onay kuyruğu, medya, envanter, kayıt (`/admin/*`). Neon Object Storage: görseller `/api/media` üzerinden, admin'den yükleme. Yerelde uçtan uca doğrulandı; Vercel'de ortam değişkenleri girildi (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, AWS_*), **canlıda giriş ve ekleme denenmedi**.
- Ana sayfa (`/`): VR, AR ve keşfe üç giriş. Eser haritası (Leaflet + OpenStreetMap, yaklaşık konumlar).
- AR: Ulu Camii ve vazo, ayrıca `xrSession` model bağımsız olduğu için tüm maketler; masaya yerleştirme, oda ışığı. **Cihazda denenmedi.**
- Maketler: 10 temsilî maket; Mevlâna (Konya) ve Sokullu (Payas) maketleri eklendi, ikisinin yürünebilir iç mekânı var. Test çıktısı hâlâ "10 with a scale model" diyor, sayı doğrulanmalı.
- Mermer: şadırvan döşemesi ile `floor.ts` mermer ızgarası aynı yükseklikte çakışıyordu (z-fighting); düzeltildi, masaüstünde önce/sonra ekran görüntüsüyle doğrulandı.
- Duvar/sütun/mihrap/minber: masaüstünde taranıp temiz çıktı.
- Ses: anlatım yalnız Ulu Camii'nde çalar (diğer binalar aynı nokta kimliklerini paylaşıyordu); askıdaki ses bağlamı yeniden açılır; masaüstü iç mekânda da yakınlıkla çalar, `AudioBufferSourceNode.start` sayımıyla doğrulandı (19 sn şadırvan kaydı).
- `test:hizli` geçti (8 Kasım, `main` 641ebcb).

**Açık**
- Quest denemesi: mermer, ses, AR cihazda görülmedi. Headless Quest kullanıcı aracısı boş sahne veriyor (neden ayrıştırılmadı).
- `test:tarayici` ve `test:e2e`: bu birleşimden sonra baştan çalıştırılmadı (bkz. §9).
- Tarihsel doğrulama ve fotoğraf izin belgeleri yapılmadı. Kayıtlar “Kaynaklı bilgi”dir, elle doğrulanmış değildir. Vercel build'i `public/images` (667 MB) dahil; izinler doğrulanmadı.
- Yok: yüksek kontrast ve yazı boyutu kontrolü.
- Mevlâna/Sokullu iç mekânları mermer/üst üste binme için taranmadı.

## 3. İş hatları ve kişi dağılımı

Her hat tek kişiye aittir. Aynı dosyada iki AI çalışmaz. `App.tsx` yalnız Kişi 2.

### Kişi 1 — VR / cihaz (hat A + hat C)

Dosya sınırı: `src/features/scale-models/`, `src/shared/xr/`, `src/features/workshops/`, `public/sesler/`, ilgili testler.

**Hat A — Mermer düzeltmesi (öncelik 1)**
- [x] Sorunu tarif et: şadırvan döşemesinde şerit şerit titreşme (iki mermer katmanı aynı yükseklikte).
- [x] Masaüstü yolunda şadırvan, mihrap, minber, levha, doğu kapısı noktalarını tara.
- [x] `fountain.ts` döşemesini 1 cm yukarı al; `floor.ts` koyu mermer kutuların üstünü ızgaradan 1 cm aşağı al.
- [x] `test:hizli` ve masaüstünde ikinci ekran görüntüsü: titreşme gitti.
- [~] Quest’te aynı noktalardan ekran görüntüsü; `lightDevice()` (lite) yolunda sorun var mı?
- [ ] Mevlâna ve Sokullu iç mekânlarını aynı yöntemle tara.

**Hat C — VR ses + cihaz kalitesi (öncelik 2)**
- [x] Anlatımı yalnız Ulu Camii'ne bağla (`narrated`), askıdaki ses bağlamını yeniden aç.
- [x] Masaüstü iç mekâna aynı yakınlık anlatımı: tıklama/tuşla açılır, VR'a girince masaüstü anlatımı susar.
- [~] 7 anlatımın (kapı, şadırvan, minber, mihrap, kubbeler, hat, Kâbe örtüsü) Quest’te tetiklenmesi, birbirini kesmemesi, çıkışta durması, yeniden girişte çalışması.
- [~] Duyulur ses seviyesi; anlatım metin karşılığı (kartta yazı) kontrolü.
- [ ] `model-interior` test zaman aşımını ayrıştır (§9'daki sonuca bak).
- [ ] AR'ı gerçek cihazda dene (masaya yerleştirme, ışık). Denenmeden sunumda “çalışıyor” deme.
- [ ] Cihazda duyulmayan sesi sunumda vaat etme.

### Kişi 2 — Ürün / veri / sunum (hat B + hat D)

Dosya sınırı: `src/features/admin/`, `src/domain/`, `src/content/artifacts/*.json`, `src/features/places/`, `src/features/artifacts/`, `src/app/App.tsx`, `e2e/`, sunum dosyaları.

**Hat B — Ürün ve veri (öncelik 1)**
- [ ] Demo eserlerini seç: Ulu Camii + kaynakları kontrol edilmiş ikinci eser.
- [ ] Demo kayıtlarının tarihçe ve kaynak sayfalarını sağlanan kitapla elle doğrula. Topluca isim tahminiyle bağlama.
- [x] Envanter → eser bağlantıları: 39 açık `inventoryId`, kalanı `inventoryLinks.ts`.
- [-] Formdaki zorunlu 3 quiz sorusunu kaldır: quiz arayüzde geri geldi, kaldırılmayacak.
- [~] Ekle → onay kuyruğu → yayın → listede gör → düzenle akışını **canlıda** dene (yerelde doğrulandı).
- [~] Eksik zorunlu alanla kayıt engellenir; kaynaksız “Kaynaklı bilgi” seçilemez (sunucu doğrulaması var, canlıda denenmedi).
- [ ] Fotoğraf izinleri: izni belirsiz görseli kamuya açık yayında bırakma. Şu an canlı build fotoğraflı.
- [x] E2E eskimiş kontrolleri güncellendi (anlık `.count()`, sayfalı liste); yeniden çalıştırılacak.

**Hat D — Sunum ve prova (öncelik 2, ama erken başlar)**
- [ ] 6 slaytlık sunumu ürünle eşitle (aşağıda §6); takım görevleri, gerçek 42 kampüsü, bağlantılar.
- [ ] Eski PPTX’ten çıkarılacaklar: 1:1 dijital ikiz, zaman slider’ı, “akademisyen onaylı”, “her cihaz”. KökMobil ve öğretmen paneli yol haritasına.
- [x] Moderasyon akışı artık var (onay/ret kuyruğu, işlem kaydı); sunumda “yayın öncesi moderasyon” de, ama canlıda denendiğinden emin olmadan “çalışıyor” deme.
- [ ] 60–90 sn yedek video (Kişi 1’den cihaz kaydı alınır), yerel build, ikinci bilgisayar kopyası.
- [ ] Süre tutarak 3 prova; jüri soruları (§7).

Not: Kişi 2 yoğun; **zaman daralırsa kes**: ikinci eser doğrulamasından kalan yarısı, kılıç atölyesi.

## 4. Sıra

1. [x] Demo eserleri ve hat dağılımı, bu gece mermer.
2. [x] Mermer, ses, `main` birleşimleri, Vercel yayını.
3. **Şimdi:** `test:tarayici` + `test:e2e`, Quest denemesi, canlı site kontrolü (admin girişi, ses, şadırvan).
4. **Pazar 08.30–10.15:** Kişi 1 Quest'te; Kişi 2 başarısız testler + slaytlar.
5. **10.15–11.15:** süre tutarak 3 prova.
6. **11.15–11.45:** PPTX/PDF, video, kablo, görüntü aktarımı, son kontrol.
7. **11.45:** sürüm kilidi. Sonrası yalnız sunumu engelleyen arıza.
8. **12.30:** sunum.

## 5. Kabul ölçütleri

- Mermer: şadırvan, duvar/sütun/mihrap, zemin Quest’te ve masaüstünde doğru görünür (önce/sonra ekran görüntüsü). Masaüstü: [x]; Quest: [ ].
- Ses: 7 anlatım Quest’te duyuldu, birbirini kesmedi, çıkış/yeniden girişte çalıştı. Doğrulanmadıysa sunumda ses vaadi yok.
- Ürün: çoklu keşif + fotoğraf/kaynak + ekleme/düzenleme kesintisiz.
- Testler: `test:hizli` yeşil [x]; `test:tarayici` ve `test:e2e` yeşil ya da başarısız akış demodan çıkarıldı [ ].
- Sunum çalışan ürünle aynı şeyi söylüyor; yedek video ve ikinci kopya hazır.

## 6. Sunum — 5 dakika, 6 slayt

| Süre | Bölüm | Şartname başlığı |
|---|---|---|
| 00.00–00.25 | Künye, Serbest (XR), takım, kampüs | Künye ve takım |
| 00.25–00.55 | Katalogdan mekânsal ve kaynaklı keşfe geçiş | Problem, vizyon |
| 00.55–01.20 | Akış şeması; klavye, alt metin, okunurluk | UX, erişilebilirlik |
| 01.20–03.50 | **Canlı demo** | MVP |
| 03.50–04.30 | React/TS/Vite + Three.js/WebXR; Neon Postgres + API; moderasyon; test | Mimari, veri, kalite |
| 04.30–05.00 | Çalışan/gelecek ayrımı, yol haritası (yeni şehir, öğretmen paneli), teşekkür | Yol haritası, kapanış |

Canlı demo (150 sn): Bursa + ilçe/tür filtresi (25) → eser, fotoğraf, kaynak (25) → Ulu Camii iç mekân + mermer + bir sesli anlatım (45) → vazo etkileşimi (20) → önceden hazır temsilî kaydı ekle/onayla (35).
Quest geçişi sığmazsa masaüstü; VR/AR doğrulama durumu açıkça söylenir.

## 7. Jüri soruları (hazırlık)

- Veri nereden, doğrulama nasıl? → Sağlanan kitap, kaynak/sayfa alanı; elle doğrulanan kayıt sayısı kadar söyle.
- Yeni şehir nasıl eklenir? → Aynı veri modeli; Konya ve Hatay kayıtları eklendi, boş şehir “içerik yok” der.
- Moderasyon/güvenlik? → Editör/küratör girişi, onay/ret kuyruğu, işlem kaydı, sunucu tarafı doğrulama.
- 3B model gerçek mi? → Temsilî, kodla üretilmiş; tarama veya belgelenmiş rekonstrüksiyon değil.
- Ölçeklenebilirlik: Neon Postgres + nesne depolama; yüzlerce eser için tasarlandı, 706 kayıt yüklü.
- Fotoğraf izinleri? → Belgelenmemiş olanlar için dürüst ol: izin süreci sürüyor; kredi satırı izin değildir.

## 8. P2 — finalden sonra

Zaman katmanı, yeni 3B model, 360° tur, öğretmen paneli, öğrenme analitiği, yüksek kontrast ve yazı boyutu kontrolü, kalan şehirler (`docs/admin-panel-plan.md` aşamaları).
`main` birleşmeleri ve kamuya yayın için önce sorulur.

## 9. Test kaydı

- 8 Kasım: `test:hizli` geçti (tür denetimi dahil, 641ebcb).
- 8 Kasım: `test:tarayici` (TEST_PORT=4187, yazılım render): derleme geçti; `model-xr-button` (164 sn) ve `vase-xr-button` (13 sn) PASS; `inventory-list` ve `model-interior` bu satır yazılırken sürüyordu, sonuçları bilinmiyor.
- `test:e2e` çalıştırılmadı.
