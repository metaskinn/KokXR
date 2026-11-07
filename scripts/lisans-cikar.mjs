// docs/lisanslar.md dosyasını üretir: bağımlılık lisansları node_modules/*/package.json'dan okunur.
// Kullanım: node scripts/lisans-cikar.mjs   (önce npm install)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const paket = JSON.parse(readFileSync('package.json', 'utf8'))
const oku = (ad) => { const y = `node_modules/${ad}/package.json`; return existsSync(y) ? JSON.parse(readFileSync(y, 'utf8')) : null }
const lisans = (p) => (typeof p.license === 'string' ? p.license : p.license?.type ?? p.licenses?.map((l) => l.type).join(' OR ')) || 'doğrulanmadı'

const gorulen = new Map()
function yuru(ad, dogrudan, uretim) {
  const p = oku(ad)
  if (!p) return
  const onceki = gorulen.get(ad)
  if (onceki) { onceki.uretim ||= uretim; onceki.dogrudan ||= dogrudan; if (!uretim || onceki.gezildi) return }
  gorulen.set(ad, { ad, surum: p.version, lisans: lisans(p), dogrudan, uretim, gezildi: true })
  for (const alt of Object.keys({ ...p.dependencies, ...p.optionalDependencies })) yuru(alt, false, uretim)
}
for (const ad of Object.keys(paket.dependencies ?? {})) yuru(ad, true, true)
for (const ad of Object.keys(paket.devDependencies ?? {})) yuru(ad, true, false)

const liste = [...gorulen.values()].sort((a, b) => a.ad.localeCompare(b.ad))
const satir = (p) => `| ${p.ad} | ${p.surum} | ${p.lisans} |`
const dogrudan = liste.filter((p) => p.dogrudan)
const gecis = liste.filter((p) => !p.dogrudan && p.uretim)
const lisansSayisi = {}
for (const p of liste.filter((x) => x.uretim)) lisansSayisi[p.lisans] = (lisansSayisi[p.lisans] ?? 0) + 1

const md = `# Lisanslar ve kaynaklar

Bu dosya \`node scripts/lisans-cikar.mjs\` ile üretilir (bağımlılık bölümü); diğer bölümler betikteki şablondadır. "doğrulanmadı" yazan yerde kaynak veya lisans repoda kayıtlı değildir ve yayından önce teyit edilmelidir.

## Doğrudan bağımlılıklar (package.json)

| Paket | Sürüm | Lisans |
|---|---|---|
${dogrudan.map(satir).join('\n')}

Üretim çıktısına giren dolaylı bağımlılıklar: ${gecis.length} paket. Lisans dağılımı (üretim, dolaylı dahil): ${Object.entries(lisansSayisi).map(([l, n]) => `${l} × ${n}`).join(', ')}.

${gecis.length ? `<details><summary>Dolaylı üretim bağımlılıkları</summary>\n\n| Paket | Sürüm | Lisans |\n|---|---|---|\n${gecis.map(satir).join('\n')}\n\n</details>` : ''}

## Üçüncü taraf hizmetler ve veriler

| Öğe | Kullanım | Lisans / koşul |
|---|---|---|
| OpenStreetMap karoları (Leaflet haritası) | \`/harita\` | ODbL; ekranda "© OpenStreetMap katkıcıları" yazar. Karo sunucusu kullanım politikasına uyulmalı (yoğun demo trafiği için değil) |
| Natural Earth 1:50m (Türkiye sınırı), world-atlas 2.0.2 | \`src/data/turkiyeHaritasi.ts\` | Kamu malı (dosya başlığında yazılı) |
| 360TR gömmesi (Ulu Camii gezintisi) | \`https://www.360tr.com/embed/bursa-ulu-camii\` | Üçüncü taraf hizmet; yazılı izin/embed kodu **doğrulanmadı** (docs/DURUM.md: resmî embed kodu bekleniyor) |
| Supabase (isteğe bağlı bulut) | \`src/data/bulut.ts\` | Hizmet koşulları; yalnız \`.env\` doluyken kullanılır |

## 3B modeller, derinlik haritaları, görseller

| Öğe | Kaynak | Lisans |
|---|---|---|
| \`public/modeller/vazo.glb\` | Projede \`scripts/vazo_uret.py\` (Blender betiği) ile üretildi; kaynak \`assets/vazo/vazo.blend\` | Proje içi üretim; ayrı lisans belirtilmedi (**doğrulanmadı**) |
| \`public/modeller/kilic.glb\`, \`kilic-atolye.glb\` | \`scripts/kilic_uret.py\` ile üretildi; kaynak \`assets/kilic/kilic.blend\`. Kılıç Topkapı Sarayı Müzesi'ndeki bir esere gönderme yapar, Bursa vakıf eseri değildir (docs/kilic-atolyesi.md) | Proje içi üretim; **doğrulanmadı** |
| Maketler (\`src/components/maket/yapilar/*.ts\`) | Envanterdeki plan ölçülerinden kodla üretilen temsilî modeller | Proje içi kod |
| \`public/derinlik/\` | Depth Anything V2 (small) modeliyle (\`onnx-community/depth-anything-v2-small\`) çevrimdışı üretilmiş derinlik haritaları; kaynak fotoğrafları arşivdendir | Model lisansı ve türev çıktı koşulu **doğrulanmadı** |
| \`public/restorasyon/muradiye-cini.jpg\` | Kaynak **doğrulanmadı** (arşiv fotoğrafı olabilir; teyit edilmeli) | **doğrulanmadı** |
| \`public/gorseller/<eser-id>/\` fotoğrafları | Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi | Kullanım izni ve fotoğrafçı kredisi netleşmedi (docs/kokkod_kazanma_plani.md madde 41). Repo private; fotoğraflar herkese açık yayımlanmaz. Her görselde \`kredi\` alanı zorunlu ve \`tests/kredi-veri.mjs\` ile denetlenir |
| \`public/ikonlar/\`, \`favicon.svg\` | Projede üretildi | Proje içi |

## Sesler ve yazı tipleri

- **Sesler:** \`src/components/kilic/ses.ts\` ses dosyası içermez; sesleri tarayıcının Web Audio API'siyle kodla üretir. Harici ses dosyası yoktur.
- **Yazı tipi:** \`Inter\` yalnız yığın içinde adı geçer; web yazı tipi dosyası yüklenmez, yoksa \`Segoe UI\`/sistem yazı tipi kullanılır. Yazı tipi lisansı gerektiren gömülü dosya yoktur.
- **Tarihsel metinler:** Vakıf Eserleri Envanteri (Bursa) kitabından alınır; her bilgide cilt/bölüm ve sayfa kaynak satırı vardır. Yeni eklenen metinler \`scripts/idml_cikar.py\` ile envanter IDML dosyalarından çıkarılmıştır.
`
writeFileSync('docs/lisanslar.md', md)
console.log(`docs/lisanslar.md yazıldı: ${dogrudan.length} doğrudan, ${gecis.length} dolaylı üretim bağımlılığı`)
