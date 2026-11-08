# Demo: eser ekleme, onaylama, düzenleme (kopyala-yapıştır)

Amaç: sunumda `Giriş → eser ekle → onayla → listede gör → düzenle → yeniden onayla` zincirini 35 saniyede göstermek.
Form uzun olduğu için tüm metinler hazır. **Tarihî bilgi içermez**: kayıt kasıtlı olarak “temsilî”dir ve gerçek bir vakıf eserini anlatmaz.

## Önce (sunumdan en az 15 dk önce, canlı sitede)

1. Temiz tarayıcı profili aç, `https://kokxr.vercel.app/admin` adresine git. Küratör şifresi ortam değişkeninde (`ADMIN_PASSWORD`); editör şifresi `EDITOR_PASSWORD`. Şifreler bu belgeye yazılmaz.
2. Küratör olarak giriş yap. Bir kez baştan sona dene, **sunumdan önce** demo kaydını sil ya da reddet (kayıt işlem kaydında kalır).
3. Sahnede yazmamak için aşağıdaki metinleri bir not dosyasında hazır tut.
4. Yedek: bağlantı kesilirse aynı akışın 60–90 sn video kaydını göster.

Roller (koddan): **editör** ekler ve düzenler, değişiklik onay bekler; **küratör** ayrıca onaylar, reddeder, siler.
Küratör olarak ekleyip aynı oturumda onaylamak demoyu kısaltır. İki rolü göstermek istersen editör ile ekle, küratör ile onayla (ekstra ~15 sn).

## 1) Form alanları

| Alan | Değer |
|---|---|
| Ad | Temsilî Demo Eseri |
| Şehir | Bursa |
| İlçe | Osmangazi |
| Dönem | Temsilî kayıt; tarihî dönem içermez |
| Vakıf | Temsilî kayıt; gerçek bir vakıf değildir |
| Tür | Diğer |
| Doğrulama | Temsilî (illustrative) |
| Özet | Bu kayıt, KökXR'da eser ekleme ve onaylama akışını göstermek için hazırlanmış temsilî bir demo kaydıdır. Tarihî bir bilgi içermez. |
| Tarihçe | Bu metin yalnızca demo içindir. Gerçek bir yapıya ait tarih, ölçü ya da vakıf bilgisi içermez. Gerçek eserlerde her bilgi, kaynak ve sayfa numarasıyla birlikte girilir. |
| Kapak görseli / galeri | Boş bırak (görsel yüklemek ve izin/künye girmek akışı uzatır; izin belirsiz görsel kullanma) |
| Bilgi noktası | Boş bırak |
| Konum | Haritada Bursa merkezinde bir nokta seç ya da boş bırak |

Not: Eser kimliği addan otomatik üretilir ve Türkçe karakterler sadeleştirilir (`artifactId`); “Temsilî Demo Eseri” → `temsili-demo-eseri`. Aynı kimlik varsa sistem sona sayı ekler. Elle kimlik girmen gerekmez.

## 2) Kaynak (1 adet)

| Alan | Değer |
|---|---|
| Kaynak kimliği | demo-1 (formun önerdiği kimlik kalabilir) |
| Metin | Temsilî demo kaydı; gerçek bir kaynak değildir. |

`maybeSourced` kuralı: kaynak metni dolu ve her quiz sorusu ile bilgi noktası mevcut bir kaynağa bağlıysa kayıt “kaynaklı” görünür. Demo kaydı “Temsilî” işaretli olduğu için kaynaklı bilgi gibi sunulmaz.

## 3) Quiz: tam 3 soru, her biri 4 seçenek

Her soru için kaynak olarak yukarıdaki `demo-1` seçilir. Doğru seçenek **koyu** gösterilmiştir (formda “doğru seçenek” olarak işaretle).

**Soru 1:** Bu kayıt neden eklendi?
- A) Gerçek bir yapının tarihini anlatmak için
- **B) Ekleme ve onaylama akışını göstermek için**
- C) Yeni bir şehir eklemek için
- D) Fotoğraf yüklemek için

Açıklama: Kayıt temsilîdir; yalnızca akışı göstermek için hazırlandı.

**Soru 2:** Bir kayıt yayınlanmadan önce kimin onayından geçer?
- A) Hiç kimsenin
- B) Ziyaretçinin
- **C) Küratörün**
- D) Bilgisayarın

Açıklama: Editör ekler ve düzenler; değişiklik küratör onayına düşer.

**Soru 3:** Bir kaydın bilgisi “kaynaklı” sayılmak için ne gerekir?
- **A) Metni dolu bir kaynak girdisine bağlanması**
- B) Kaydın uzun olması
- C) Fotoğraf eklenmesi
- D) Haritada işaretlenmesi

Açıklama: Kaynak olmadan bilgi kaynaklı gösterilmez.

## 4) Sunumdaki sıra (35 sn)

1. **0–5 sn** Giriş (önceden açık oturumdan “Yeni eser”e git).
2. **5–15 sn** Hazır metinleri yapıştır, tür ve doğrulamayı seç, kaydet. Sahnede yazmak yok.
3. **15–22 sn** Onay kuyruğu (`/admin/onay`): kaydı aç, onayla.
4. **22–28 sn** Eserler listesinde ara: “Temsilî Demo Eseri” görünür.
5. **28–35 sn** Düzenle: Özet'in sonuna “(düzenlendi)” ekle, kaydet; yeniden onayla.

## 5) Bir şey ters giderse

- **Giriş çalışmıyor / “Giriş yapılamadı”**: ortam değişkenleri veya veritabanı bağlantısı. Yedek videoya geç ve şunu söyle: “Bu akış canlıda çalıştı; şimdi video gösteriyoruz.” **Çalışmadıysa** söyleme.
- **Kayıt kaydedilmiyor**: formdaki kırmızı hatalara bak (tam 3 soru, her soruda 4 dolu seçenek, doğru seçenek, kaynak).
- **Liste eski**: sayfayı yenile (önbellek). Yayınlanan kayıt yeniden yüklemeyle görünür.
- Demo bittikten sonra kaydı **sil/reddet**; canlı listede temsilî kayıt kalmasın.

## 6) Doğruluk notu

Bu kayıt gerçek içerik değildir ve “doğrulanmış” sayılmaz. Sunumda: “Gerçek eserlerimizde her bilgi kaynak ve sayfayla gelir; burada akışı göstermek için temsilî bir kayıt kullandık.”
