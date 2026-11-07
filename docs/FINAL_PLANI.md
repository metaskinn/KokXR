# KökXR final planı (şartname ve kazanma planına göre)

Durum: **TASLAK, onay bekliyor.** Onay gelmeden bu dosyadaki hiçbir madde uygulanmaz.
Kaynaklar: `docs/sartname.md` (5. bölüm), `docs/kokkod_kazanma_plani.md`, bu gece yapılan işler. Bu plan `docs/GECE_PLANI_2.md`'nin yerini alır; oradaki işler aşağıya taşındı.

## Kurallar (değişmez)
- PUSH YOK. Her madde ayrı dal ve commit; commit öncesi `test:hizli` ve `build` geçmeli.
- **VR kodu (`src/components/maket/xr*`, VR sahneleri, atölyeler) değişmez.** Yalnız VR'ın web/mobildeki yeri, menü ve metinleri değişir.
- Tarih, kişi, kaynak uydurulmaz; bilinmeyen alan boş kalır. Doğrulanmamış içerik kesin bilgi gibi sunulmaz.
- Yeni bağımlılık yalnız aşağıda "onaylı" yazanlar. `@supabase/supabase-js` zaten ekli. Onay: **Capacitor** (Android APK), **Leaflet** (harita). Başka paket için sorulur.
- Karar gereken yerde madde atlanır, "Sabah sorulacaklar"a yazılır.

## Şartname karşılığı: nerede duruyoruz

| Şartname maddesi | Durum | Boşluk → görev |
|---|---|---|
| 5.1.1 Çalışan mobil/masaüstü uygulama | PWA var, APK yok | G4, G5 |
| 5.1.1 Birden fazla eser, tarihçe+görsel+kaynak (kazanma planı: **en az 10 eser**) | Tam 10 eser var (sınırda), hepsi cami/külliye, yalnız Bursa | G6 (hedef en az 14: 10 + 3 yeni tür + 1 Konya/Hatay), G7 |
| 5.1.1 İçerik ekle/düzenle | Yönetim var; bulut yolu gerçek Supabase'e karşı denenmedi | G3 |
| 5.1.2 Yeni eser, **şehir ve içerik türü** eklenebilirlik | Şehir listesi kodda (`vrEserler.ts`); içerik türü sabit | G8 |
| 5.1.3 Kaynak göster, doğrulanmamışı kesin sunma | Var (rozet, kaynak satırı) | G12 (kitap karşılaştırması) |
| 5.1.3 Topluluk katkısı varsa moderasyon | Yalnız yeni eser onayı var; katkı formu yok | G9 |
| 5.1.4 Erişilebilirlik çalışan üründe | Yazı boyutu, kontrast, sesli dinle var; axe raporu yok | G10 |
| 5.1.5 Girdi doğrulama, test, README | Var; yönetim girişi bulutsuzken yok | G3, G11 |
| 5.2.1–2 Problem uyumu, yenilik, veri kullanımı | VR güçlü; web/mobil akış ve harita zayıf | G2, G8 |
| 5.4 Sunum + canlı demo + mimari + ölçek | Taslak yok | G13, G14 |

## Şartname kontrol listesi (her madde bir göreve bağlı)
- Çalışan uygulama (PWA/APK): G4 · birden fazla eser, en az 10: G6 · tarihçe/görsel/kaynak: G6, G12 · içerik ekle/düzenle: G3 · yeni eser/şehir/içerik türü: G8 · mimari ve veri modeli anlatımı: G13 · üçüncü taraf servislerin demoda çalışması (Supabase, 360tr gömme): G5 (çevrimdışı yedek, 360tr için yedek bağlantı) · açık kaynak lisansları: G11
- Kaynak gösterme, doğrulanmamışı kesin sunmama: G12 · topluluk moderasyonu: G9 · erişilebilirlik (alt metin, kontrast, yazı boyutu, sesli anlatım, klavye, renk körlüğü): G10 · girdi doğrulama, kişisel veri: G3, G9 · test: G1, G9, G17 · okunabilir kod, README: G11, G17
- Problem uyumu, yenilik, veri kullanımı: G13, G14 · takım çalışması, herkes teknik detaya hâkim: G18, `gorev_dagilimi.md` · sunum içeriği ve yalnız takım üyelerinin sunması: G13, G14

## Görevler

Sıra değer sırasıdır. `[ ]` yapılmadı, `[x]` bitti, `[!]` 2 denemede olmadı.

