# Çini atölyesi

`/atolye/cini`: çarkta şekillendirmeden fırına çini tabak yapma oyunu. Masaüstü (fare/dokunma) ve WebXR aynı oyun mantığını kullanır.

## Dosyalar
- `src/components/cini/durum.ts`: oyun kuralları, Three.js'e bağlı değildir (`tests/cini-mantik.mjs`).
- `src/components/cini/desen.ts`: özgün desen, bölgeler ve tahrir izleri.
- `src/components/cini/doku.ts`: tabağın yüzey tuvali.
- `src/components/cini/sahne.ts`: atölye sahnesi ve fare girişi. `src/components/cini/xr.ts`: VR oturumu, panel ve kumanda.
- `tests/cini.mjs`: gerçek fare olaylarıyla baştan sona oynar.

## Kaynaklar ve sınırlar
- T.C. Kültür ve Turizm Bakanlığı, "Geleneksel Çini Ustalığı": sıraltı süreci, bisküvi, tahrir, ikinci pişirim 900-940°C, renkler, usta adları, UNESCO kaydı. https://yakegm.ktb.gov.tr/TR-345131/geleneksel-cini-ustaligi.html
- İstanbulumSanat, "Çini Nasıl Yapılır": iğneleme ve kömürleme anlatımı. https://www.istanbulumsanat.com/cini-nasil-yapilir-cini-yapim-asamalari-nelerdir/

Oyun ölçeği (kaynak değil): bisküvi aralığı 850-900°, süreler, puan, boyaların mat görünümü.

Kaynakla doğrulanamadığı için oyuna alınmadı: çamur reçetesindeki malzeme adları ve oranları, hangi rengin hangi oksitten geldiği. Doğrulanırsa `src/data/cini.ts` notlarına eklenebilir.

Desen uygulama için çizildi; belirli bir tarihî eserin kopyası değildir.
