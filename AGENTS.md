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
| Sunum vaatleri | `docs/presentation-promises.md` |
| Yönetim paneli planı | `docs/admin-panel-plan.md` |
| Şartname, puanlama | `docs/specification.md` (5. bölüm) |
| **Plan ve durum (işe buradan başla)** | `PLAN.md` |
| Quest durumu | `QUEST-HANDOFF.md` |
| Kurulum, mimari, veri modeli | `HANDOFF.md` |
| Sayfa ve rota | `src/app/App.tsx`, `src/features/*/` |
| Eser içeriği | `src/content/artifacts/*.json`, tipler `src/domain/artifact.ts` |
| Maket ve VR | `src/features/scale-models/` (`xr*.ts`: VR), `src/shared/xr/` |
| Atölye ayrıntısı | `docs/sword-workshop.md`, `docs/vase-model.md` |
| Tasarım | `docs/ui-design.md` |
| Eski raporlar | `docs/archive/` |

## Verimli çalışma

- Belgeyi baştan sona okuma: önce ara, sonra gereken aralığı oku.
- `docs/archive/`, `docs/test-screenshots/`, `public/`, `assets/`, `dist/`, `node_modules/` ve `package-lock.json`'ı gerekmedikçe açma.
- Her küçük değişiklikte `npm run test:hizli`; arayüz veya sahne değiştiyse iş sonunda `npm run test:tarayici`. Tek test için: `node scripts/test-browser.mjs model-interior` (önce build).
- Alt ajanı yalnız bağımsız işe aç. Dosya yolunu ver, içeriğini kopyalama; kısa rapor iste. Aynı dosyaya iki ajan dokunmasın.
- Biten plan ve raporları `docs/archive/`'e taşı; `docs/` kökünde yalnız etkin belgeler kalsın.

## Token kuralları

Her işte sırayla uygula; gerekçe `docs/token-saving.md`. Testler ve kaynak denetimi tasarruf için atlanmaz.

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
