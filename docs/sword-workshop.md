# Kılıç atölyesi — tasarım ve kaynaklar

**İstek:** Vazo atölyesi benzeri, gerçekçi bir deneyim. Ham çelikten başlayıp Fatih Sultan Mehmed'in kılıcını yap,
sonra test alanında dene. Rota: `/workshops/sword`.

## Kaynaklar ve doğrulanan bilgiler

| # | Kaynak | Bilgi |
|---|---|---|
| K1 | Ünsal Yücel, *Islamic Swords and Swordsmiths*, Plate 87, s. 128 (katalog sayfası [myArmoury](http://myarmoury.com/talk/viewtopic.34526.html) üzerinden görüldü) | Topkapı 1/90, II. Mehmed'e atfedilen eğri kılıç. Toplam 126,5 cm, namlu 106 cm. Tek ağızlı, hafif eğri, geniş sırtlı. Kabzadan uca bir geniş oluk, sırt kenarında "basamağa" kadar ikinci oluk. Haç biçimli, kalın kollu, altın kakmalı balçak. Normalden uzun kabza: dört perçinle tutturulmuş iki mors dişi plaka; ayrı metal başlık yok, fildişi başlık biçiminde şekillendirilmiş. Törensel kılıç. İki yüzünde altın kakma sülüs kitabe. |
| K2 | Hasan Korkmaz, İlhan Özkeçeci, "Osmanlı kesici silahlarından bir form: Türk eğri kılıcı", *YJAD*, 2025 ([PDF](https://yjad.yildiz.edu.tr/storage/upload/pdfs/1766990843-tr.pdf)) | Env. 1/90 Osmanlı dönemine ait bilinen en eski kılıç; namlu henüz tam eğrilik kazanmamış, kabzada eğim var. Düz kollu balçak 15. yy. Parça adları: namlu, balçak, kabza, kabza başı, yalman, mahmuz, kan oluğu. Kılıç yumurtası denen çelik külçesi dövülür; sertleştirmeye su verme denir. Yapım kolektiftir: kılıç ustaları (Seyfiye ocağı), hattat, sedefkâr, kuyumcu, nakkaş. |
| K3 | Milli Saraylar paylaşımı ([X](https://x.com/millisaraylar/status/1265951735228575744), arama özetinden) | XV. yy ikinci yarısı; çelik, demir ve altın; uzunluk 125 cm. **Not:** K1 ile uzunluk farkı var (126,5 cm); arayüzde ikisi de kaynağıyla gösterilir. |

Kitabe çevirisi K1'de verilir ("...Sultan Muhammad Khan, the son of Sultan Murad Khan..."). **Çeviri yalnızca K1'e atıfla gösterilir.**

## Temsilî olan her şey (arayüzde açıkça yazılır)

- Model birebir kopya veya 3B tarama değildir; ölçüler K1'den, genişlik, kalınlık, eğrilik miktarı ve balçak ölçüleri fotoğraflardan tahminidir.
- **Altın bant bitkisel süslemedir; gerçek kitabe değildir.** Sahte Arapça harf kullanılmaz: gerçek metin dinî içeriklidir.
- Sıcaklık, zamanlama ve puanlar oyun için basitleştirilmiştir; 1/90 kılıcının gerçekte nasıl yapıldığını anlatmaz.
- Kullanılan çeliğin türü bilinmiyor; "şu çelikten yapıldı" denmez. Test alanı kurgudur: törensel kılıç (K1) savaşta böyle denenmiş iddiası yoktur.

## Akış

| Aşama | Kullanıcı ne yapar | Kalite etkisi |
|---|---|---|
| 1. Külçe | Kılıç yumurtasını maşayla alıp ocağa koyar | — |
| 2. Isıtma | Körüğü basılı tutar; çelik koyu kırmızıdan sarıya döner | Sıcaklık |
| 3. Dövme | Örste çekiçle bölge bölge vurur; külçe gerçekten uzayıp namluya dönüşür, soğuyunca yeniden ısıtır | Biçim, çatlak riski |
| 4. Su verme | Yeniden ısıtır, doğru anda suya daldırır; buhar | Sertlik veya çatlak |
| 5. Bileme | Taş üzerinde boydan boya sürer; ağız ve parlaklık artar | Keskinlik, parlaklık |
| 6. Kuşanma | Balçak, iki mors dişi plaka, dört perçin; altın bant belirir, kolektif yapım notu | — |
| 7. İnceleme | Elde çevirir, yakınlaştırır; parça adları ve kaynaklar | — |
| 8. Test alanı | Fareyle kesim çizer: hasır rulo, kütük, asılı kumaş; sonuç ustalığa bağlı | Puan kartı |

## Görsel hedef

Karanlık atölye, ocak ışığı. Fiziksel tabanlı malzeme, ACES ton eşleme, bloom, gölgeler, kıvılcım ve buhar parçacıkları,
sıcaklık rengine göre ısıma, WebAudio ile üretilen sesler (kapatılabilir). Azaltılmış hareket, klavye ve dokunmatik desteği.

## Dosyalar

- `scripts/sword_texture.py` — dokuları üretir (`assets/kilic/doku/`)
- `scripts/sword_generate.py` — Blender betiği: `assets/kilic/kilic.blend`, `public/models/sword.glb`, `public/models/sword-workshop.glb`
