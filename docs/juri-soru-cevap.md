# Jüri soru-cevap (30 soru)

Her cevap kısa tutuldu ve kanıt dosyasını gösterir. Bilmediğimiz şeyi "bilmiyoruz / yapılmadı" diye söyleriz; cevaplar sunum öncesi tekrar doğrulanmalıdır. Jüri: Bilişim Vadisi 2, Vakıf Katılım 2, bağımsız 2, VGM 1 (`docs/sartname.md`, 5.4).

## Veri ve doğruluk

1. **Veri nereden geliyor?** Vakıf Eserleri Envanteri – Bursa kitabı ve Vakıf Katılım fotoğraf arşivi. Her eserde kaynak satırı (kitap, sayfa) var. → `src/data/eserler/*.json` (`kaynaklar`), `docs/guncel/dogrulama-raporu.md`
2. **Kaç eser var?** 14 Bursa eseri; en az 10 şartı karşılanır. Sayıyı sunumdan önce `ls src/data/eserler | wc -l` ile yeniden sayın. → `src/data/eserler/`
3. **Bilgilerin doğru olduğunu nasıl biliyorsunuz?** Metinler kitaptan alınır, uydurma yasaktır. 10 eski eserin yıl ve sayıları kitap metniyle karşılaştırıldı; isim ve yorum cümleleri tam okunmadı, bunu açıkça söylüyoruz. → `docs/guncel/dogrulama-raporu.md`, `scripts/dogrulama-karsilastir.mjs`
4. **Kaynağı olmayan bilgi ne oluyor?** "Doğrulanmadı" rozetiyle gösterilir, kesin bilgi gibi sunulmaz. → `src/data/dogrulama.ts` (`kaynakliOlabilir`), `src/pages/EserSayfasi.tsx`
5. **Kitaptan veriye nasıl geçiyorsunuz?** IDML dosyaları metne çevrilir, eser JSON'una elle yazılır. Dört eser (Koza Han, Eyne Bey Hamamı ve Medresesi, Osman Gazi Türbesi) bu yolla eklendi. → `scripts/idml_cikar.py`
6. **Fotoğraflar kimin, izin var mı?** Kredi satırı her görselde var. Yayın izni ve bazı üçüncü taraf içerikler (çini fotoğrafı, 360TR gömme) belirsiz; repo özel, açık yayında görseller çıkarılır. → `docs/guncel/lisanslar.md`, `src/data/acikYayin.ts`
7. **Yeni eserlerde neden fotoğraf yok?** Arşiv dosyaları çok büyük ve izni netleşmemiş görseli koymadık. Metin kaynaklıdır, görsel sonra eklenir. → `docs/guncel/FINAL_PLANI.md` (Sabah sorulacaklar)
8. **Harita neden eser işareti göstermiyor?** Doğrulanmış koordinatımız yok, uydurmadık. Alan hazır, koordinat gelince işaret çıkar. → `src/types/eser.ts` (`konum`), `src/pages/Harita.tsx`

## Ölçek ve sürdürülebilirlik

9. **Başka şehre nasıl ölçeklenir?** Şehir, ilçe ve yapı türü eser verisinden okunur; yeni değer kod değişmeden süzgeçte çıkar. → `src/pages/AnaSayfa.tsx`, `tests/yonetim.mjs`
10. **Konya veya Hatay verisi var mı?** Hayır. Kitap dosyalarını elle indirmek gerekiyor; "ölçeklenebilir" diyoruz, "çalışıyor" demiyoruz. → `docs/sunum-taslagi.md` (8. slayt)
11. **Yeni eser eklemek ne kadar sürer?** Yönetim formu ya da JSON dosyası; kayıt "beklemede" kalır, onaydan sonra yayına girer. → `README.md` ("Yeni eser ekleme"), `src/pages/EserFormu.tsx`
12. **Veri şeması değişirse?** Tipler tek yerde; doğrulama eski veriyi bozmayan isteğe bağlı alanlarla genişledi (`yapiTuru`, `konum`). → `src/types/eser.ts`, `src/data/dogrulama.ts`
13. **Kim sürdürecek?** Takım hackathon sonrası devam edebilir; kalıcı bir sahip (VGM veya Vakıf Katılım) kararı bizim değil, bunu açık soru olarak bırakıyoruz. → `docs/guncel/FINAL_PLANI.md`

## Mimari ve teknik

