# KökXR final planı: açık işler

Biten görevler (G1–G6, G8–G18) ve günlük `_arsiv/docs/FINAL_PLANI-tam.md` dosyasına taşındı. Burada yalnız açık iş ve kullanıcı kararı bekleyen sorular kalır.

## Kurallar (değişmez)
- PUSH YOK. Her madde ayrı dal ve commit; commit öncesi `test:hizli` ve `build` geçmeli.
- **VR kodu (`src/components/maket/xr*`, VR sahneleri, atölyeler) değişmez.**
- Tarih, kişi, kaynak uydurulmaz; bilinmeyen alan boş kalır.
- Yeni bağımlılık için sorulur.

## Açık görev
- [!] **G7. veri/yeni-sehir:** Konya veya Hatay envanterinden 1 eser (kaynak: cilt+sayfa). Konya/Hatay PDF'i elle indirilmeli; ayrıntı aşağıda.

## Sabah sorulacaklar
- Lisanslar: çini fotoğrafı (muradiye-cini.jpg) kaynağı, 360TR gömme izni, derinlik modeli lisansı, vazo/kılıç modeli lisansı ve arşiv fotoğraflarının kullanım izni docs/guncel/lisanslar.md'de 'doğrulanmadı'. Organizasyona/sahibine sorulmalı.
- Erişilebilirlik: axe/Lighthouse çalıştırılamadı; yerine tests/erisilebilirlik.mjs ve docs/guncel/erisilebilirlik-raporu.md yazıldı. Gerçek axe raporu istenirse npx indirmesine izin ver. Ekran okuyucu ile elle tur yapılmadı.
- Harita: (güncelleme: 10 eserin kaynaklı koordinatı bağlandı, yeni 4 eser hâlâ yok) eserlerin doğrulanmış koordinatı yok. Eser.konum {enlem, boylam, kaynak} alanı hazır (kaynak zorunlu); koordinat verilince eser işaretleri ve rota çizgisi kendiliğinden çıkar. Şimdilik şehir işareti ve rota listeleri var. Harita OpenStreetMap karolarını internetten çeker.
- Topluluk katkıları şimdilik yalnız bu tarayıcıda (localStorage) saklanıyor. Buluta (`katkilar` tablosu) yazmak için anonim ziyaretçiye insert izni vermek gerekir (`sema.sql` bugün yalnız girişli kullanıcıya izin veriyor). Anonim katkıya izin verilsin mi? Spam riski var.
- G7 (Konya/Hatay eseri): Konya ve Hatay envanter PDF'leri `vakifkatilim.com.tr/documents/KurumsalIletisim/...` adreslerinde. Betik indirmesi bu oturumda izin denetiminden geçmedi (ayrıca Firecrawl kredisi bitti). Çözüm: PDF'i tarayıcıdan indirip `~/Downloads`'a koy; metni macOS PDFKit ile çıkarıp 1 eser eklerim (kaynak cilt+sayfa). Konya/Hatay Drive'da yok (yalnız Bursa arşivi).
- G6 notu: Yeni 4 eserin fotoğrafı yok (Drive görselleri 2–144 MB, araçla indirilemiyor); eser sayfaları fotoğrafsız çalışır. Fotoğraf eklenecekse el ile küçültülüp `public/gorseller/<eser-id>/` altına, `kredi` alanıyla konmalı.
- Vakıf Katılım yayın adresleri (`src/data/vrEserler.ts`) doğru görünüyor (sayfadaki bağlantılarla aynı); bot istekleri 404 alıyor, tarayıcıda açılır.
- APK: (güncelleme: debug APK derlendi, `docs/apk.md`; telefonda denenmedi) JDK 21 kurulu değil (makinede 17). Kurulumu sistem değişikliği olduğu için yapmadım. `brew install --cask temurin@21` sonrası `docs/apk.md` adımlarıyla APK derlenir.
- Supabase tabloları henüz kurulu değil (REST `eserler` 404). `docs/supabase-kurulum.md` adımlarını yap; kurulana kadar yönetim giriş istemez, yerel kayıtla çalışır. Kurulduktan sonra giriş, kayıt, onay ve görsel yükleme gerçek sunucuda denenmeli.
- `tests/kilic.mjs` 1280'de zaman aşımı: G17'de eski master'da (60d7787, FINAL_PLANI öncesi) aynı hata çıktı; yeni işlerden kaynaklanmıyor. Tıklanan öğe yazılımsal çizimde 'stable' olmuyor (animasyon). Gerçek cihazda/tarayıcıda elle denenmeli.
