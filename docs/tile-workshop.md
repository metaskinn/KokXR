# Çini atölyesi

`/workshops/tile`: çarkta şekillendirmeden fırına çini tabak yapma oyunu. Masaüstü (fare/dokunma) ve WebXR aynı oyun mantığını kullanır.

## Dosyalar
- `src/features/workshops/tile/engine/state.ts`: oyun kuralları, Three.js'e bağlı değildir (`tests/tile-logic.mjs`).
- `src/features/workshops/tile/engine/pattern.ts`: özgün desen, bölgeler ve tahrir izleri.
- `src/features/workshops/tile/engine/texture.ts`: tabağın yüzey tuvali.
- `src/features/workshops/tile/engine/scene.ts`: atölye sahnesi ve fare girişi. `src/features/workshops/tile/engine/xr.ts`: VR oturumu, panel ve kumanda.
- `tests/tile.mjs`: gerçek fare olaylarıyla baştan sona oynar.

## Kaynaklar ve sınırlar
- T.C. Kültür ve Turizm Bakanlığı, "Geleneksel Çini Ustalığı": sıraltı süreci, bisküvi, tahrir, ikinci pişirim 900-940°C, renkler, usta adları, UNESCO kaydı. https://yakegm.ktb.gov.tr/TR-345131/geleneksel-cini-ustaligi.html
- İstanbulumSanat, "Çini Nasıl Yapılır": iğneleme ve kömürleme anlatımı. https://www.istanbulumsanat.com/cini-nasil-yapilir-cini-yapim-asamalari-nelerdir/

Oyun ölçeği (kaynak değil): bisküvi aralığı 850-900°, süreler, puan, boyaların mat görünümü.

Kaynakla doğrulanamadığı için oyuna alınmadı: çamur reçetesindeki malzeme adları ve oranları, hangi rengin hangi oksitten geldiği. Doğrulanırsa `src/content/tile.ts` notlarına eklenebilir.

Desen uygulama için çizildi; belirli bir tarihî eserin kopyası değildir.
