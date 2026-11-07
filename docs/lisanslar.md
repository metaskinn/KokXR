# Lisanslar ve kaynaklar

Bu dosya `node scripts/lisans-cikar.mjs` ile üretilir (bağımlılık bölümü); diğer bölümler betikteki şablondadır. "doğrulanmadı" yazan yerde kaynak veya lisans repoda kayıtlı değildir ve yayından önce teyit edilmelidir.

## Doğrudan bağımlılıklar (package.json)

| Paket | Sürüm | Lisans |
|---|---|---|
| @capacitor/android | 8.6.0 | MIT |
| @capacitor/cli | 8.6.0 | MIT |
| @capacitor/core | 8.6.0 | MIT |
| @supabase/supabase-js | 2.119.0 | MIT |
| @types/leaflet | 1.9.22 | MIT |
| @types/node | 26.6.6 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @types/three | 0.187.0 | MIT |
| @vitejs/plugin-react | 6.2.1 | MIT |
| leaflet | 1.9.4 | BSD-2-Clause |
| playwright | 1.64.1 | Apache-2.0 |
| react | 19.3.1 | MIT |
| react-dom | 19.3.1 | MIT |
| react-router-dom | 7.18.5 | MIT |
| three | 0.187.0 | MIT |
| typescript | 7.0.2 | Apache-2.0 |
| vite | 8.3.5 | MIT |

Üretim çıktısına giren dolaylı bağımlılıklar: 12 paket. Lisans dağılımı (üretim, dolaylı dahil): MIT × 18, BSD-2-Clause × 1, 0BSD × 1.

<details><summary>Dolaylı üretim bağımlılıkları</summary>

| Paket | Sürüm | Lisans |
|---|---|---|
| @supabase/auth-js | 2.119.0 | MIT |
| @supabase/functions-js | 2.119.0 | MIT |
| @supabase/phoenix | 0.4.5 | MIT |
| @supabase/postgrest-js | 2.119.0 | MIT |
| @supabase/realtime-js | 2.119.0 | MIT |
| @supabase/storage-js | 2.119.0 | MIT |
| cookie | 1.1.1 | MIT |
| iceberg-js | 0.8.1 | MIT |
| react-router | 7.18.5 | MIT |
| scheduler | 0.28.0 | MIT |
| set-cookie-parser | 2.7.3 | MIT |
| tslib | 2.8.1 | 0BSD |

</details>

## Üçüncü taraf hizmetler ve veriler

| Öğe | Kullanım | Lisans / koşul |
|---|---|---|
| OpenStreetMap karoları (Leaflet haritası) | `/harita` | ODbL; ekranda "© OpenStreetMap katkıcıları" yazar. Karo sunucusu kullanım politikasına uyulmalı (yoğun demo trafiği için değil) |
| Natural Earth 1:50m (Türkiye sınırı), world-atlas 2.0.2 | `src/data/turkiyeHaritasi.ts` | Kamu malı (dosya başlığında yazılı) |
| 360TR gömmesi (Ulu Camii gezintisi) | `https://www.360tr.com/embed/bursa-ulu-camii` | Üçüncü taraf hizmet; yazılı izin/embed kodu **doğrulanmadı** (docs/DURUM.md: resmî embed kodu bekleniyor) |
| Supabase (isteğe bağlı bulut) | `src/data/bulut.ts` | Hizmet koşulları; yalnız `.env` doluyken kullanılır |

## 3B modeller, derinlik haritaları, görseller

| Öğe | Kaynak | Lisans |
|---|---|---|
| `public/modeller/vazo.glb` | Projede `scripts/vazo_uret.py` (Blender betiği) ile üretildi; kaynak `assets/vazo/vazo.blend` | Proje içi üretim; ayrı lisans belirtilmedi (**doğrulanmadı**) |
| `public/modeller/kilic.glb`, `kilic-atolye.glb` | `scripts/kilic_uret.py` ile üretildi; kaynak `assets/kilic/kilic.blend`. Kılıç Topkapı Sarayı Müzesi'ndeki bir esere gönderme yapar, Bursa vakıf eseri değildir (docs/kilic-atolyesi.md) | Proje içi üretim; **doğrulanmadı** |
| Maketler (`src/components/maket/yapilar/*.ts`) | Envanterdeki plan ölçülerinden kodla üretilen temsilî modeller | Proje içi kod |
| `public/derinlik/` | Depth Anything V2 (small) modeliyle (`onnx-community/depth-anything-v2-small`) çevrimdışı üretilmiş derinlik haritaları; kaynak fotoğrafları arşivdendir | Model lisansı ve türev çıktı koşulu **doğrulanmadı** |
| `public/restorasyon/muradiye-cini.jpg` | Kaynak **doğrulanmadı** (arşiv fotoğrafı olabilir; teyit edilmeli) | **doğrulanmadı** |
| `public/gorseller/<eser-id>/` fotoğrafları | Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi | Kullanım izni ve fotoğrafçı kredisi netleşmedi (docs/kokkod_kazanma_plani.md madde 41). Repo private; fotoğraflar herkese açık yayımlanmaz. Her görselde `kredi` alanı zorunlu ve `tests/kredi-veri.mjs` ile denetlenir |
| `public/ikonlar/`, `favicon.svg` | Projede üretildi | Proje içi |

## Sesler ve yazı tipleri

- **Sesler:** `src/components/kilic/ses.ts` ses dosyası içermez; sesleri tarayıcının Web Audio API'siyle kodla üretir. Harici ses dosyası yoktur.
- **Yazı tipi:** `Inter` yalnız yığın içinde adı geçer; web yazı tipi dosyası yüklenmez, yoksa `Segoe UI`/sistem yazı tipi kullanılır. Yazı tipi lisansı gerektiren gömülü dosya yoktur.
- **Tarihsel metinler:** Vakıf Eserleri Envanteri (Bursa) kitabından alınır; her bilgide cilt/bölüm ve sayfa kaynak satırı vardır. Yeni eklenen metinler `scripts/idml_cikar.py` ile envanter IDML dosyalarından çıkarılmıştır.
