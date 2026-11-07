# KökXR — final hazırlık planı

Güncelleme: 7 Kasım 2026, gece · Teslim hedefi: **8 Kasım Pazar 12.30 (Türkiye saati)**.
Sunum: **toplam 5 dakika**. Ekip: **4 kişi, her biri AI kullanacak**.
İncelenen çalışma dalı: `feature/maket-vr`. Bu incelemede uygulama kodu değiştirilmedi.
Önceki plan: `docs/archive/2026-11-07-plan-before-final-review.md`.

## 1. Karar ve hedef

**Önce şartnamenin çalışan temel akışlarını güvenceye al; ardından tek bir güçlü XR deneyimini göster.**

Önerilen değer önerisi: **“Bursa’nın vakıf eserlerini kaynaklarıyla keşfet; temsilî 3B mekânda gezerek yapı ayrıntılarıyla bağ kur.”**

Çalışma alanı önerisi: Serbest / XR ve oyunlaştırma; başvurudaki gerçek kategoriyle tutarlı yazılmalı.
Platform: masaüstü web; mobil web desteği; Meta Quest/WebXR yalnız cihazda doğrulanan kapsamda.
Araştırmacı için değer: kaynak ve sayfa bilgisine ulaşma. Gençler için değer: mekânsal keşif ve görev.
“Akademik olarak doğrulanmış referans” ve “öğrenmeyi artırdığı kanıtlandı” denmez; bunlar bu incelemede doğrulanmadı.

Şartname 5.1.1 çoklu eser, tarihçe/görsel/kaynak, ekleme/düzenleme ve canlı uçtan uca demo istiyor.
SQL veritabanı, sunucu, AR, quiz, öğretmen paneli veya bütün erişilebilirlik araçlarının birlikte bulunmasını zorunlu tutmuyor.
Topluluk katkısı açılırsa yayımlama öncesi moderasyon gerekli (5.1.3); bugünkü yerel yönetim ekranı bu sistem değildir.
Puan ağırlıkları dokümanda verilmemiş; yüzde veya kazanma garantisi üretilmez.

## 2. Koddan görülen durum ve eksikler

