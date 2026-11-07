# Supabase kurulumu (yaklaşık 5 dakika)

Önkoşul: `.env` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` dolu (git'e girmez). Bu adımlar yapılana kadar uygulama yerel kayıtla çalışır ve yönetim giriş istemez.

1. Supabase Dashboard'da projeyi aç → sol menüden **SQL Editor** → **New query**.
2. `supabase/sema.sql` dosyasının tamamını yapıştır → **Run**. "Success. No rows returned" görünmeli (tablolar `eserler`, `gorseller`, `katkilar`, `gorseller` kovası, RLS kuralları).
3. Sol menüden **Authentication → Users → Add user → Create new user**: e-posta ve parola yaz, **Auto Confirm User**'ı işaretle.
4. **SQL Editor**'de yeni sorgu aç, `sema.sql` sonundaki satırı kendi e-postanla çalıştır:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"yonetici"}' where email = 'EPOSTA@ornek.com';`
5. **Storage**'a bak: `gorseller` kovası (Public) görünmeli; yoksa **New bucket → gorseller → Public**.
6. Geliştirme sunucusunu yeniden başlat (`npm run dev`) veya `npm run build` ile yeniden derle (`.env` derlemeye gömülür).
7. Uygulamada **Yönetim**'e git: giriş formu çıkmalı; 3. adımdaki e-posta ve parolayla gir.
8. **Yeni eser ekle** → formu doldur → Kaydet. Dashboard'da **Table Editor → eserler** altında satır `beklemede` görünmeli.
9. **Onay akışı** sayfasında eseri **Onayla**; Table Editor'de `durum` `onaylandi` olmalı, başka bir tarayıcıda ana sayfada eser görünmeli.
10. Yönetim'de **Görsel yükle** ile bir fotoğraf yükle; Storage → `gorseller` içinde dosya, `gorseller` tablosunda kredi satırı görünmeli.

Sorun giderme: Yönetim giriş yerine doğrudan açılıyorsa tablolar hâlâ yok demektir (adım 2). Giriş sonrası onay çalışmıyorsa 4. adım (yönetici rolü) eksiktir.
Fotoğraf kredisi varsayılanı: "Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi".