14. **Mimari nedir?** React + TypeScript + Vite; veri JSON, üst katman localStorage, isteğe bağlı Supabase. → `README.md` ("Mimari"), `docs/guncel/DURUM.md`
15. **Neden Supabase?** Giriş, kalıcı kayıt ve görsel yükleme için; tek bağımlılık `@supabase/supabase-js`. Tablolar henüz kurulu değil, kurulmazsa yerel kayıtla çalışır. → `supabase/sema.sql`, `docs/supabase-kurulum.md`, `src/data/bulut.ts`
16. **Mobilde nasıl çalışıyor?** PWA (kurulabilir, çevrimdışı açılır) ve Capacitor ile Android APK iskeleti. APK derlenmedi (JDK 21 yok). → `scripts/sw-sablon.js`, `tests/pwa.mjs`, `docs/apk.md`
17. **İnternet yoksa?** PWA önceden bir kez açıldıysa çevrimdışı açılır; ayrıca yerel demo komutu var. → `docs/guncel/demo-senaryosu.md` ("Wifi çökerse"), `package.json` (`demo`)
18. **Performans?** FPS yalnız gerçek cihazda ölçülür; yerelde ölçmedik. 3B/VR ve harita sayfaları gerektiğinde yüklenir. → `_arsiv/docs/FINAL_PLANI-tam.md` (G16)
19. **Testler?** Tip denetimi, saf testler, tarayıcı testleri (PWA, galeri, yolculuk, yönetim, harita, erişilebilirlik, hata avı) ve uçtan uca (Chromium 1280/360, Firefox). → `package.json`, `tests/`
20. **Üçüncü taraf servis çökerse?** 360TR gömme için yedek bağlantı var, Supabase yoksa yerel kayıt. → `_arsiv/docs/FINAL_PLANI-tam.md` (G5)

## Güvenlik ve içerik yönetimi

21. **Kim içerik ekleyebilir?** Yönetim ekranı bulut açıksa girişle korunur; bulut yoksa yerel moddadır ve bu yalnız demo içindir. → `src/components/YonetimKapisi.tsx`
22. **Onay akışı gerçek mi?** Yeni eser ve topluluk katkısı "beklemede" başlar, yalnız onaylanan yayına girer. Bulutta bu satır güvenliği (RLS) ile de zorlanır. → `src/data/onay.ts`, `supabase/sema.sql`
23. **Topluluk katkısında spam ve kişisel veri?** Başlık 80, metin 600 karakter; e-posta ve telefon reddedilir; kontrol karakterleri temizlenir. Anonim ekleme bulutta henüz ele alınmadı, yerelde çalışır. → `src/data/katki.ts`, `tests/katki-mantik.mjs`
24. **Girdi doğrulama?** Zorunlu alanlar, görsel adresi, kaynak ve koordinat denetimi. → `src/data/dogrulama.ts`
25. **Gizli anahtarlar?** `.env` repoda yok; yalnız genel (anon) anahtar kullanılır, yetkiyi RLS verir. → `supabase/sema.sql`, `.gitignore`

## Erişilebilirlik ve kullanıcı deneyimi

26. **Erişilebilirlik ne düzeyde?** Yazı boyutu, yüksek kontrast, klavye gezinmesi, alt metinler, sesli dinle; bağımlılıksız bir denetim 10 sayfada temiz. axe ve Lighthouse çalıştırılmadı. → `docs/guncel/erisilebilirlik-raporu.md`, `tests/erisilebilirlik.mjs`
27. **Öğretmen paneli gerçek mi?** Örnek veriyle çalışır ve "Demo · örnek veri" etiketlidir; gerçek sınıf verisi yok. → `src/pages/OgretmenPaneli.tsx`, `docs/guncel/demo-senaryosu.md`
28. **VR gerçekten çalışıyor mu?** Kod ve tarayıcı testleri var; gerçek Quest denemesi sunumdan önce yapılmalı, yerelde FPS ölçülmedi. VR ana akış değil, "Deneyimler" altında. → `src/components/maket/xr*.ts`, `docs/guncel/DURUM.md`

## Neden böyle?

29. **Kılıç atölyesi neden var?** Bursa vakıf eseri değil; ek deneyim olarak "Deneyimler" altında ve böyle anlatılır. Kaynakları listelidir ve bazılarında çelişkiler not edilmiştir. → `docs/kilic-atolyesi.md`
30. **VGM ve Vakıf Katılım için faydası ne?** Envanter kitabı ve arşiv kaynaklı, doğrulanmamışı ayıran, öğrenci ve gezgine açık bir keşif kapısı; yeni şehir eklemek kod değişmeden mümkün. Henüz pilot veya kullanıcı verisi yok. → `docs/sunum-taslagi.md`, `docs/guncel/lisanslar.md`