| Konu | Kanıtlanan mevcut durum | Final için karar |
|---|---|---|
| Çoklu eser | JSON klasöründe 280 eser kaydı; `/artifacts` listesi | Sayı içerik doğruluğunun kanıtı değildir. Demoda seçilen 2–3 kayıt kontrol edilir. |
| Envanter | 340 yapı, ilçe/tür/arama ve yalnız maket filtresi | “340 adet 3B eser” denmez. |
| Harita | Türkiye → şehir → Bursa yapıları; boş şehirlerde içerik yok bilgisi | Sunumda Bursa üzerinden ilerle. Şehir seçimi ile ilçe/tür filtresinin kapsamını doğru anlat. |
| 3B | 10 temsilî maket; Ulu Camii iç mekânı ve kaynaklı bilgi kartları | 1:1 dijital ikiz, tarama veya belgelenmiş rekonstrüksiyon denmez. |
| Galeri ve kaynak | Eser detayında fotoğraf, tarihçe, kaynak ve keşif noktaları | Seçili kayıtların görsel yolları ve kaynak sayfaları elle kontrol edilir. |
| Ekleme/düzenleme | `/admin` ve form; doğrulama, JSON aktarımı, localStorage | Gerçek yerel prototip; başka tarayıcıya otomatik yayılmaz. Doğrudan adres/bookmark ile göster. |
| Yönetim formu | Yeni eser için 3 soru ve seçenekleri hâlâ zorunlu | Quiz kullanıcı arayüzünden kaldırılmış. Bu bağımlılığı sadeleştirmek öncelikli; quiz ekranını geri getirmek gerekmiyor. |
| Envanter → eser | Hiçbir eserde `inventoryId` dolu değil; tam sayfa bağlantısı bu alanı kullanıyor | Seçilen demo kayıtlarının açık kimlik eşleşmesini düzelt; kalanları isim tahminiyle topluca bağlama. |
| İlişki ayrıntısı | Envanterde 51 `artifactId` var; 41'i maketsiz alt yapıyı maketli külliye kaydına bağlıyor | Bu alan doğrudan tam eser eşleşmesi sayılamaz; alt yapı ile külliyeyi karıştırma. |
| Arama | 280 kartlık Eserler sayfasında arama/filtre yok; Mekanlar envanterinde var | Önce mevcut filtreyi demoda kullan. Zaman varsa Eserler'e basit arama ekle. |
| Erişilebilirlik | Atlama bağlantısı, odak yönetimi, alt metinler, klavye kontrolleri, azaltılmış hareket desteği | Ekran okuyucu ile tam uyumluluk iddia etme; seçili akışı klavye ve %200 büyütmede doğrula. |
| Ses | Ulu Camii VR için 7 anlatım kaydı ve yakınlıkla ses kodu var | Gerçek cihazda duyulmadan çalışan sunum vaadi yapılmaz; içerik ve metin karşılığı kontrol edilir. |
| Atölyeler | Temsilî vazo onarımı ve kılıç atölyesi | Vazo ana kısa örnek; kılıç süre kalırsa veya soru-cevapta. Tarihî esere birebir bağlılık iddia etme. |
| Veri mimarisi | TypeScript tipleri, JSON kayıtları ve kaynak kimlikleri; yerel üst katman | İlişkilendirilmiş içerik modeli olarak anlat. SQL/merkezî veritabanı var denmez. |
| Yayın ve lisans | Fotoğraf izinleri eski planda açık; `build:acik` fotoğrafları kaldırıyor, bir panel istisnası bırakıyor | Kredi satırı izin değildir. Kamuya yayın öncesi istisna dahil hak/izin kontrol edilir. Bu görev yayın yapmaz. |

### Eski sunumda mutlaka değişecek ifadeler

Kaynak: `docs/legacy/kokxr-presentation-v2.pptx` (3 slayt).

- “1:1 dijital ikiz / mekânı tarıyoruz” → **temsilî, kodla oluşturulan 3B maket**.
- “İlk yapıldığı döneme dön / zaman slider'ı” → çıkar; çalışan güncel arayüzde yok.
- “Akademisyen / küratör onaylı” → **kaynak bilgisi gösterilen içerik**; gerçek onay olmadan iddia edilmez.
- “Her cihaz / AR” → çalışan web ve cihazda doğrulanan WebXR kapsamı.
- KökMobil, öğretmen paneli, öğrenme ölçümü → **gelecek yol haritası**.
- “10 kat büyüt / eline al” → yalnız gerçekten gösterilen etkileşim ve ölçüde kullan.
- “Tek eser” → **çoklu keşif, tek odak demo senaryosu**.

## 3. P0 — olmazsa olmazlar

P0 bitmeden yeni AR, yeni model veya kapsamlı yönetim altyapısı başlanmaz.

