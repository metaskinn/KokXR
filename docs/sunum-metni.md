# KökXR sunum metni (5 dakika, 6 slayt)

Köşeli parantez `[...]` = ekibin doldurması gereken bilgi (bende yok). Rakamlar ve iddialar depodan doğrulandı; doğrulanamayanlar ayrıca işaretli.
Sunum: **8 Kasım Pazar 12.30**. Konuşmacı dağılımı en altta.

## Jüri başlıkları ve slayt eşlemesi

Organizatörün önerdiği 10 başlık (“özgün dokunuş serbest”). 6 slayta şöyle sığdırdık:

| # | Jüri başlığı | Slayt | Not |
|---|---|---|---|
| 1 | Proje künyesi ve takım tanıtımı | 1 | Ad, alan (Serbest/XR), platform, 42 kampüs, görev dağılımı: ekip doldurur |
| 2 | Problem tanımı ve çözümün değeri | 2 | Araştırmacı (kaynak + sayfa) ve genç (mekânı gezerek öğrenme) |
| 3 | Ürün vizyonu ve değer önerisi | 2 | Katalogdan farkı: bilgi mekânda; özgün konsept = kaynaklı bilgi + 3B maket |
| 4 | Kullanıcı deneyimi ve arayüz tasarımı | 3 | Akış, harita, il/ilçe/tür filtresi |
| 5 | Evrensel erişilebilirlik yaklaşımı | 3 | Yalnız denenenler; ekran okuyucu, yüksek kontrast, yazı boyutu yol haritasında |
| 6 | Veri yönetimi ve içerik yapısı | 5 | Veri modeli, kaynak bağı, moderasyon akışı (editör → küratör) |
| 7 | Teknik mimari ve ölçeklenebilirlik | 5 | Yeni şehir = yeni kayıt, kod değişmez |
| 8 | Ürün demosu (MVP) | 4 | Keşif, harita/filtre, detay, ekleme/düzenleme; canlı uygulama |
| 9 | Güvenlik, kalite ve gelecek yol haritası | 5–6 | Ortak doğrulama, roller, işlem kaydı; yol haritası tablosu |
| 10 | Kapanış ve jüri soru-cevap | 6 | Bağlantı ve QR ekranda kalır; tüm ekip yanıtlar |

Boşluklar: yönetim akışının canlı çalıştığı henüz doğrulanmadı (demo-ekleme-duzenleme.md); “kaynak/doğrulanmamış içeriğin önlenmesi” için elle doğrulanan kayıt sayısı [sayı] ekipten gelmeli.

## Slayt 1: Künye ve ekip (0.00–0.25)

**Ekranda:** KökXR · Bursa'nın vakıf eserleri, kaynaklarıyla ve üç boyutlu · Çalışma alanı: **Serbest (XR)** · Platform: **masaüstü ve mobil web** (Quest/WebXR VR, mobil AR) · 42 [kampüs adı] · Ekip: [isimler ve görevler] · Uygulama: kokxr.vercel.app (QR).

**Söylenecek:** “Biz [ekip adı], 42 [kampüs]. KökXR, Bursa'nın vakıf eserlerini kaynaklarıyla keşfetmeyi ve yapıların temsilî 3B maketlerinde gezmeyi sağlıyor.”

## Slayt 2: Problem ve değer (0.25–0.55)

**Problem (somut):** Vakıf eserleri bilgisi kitaplarda ve arşivlerde dağınık; gençler için okunması zor, bir mekânı “görmeden” anlamak güç.
**Hedef kullanıcı:** (1) kaynak ve sayfa numarasına ulaşmak isteyen araştırmacı, (2) mekânı gezerek öğrenmek isteyen genç.
**Çözüm:** Her bilgi kaynak ve sayfayla gelir; 3B maket, o bilginin mekândaki yerini gösterir. Katalog uygulamasından farkı: okuduğun yere “gidebilirsin”.

