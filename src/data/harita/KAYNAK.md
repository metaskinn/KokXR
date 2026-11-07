# Harita verisi: kaynak ve lisans

Uygulama bu klasördeki gömülü dosyalarla internetsiz çalışır; canlı tile sunucusu kullanılmaz. Veri Kasım 2026'da alındı, sadeleştirildi.

| Veri | Kaynak | Lisans |
|---|---|---|
| Türkiye sınırı, iller, kara, göl, nehir, Türkiye haritasındaki şehir noktaları (`turkiye.json`) | [Natural Earth](https://www.naturalearthdata.com/) 1:10m | Kamu malı |
| Bursa, Konya, Hatay yolları, kıyı, su, yer adları, zirve yükseklikleri (`bursa.json`, `konya.json`, `hatay.json`) | [OpenStreetMap](https://www.openstreetmap.org/copyright), Overpass API ile tek seferlik sorgu; tile indirilmedi | ODbL, atıf: © OpenStreetMap katkıda bulunanlar |
| Kabartma (`*-kabartma.webp`) | [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (AWS Open Data; SRTM dahil kaynaklardan), buradan hesaplanan tepe gölgesi | Kaynak atfıyla açık veri |
| Eser koordinatları (`../vrEserler.ts`) | Her yapı için OSM nesnesi ve Wikidata P625 karşılaştırıldı; kaynak veri satırında | ODbL / CC0 |

Haritada ve OSM türevi veride atıf görünür kalmalıdır. Harita hesaplanmış bir sadeleştirmedir, yol tarifi için değildir.

Yeniden üretim: `node src/data/harita/veri-uret.mjs <ham-klasör>`, ardından `node src/data/harita/kabartma-uret.mjs <ham-klasör>`.
