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
| Etkin plan | `docs/plan-vaat-mokap.md` |
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
