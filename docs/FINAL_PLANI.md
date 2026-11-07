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
| 5.1.1 Birden fazla eser, tarihçe+görsel+kaynak | 10 eser, hepsi cami/külliye; yalnız Bursa | G6, G7 |
| 5.1.1 İçerik ekle/düzenle | Yönetim var; bulut yolu gerçek Supabase'e karşı denenmedi | G3 |
| 5.1.2 Yeni eser, **şehir ve içerik türü** eklenebilirlik | Şehir listesi kodda (`vrEserler.ts`); içerik türü sabit | G8 |
| 5.1.3 Kaynak göster, doğrulanmamışı kesin sunma | Var (rozet, kaynak satırı) | G12 (kitap karşılaştırması) |
| 5.1.3 Topluluk katkısı varsa moderasyon | Yalnız yeni eser onayı var; katkı formu yok | G9 |
| 5.1.4 Erişilebilirlik çalışan üründe | Yazı boyutu, kontrast, sesli dinle var; axe raporu yok | G10 |
| 5.1.5 Girdi doğrulama, test, README | Var; yönetim girişi bulutsuzken yok | G3, G11 |
| 5.2.1–2 Problem uyumu, yenilik, veri kullanımı | VR güçlü; web/mobil akış ve harita zayıf | G2, G8 |
| 5.4 Sunum + canlı demo + mimari + ölçek | Taslak yok | G13, G14 |

## Görevler

Sıra değer sırasıdır. `[ ]` yapılmadı, `[x]` bitti, `[!]` 2 denemede olmadı.

### A. Zemin (önce)
- [ ] **G1. demo/hata-avi:** `tests/hata-avi.mjs` (yazıldı, çalıştırılmadı) ile tüm rotalar 1280/360 pikselde taranır; yalnız demoyu bozan hata düzeltilir. Bilinen: 360 pikselde `/atolye/kilic` yatay taşma.
- [ ] **G2. arayuz/menu:** Menü yeniden düzeni (VR'a dokunmadan): öne **Keşfet, Harita, Yolculuk**; **Deneyimler** grubu altına VR Eserler, Vazo/Kılıç/Çini atölyeleri, Öğretmen; **Yönetim** ve vizyon sayfaları en arkaya. Mokap/vizyon etiketleri tutarlı ve dürüst olacak. Ana sayfa "VR'a gir"i ikincil çağrı yapar.
- [ ] **G3. yonetim/bulut-saglamlastir:** Supabase kurulumu sonrası gerçek denemeler (giriş, eser kaydı, görsel yükleme, onay). Yönetim ekranı bulut açıkken giriş ister; `docs/supabase-kurulum.md` (5 dakikalık adımlar). Kurulum sabaha kalırsa yalnız belge ve yerel yedek yolu.

### B. Şartnamenin zorunlu açıkları
- [ ] **G4. paket/capacitor (onaylı bağımlılık):** Capacitor ile Android APK (aynı kod). Quest/VR akışı APK'da denenmez; APK keşif, harita, erişilebilirlik içindir. Android SDK yoksa yalnız proje iskeleti ve derleme adımı belgelenir.
- [ ] **G5. demo/yedek:** `npm run demo` (derle + önizle), PWA önbelleğini ısıtan sayfa listesi `docs/demo-senaryosu.md`'ye; internetsiz çalışma kontrolü.
- [ ] **G6. veri/kategori:** En az 3 yeni türde eser (han, hamam/çeşme, türbe, eğitim yapısı). Metin yalnız envanter kitabından (Drive PDF veya .idml), her bilgiye cilt ve sayfa. Metin çıkarılamazsa eser eklenmez, `[!]`.
- [ ] **G7. veri/yeni-sehir:** Konya veya Hatay envanterinden 1 eser (aynı kaynak kuralı). Demodaki "yeni şehir" adımı gerçek veriyle.
- [ ] **G8. mimari/sehir-ve-tur:** Şehir ve içerik türü eser verisinden türer; şehir eklemek `vrEserler.ts` düzenlemeden olur. Eser sayfasında 3B olmayan eserler (han, türbe) eşit değerde görünür. Yeni şehir kod değişmeden gelir (README + test).
- [ ] **G9. yonetim/katki (şartname 5.1.3):** Kullanıcı anısı/fotoğraf formu → `katkilar` (beklemede) → onay sayfasında onayla/reddet → yalnız onaylanan eser sayfasında "Topluluk katkısı, doğrulanmamış" etiketiyle. Kişisel veri toplanmaz (ad/telefon yok). Girdi doğrulama ve metin temizleme testli.

### C. Keşif ve erişilebilirlik
- [ ] **G15. arayuz/harita (onaylı bağımlılık Leaflet):** Eser işaretli harita ve 2–3 hazır rota. **Koordinat doğrulanmadan işaret konmaz**; kaynağı olmayan koordinat için mevcut `vrEserler.ts` şehir konumu kullanılır, eser işareti boş kalır ve sabaha sorulur. Tile'lar internetsiz açılmaz; çevrimdışıda liste görünümü yedek.
- [ ] **G10. arayuz/erisilebilirlik-rapor:** axe veya Lighthouse raporu `docs/`'a (indirme izni gerekirse atlanır, sorulur). Renk körlüğü paleti, klavye ve ekran okuyucu denetimi.

### D. Belgeler ve sunum
- [ ] **G11. docs/lisanslar.md** (bağımlılık lisansları betikle; model, ses, font, fotoğraf kaynakları; bulunamayan "doğrulanmadı") ve README bağlantısı.
- [ ] **G12. docs/dogrulama-raporu.md:** 10 eserin metni kitapla karşılaştırma durumu; hangi eser `dogrulanmis` kalabilir. Kitap yoksa işaretli bırakılır (kazanma planı 73/74).
- [ ] **G13. docs/sunum-taslagi.md:** Şartname 5.4 sırası: problem, hedef kullanıcı, çözüm, canlı demo, mimari (mermaid), veri kullanımı, yenilik, ölçek (Bursa → Konya → Hatay), yol haritası, ekip. Şanlıurfa yok. Çalışan vaatler ve "vizyon" olanlar ayrılır. Kılıç, Bursa vakıf eseri olmayan ek deneyim olarak konumlanır.
- [ ] **G14. docs/juri-soru-cevap.md:** 30 soru; her cevapta dosya yolu. VGM/Vakıf Katılım jürisi için "kılıç neden var", "veri nereden", "doğrulama" öne.

### E. Performans ve kapanış
- [ ] **G16. perf:** Büyük parçalar listelenir; 3B/VR sayfaları tembel yüklenir (davranış değişmez, testler geçer); ilk açılış süresi önce/sonra günlüğe.
- [ ] **G17. birleştirme:** Dallar `master`'a yerel birleşir; tam test (e2e 3 yapılandırma + tarayıcı testleri).
- [ ] **G18. docs/sabah-brifingi.md:** 1 sayfa: ne bitti/bitmedi, 09.00 öncesi 5 adım (Supabase kurulumu, push kararı, Vercel'in `master`'a bağlanması, PWA/APK telefonda deneme, Quest şarjı) ve `gorev_dagilimi.md`'deki 4 kişinin ilk 2 saatlik işi. Sonra dur.

## Sabah sorulacaklar
(boş)

## Günlük
(boş)
