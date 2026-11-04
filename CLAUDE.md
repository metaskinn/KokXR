# KökXR

@AGENTS.md

## Vaatler ve kurallar çakışırsa

Vaat, yapılacak işi belirler; yukarıdaki kurallar ise ürünün neyi iddia edebileceğini. Verisi olmayan bir vaat var gibi gösterilmez ve tarihsel bilgi uydurulmaz. Böyle bir durumda eksik veriyi kullanıcıya bildir.

## Komutlar

Node.js 24+ gerekir (`.nvmrc`).

```bash
npm install
npm run dev
npm run test:hizli      # tip denetimi + saf testler, saniyeler sürer
npm run test:tarayici   # build + preview + tarayıcı testleri, kısa özet; sunucuyu kendi kapatır
npm run test:e2e        # uçtan uca; ayrı terminalde preview açık olmalı
```

Yerel tarayıcı testleri yazılımsal çizimle yavaş çalışır; süreye değil koşula bağlı bekleyin. FPS yalnız gerçek cihazda ölçülür.

## Çalışma düzeni

- Kullanıcıyla Türkçe konuş.
- `package.json` bağımlılığı eklemeden önce sor.
- Repo private kalır; izni netleşmemiş fotoğraflar herkese açık yayımlanmaz.
- `master`'a birleştirmeden önce sor.