### A. Zemin (önce)
- [x] **G1. demo/hata-avi:** `tests/hata-avi.mjs` (yazıldı, çalıştırılmadı) ile tüm rotalar 1280/360 pikselde taranır; yalnız demoyu bozan hata düzeltilir. Bilinen: 360 pikselde `/atolye/kilic` yatay taşma.
- [x] **G2. arayuz/menu:** Menü yeniden düzeni (VR'a dokunmadan): öne **Keşfet, Harita, Yolculuk**; **Deneyimler** grubu altına VR Eserler, Vazo/Kılıç/Çini atölyeleri, Öğretmen; **Yönetim** ve vizyon sayfaları en arkaya. Mokap/vizyon etiketleri tutarlı ve dürüst olacak. Ana sayfa "VR'a gir"i ikincil çağrı yapar.
- [x] **G3. yonetim/bulut-saglamlastir:** Supabase kurulumu sonrası gerçek denemeler (giriş, eser kaydı, görsel yükleme, onay). Yönetim ekranı bulut açıkken giriş ister; `docs/supabase-kurulum.md` (5 dakikalık adımlar). Kurulum sabaha kalırsa yalnız belge ve yerel yedek yolu.

### B. Şartnamenin zorunlu açıkları
- [!] **G4. paket/capacitor (onaylı bağımlılık):** Capacitor ile Android APK (aynı kod). Quest/VR akışı APK'da denenmez; APK keşif, harita, erişilebilirlik içindir. Android SDK yoksa yalnız proje iskeleti ve derleme adımı belgelenir.
- [x] **G5. demo/yedek:** `npm run demo` (derle + önizle), PWA önbelleğini ısıtan sayfa listesi `docs/demo-senaryosu.md`'ye; internetsiz çalışma kontrolü.
- [x] **G6. veri/kategori:** **Eser sayısı en az 10 şartı sağlanmış kalır ve güvenli payla 14'e çıkar.** En az 3 yeni türde eser (han, hamam/çeşme, türbe, eğitim yapısı). Metin yalnız envanter kitabından (Drive PDF veya .idml), her bilgiye cilt ve sayfa. Metin çıkarılamazsa eser eklenmez, `[!]`.
- [!] **G7. veri/yeni-sehir:** Konya veya Hatay envanterinden 1 eser (aynı kaynak kuralı). Demodaki "yeni şehir" adımı gerçek veriyle.
- [x] **G8. mimari/sehir-ve-tur:** Şehir ve içerik türü eser verisinden türer; şehir eklemek `vrEserler.ts` düzenlemeden olur. Eser sayfasında 3B olmayan eserler (han, türbe) eşit değerde görünür. Yeni şehir kod değişmeden gelir (README + test).
- [x] **G9. yonetim/katki (şartname 5.1.3):** Kullanıcı anısı/fotoğraf formu → `katkilar` (beklemede) → onay sayfasında onayla/reddet → yalnız onaylanan eser sayfasında "Topluluk katkısı, doğrulanmamış" etiketiyle. Kişisel veri toplanmaz (ad/telefon yok). Girdi doğrulama ve metin temizleme testli.

### C. Keşif ve erişilebilirlik
- [x] **G15. arayuz/harita (onaylı bağımlılık Leaflet):** Eser işaretli harita ve 2–3 hazır rota. **Koordinat doğrulanmadan işaret konmaz**; kaynağı olmayan koordinat için mevcut `vrEserler.ts` şehir konumu kullanılır, eser işareti boş kalır ve sabaha sorulur. Tile'lar internetsiz açılmaz; çevrimdışıda liste görünümü yedek.
- [x] **G10. arayuz/erisilebilirlik-rapor:** axe veya Lighthouse raporu `docs/`'a (indirme izni gerekirse atlanır, sorulur). Renk körlüğü paleti, klavye ve ekran okuyucu denetimi.

### D. Belgeler ve sunum
- [x] **G11. docs/lisanslar.md** (bağımlılık lisansları betikle; model, ses, font, fotoğraf kaynakları; bulunamayan "doğrulanmadı") ve README bağlantısı.
- [ ] **G12. docs/dogrulama-raporu.md:** 10 eserin metni kitapla karşılaştırma durumu; hangi eser `dogrulanmis` kalabilir. Kitap yoksa işaretli bırakılır (kazanma planı 73/74).
- [ ] **G13. docs/sunum-taslagi.md:** Şartname 5.4 sırası: problem, hedef kullanıcı, çözüm, canlı demo, mimari (mermaid), veri kullanımı, yenilik, ölçek (Bursa → Konya → Hatay), yol haritası, ekip. Şanlıurfa yok. Çalışan vaatler ve "vizyon" olanlar ayrılır. Kılıç, Bursa vakıf eseri olmayan ek deneyim olarak konumlanır.
- [ ] **G14. docs/juri-soru-cevap.md:** 30 soru; her cevapta dosya yolu. VGM/Vakıf Katılım jürisi için "kılıç neden var", "veri nereden", "doğrulama" öne.

### E. Performans ve kapanış
- [ ] **G16. perf:** Büyük parçalar listelenir; 3B/VR sayfaları tembel yüklenir (davranış değişmez, testler geçer); ilk açılış süresi önce/sonra günlüğe.
- [ ] **G17. birleştirme:** Dallar `master`'a yerel birleşir; tam test (e2e 3 yapılandırma + tarayıcı testleri).
- [ ] **G18. docs/sabah-brifingi.md:** 1 sayfa: ne bitti/bitmedi, 09.00 öncesi 5 adım (Supabase kurulumu, push kararı, Vercel'in `master`'a bağlanması, PWA/APK telefonda deneme, Quest şarjı) ve `gorev_dagilimi.md`'deki 4 kişinin ilk 2 saatlik işi. Sonra dur.

## Sabah sorulacaklar
- Lisanslar: çini fotoğrafı (muradiye-cini.jpg) kaynağı, 360TR gömme izni, derinlik modeli lisansı, vazo/kılıç modeli lisansı ve arşiv fotoğraflarının kullanım izni docs/lisanslar.md'de 'doğrulanmadı'. Organizasyona/sahibine sorulmalı.
- Erişilebilirlik: axe/Lighthouse çalıştırılamadı; yerine tests/erisilebilirlik.mjs ve docs/erisilebilirlik-raporu.md yazıldı. Gerçek axe raporu istenirse npx indirmesine izin ver. Ekran okuyucu ile elle tur yapılmadı.
- Harita: eserlerin doğrulanmış koordinatı yok. Eser.konum {enlem, boylam, kaynak} alanı hazır (kaynak zorunlu); koordinat verilince eser işaretleri ve rota çizgisi kendiliğinden çıkar. Şimdilik şehir işareti ve rota listeleri var. Harita OpenStreetMap karolarını internetten çeker.
- Topluluk katkıları şimdilik yalnız bu tarayıcıda (localStorage) saklanıyor. Buluta (`katkilar` tablosu) yazmak için anonim ziyaretçiye insert izni vermek gerekir (`sema.sql` bugün yalnız girişli kullanıcıya izin veriyor). Anonim katkıya izin verilsin mi? Spam riski var.
- G7 (Konya/Hatay eseri): Konya ve Hatay envanter PDF'leri `vakifkatilim.com.tr/documents/KurumsalIletisim/...` adreslerinde. Betik indirmesi bu oturumda izin denetiminden geçmedi (ayrıca Firecrawl kredisi bitti). Çözüm: PDF'i tarayıcıdan indirip `~/Downloads`'a koy; metni macOS PDFKit ile çıkarıp 1 eser eklerim (kaynak cilt+sayfa). Konya/Hatay Drive'da yok (yalnız Bursa arşivi).
- G6 notu: Yeni 4 eserin fotoğrafı yok (Drive görselleri 2–144 MB, araçla indirilemiyor); eser sayfaları fotoğrafsız çalışır. Fotoğraf eklenecekse el ile küçültülüp `public/gorseller/<eser-id>/` altına, `kredi` alanıyla konmalı.
- Vakıf Katılım yayın adresleri (`src/data/vrEserler.ts`) doğru görünüyor (sayfadaki bağlantılarla aynı); bot istekleri 404 alıyor, tarayıcıda açılır.
- APK: JDK 21 kurulu değil (makinede 17). Kurulumu sistem değişikliği olduğu için yapmadım. `brew install --cask temurin@21` sonrası `docs/apk.md` adımlarıyla APK derlenir.
- Supabase tabloları henüz kurulu değil (REST `eserler` 404). `docs/supabase-kurulum.md` adımlarını yap; kurulana kadar yönetim giriş istemez, yerel kayıtla çalışır. Kurulduktan sonra giriş, kayıt, onay ve görsel yükleme gerçek sunucuda denenmeli.
- `tests/kilic.mjs` 1280'de zaman aşımı (G1 notu): gerçek hata mı yavaşlık mı, G17'de master'da bakılacak.

## Günlük
- G1: Hata avı (tests/hata-avi.mjs, 24 rota + /olmayan-sayfa, 1280 ve 360) tek bulgu verdi: 360 px `/atolye/kilic` yatay taşma (`.kilic-sahne-isaret` 406 px). `src/pages/kilic.css` mobil bloğunda `overflow-x:clip` ile giderildi; hata avı artık temiz, `ui` geçti. Not: `tests/kilic.mjs` 1280'de 'Parçayı yerleştir' tıklamasında zaman aşımı veriyor; düzeltme yalnız mobil medya bloğunda olduğundan ilgisiz, önceden var olan/yazılımsal çizim yavaşlığı olarak izleniyor (G17'de master üzerinde tekrar denenecek). Konsol 404'ü yalnız `.env` doluyken Supabase tablosu olmadığından; testler boş değişkenle derleniyor.
- G2 (arayuz/menu): Menü sırası Keşfet, Yolculuk, [Deneyimler: VR Eserler, Vazo, Kılıç, Çini, Öğretmen], Yönetim. VR koduna dokunulmadı. Etiketler kontrol edildi: Öğretmen 'Demo · örnek veri', Vizyon 'henüz uygulanmadı', Kütüphane/Onay gerçek veri (etiketsiz). 'Harita' bağlantısı G15'te eklenecek. ui, yolculuk, hata-avi (33 rota) geçti.
- G3 (yonetim/bulut-saglamlastir): `YonetimKapisi` bulut hazırsa giriş ister, hazır değilse yerel moda düşer; `bulutHazir()` eklendi; docs/supabase-kurulum.md yazıldı. Gerçek sunucu denemesi tablolar kurulmadığı için yapılamadı.
- G4 (paket/capacitor): Capacitor eklendi, `android/` iskeleti ve Gradle eşitlemesi tamam, `npm run apk:esitle`. APK derlemesi JDK 21 yokluğundan [!] (docs/apk.md).
- G5 (demo/yedek): `npm run demo` ve `demo:bulut`; çevrimdışı ısıtma listesi ve sınırlar docs/demo-senaryosu.md'de. 360tr gömmesi çevrimdışı açılmaz (yedek bağlantı + fotoğraf modu var).
- G6 (veri/kategori): 4 yeni eser, hepsi envanter IDML'inden (Drive 'Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi'): Koza Han (ticari, s. 648–655), Eyne Bey Hamamı (su yapısı/hamam, s. 684–685), Eyne Bey Subaşı Medresesi (eğitim, s. 556–561), Osman Gazi Türbesi (türbe, s. 520–531). Sayfa numaraları IDML spread sayfa adlarından; cilt bilgisi klasör adı 'I. ve II. Cilt – Osmangazi' olduğundan kaynak satırına 'Osmangazi' yazıldı, cilt numarası kitaptan teyit edilmeli. `scripts/idml_cikar.py` hat aracı. Toplam eser 14.
- G7: [!] yukarıda.
- G8 (mimari/sehir-ve-tur): `Eser.yapiTuru` (isteğe bağlı) eklendi, 14 eserde dolduruldu (Cami/Külliye/Han/Hamam/Medrese/Türbe), formda alan, ana sayfada 'Yapı türü' süzgeci. `tests/yonetim.mjs` Konya/Meram/Han eserinin süzgeçlere kod değişmeden geldiğini sınar. VR haritasına şehir eklemek hâlâ konum bilgisi ister (vrSehirler).
- G9 (yonetim/katki): eser sayfasında 'Topluluk katkıları' formu (başlık ≤80, metin ≤600, e-posta/telefon reddi, kontrol karakteri temizliği), `/onay` sayfasında katkı kararları, yalnız onaylananlar 'Topluluk katkısı · doğrulanmamış bilgi' etiketiyle görünür. `tests/katki-mantik.mjs` (test:hizli'da) ve tarayıcı akışı (`tests/yonetim.mjs`) geçti.
- G15 (arayuz/harita): Leaflet (onaylı bağımlılık) ile /harita (tembel yüklenir): şehir işaretleri, 3 hazır rota (src/data/rotalar.ts; sıra gezi önerisi), tüm eser listesi, çevrimdışı yedek liste. Menüye Harita eklendi. tests/harita.mjs ve hata-avi'ye /harita eklendi.
- G10 (arayuz/erisilebilirlik-rapor): bağımlılıksız denetim 10 rota × 3 mod; gerçek hata bulundu ve düzeltildi: ana sayfada kılıç tanıtım kartı açık zeminde açık yazı (1,07:1) — CSS sırası; kilic.css seçicileri güçlendirildi. Rapor: docs/erisilebilirlik-raporu.md.
- G11 (docs/lisanslar): scripts/lisans-cikar.mjs docs/lisanslar.md üretir (18 doğrudan, 12 dolaylı üretim bağımlılığı; MIT/BSD-2/Apache/0BSD). Modeller, sesler, yazı tipi, fotoğraflar için kaynak ve 'doğrulanmadı' işaretleri; README'ye bağlantı.