- [ ] Demo eserlerini seç: Ulu Camii + kaynakları kontrol edilmiş ikinci eser + gerekiyorsa ekleme örneği.
- [ ] Harita/filtre → detay → fotoğraf → kaynak akışını kesintisiz göster.
- [ ] Demoda kullanılacak envanter satırlarının tam eser bağlantılarını açık kimliklerle doğrula/düzelt.
- [ ] Yeni eser formundaki gereksiz üç-soru zorunluluğunu sadeleştir; mevcut kayıtları ve içe aktarma uyumluluğunu koru. Alternatif: kod yetişmezse dürüstçe etiketli, önceden hazırlanmış örnek kayıtla mevcut ekleme akışını prova et.
- [ ] Eser ekle → listede gör → düzenle → yenile → aynı tarayıcıda değişikliği gör akışını doğrula. Demo verisini açıkça “Temsilî demo kaydı” olarak işaretle.
- [ ] Eksik zorunlu alanla kaydı engelle; kaynak olmadan “Kaynaklı bilgi” seçilemediğini göster.
- [ ] Demo kayıtlarının tarihçe ve kaynak sayfalarını sağlanan kitapla kontrol et. Otomatik şema testi tarihsel doğrulama yerine geçmez.
- [ ] Fotoğraf/görsel izin durumunu netleştir; kamuya açık dosyada belirsiz izinli görsel bırakma.
- [ ] Klavyeyle gezinme, görünür odak, galeri aç/kapat, hata odağı, 360 px ve %200 büyütme kontrolü.
- [ ] 6 slaytlık sunumu gerçek ürünle eşitle; takım görevleri, gerçek 42 kampüsü ve bağlantıları ekle.
- [ ] Son kodda hızlı + tarayıcı + e2e testlerini çalıştır; başarısız akışları gider veya demodan çıkar. E2E yönlendirme sonrası beklemelerini düzelt; iç mekân yükleme zaman aşımını gerçek demo cihazında incele.
- [ ] Canlı demo + 60–90 saniyelik yedek video + yerel build + ikinci bilgisayar kopyası hazırla.

## 4. P1 — bizi öne çıkaran kısa deneyim

**Ana fark:** aynı eserin fotoğrafı, kaynaklı bilgisi ve temsilî iç mekânını tek öğrenme akışında buluşturmak.

- [ ] Ulu Camii: maketi aç → içeri gir → bir ayrıntıya yaklaş → kaynaklı bilgi kartını göster.
- [ ] Quest varsa: giriş, kontrolcü, kart okunurluğu, ses, oturumdan çıkış ve yeniden giriş gerçek cihazda denenir.
- [ ] Quest yoksa veya kararsızsa: aynı mekânsal keşfi masaüstünde canlı göster; VR doğrulama durumunu açıkça belirt.
- [ ] Vazo: 15–20 saniyede tek parça etkileşimi; tamamını bitirmeyi vaat etme. Belirli tarihî eseri temsil etmediği etiketi görünür.
- [ ] Tek bir erişilebilir etkileşimi canlı göster: klavye ile bilgi açma veya galeri. Sesli anlatım ancak doğrulanırsa eklenir.
- [ ] Vakit kalırsa Eserler listesine basit arama; yeni tasarım çalışmasına dönüşmesin.

Kılıç etkileşimi güçlü bir yedek; Bursa vakıf mirasıyla bağını açıklamadan ana hikâyenin önüne geçmesin.

## 5. P2 — finalden sonraya bırakılacaklar

Yeni şehir içeriği, AR, tarihsel zaman katmanı, yeni 3B model, 360° tur, öğretmen paneli, öğrenme analitiği ve yeni büyük tasarım.

`docs/admin-panel-plan.md` içindeki sunucu planı önceki onayıyla korunur; bu plan onu iptal etmez.
Ancak 11 aşamalı tam paneli bu gece bitirmeyi finalin koşulu yapmak önerilmez.
Merkezî yayın zorunlu hale gelirse, P0 sonrası ayrı bir dikey akış gerekir: yetkili oturum → sunucu doğrulaması → taslak/yayın → ikinci tarayıcıda görme.
Bu akış tamamlanmadan giriş ekranı ekleyip güvenli yönetim veya merkezî kalıcılık var denmez.
Yeni eserlerin harita, envanter ve 3B modele otomatik dönüştüğü iddia edilmez.

## 6. Dört kişi + AI görev sınırları

Aşağıdaki dağılım öneridir; kişi isimleri ekip tarafından atanır.
Her AI oturumuna kendi dosya sınırı verilir; test geçmeden diğer işe başlanmaz.

