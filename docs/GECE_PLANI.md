 # Gece planı (Meltem uyurken)

Her turda: önce bu dosyayı oku, işaretsiz ([ ]) İLK maddeyi yap, bitince [x] yap, kısa sonucu "Gece günlüğü"ne yaz, commit at, sonrakine geç. Bir madde 2 denemede bitmezse [!] işaretle, nedenini yaz, sonrakine geç.

## Değişmez kurallar
- PUSH YOK. master'a birleştirme sadece aşağıda yazan yerlerde.
- Yeni bağımlılık yok (tek istisna: @supabase/supabase-js).
- Tarihî bilgi, tarih, kişi, kaynak UYDURMA. Bilinmeyen alan boş kalır.
- Her madde ayrı dal ve commit; commit öncesi test:hizli ve npm run build geçmeli.
- Karar gerektiren şeyi yapma, "Sabah sorulacaklar"a yaz.
- AGENTS.md'deki token kuralları geçerli.

## Görevler (sırayla)
- [x] 1. arayuz/pwa: regresyon testi bitince commit, belgeleri güncelle.
- [x] 2. "docs/eski dosyalar/" boşalt: şartname, sunum, rapor → docs/kaynaklar/; gelistirme-plani.md → _arsiv/docs/. Yolları AGENTS.md, HARITA.md, DURUM.md'de güncelle.
- [x] 3. duzen/temizlik-2 ve arayuz/pwa'yı master'a birleştir (yerel, push yok). Tam test.
- [x] 4. tests/uctan-uca.mjs başarısız adımda 1 koduyla çıksın.
- [x] 5. yonetim/supabase: supabase/sema.sql yaz (eserler, gorseller, katkilar + RLS + storage bucket). Kod: .env doluysa Supabase'e kaydet, değilse localStorage'a düş (demo asla kırılmasın). Giriş (Supabase Auth, e-posta) ve görsel yükleme. Tabloları anon anahtarla oluşturamazsın; SQL'in sabah elle çalıştırılma adımlarını "Sabah sorulacaklar"a yaz.
- [x] 6. yonetim/onay: onay akışı mokaptan çıksın (beklemede/onaylandı/reddedildi, yalnız onaylanan yayında). Supabase yoksa localStorage ile çalışsın. Bu sayfadan DemoEtiketi'ni kaldır.
- [ ] 7. arayuz/kesif: ana sayfada şehir/ilçe/kategori filtresi (mevcut veriden).
- [ ] 8. arayuz/erisilebilirlik: yazı boyutu ve yüksek kontrast düğmesi (hatırlansın), tarihçe için tarayıcı TTS ile "Sesli dinle". axe veya Lighthouse raporunu docs/'a kaydet.
- [ ] 9. Testler: yönetim ekle/düzenle ve onay akışı için otomatik test.
- [ ] 10. README.md: kurulum, çalıştırma, testler, mimari ve veri modeli şeması (mermaid), yeni eser/şehir ekleme, kütüphaneler ve lisanslar, fotoğraf kredisi.
- [ ] 11. docs/demo-senaryosu.md: dakika dakika canlı demo (keşfet → eser detay → sesli dinle → VR'da eline al → görev/rozet → yönetimden eser ekle → onay → yeni şehir), her adımın URL'si.
- [ ] 12. 5–9 arası dalları master'a birleştir (yerel). Tam test (e2e 3 yapılandırma + tarayıcı testleri), sonuçları günlüğe yaz.
- [ ] 13. "Sabah özeti" yaz (ne bitti, ne bitmedi, sabah ilk 3 adım) ve dur.

## Sabah sorulacaklar
- Supabase kurulumu: (1) Dashboard → SQL Editor'de `supabase/sema.sql` dosyasını baştan sona çalıştır. (2) Authentication → Users'tan kendin için e-posta+parola kullanıcısı oluştur. (3) Dosyanın sonundaki `update auth.users ... 'yonetici'` satırını kendi e-postanla çalıştır. (4) Storage'ta `gorseller` kovasının oluştuğunu doğrula. (5) Dev sunucusunu yeniden başlat.
- Bulut katmanı gerçek Supabase'e karşı denenmedi (tablolar kurulu değil); yalnız derleme ve yerel yedek yolu test edildi.
- Giriş: yeni üyelik/kayıt ekranı yapılmadı; kullanıcılar Dashboard'dan açılır. İstenir mi?
- kokxr.vercel.app başka ekip üyesinin hesabında, elle yüklenmiş fotoğrafsız sürüm; push onu güncellemeyebilir.
- Görsel kredisi: yüklemede varsayılan 'Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi'; kendi çektiğin fotoğrafta kredi elle değiştirilmeli.

## Gece günlüğü

- 1 (af3e01f): PWA commit. Firefox e2e 15/15, pwa/galeri/yolculuk/maket-xr-dugme/vazo-xr-dugme/maket-ic geçti; ui testi PWA'dan bağımsız odak zamanlaması nedeniyle (stash ile doğrulandı) kırıktı, beklemeyle düzeltildi.
- 2: eski dosyalar boşaltıldı; şartname PDF ile karşılaştırıldı, eksik yok.
- 3: master ileri sarma ile arayuz/pwa'ya (0912dfa) getirildi (temizlik-2 zaten onun atasıydı); ağaç test edilmiş olanla aynı. Push yok.
- 4: tests/uctan-uca.mjs:156 zaten başarısız adımda exitCode=1 veriyor (460a8db); ek iş gerekmedi.
- 5 (yonetim/supabase): supabase/sema.sql, src/data/bulut.ts (giriş, yükleme, eser kaydı), BulutPaneli. .env boşsa yalnız localStorage. test:hizli ve build geçti.
- 6 (yonetim/onay): OnayAkisi gerçek oldu (src/data/onay.ts; beklemede/onaylandı/reddedildi, yalnız onaylanan yeni eser yayında, yerel + bulut). DemoEtiketi kaldırıldı. e2e 6b onay adımını içerecek şekilde güncellendi; Chromium 1280 15/15. Konsolda 404: Supabase tabloları henüz kurulu olmadığı için bekleniyor (sema.sql çalışınca kalkar).