**Söylenecek:** “Biz bir fotoğraf kataloğu değil, kaynaklı bilgiyi mekânla buluşturan bir deneyim yaptık.”
**Söyleme:** “akademik olarak doğrulanmış”, “öğrenmeyi artırdığı kanıtlandı”. Kayıtlar kaynaklıdır, elle doğrulanmış değildir.

## Slayt 3: Kullanıcı deneyimi ve erişilebilirlik (0.55–1.20)

**Ekranda:** Akış: Ana sayfa → Eserler (şehir, ilçe, tür filtresi, arama) → Eser sayfası (galeri, tarihçe, kaynaklar, quiz) → 3B maket.
**Erişilebilirlik (kontrol edilenler):** klavyeyle tüm akış, görünür odak halkası, “ana içeriğe atla” bağlantısı, görsellerde alt metin, tek h1 ve landmark bölgeleri, 360 px ve %200 yakınlaştırmada taşma yok, azaltılmış hareket desteği, kontrast ölçüldü (gövde metni 6,97:1).
**Söyleme:** “ekran okuyucuyla tam uyumlu”, “yüksek kontrast”, “yazı boyutu ayarı”. Bunlar yok ya da denenmedi. Doğrusu: “klavye, odak, alt metin ve kontrast yaklaşımıyla erişilebilirliğe temel attık; gerçek ekran okuyucu testi yol haritasında.”

## Slayt 4: Canlı demo (1.20–3.50, 150 sn)

1. **Keşif (25 sn):** Eserler: Bursa seç, ilçe/tür filtresi.
2. **Eser (25 sn):** Eser sayfası: fotoğraf, tarihçe, kaynak.
3. **3B iç mekân (45 sn):** Ulu Camii maketi → içeri gir → şadırvana yürü, kaynaklı bilgi kartı ve sesli anlatım.
4. **Vazo (20 sn):** atölyede tek etkileşim, “temsilî model” etiketi.
5. **İçerik yönetimi (35 sn):** `docs/demo-ekleme-duzenleme.md` akışı.

**AR/VR cümlesi:** “Maketler Meta Quest'te VR'da ve telefonda AR'da masaya konabilir.” Bunu yalnızca cihazda denediysen söyle; denemediysen: “VR ve AR desteğini geliştirdik, cihaz doğrulaması sürüyor.” Mobil AR için **ekip hangi telefon ve tarayıcıyla denediğini yazsın** (WebXR AR genelde Android'de Chrome + ARCore ile çalışır; iPhone Safari WebXR AR desteklemez. Demo cihazını ona göre seç, doğrulama ekibe aittir).
**Yedek:** Quest/AR çalışmazsa masaüstü iç mekânı göster ve söyle: “VR/AR cihaz doğrulaması bekliyor.”

## Slayt 5: Mimari, veri ve kalite (3.50–4.30)

```
                  Tarayıcı (masaüstü / telefon / Quest)
   ┌────────────────────────────────────────────────────────┐
   │ React + TypeScript + Vite (tek sayfa uygulama)         │
   │ Three.js + WebXR  →  3B maketler, VR (Quest), AR (mobil)│
   │ Leaflet + OpenStreetMap  →  harita                     │
   │ Paketli içerik: 706 eser kaydı (JSON), 340 yapılık      │
   │ envanter                                               │
   └───────────────┬────────────────────────────────────────┘
                   │ HTTPS  /api/*
        ┌──────────▼───────────┐     ┌────────────────────────────┐
        │ Vercel sunucusuz     │────▶│ Neon Postgres              │
        │ fonksiyon (Node)     │     │ eserler, envanter, medya,  │
        │ giriş (editör/küratör│     │ işlem kaydı                │
        │ rolü), doğrulama     │     └────────────────────────────┘
        │                      │     ┌────────────────────────────┐
        │                      │────▶│ Neon nesne depolama        │
        └──────────────────────┘     │ yüklenen görseller,        │
                                     │ imzalı adresle sunulur     │
                                     └────────────────────────────┘
   Yazma akışı: editör ekler → bekleyen → küratör onaylar → yayında
```