| Sorumlu | Teslim | Dosya/sorumluluk sınırı |
|---|---|---|
| 1 — ürün / entegrasyon | Formda ekleme-düzenleme ve veri modeli uyumu; son kodu birleştirme | `src/features/admin/`, `src/domain/verification.ts`, gerekirse `src/domain/artifact.ts`; `App.tsx` yalnız bu kişi |
| 2 — veri / içerik | Demo kayıtlarında kaynak kontrolü, açık envanter eşleşmesi ve görsel izin listesi | Seçili `src/content/artifacts/*.json`, `src/features/places/InventoryList.tsx`, `InventoryPage.tsx`; ilişki düzeltmesine ait test yalnız bu kişi |
| 3 — cihaz / kalite | Quest ve masaüstü XR denemesi; hata raporu, final testleri ve video | `src/features/scale-models/`, `src/shared/xr/`, `src/features/workshops/`; ilgili testler ve kayıt araçları |
| 4 — sunum / prova | 6 slayt, 5 dakikalık metin, demo sırası ve jüri soruları | Sunum dosyası ve final anlatımı; kaynak kodunu değiştirmez. Arama P1'e alınırsa `ArtifactsPage.tsx` bu kişiye açıkça atanır. |

Ortak dosyaya ihtiyaç varsa önce 1 numaraya bildirilir. Aynı dosyada iki AI çalışmaz.
Değişiklikler küçük tutulur; bağımsız işler ayrı dal/çalışma kopyasında yapılır. Dal birleştirme ve yayın ayrıca koordine edilir.
`master` birleştirmesi ve kamuya yayın bu incelemenin kapsamında değildir.

## 7. Zaman planı — Türkiye saati

Bu çizelge tahmindir; ekip çalışma/dinlenme düzenine göre saatleri kaydırabilir. **12.30 sabit son sınır.**

| Zaman | Çıktı |
|---|---|
| Cumartesi 23.00–23.15 | Görev sahipleri, demo eserleri, Quest erişimi ve sunum kategorisi kesinleşsin. |
| 23.15–00.45 | Dört iş paralel: P0 form/bağlantı düzeltmeleri; kaynak/izin kontrolü; cihaz denemesi; slayt taslağı. |
| 00.45–01.30 | Kod birleştirme, hızlı ve ilgili testler; tam test turunu başlat. En az bir baştan sona demo. Yeni özellikleri durdur. |
| Pazar 08.30–09.30 | Başarısız testler ve yalnız demoyu bozan hatalar; cihaz sonucuna göre VR/masaüstü kararı. |
| 09.30–10.15 | Son build, final testleri, yedek video ve ikinci cihaz kopyası. |
| 10.15–11.15 | Süre tutarak üç prova; 5 dakikayı aşan bölümü kes. |
| 11.15–11.45 | PPTX/PDF, video, bağlantılar, kablolar ve görüntü aktarımı son kontrol. |
| **11.45** | **Hazır sürüm kilidi.** Bundan sonra yalnız sunumu engelleyen arıza. |
| 11.45–12.30 | Teknik kurulum, dinlenme ve sorun payı. |

## 8. Beş dakikalık sunum — 6 slayt

| Süre | Slayt / canlı bölüm | Karşıladığı başlık |
|---|---|---|
| 00.00–00.25 | KökXR, gerçek kategori/platform, takım, kampüs, tek cümle değer | Künye ve takım |
| 00.25–00.55 | Fotoğraf/katalogdan mekânsal ve kaynaklı keşfe geçiş; hedef kullanıcı | Problem, vizyon ve özgün değer |
| 00.55–01.20 | Tek akış şeması; klavye, alt metin, okunurluk yaklaşımı | UX ve erişilebilirlik |
| 01.20–03.50 | **Canlı ürün demosu** | MVP, veri kullanımı ve kullanıcı değeri |
| 03.50–04.30 | React/TS/Vite + Three.js/WebXR; JSON/kaynak ilişkileri; localStorage sınırı; doğrulama ve test | Mimari, veri, güvenlik ve kalite |
| 04.30–05.00 | Çalışan/gelecek ayrımı, sürdürülebilirlik, bağlantı ve teşekkür | Yol haritası, kapanış ve soru-cevap geçişi |

