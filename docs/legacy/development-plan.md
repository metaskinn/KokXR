# KökXR — Faz Faz Geliştirme Planı

> Bugün: **23 Ekim 2026 Cuma** · Final: **7–8 Kasım 2026 (Cumartesi–Pazar)** · Kalan: 15 gün
> Kurallar ve teknik detaylar için: `developer.md`

---

## MVP: üç şey, fazlası yok

| # | MVP | Demoda görünen |
|---|---|---|
| 1 | **Gezilebilir bir mekân** | Kullanıcı tarihi bir odanın içinde yürür, duvarlardan geçemez |
| 2 | **Mekândaki eşyalarla etkileşim** | Odadaki 3–5 eşya alınır, çevrilir, bırakılır |
| 3 | **Tek bir eserin bilgisi** | Ana esere yaklaşınca ya da onu tutunca bilgi paneli açılır: ad, dönem, tarihçe, bilgi noktaları, kaynak |

Bunların dışında kalan her şey (galeri, mini test, zaman katmanı, öğretmen paneli…) **yapılmaz**, sunumda "vizyon" olarak anlatılır.

**İki platform, aynı sahne:**
- **Masaüstü** (WASD + fare): Her durumda hazır olan ürün. Şartnamedeki "masaüstü uygulaması" şartını karşılar.
- **VR** (Quest): Faz 0'da cihaz doğrulanırsa eklenir.

---

## Fazlar

Her fazın bir **çıkış kriteri** var. Kriter sağlanmadan bir sonraki faza geçilmez. Kriter tarihinde sağlanamazsa "gecikirse" sütunundaki karar uygulanır.

### Faz 0 · Kurulum ve doğrulama
**23–24 Eki (Cum–Cmt)** · Hafta 1

| Kim | İş |
|---|---|
| Unity | Quest geliştirici modu, Quest Link, Unity 6.3 LTS, VR şablonuyla `KokXR` projesi, Git + GitHub Desktop |
| 3D | Mekân seçimi için 3 aday ortam modeli (oda, medrese hücresi, kütüphane…) + 3 aday eser modeli. Lisans tablosu |
| İçerik | Ana eser için 3 aday. Her biri için kısa tarihçe ve en az 2 kaynak |
| Ürün | 2 dakikalık demo senaryosu taslağı. Sunumdaki kapsam ifadelerinin güncellenmesi |

**Çıkış kriteri:** Play'e basınca Quest'te şablon sahnesi görünüyor ve küp tutulabiliyor. Proje GitHub'da.
**Karar (24 Eki akşamı):** Mekân ve ana eser seçilir. Bu karar bir daha değişmez.
**Gecikirse:** 25 Eki'ye kadar VR çalışmazsa **VR tamamen bırakılır**, masaüstü yoluna geçilir. Kayıp 0 gün olur, çünkü sonraki fazlar masaüstüyle de ilerleyebilir.

---

### Faz 1 · Gezilebilir mekân
**25–27 Eki (Paz–Sal)** · Hafta 1

| Kim | İş |
|---|---|
| Unity | `Mekan.unity` sahnesi. Ortam modelinin yerleştirilmesi (ya da ProBuilder ile basit bir oda). Zemin ve duvarlara collider ekleme. Masaüstü için WASD + fare kontrolcüsü. VR için şablonun hareket (locomotion) sistemi: teleport + yürüme. Temel ışık |
| 3D | Seçilen ortam modelinin Blender'da temizlenmesi: ölçek (1 birim = 1 m), gereksiz detayların silinmesi, poligon azaltma |
| İçerik | Ana eserin tam metni: ad, dönem, yer, vakıf, 100–150 kelime tarihçe, 3 bilgi noktası, kaynaklar |
| Ürün | Mekân içinde kullanıcının izleyeceği yolun çizimi: giriş → nereye bakar → esere nasıl yönelir |

**Çıkış kriteri:** Hem masaüstünde hem (varsa) VR'da odanın içinde 1 dakika boyunca dolaşılabiliyor. Duvardan ya da zeminden düşülmüyor. Build alınmış hâlde de çalışıyor.
**Gecikirse:** Hazır ortam modeli sorun çıkarırsa ProBuilder ile 4 duvar, zemin ve bir kapı yapılır. Görsellik sonra iyileştirilir.

---