**Veri modeli:** her eser: ad, şehir, ilçe, dönem, vakıf, özet, tarihçe, kaynaklar (kimlik + metin + sayfa), görseller (alt metin + künye), bilgi noktaları, 3 soruluk quiz, isteğe bağlı 3B maket. Bilgi noktası ve quiz sorusu bir kaynağa bağlanır; kaynak yoksa bilgi “kaynaklı” sayılmaz.
**Ölçeklenebilirlik:** yeni şehir = yeni kayıtlar, kod değişmez. Bursa'ya ek olarak Konya ve Hatay kayıtları eklendi. Harita ve filtre veriden beslenir. Boş şehir “içerik yok” der.
**Kalite ve güvenlik:** doğrulama hem formda hem sunucuda aynı kodla yapılır (`src/domain/verification.ts`); şifreler ortam değişkeninde; oturum imzalı çerez; yazma istekleri yalnız JSON; yükleme boyutu sınırlı; işlem kaydı tutulur. Testler: tür denetimi + saf mantık testleri + tarayıcı testleri.
**Dürüst sınırlar:** veri kaynaklıdır, elle doğrulama sürüyor; görsel izinleri alındı ([kimden/nasıl: ekip yazsın]); kayıtlarda henüz izin alanı yok.

## Slayt 6: Yol haritası ve kapanış (4.30–5.00)

| Çalışan | Yol haritası |
|---|---|
| 706 eser kaydı, kaynak ve sayfa bilgisi | Elle doğrulanmış kayıt sayısını artırmak, kaynak kontrol akışı |
| Şehir/ilçe/tür filtresi, arama, harita | Daha fazla şehir (İzmir, Manisa) |
| 12 temsilî 3B maket, 7 sesli anlatım (Ulu Camii) | Diğer maketler için sesli anlatım |
| Yönetim: giriş, onay kuyruğu, işlem kaydı | Gerçek ekran okuyucu testi, yüksek kontrast, yazı boyutu |
| VR/AR kodu (cihaz doğrulaması [durum]) | Öğretmen paneli, öğrenme ölçümü |

**Kapanış:** “Teşekkürler. Uygulama bu bağlantıda ve QR kodda: kokxr.vercel.app. Sorularınızı bekliyoruz.” QR ekranda kalır.

## Konuşmacı dağılımı (öneri, ekip karar versin)

- **Ana anlatıcı:** slayt 1, 2, 3, 5, 6 ([isim]).
- **Demo operatörü:** slayt 4 ([isim]); anlatıcı demo sırasında konuşur, operatör ekrana odaklanır.
- **Soru-cevap:** ürün/veri → [isim]; VR/AR ve 3B → [isim]; yönetim, güvenlik ve altyapı → [isim].

## Jüri soruları ve kısa cevaplar

- **Veri nereden?** Sağlanan Vakıf Eserleri Envanteri ve yayımlanmış kitaplar; her bilgi kaynak ve sayfayla bağlı. Elle doğrulanan kayıtlar [sayı].
- **Moderasyon?** Editör ekler, küratör onaylar; reddet/geri al/sil ve işlem kaydı var. Editörün değişiklikleri küratör onayını bekler (rol tanımı `server/auth.ts`).
- **Fotoğraf izinleri?** Her görselde kredi satırı var; kullanım izni alındı [kimden, hangi biçimde: ekip yazsın]. Belgeyi elde tut; kayıtlara izin alanı eklemek yol haritasında. İzin belgesi gösterilemiyorsa “alındı” deme.
- **3B model gerçek mi?** Temsilî, kodla üretilmiş; tarama ya da belgelenmiş rekonstrüksiyon değil.
- **Yeni şehir?** Aynı veri modeli; Konya ve Hatay eklendi.
- **Mobil AR?** [ekip doğrulaması]; cihaz ve tarayıcı listesi: [liste].
