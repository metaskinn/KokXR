# Arayüz tasarımı — 3 Kasım 2026

Amaç: Türkçe, sade ve modern bir dijital miras arayüzü. Fotoğrafları, eser seçimini ve vazo atölyesini öne çıkarmak; mevcut içerikleri ve deneyimleri korumak.

## Araştırma ve kararlar

- [Material Design 3 — renk rolleri](https://m3.material.io/m3/pages/color-roles?s=m3): yüzey, ana eylem, ikincil metin ve vurgu rollerini ayır. Uygulamada bunlar `src/index.css` değişkenleriyle tanımlandı. Bronz küçük başlıklarda, yeşil ana eylemlerde kullanıldı.
- [Material Design 3 — tipografi](https://m3.material.io/styles/typography/applying-type): başlık, gövde ve etiketler için ayrı ölçekler. Ana sayfada kısa, büyük serif başlıklar; içerik ve kontrollerde sistem sans-serif yazı tipi. Harici font isteği yok.
- [NN/g — Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/): görevle ilişkili bilgiyi öne çıkar, görsel gürültüyü azalt. Ana sayfada tek ana çağrı, açık eser kartları ve ayrı atölye alanı; eser sayfalarında bölüm bağlantıları.
- [WCAG 2.2 — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): normal metinde en az 4,5:1 hedefi. Renk tek başına durum anlatmıyor; seçili parça, aktif menü, doğru/yanlış yanıtlar ayrıca çizgi, metin ve işaret içeriyor.
- [WCAG 2.2 — Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): görünür klavye odağı ve içeriği kapatmayan gezinme. Üst menü sabitlenmedi; atlama bağlantısı korundu. Rota değişiminde odak ana içeriğe taşınıyor.
- [WCAG 2.2 — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): minimum ölçüt 24 CSS piksel ve istisnalarıdır. Bu tasarımda ana gezinme en az 44px, standart düğmeler en az 46px yüksek tutuldu.

## Palet

| Rol | Renk | Eşleşmede ölçülen kontrast |
| --- | --- | --- |
| Zemin | `#faf9f6` | — |
| Ana metin | `#253a34` | zeminde 11,51:1 |
| İkincil metin | `#626b64` | zeminde 5,24:1 |
| Ana eylem | `#244e40` | beyaz metinle 9,38:1 |
| Açık yüzey | `#edf2ed` | ana eylem rengi metinle 8,27:1 |
| Bronz vurgu | `#8c6035` | zeminde 5,19:1 |
| Büyük başlık vurgusu | `#607767` | zeminde 4,60:1 |

Bu oranlar seçili eşleşmelerin ölçümüdür; tüm uygulama için kapsamlı WCAG uygunluk beyanı değildir.

## Uygulanan yapı

- Ortak marka, aktif sayfa göstergeli menü ve alt bilgi.
- Fotoğraf ağırlıklı giriş, eser listesine ana çağrı, ikincil atölye bağlantısı.
- Eser kartlarında konum, özet, mevcut deneyim ve soru sayısı.
- Özgün SVG vazo çizimiyle ayrı atölye tanıtımı; temsili model açıklaması.
- Eser detayında özet paneli ve galeri/tarihçe/test/kaynak kısayolları.
- Galeri, test, yönetim, formlar ve vazo ekranında tutarlı boşluk, kontrol ve yüzey stilleri.
- Mobilde tek sütun; azaltılmış hareket ve zorunlu renk modu için stiller.

## Doğrulama

- `npm run build`
- `node tests/ui.mjs`: Google Chrome ile 1440, 768, 360 ve 320px; altı rota, taşma, başlıklar, bölüm hedefleri, gezinme ölçüleri, atlama bağlantısı, rota odağı, seçili renk eşleşmeleri ve azaltılmış hareket.
- `node tests/vazo.mjs`: Google Chrome ile 1280 ve 360px; inceleme, yanlış parça/yön, tam onarım, masaüstünde sürükleme, telefonda dokunma ve yeniden başlatma.
- Mevcut `tests/uctan-uca.mjs` senaryoları kurulu Chrome ve geliştirme sunucusuna uyarlanmış geçici kopyayla ayrıca çalıştırıldı. Asıl senaryo dosyası değiştirilmedi.
- Ekran görüntüleri git dışında kalan `test-sonuclari/` içinde. Firefox bu ortamda çalıştırılmadı.

### Sonuç notu

- Arayüz kontrolleri: dört genişlikte altışar rota başarılı; seçili sekiz metin/zemin çifti 4,60–12,35:1 aralığında.
- Vazo senaryoları: 1280 ve 360px başarılı.
- Mevcut uçtan uca senaryolar: 1280 ve 360px Chrome'da ayrı ayrı 15/15 başarılı, yerel HTTP 404 yok.
- 360TR iframe'i açıldı; sağlayıcının `krpano.get` çağrılarına ilişkin konsol hataları ve bir iframe konsol hatası kaydedildi. Bunlar tasarım çalışması kapsamında değiştirilmedi.

## Fotoğraf ve palet revizyonu

Kullanıcı yönlendirmesi: fotoğraf boyutlarını/yerleşimini ve fotoğraflar arasında gezinmeyi iyileştir; sarı-kahverengi sıcaklığı yaklaşık %10 ile sınırla; öncelikli eylemleri belirginleştir.

- CSS paletinde mevcut renklerin %90'ı korundu, %10 sıcak hedef renk eklendi (sRGB kanal karışımı; algısal değişimin yüzdesi olarak yorumlanmamalı). Açık renklerde sıcak kum, koyu renklerde kahverengi hedef kullanıldı. Durum/hata renkleri korundu. Büyük başlık vurgusunda kontrast için iki kanal seviyesi kadar ek koyulaştırma yapıldı.
- Nötr/açık yüzeyler ve ikincil metinler ortak değişkenlerde birleştirildi. Yeşil ana eylem, bronz küçük vurgu rolünde kaldı. Fotoğraf renklerine filtre uygulanmadı.
- Güncel palet: zemin `#f8f5ef`, ana metin `#314035`, ikincil metin `#686c60`, ana eylem `#305240`, açık yüzey `#ecefe7`, bronz `#8e6236`.
- Güncel seçili kontrastlar: ana metin 10,08:1; ikincil metin 4,95:1; bronz 4,89:1; beyaz/ana düğme 8,73:1; yeşil/açık yüzey 7,51:1; fotoğraf başlığı 11,18:1; hero vurgusu 4,53:1; atölye açıklaması 4,63:1.
- Eser sayfasında fotoğraf galerisi ilk deneyim olarak konumlandırıldı; fotoğraf bölümüne giden ana eylem belirginleştirildi.
- Ana sayfa fotoğrafında açıklama ayrı satıra alındı; metin görüntüyü kapatmıyor. Eser kartları ekran genişliğine bağlı görüntü oranı kullanıyor.
- Galeri sabit yüksekliğe sığdırılır; fotoğraf kırpılmaz veya esnetilmez. Keşif işaretleri, fotoğrafın gerçek görüntü alanına göre konumlanır. Küçük fotoğraflar da bütünüyle gösterilir.
- Ana galeride önceki/sonraki düğmeleri, sayaç, görünen büyütme eylemi, ok tuşları ve telefonda yatay kaydırma bulunur. Seçili küçük resim şerit içinde görünür kalır; bunun için sayfanın dikey konumu değiştirilmez.
- Büyütme penceresinde %100–300 yakınlaştırma, kaydırarak ayrıntı inceleme, sığdırma, önceki/sonraki, Escape ve odak dönüşü bulunur. Yakınlaştırınca ok tuşları fotoğrafı kaydırmaya bırakılır.
- Sanal gezintide durak adı ve yön düğmeleri fotoğraf dışına taşındı. “Fotoğrafın tamamını göster” seçeneği derinlik etkisini kapatıp kırpılmayan fotoğraf modunu açar; duraklar arasında gezinme sürer.

Etkileşim kararları [WAI Carousel Controls](https://www.w3.org/WAI/tutorials/carousels/controls/) ve [WAI Carousel Functionality](https://www.w3.org/WAI/tutorials/carousels/functionality/) rehberlerindeki kullanıcı kontrolü, açık gezinme ve odak koruma ilkelerine dayanır. Otomatik fotoğraf geçişi yok.

Galeri kontrolleri: `node tests/galeri.mjs`. Yalnız renk ölçümü: `node tests/ui.mjs --contrast-only`.
