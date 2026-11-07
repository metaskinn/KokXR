# KökXR – 24 Saatlik Final Görev Dağılımı (4 kişi, paralel)

Saatler geliştirmenin başladığı andan itibaren sayılıyor: S0 = başlangıç (açılıştan sonra, tahminen Cumartesi 10.00), S24 = bitiş. Sunum saati açılışta duyurulunca son blok ona göre kaydırılır.

## Çakışmayı önleyen kurallar
1. Herkes kendi dalında çalışır: `veri`, `yonetim`, `arayuz`, `demo`. Ana dala (Vercel'e giden) sadece ortak senkron anlarında birleştirilir.
2. Her kişinin dokunduğu klasörler ayrıdır (aşağıda "Sahip olduğu yer"). Başkasının alanındaki dosyayı değiştirmek gerekirse önce ona söylenir.
3. S0–S1 arası herkes birlikte **eser veri şemasını** kilitler. Sonra kimse şemayı tek başına değiştirmez.
4. Ortak senkron: S4, S8, S12, S16, S20. 10 dakika: ne bitti, ne bloklandı, birleştirme.
5. S18'de kod dondurma: yeni özellik yok, sadece hata düzeltme ve prova.

## Kişi 1 – Veri ve İçerik
Sahip olduğu yer: eser veri dosyaları (veya seed), `public/` altındaki eser görselleri, görsel küçültme script'i.
- S0–S1: Şemayı birlikte kilitle (id, slug, şehir, ilçe, kategori, dönem, vâkıf, özet, tarihçe, kaynaklar[kitap, cilt, sayfa], görseller[dosya, alt metin, kredi], doğrulama durumu).
- S1–S4: Drive'dan 10 eser seç (her kategoriden 1–2: cami, külliye, türbe, su yapısı, han/ticari, medrese). Her eser için 3–6 fotoğraf indir, 1600px ve 400px WebP'ye küçült.
- S4–S12: Her eser için kitaptan kaynaklı kısa tarihçe (80–150 kelime) ve kaynak satırı yaz. Alt metinleri yaz. Bilmediğin alanı boş bırak, uydurma.
- S12–S16: Konya veya Hatay kitabından 1 eserin verisini hazırla (Kişi 2'nin yönetim ekranından canlı eklenecek).
- S16–S18: Tüm metinleri kitapla son kez karşılaştır, yazım kontrolü yap.
- S18–S24: Sunumdaki veri slaytı (kaç eser, kaynak, veri hattı) ve jüri sorularına "veri nereden geldi" cevabı.

## Kişi 2 – Yönetim Ekranı ve Onay Akışı
Sahip olduğu yer: yönetim ekranı, API/veri kaydetme katmanı, giriş (auth), bunların testleri.
- S0–S1: Şema kilitleme. Mevcut yönetim ekranının gerçekten kaydedip kaydetmediğini kontrol et.
- S1–S8: Eser ekle / düzenle / görsel yükle / yayınla, kalıcı kayıtla çalışsın. Girdi doğrulama (zorunlu alanlar, dosya tipi ve boyut sınırı, metin temizleme).
- S8–S12: Onay akışı: kullanıcı katkısı veya yeni içerik "beklemede", küratör "onayla/reddet", sadece onaylanan yayında. Mokap kaldırılır.
- S12–S16: Yönetim ekranına giriş koruması; ekle, düzenle ve onay için otomatik testler.
- S16–S18: Kişi 1'in hazırladığı Konya/Hatay eserini panelden ekleme provası.
- S18–S24: Demoda "canlı eser ekleme" ve "onay" adımlarını sen sun; mimari slaytında backend kısmını anlat.

## Kişi 3 – Keşif Arayüzü, Erişilebilirlik ve Paketleme
Sahip olduğu yer: ana sayfa, eser listesi ve detay sayfası bileşenleri, PWA dosyaları, masaüstü paketi.
- S0–S1: Şema kilitleme.
- S1–S6: Eser detay sayfası 3D'si olmayan eserleri de göstersin (galeri, tarihçe, kaynak, doğrulama rozeti). Ana sayfada şehir/ilçe/kategori filtresi.
- S6–S10: Harita (Leaflet + OpenStreetMap) ve eser işaretleri; koordinatları Kişi 1 verir.
- S10–S14: PWA (manifest, ikon, service worker, çevrimdışı önbellek). Masaüstünde ve Android'de "yükle" ile açıldığını dene. Zaman kalırsa Tauri/Electron masaüstü paketi.
- S14–S18: Erişilebilirlik: alt metinler, klavye ile gezinme, yazı boyutu ve kontrast düğmesi, sesli anlatım. Lighthouse/axe çalıştır, sonucu kaydet.
- S18–S24: Hata düzeltme; demoda keşif ve erişilebilirlik adımlarını sen sun.

## Kişi 4 – VR, Demo ve Sunum
Sahip olduğu yer: VR sahneleri ve atölyeler (mevcut), sunum dosyası, README, demo senaryosu.
- S0–S1: Şema kilitleme. Quest'in çalıştığını, şarjını ve sitenin Quest tarayıcısında açıldığını doğrula.
- S1–S6: Mevcut VR akışlarını gerçek Quest'te dene (Ulu Camii, Muradiye panosu, maket, vazo). Bozuk olanı düzelt; yeni VR özelliği ekleme.
- S6–S10: Demo senaryosunu yaz (dakika dakika): keşfet → eser detay → sesli dinle → VR'da eline al → görev ve rozet → yönetimden eser ekle → onayla → yeni şehir göründü.
- S10–S16: Sunumu güncelle: problem, hedef kullanıcı, çözüm, mimari ve veri modeli şeması, veri kullanımı, yenilik, ölçek (Bursa → Konya → Hatay), yol haritası. Şanlıurfa anlatısını çıkar. Kılıcı ek deneyim olarak konumla.
- S16–S18: README: kurulum, çalıştırma, mimari, yeni şehir/eser ekleme, kullanılan kütüphaneler ve lisanslar.
- S18–S24: Ekiple 3 tam prova (süre tutarak), yedek demo videosu, wifi olmazsa çalışacak yerel sürüm, son build'in iki bilgisayarda hazır olması.

## Ortak anlar
- S8: İlk birleştirme. Yeni eserlerin en az 5'i sitede görünüyor olmalı.
- S12: Yönetim ekranından eklenen eser sitede görünüyor olmalı.
- S16: Tüm P0'lar ana dalda ve Vercel'de canlı. Değilse P1 işleri durur, herkes P0'a döner.
- S18: Kod dondurma.
- S20–S24: Prova, prova, prova. Herkes kendi kısmını ve mimariyi 1 dakikada anlatabilmeli (şartname 5.2.3).

## Bilinmeyenler
- Sunum süresi ve teslim formatı açılışta duyurulacak; duyurulunca S18 sonrası buna göre ayarlanır.
- Geliştirmenin tam başlangıç ve bitiş saati açılışta netleşecek.