### Faz 2 · Eşyalarla etkileşim
**28–30 Eki (Çar–Cum)** · Hafta 1 → Hafta 2

| Kim | İş |
|---|---|
| Unity | 3–5 eşyayı tutulabilir yapmak. VR: `XR Grab Interactable` + `Rigidbody`. Masaüstü: bakılan eşyaya tıklayınca kameranın önüne gelir, fareyle çevrilir, tekrar tıklayınca yerine döner. Eşyanın üzerine gelince vurgulama (highlight) |
| 3D | Eşya modellerinin hazırlanması (kitap, şamdan, rahle, kandil…) ve ana eserin son hâli. Pivot ortada, ölçek doğru |
| İçerik | Diğer eşyalar için birer cümlelik etiket metni ("19. yy pirinç şamdan, temsili") |
| Ürün | Faz 1 build'ini ekip dışından 2 kişiye test ettirmek, takıldıkları yerleri not etmek |

**Çıkış kriteri:** Kullanıcı odadaki her eşyayı alıp çevirebiliyor ve bırakabiliyor. Eşyalar duvarın içine düşmüyor ya da kaybolmuyor (düşen eşya yerine döner).
**Gecikirse:** Eşya sayısı 1'e (yalnızca ana eser) indirilir. Fizik sorun çıkarırsa eşyalar fiziksiz tutulur, bırakılınca yerine döner.

---

### Faz 3 · Eserin bilgisi
**31 Eki–2 Kas (Cmt–Pzt)** · Hafta 2

