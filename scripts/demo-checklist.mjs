// Builds docs/demo-dogrulama-listesi.md: every claim of the demo artifacts with its source and page, for manual checking against the books.
// Usage: node scripts/demo-checklist.mjs   (edit `ids` to change the artifacts)
import { readFileSync, writeFileSync } from 'node:fs'
const ids = ['ulu-mosque', 'muradiye-complex']
const out = []
out.push('# Demo içeriklerinin doğrulama listesi (Ulu Camii + Muradiye Külliyesi)')
out.push('')
out.push('Amaç: sunulacak iki eserin her iddiasını, kayıtta gösterilen kaynak ve sayfayla kitap/belge üzerinden elle kontrol etmek. **Bu liste doğrulama yapmaz;** yalnızca kontrol edilecek iddiaları ve işaret ettikleri kaynakları çıkarır. Kutuyu yalnızca kaynağı açıp metni karşılaştırdıktan sonra işaretle. İşaretlenmeyen iddia sunumda “kaynaklı” olarak anılır, “doğrulandı” olarak anılmaz.')
out.push('')
out.push('Kapsam notu: Muradiye Külliyesi “ikinci demo eseri” olarak seçildi (maketi var ve kısa bağlantısı `/m`); ekip başka bir eser seçerse aynı betikle (komut en altta) liste yeniden üretilir. Üretim tarihi: 8 Kasım 2026.')
for (const id of ids) {
  const a = JSON.parse(readFileSync(`src/content/artifacts/${id}.json`, 'utf8'))
  const src = new Map(a.sources.map((k) => [k.id, k]))
  const ref = (sid) => { const k = src.get(sid); return k ? `${k.text}${k.page ? `, s. ${k.page}` : ''}` : `(kaynak yok: ${sid || 'boş'})` }
  const row = (label, text, sid) => out.push(`- [ ] **${label}:** ${text}\n  - Kaynak: ${ref(sid)}`)
  out.push('', `## ${a.name} (\`${id}\`)`, '')
  out.push(`Şehir/ilçe: ${a.city} / ${a.district} · Dönem: ${a.period} · Vakıf: ${a.endowment} · Kayıt durumu: ${a.verification}`)
  out.push('', '### Başlık bilgileri', '')
  out.push(`- [ ] **Dönem:** ${a.period}`, `- [ ] **Vakıf:** ${a.endowment}`, `- [ ] **Özet:** ${a.summary}`)
  out.push('', '### Tarihçe (kayıtta tek metin; cümleleri tek tek kaynaktan kontrol et)', '')
  out.push(a.history.split(/(?<=[.!?])\s+/).map((c) => `- [ ] ${c}`).join('\n'))
  if (a.hotspots?.length) { out.push('', '### Fotoğraf bilgi noktaları', ''); a.hotspots.forEach((h) => row(h.title, h.text, h.sourceId)) }
  if (a.model?.infos?.length) { out.push('', '### Maket açıklamaları', ''); a.model.infos.forEach((h, i) => row(`Maket ${i + 1}`, h.text, h.sourceId)) }
  if (a.model?.interiorInfos?.length) { out.push('', '### İç mekân bilgi kartları (VR/masaüstü)', ''); a.model.interiorInfos.forEach((h) => row(h.title, h.text, h.sourceId)) }
  if (a.timeLayer?.length) { out.push('', '### Zaman katmanı kayıtları', ''); a.timeLayer.forEach((h) => row(`${h.period}: ${h.title}`, h.text, h.sourceId)) }
  if (a.test?.length) { out.push('', '### Quiz (doğru cevap ve açıklama)', ''); a.test.forEach((q, i) => row(`Soru ${i + 1}: ${q.question} → doğru: ${q.options[q.correct]}`, q.description, q.sourceId)) }
  out.push('', '### Kaynak listesi', '')
  a.sources.forEach((k) => out.push(`- ${k.id}: ${k.text}${k.page ? `, s. ${k.page}` : ''}`))
  out.push('', '### Görsel kredileri', '')
  const credits = new Map(); (a.images ?? []).forEach((g) => credits.set(g.credit ?? '(kredi yok)', (credits.get(g.credit ?? '(kredi yok)') ?? 0) + 1))
  out.push(...[...credits].map(([c, n]) => `- ${n} görsel: ${c}`), '- Kredi satırı izin değildir; kullanım izni ayrıca doğrulanmalı (bkz. PLAN §0, sıra 3).')
}
out.push('', '---', 'Yeniden üretim: `node scripts/demo-checklist.mjs` (`ids` dizisini değiştir); betik `src/content/artifacts/<id>.json` dosyalarını okur.')
writeFileSync('docs/demo-dogrulama-listesi.md', out.join('\n') + '\n')
console.log('yazıldı', out.length, 'satır')
