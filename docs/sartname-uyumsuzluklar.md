# Şartnameye uymayan veya eksik kalan yerler

Tarih: 7 Kasım 2026. Karşılaştırma `docs/sartname.md` (bölüm 2 ve 5) ile `docs/DURUM.md` arasında yapıldı; birkaç maddeye kodda kısa bakıldı. Uygulama baştan sona çalıştırılıp denenmedi. `docs/DURUM.md` bazı yerlerde eski (örneğin README ve erişilebilirlik aracı artık var), o yüzden her madde için dayanak yazıldı.

## 1. Şartnameye açıkça uymayanlar (yüksek risk)

| # | Şartname | Durum | Dayanak |
|---|---|---|---|
| 1 | 5.1.1: İçerik ekleme ve düzenleme imkânı bulunmalı | Yönetim ekranı yalnız `localStorage`'a yazıyor, kalıcı değil. `src/data/bulut.ts` (Supabase) kodda var ama `.env` boşsa kapalı; giriş, görsel yükleme ve onay akışının canlıda çalıştığı doğrulanmadı | `docs/DURUM.md` madde 4 ve 7, `src/data/bulut.ts` |
| 2 | 5.1.3: Doğrulanmamış içerik kesin bilgi olarak sunulmamalı | 10 eser `dogrulanmis` işaretli, ama tarihsel metinler kitapla karşılaştırılmadı; sayfa numaralarını ajanlar yazdı | `docs/DURUM.md` madde 6, "Doğrulanmayanlar" |
| 3 | 5.1.4: Erişilebilirlik çalışan ürüne entegre olmalı | Yazı boyutu ve yüksek kontrast `ErisilebilirlikAraci.tsx`'te var. axe raporu yok; çini atölyesinde sürükleme adımlarının klavye karşılığı yok, ses yok | `docs/DURUM.md` 5b ve "Küçük ve isteğe bağlı" |
| 4 | 5.4: Canlı ürün demosu | VR yalnız Ulu Camii'de gerçek Quest'te denendi; 9 yeni yapı ve VR birleştirme oyunu hiç denenmedi, FPS ölçülmedi | `docs/DURUM.md` madde 3, "Doğrulanmayanlar" |
| 5 | 3.4 ve 2: Yayın adresi | `kokxr.vercel.app` başka üyenin hesabında, eski ve fotoğrafsız. Güncel sürüm geçici olarak `master-deploy-ashy.vercel.app` adresinde | `docs/DURUM.md` madde 6 |

## 2. Kısmen karşılananlar (orta risk)

| # | Şartname | Eksik |
|---|---|---|
| 6 | Bölüm 2: Birden fazla vakıf eseri; sponsor paketi 60–80 eser, 7 bölge | 14 eser dosyası var (10'u Bursa). Haritada Konya ve Hatay'da VR yok, yalnız kitap bağlantısı var. Sponsor paketinin elimizde olup olmadığı belgede yazmıyor. |
| 7 | 5.1.1: Keşif | Şehir, ilçe ve kategori filtresi eksik (`docs/DURUM.md` 5b). Harita VR Eserler sekmesinde var. |
| 8 | 5.1.2: Mimari ve ölçeklenebilirlik | Yeni eser ekleme JSON ve `yapilar/<eser-id>.ts` ile kolay, ama masaüstü paketi yok; "mobil veya masaüstü uygulaması" ifadesi web/PWA ile karşılanıyor. PWA kurulu ve çevrimdışı açılış testli. Jüri bunu uygulama olarak kabul eder mi, organizasyona sorulmalı. |
| 9 | 5.1.3: Kaynak gösterimi | Kaynak ve kredi gösteriliyor, ama sponsor izni belirsiz fotoğraflar yayında (arşiv fotoğrafları kullanıcı izniyle eklendi; sponsor izni açık konu). |
| 10 | 2: Çalışma alanı | Seçilen yaklaşım serbest çalışma (VR/XR maket). AR ve sesli rehber yok; sesli dinleme (`SesliDinle.tsx`) var, kapsamı doğrulanmadı. |
| 11 | 5.1.5: Güvenlik ve test | Kullanıcı girdi doğrulaması, Supabase satır yetkileri (RLS) ve giriş akışı incelenmedi. Testler (`test:hizli`, `test:tarayici`, `test:e2e`) var; gerçek cihaz testi yok. |
| 12 | 5.1.3: Moderasyon (topluluk katkısı varsa) | Onay ve öğretmen ekranları "Demo · örnek veri" mokap ekranı; bulut onayı yazılmış ama çalıştığı doğrulanmadı. |

## 3. Şartnamede olup repoda karşılığı belirsiz olanlar

- Sunum şablonu, süre ve teslim formatı finalistlere ayrıca bildirilecek; belgelerde karşılığı yok.
- 5.2.3: Her ekip üyesinin mimariyi ve veri modelini 1 dakikada anlatabilmesi `docs/DURUM.md` yapılacaklar listesinde açık.
- Kullanıcı verisi (giriş, katkı) tutuluyorsa aydınlatma/KVKK metni yok.

## 4. Önerilen sıra

1. Yönetim kaydını Supabase ile canlıda çalıştır ve test et (madde 1, 12).
2. Tarihsel metinleri envanter PDF'iyle karşılaştır; karşılaştırılamayanın işaretini `temsili`ye çevir (madde 2).
3. Quest'te 9 yeni yapıyı ve VR birleştirmeyi dene; çalışmayanı demodan çıkar (madde 4).
4. Şehir/kategori filtresi ve axe raporu (madde 3, 7).
5. Sponsor veri paketi ve masaüstü paketi için organizasyona sor (madde 6, 8).