| Kim | İş |
|---|---|
| Unity | Ana eser tutulunca ya da yaklaşılınca açılan **bilgi paneli** (VR'da havada duran, masaüstünde ekranda duran panel). Eserin üzerinde 3 **bilgi noktası** (hotspot): tıklanınca o noktanın açıklaması gösterilir. Panelin altında kaynak satırı ve "doğrulanmış / temsili" etiketi. Metinler bir JSON dosyasından okunur |
| 3D | Bilgi noktalarının model üzerindeki konumlarının belirlenmesi |
| İçerik | Metinlerin JSON'a girilmesi, kaynakların son kontrolü. İsteğe bağlı: tarihçenin sesli okunmuş kaydı (.mp3) |
| Ürün | Erişilebilirlik kontrolü: yazı boyutu, kontrast, altyazı. Sunum taslağı v1 |

**Çıkış kriteri:** Demo senaryosu baştan sona çalışıyor: içeri gir → dolaş → eşyaya dokun → ana eseri al → bilgi paneli ve bilgi noktaları → kaynak görünür.
**Gecikirse:** Bilgi noktaları kesilir, sadece tek bir bilgi paneli kalır. Ses kaydı kesilir.

---

### Faz 4 · Cila ve dondurma
**3–4 Kas (Sal–Çar)** · Hafta 2

| Kim | İş |
|---|---|
| Unity | Karşılama ekranı ("KökXR — başlamak için tıkla" + kontroller). Ortam sesi. Quest'e APK build alma ve performans kontrolü (takılma olmamalı). Hata düzeltme |
| 3D | Işık ve doku iyileştirmeleri, yalnızca performansı bozmayanlar |
| İçerik | Sunumdaki tarihsel bilgilerin ve kaynakların kontrolü. Lisans slaytı |
| Ürün | README: kurulum ve çalıştırma. Test senaryosunun build üzerinde tam koşturulması |

**4 Kas Çarşamba akşamı: KOD DONDURMA.** Bu saatten sonra yeni özellik eklenmez, yalnızca demoyu bozan hatalar düzeltilir.

---

### Faz 5 · Prova
**5–6 Kas (Per–Cum)** · Hafta 2 → Final

| Kim | İş |
|---|---|
| Hepsi | 3 tam prova: sunum + canlı demo, süre tutarak |
| Unity | Son build'in USB'ye ve iki dizüstü bilgisayara kopyalanması |
| Ürün | Yedek demo videosunun çekilmesi (masaüstü + VR ekran kaydı) |
| Hepsi | Her üye mimariyi ve kendi kısmını 1 dakikada anlatabilir hâle gelir |

### Final · 7–8 Kas (Cmt–Paz)

---

## Haftalık düzen

### Hafta 1 · 23–29 Ekim · "Mekân ve eşyalar"
**Hafta hedefi:** Odada dolaşılıyor ve eşyalar tutulabiliyor.

| Gün | Tarih | Faz | Gün sonu beklenen |
|---|---|---|---|
| Cum | 23 Eki | 0 | Unity kuruldu, VR şablonu açıldı |
| Cmt | 24 Eki | 0 | Quest'te küp tutuldu, mekân ve eser seçildi |
| Paz | 25 Eki | 1 | Sahnede ortam modeli var |
| Pzt | 26 Eki | 1 | Masaüstünde WASD ile yürünüyor |
| Sal | 27 Eki | 1 | VR'da da yürünüyor, build alındı ✅ |
| Çar | 28 Eki | 2 | VR'da eşyalar tutuluyor |
| **Per** | **29 Eki** | 2 | **Hafta 1 değerlendirmesi** (aşağıda) |

### Hafta 2 · 30 Ekim–5 Kasım · "Bilgi ve cila"
**Hafta hedefi:** Demo senaryosu baştan sona çalışıyor ve kod donduruldu.

| Gün | Tarih | Faz | Gün sonu beklenen |
|---|---|---|---|
| Cum | 30 Eki | 2 | Masaüstünde eşya tutma çalışıyor ✅ |
| Cmt | 31 Eki | 3 | Bilgi paneli JSON'dan doluyor |
| Paz | 1 Kas | 3 | Bilgi noktaları çalışıyor |
| Pzt | 2 Kas | 3 | Demo senaryosu uçtan uca çalışıyor ✅ |
| Sal | 3 Kas | 4 | Karşılama ekranı, Quest APK |
| **Çar** | **4 Kas** | 4 | **KOD DONDURMA** |
| **Per** | **5 Kas** | 5 | **Hafta 2 değerlendirmesi**, prova 1 |

### Final haftası · 6–8 Kasım
| Cum | 6 Kas | Prova 2 ve 3, yedek video, son build kopyaları |
|---|---|---|
| Cmt–Paz | 7–8 Kas | **Final** |

---

## İlerleme takip ritmi

### Her gün · 15 dakikalık durum toplantısı (öğlen veya akşam)

Herkes 3 cümle söyler:
1. **Dün** ne bitti?
2. **Bugün** ne bitecek?
3. **Engel** var mı?

Engel varsa toplantıdan sonra ilgili iki kişi çözer. Toplantı uzatılmaz. Sonuçlar panodaki görev durumlarına işlenir.

### Haftalık değerlendirme · Perşembe akşamı, 45 dakika

1. **Demo (15 dk):** Unity sorumlusu **build alınmış** sürümü gösterir. Editör ekranı sayılmaz.
2. **Çıkış kriterleri (10 dk):** Haftanın fazları kriterleri sağladı mı? Evet / hayır.
3. **Kesme kararı (10 dk):** Gecikme varsa ilgili fazın "gecikirse" kararı **o anda** uygulanır. "Biraz daha uğraşalım" seçeneği yoktur.
4. **Gelecek hafta (10 dk):** Görevler panoda kişilere atanır.

Değerlendirme notu `ilerleme.md` dosyasına şu formatta eklenir:

```
## Hafta 1 — 29 Ekim
Durum: 🟢 yolunda / 🟡 riskli / 🔴 gecikmede
Çalışan: …
Çalışmayan: …
Kesilen: …
Gelecek hafta: …
```

### Kilometre taşı yedekleri
Her ✅ işaretli günde çalışan build `KokXR_<tarih>.zip` olarak USB'ye alınır. Finalde bir şey bozulursa en son ✅ sürüme dönülür.

---

## Şartname notu

Şartname 5.1.1 maddesi "birden fazla vakıf eseri" ve "içerik ekleme/düzenleme" istiyor. Tek eserli bu kapsam iki maddeyi tam karşılamıyor ve puan kaybı riski taşıyor. Riski azaltan, plana zaten dahil olan iki şey var:
- Eser bilgisi kodda değil **JSON dosyasında** (Faz 3). Jüriye "Yeni eser = yeni JSON dosyası + model; kod değişmiyor" gösterilebilir.
- Odadaki diğer eşyaların da kısa etiketleri var (Faz 2).

Faz 4 zamanında biterse ve ekip isterse, ikinci bir eser için yalnızca JSON + model eklemek yaklaşık yarım günlük iş olur. Bu bir karar değil, seçenek.
