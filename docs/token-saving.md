# Token tasarrufu

Kaynak: [Claude Code maliyet belgesi](https://code.claude.com/docs/en/costs). Kısa kurallar `AGENTS.md`'de, her oturumda yüklenir; bu dosya gerekçe ve kurulum içindir.

## Kurallar (sırayla uygula)

1. **Hedefi daralt.** Dosya yolu biliniyorsa doğrudan oraya git. Önce `rg`, sonra `Read` ile yalnız gereken aralık.
2. **Yeniden okuma.** Konuşmada olan dosyayı veya bilgiyi tekrar açma, kararı yeniden tartışma.
3. **Çıktıyı kıs.** Uzun komutları `| tail -n 20` veya `rg` ile süz. Ham günlük, dosya dökümü ve JSON'u bağlama alma.
4. **En ucuz yöntemi seç.** Yerel araç ve CLI (`gh`, `curl`, `vercel`) MCP'den önce gelir. Web'de tam sayfa yerine hedefli sorgu kullan.
5. **Araştırmayı sınırla.** Belge bilinen bir adresteyse tek sorgu yeter; geniş arama yapma.
6. **Küçük test, sonra büyük test.** Önce `test:hizli`, ardından tek tarayıcı testi. Tam paket yalnız iş sonunda, süresi uzunsa arka planda ve izleme yapmadan çalışır.
7. **Toplu çağrı.** Birbirine bağlı olmayan araç çağrılarını tek yanıtta gönder.
8. **Alt ajan seyrek.** Yalnız bağımsız ve çok dosyalı iş için aç. Salt arama ve günlük için `model: haiku`. Tarihsel metin doğrulamasında Haiku kullanma.
9. **Kısa yanıt.** Yapılanı tekrar anlatma, kod yapıştırma; sonucu ve kararı yaz.
10. **Bağlamı temizle.** Konu değişince `/clear`; uzayınca `/compact`. Korunacaklar `CLAUDE.md`'deki `Compact instructions` bölümünde.
11. **Büyük işte önce plan.** Çok dosyalı işte plan modu kullan, yanlış gidişi `Esc` veya `/rewind` ile erken kes.

**Sınır:** Tasarruf; test, kaynak denetimi veya `AGENTS.md` kurallarını atlamak için gerekçe olamaz.

## Uygulanan ayarlar

| Ayar | Yer | Kapsam |
|---|---|---|
| `node_modules`, `dist`, `package-lock.json` okuma engeli | `.claude/settings.json` | Takım |
| `model: sonnet`, `effortLevel: medium` | `.claude/settings.local.json` | Yalnız bu makine |
| Bu projede gereksiz eklentiler kapalı | `.claude/settings.local.json` | Yalnız bu makine |

Ayarlar yeni oturumda etkinleşir; `/context` ile doğrula. Zor bir iş için `/model opus`.

## Seçilmeyenler

- **`MAX_THINKING_TOKENS`:** Yalnız sabit düşünme bütçeli modellerde geçerli; bunun yerine `effortLevel` kullanıldı.
- **Çıktı süzen hook:** `test:tarayici` zaten kısa özet veriyor, bakımına değmez.
- **TypeScript kod zekâsı eklentisi:** Kurulum gerektirir; final öncesi eklenmedi.
- **Ajan takımları:** Maliyeti artırır.
