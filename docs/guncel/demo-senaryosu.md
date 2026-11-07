# Canlı demo senaryosu

Yerel adres `http://localhost:4173` (`npm run build && npm run preview`). Canlı sitede kök adresi değiştirin. Süreler yaklaşıktır; Quest adımı gerçek cihaz ister, yoksa simülasyonla gösterilmez.

| Dakika | Adım | URL | Ne gösterilir |
|---|---|---|---|
| 0:00–0:30 | Açılış | `/` | Hikâye cümlesi, eser sayısı, üst çubukta yazı boyutu ve yüksek kontrast düğmeleri |
| 0:30–1:15 | Keşfet | `/#eserler` | Şehir/ilçe/kategori süzgeci; "3B maket" kategorisini seç, sayı güncellenir, "Süzgeci temizle" |
| 1:15–2:15 | Eser detay | `/eser/ulu-camii` | Galeri, foto kredisi, bilgi noktaları, kaynak satırı, "Kaynaklı bilgi" etiketi, üç soruluk test |
| 2:15–2:45 | Sesli dinle | `/eser/ulu-camii#tarihce-basligi` | "Sesli dinle" düğmesi Türkçe okur; "Okumayı durdur" |
| 2:45–4:15 | VR'da eline al | `/vr` → Bursa → Ulu Camii → `/vr/ulu-camii` | Harita, yapı seçimi, 3B maket; Quest'te "VR'a gir" ve tutma/ölçekleme |
| 4:15–5:30 | Görev ve rozet | `/yolculuk`, `/eser/muradiye-kulliyesi` | Restorasyon görevini tamamla; rozet ana sayfada görünür |
| 5:30–6:15 | Atölye (isteğe bağlı) | `/atolye/vazo` | Vazo modeli |
| 6:15–7:30 | Yönetimden eser ekle | `/yonetim` → `/yonetim/yeni` | Giriş (bulut açıksa), formu doldur, Kaydet; ana sayfada henüz görünmez |
| 7:30–8:15 | Onay | `/onay` | Eseri Onayla; ana sayfada belirir; Reddet ile kaybolur |
| 8:15–9:00 | Yeni şehir | `/vr` | `vrSehirler` listesine şehir eklemenin kodu (README "Yeni şehir ekleme"); bu veri henüz yok, canlı eklenmez |
| 9:00–9:30 | Kapanış | `/vizyon` | Vizyon sayfası "henüz uygulanmadı" etiketli; PWA kurulumu |

## Hazırlık

- Yönetim adımı için bulut kullanılacaksa `supabase/sema.sql` çalıştırılmış ve yönetici hesabı açılmış olmalı; yoksa adımlar `localStorage` ile aynı akışta çalışır.
- Demo öncesi `/yonetim` ekranında "Tüm üst katmanı sıfırla" ve tarayıcıda `kokxr-onay` anahtarını temizleyin.
- Yedek: ağ yoksa PWA çevrimdışı açılır (önceden bir kez açılmış olmalı).

## Wifi çökerse: yerel demo

```bash
nvm use 24
npm run demo          # buluttan bağımsız derler, http://127.0.0.1:4173 adresinde açar (eserler ve yönetim yerel kayıtla çalışır)
npm run demo:bulut    # .env'deki Supabase ile (internet ve kurulu tablo gerekir)
```

Demo öncesi, **internet varken**, tarayıcıda şu sayfaları bir kez açın (service worker ön belleği dolar; sonra çevrimdışı açılır). Cihazı PWA olarak "Yükle" ile kurmak ek güvence sağlar.

1. `/`  2. `/yolculuk`  3. `/eser/ulu-camii`  4. `/eser/muradiye-kulliyesi`  5. `/vr`  6. `/vr/ulu-camii`  7. `/atolye/vazo`  8. `/yonetim`  9. `/yonetim/yeni`  10. `/onay`

Sınırlar: Ulu Camii'nin 360° gezintisi `360tr.com` gömmesidir ve çevrimdışı açılmaz; sayfada yedek bağlantı ve fotoğraflı gezinti modu vardır, demoda bu iki yolu da gösterin. Quest VR için cihazın aynı ağdan siteye erişmesi gerekir (yerel demo Quest'te çalışmaz; Vercel adresi veya ortak ağ kullanın).