Canlı demo, toplam 150 saniye:
1. 0–25 sn: Bursa seç → mevcut ilçe/tür filtresiyle çoklu keşif.
2. 25–50 sn: Seçili eser → fotoğraf → tarihçe/kaynak.
3. 50–90 sn: Ulu Camii temsilî iç mekân → bir kaynaklı bilgi kartı. Quest geçişi bu süreye sığmazsa masaüstü kullan.
4. 90–110 sn: Vazo atölyesinde tek bir etkileşim; temsilî model etiketi.
5. 110–150 sn: Önceden doldurulmuş temsilî yeni kaydı kaydet → Eserler'de gör → kısa düzenleme → tekrar gör. Metinleri sahnede yazma.

İki sekme aynı tarayıcıdaysa uygulama yenileme gerekebilir; oturumdan önce bunu prova et.
Demo ekleme örneği temiz bir tarayıcı profilinde hazırlanır; gerçek kayıtlara zarar vermeden sıfırlanabilir olmalı.
Sunum ana anlatıcısı + demo operatörü seçilsin; 5 dakikada gereksiz konuşmacı geçişi yapılmasın. Soru-cevapta herkes kendi alanını savunabilsin.

## 9. İnceleme ve test kaydı

İnceleme kaynakları: şartname bölüm 5; eski geliştirme planı ve üç slaytlık PPTX; önceki PLAN;
güncel rotalar, eser/galeri/harita/yönetim kodu, veri modeli, doğrulama, XR/ses kodu ve testler.
`docs/legacy/development-plan.md` içindeki Unity ve tek-eser kapsamı mevcut web ürününü yönetmek için güncel değildir.

- [x] `npm run test:hizli`: geçti. XR mantığı, ses seçimi, vazo/maket işlemleri, kredi ve envanter tutarlılığı dahil.
- [x] Tarayıcı komutundaki TypeScript + Vite build adımı geçti.
- [ ] `npm run test:tarayici`: **3/4 geçti**. `model-xr-button`, `vase-xr-button`, `inventory-list` geçti; `model-interior`, `.model-area canvas` için 30 saniyelik bekleme sınırına takıldı. Nedeni henüz ayrıştırılmadı; ürün hatası veya yalnız cihaz/yük etkisi diye kesinleştirilmez. Sandbox port kısıtı sonrası 4187'de bağımsız sunucu kullanıldı.
- [ ] E2E: 4191'de bağımsız sunucuda tamamlandı; **başarısız**. Chromium 1280: 6/9, Chromium 360: 7/9, Firefox 1280: 6/9 kontrol geçti. Başarısız kontroller açılış başlığı ve ekleme/düzenleme sonrası listeyle ilgili (360 px düzenleme kontrolü geçti). Testler yönlendirmeden sonra anlık `.count()` kontrolü yapıyor. Ayrı, ekranın hazır olmasını bekleyen Chromium kontrolünde 280 kart, ekleme, düzenleme ve yenileme sonrası kalıcılık **geçti**. Üç turda da JS hatası ve HTTP 404 görülmedi. Resmî E2E turu yeşil sayılmaz.
- [ ] Gerçek Quest denemesi: bu incelemede yapılmadı; cihazın mevcut olduğu henüz teyit edilmedi.
- [ ] Tarihsel doğrulama ve fotoğraf izin belgeleri: bu incelemede doğrulanmadı.

Final kabulü: çoklu keşif + fotoğraf/kaynak + ekleme/düzenleme kesintisiz; XR yalnız doğrulanan kapsamda;
5 dakika prova tamam; yedek video ve yerel kopyalar hazır; çalışan ürünle sunum aynı şeyi söylüyor.
