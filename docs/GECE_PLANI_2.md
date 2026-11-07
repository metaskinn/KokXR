# Gece planı 2 (yaklaşık 5 saat, en geç 07.30'da dur)

Aynı kurallar: önce bu dosyayı oku, işaretsiz ([ ]) ilk maddeyi yap, [x] yap, "Gece günlüğü"ne kısa sonuç yaz, commit at, sonrakine geç. 2 denemede bitmeyen madde [!] olur, sebebi yazılır, sonrakine geçilir. Saat 07.30 olduysa kalan maddeleri bırak, 12. maddeyi yap ve dur.

## Değişmez kurallar
- PUSH YOK. Her madde ayrı dalda; master'a birleştirme sadece 11. maddede.
- Yeni npm bağımlılığı yok. Geçici araç gerekiyorsa önce makinede var olanı kullan (python3, macOS araçları).
- Tarihî bilgi, tarih, kişi, kaynak UYDURMA. Kitapta bulamadığın alan boş kalır.
- Commit öncesi test:hizli ve npm run build geçmeli.
- Karar gerektiren işi yapma, "Sabah sorulacaklar"a yaz.
- AGENTS.md token kuralları geçerli.

## Görevler (sırayla, değer sırasına göre)
- [ ] 1. demo/hata-avi: Tüm sayfaları (HARITA.md'deki rotalar) derlenmiş sürümde 1280 ve 360 piksel genişlikte aç. Konsol hatası, kırık görsel, taşan yazı, çalışmayan düğme listesi çıkar. Yalnız demoyu bozan hataları düzelt, yeni özellik ekleme.
- [ ] 2. veri/kategori: Şu an 10 eserin hepsi cami veya külliye. Drive arşivinden (Ticari Yapılar, Su Yapıları, Türbeler, Eğitim Yapıları klasörleri) en az 3 farklı türde eser ekle (ör. bir han, bir hamam veya çeşme, bir türbe). Metin yalnız envanter kitabından (Drive'daki bölüm PDF'i veya .idml), her bilgiye cilt ve sayfa. Metni çıkaramıyorsan eseri ekleme, [!] yaz.
- [ ] 3. veri/yeni-sehir: Konya veya Hatay envanter PDF'inden (vakifkatilim.com.tr yayınlar sayfası) 1 eser ekle, aynı kaynak kuralıyla. Böylece demodaki "yeni şehir" adımı gerçek veriyle gösterilir. Metin çıkarılamazsa [!].
- [ ] 4. docs/supabase-kurulum.md: Sabah 5 dakikada yapılacak adımlar: SQL Editor'de sema.sql, kullanıcı açma, yönetici atama, uygulamada giriş deneme. Her adım tek satır, ekran adlarıyla.
- [ ] 5. docs/juri-soru-cevap.md: Jüriden gelebilecek 30 soru ve kısa cevaplar (veri nereden geldi, doğrulama nasıl, yeni şehir nasıl eklenir, mimari, güvenlik, erişilebilirlik, maliyet, sürdürülebilirlik, VGM ve Vakıf Katılım'a faydası, kılıç neden var). Cevaplar koda ve belgelere dayansın, her cevabın yanına dosya yolu.
- [ ] 6. docs/sunum-taslagi.md: Şartname 5.4'teki sırayla slayt slayt içerik: problem, hedef kullanıcı, çözüm, canlı demo, mimari (mermaid), veri kullanımı (kaç eser, kaynak, veri hattı), yenilik, ölçek (Bursa → Konya → Hatay), yol haritası, ekip ve görev paylaşımı. Şanlıurfa'yı çıkar. Gerçek sayıları koddan al. Sunumdaki vaatlerden hangisinin çalıştığını, hangisinin "vizyon" olduğunu açıkça ayır.
- [ ] 7. docs/lisanslar.md: package.json bağımlılıklarının lisanslarını node_modules/*/package.json içinden bir node betiğiyle çıkar; 3B modellerin, seslerin, fontların ve fotoğrafların kaynak ve lisansını ekle. Bulamadığını "doğrulanmadı" diye işaretle. README'ye bağlantı ver.
- [ ] 8. demo/yedek: Wifi çökerse çalışacak yerel demo: tek komutla derleyip önizleyen bir npm script (ör. `npm run demo`). PWA önbelleğini doldurmak için demo öncesi açılacak sayfaların listesini docs/demo-senaryosu.md'ye ekle.
- [ ] 9. arayuz/mokaplar: Öğretmen paneli, Vizyon ve benzeri mokap sayfalarında "demo/vizyon" etiketlerinin tutarlı ve dürüst olduğunu kontrol et. Ana menüde çalışan özellikleri öne, vizyonu arkaya al. Metin uydurma.
- [ ] 10. perf: Derleme çıktısındaki büyük parçaları listele. 3B/VR sayfalarını tembel yüklemeye (lazy import) al, ilk açılış hızını ölç ve günlüğe yaz. Davranış değişmesin, testler geçsin.
- [ ] 11. 1–10 arası dalları master'a birleştir (yerel). Tam test (e2e 3 yapılandırma + tarayıcı testleri), sonuçları günlüğe yaz.
- [ ] 12. docs/sabah-brifingi.md: 1 sayfa. Gece ne bitti, ne bitmedi; sabah 09.00'dan önce yapılacak 5 adım (Supabase kurulumu, push kararı, Vercel'in master'a bağlanması, PWA'nın telefonda "yükle" denemesi, Quest şarjı); gorev_dagilimi.md'deki 4 kişinin her biri için ilk 2 saatlik iş. Sonra dur.

## Sabah sorulacaklar

## Gece günlüğü
