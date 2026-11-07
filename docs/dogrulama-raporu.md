# Doğrulama raporu (G12)

Amaç: eski 10 eserin metinlerindeki yıl ve sayıların kitaptaki (Vakıf Eserleri Envanteri – Bursa, Osmangazi) metinle uyuştuğunu denetlemek.

## Yöntem
- Kitabın IDML dosyaları Drive'dan indirildi, `scripts/idml_cikar.py` ile düz metne çevrildi.
- `scripts/dogrulama-karsilastir.mjs` her eserin özet, tarihçe, dönem ve bilgi noktası metinlerindeki 3–4 haneli sayıları çıkarır ve ilgili külliyenin kitap metninde arar.
- Betik tek başına kanıt değildir: sayı kitapta herhangi bir yerde geçiyorsa "bulundu" sayar; sayının doğru olguya bağlandığını göstermez.

## Sonuç
| Eser | Sayı | Kitapta bulundu | Bulunamayan |
|---|---|---|---|
| Ulu Camii | 10 | 10 | – |
| II. Murad (Muradiye) | 14 | 14 | – |
| Hamzabey | 11 | 11 | – |
| I. Murad Hudâvendigâr | 20 | 20 | – |
| Orhan Bey | 13 | 13 | – |
| Timurtaş Paşa | 12 | 11 | 2025 (kitap değil, `kaynaklar`ta gösterilen 2025 tarihli makale) |
| Yıldırım | 18 | 18 | – |
| Emir Sultan | 14 | 14 | – |
| Umur Bey | 9 | 9 | – |
| Yeşil Çelebi Mehmed | 19 | 19 | – |

Yeni 4 eser (Koza Han, Eyne Bey Hamamı, Eyne Bey Medresesi, Osman Gazi Türbesi) doğrudan kitap metninden yazıldı; ayrıca karşılaştırılmadı.

## Sınırlar (dürüst durum)
- Yalnız sayılar denetlendi. İsimler, ilişkiler ve yorum cümleleri satır satır okunmadı; bunlar için insan okuması gerekir.
- Test soruları ve zaman katmanları karşılaştırmaya girmedi.
- Hiçbir eserin etiketi değiştirilmedi; hepsi `dogrulanmis` kalıyor, ancak bu etiket "sayılar kitapla çelişmiyor" düzeyindedir, tam okuma düzeyinde değildir.
- Görsel izinleri bu rapor kapsamında değil (bkz. `docs/lisanslar.md`).
