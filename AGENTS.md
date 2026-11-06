# KökXR Geliştirme Kuralları

KökXR, Bursa'daki vakıf eserlerini dijital olarak keşfetmeye
yönelik bir hackathon prototipidir.

Teknolojiler: React, TypeScript, Vite.

İlk hedef:
- Ana sayfa
- Tarihi eser seçimi
- Fotoğraf galerisi
- Bilgi paneli
- Üç soruluk test

Kurallar:
- Arayüz Türkçe olacak.
- Önce çalışan basit sürümü geliştir.
- Verisi olmayan 3D veya VR özelliklerini varmış gibi gösterme.
- Tarihsel bilgi uydurma.
- Hassas dosyaları veya lisansı belirsiz görselleri yayımlama.
- Her aşamada uygulamayı test et.
- Görev kapsamı dışında değişiklik yapma.

## Nerede ne var

Yalnız görevin gerektirdiği satırı oku.

| Konu | Yer |
|---|---|
| Sunum vaatleri | `docs/sunum-vaatleri.md` |
| Şartname, puanlama | `docs/sartname.md` (5. bölüm) |
| **Plan ve durum (işe buradan başla)** | `PLAN.md` |
| Quest durumu | `DEVIR-QUEST.md` |
| Kurulum, mimari, veri modeli | `DEVAM.md` |
| Sayfa ve rota | `src/App.tsx`, `src/pages/` |
| Eser içeriği | `src/data/eserler/*.json`, tipler `src/types/eser.ts` |
| Maket ve VR | `src/components/maket/` (`xr*.ts`: VR) |
| Atölye ayrıntısı | `docs/kilic-atolyesi.md`, `docs/vazo-modeli.md` |
| Tasarım | `docs/ui-tasarim.md` |
| Eski raporlar | `docs/arsiv/` |

## Verimli çalışma

- Belgeyi baştan sona okuma: önce ara, sonra gereken aralığı oku.
- `docs/arsiv/`, `docs/test-ekranlari/`, `public/`, `assets/`, `dist/`, `node_modules/` ve `package-lock.json`'ı gerekmedikçe açma.
- Her küçük değişiklikte `npm run test:hizli`; arayüz veya sahne değiştiyse iş sonunda `npm run test:tarayici`. Tek test için: `node scripts/test-tarayici.mjs maket-ic` (önce build).
- Alt ajanı yalnız bağımsız işe aç. Dosya yolunu ver, içeriğini kopyalama; kısa rapor iste. Aynı dosyaya iki ajan dokunmasın.
- Biten plan ve raporları `docs/arsiv/`'e taşı; `docs/` kökünde yalnız etkin belgeler kalsın.

## Token kuralları

Her işte sırayla uygula; gerekçe `docs/token-tasarrufu.md`. Testler ve kaynak denetimi tasarruf için atlanmaz.

1. Hedefi daralt: önce `rg`, sonra yalnız gereken aralık.
2. Konuşmada olanı yeniden okuma, kararı yeniden tartışma.
3. Uzun çıktıyı `| tail -n 20` veya `rg` ile süz.
4. Yerel araç ve CLI'ı MCP'ye tercih et; web'de hedefli sorgu kullan.
5. Araştırmayı tek hedefli sorguyla başlat.
6. Önce `test:hizli`, sonra tek test; tam paket iş sonunda.
7. Bağımsız araç çağrılarını tek yanıtta gönder.
8. Alt ajan seyrek; salt arama için `model: haiku`, tarihsel doğrulamada asla.
9. Yanıt kısa: sonuç ve karar; kod yapıştırma.
10. Konu değişince `/clear`, uzayınca `/compact`.
11. Çok dosyalı işte önce plan.
