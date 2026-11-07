// Eser metinlerindeki yıl ve sayıları kitap (IDML) metniyle karşılaştırır; sonuç yalnız bir ipucudur, kaynak okuması yerine geçmez.
// Kullanım: node scripts/dogrulama-karsilastir.mjs <eslesme.json>   (eslesme: {eserId: idmlCikti.json})
import { readFileSync } from 'node:fs'

const eslesme = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const tr = (s) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ')
const metinler = (e) => [
  ['özet', e.ozet], ['tarihçe', e.tarihce], ['dönem', e.donem],
  ...(e.bilgiNoktalari ?? []).map((b) => [`bilgi:${b.id}`, b.metin]),
].filter(([, m]) => typeof m === 'string')

const sonuc = []
for (const [id, dosya] of Object.entries(eslesme)) {
  const e = JSON.parse(readFileSync(`src/data/eserler/${id}.json`, 'utf8'))
  const kitap = tr(JSON.parse(readFileSync(dosya, 'utf8')).map((h) => h.metin).join(' ')).replace(/(\d)[.\s](?=\d{3}\b)/g, '$1')
  const satirlar = []
  let toplam = 0, bulunan = 0
  for (const [yer, m] of metinler(e)) {
    const sayilar = [...new Set(m.match(/\b\d{3,4}\b/g) ?? [])]
    for (const s of sayilar) { toplam++; if (kitap.includes(s)) bulunan++; else satirlar.push(`${yer}: ${s}`) }
  }
  sonuc.push({ id, toplam, bulunan, yok: satirlar })
}
console.log(JSON.stringify(sonuc, null, 1))
