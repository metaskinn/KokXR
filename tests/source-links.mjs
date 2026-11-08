// Source links: every Vakıf Katılım book citation in the data opens the book's PDF at a sane page; photo credits get no link.
import { readdirSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { register } from 'node:module'
// verification.ts imports './artifactTypes.js' (the server build's spelling); resolve it to the .ts file here.
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  try { return await next(s, c) } catch (e) { if (s.endsWith('.js') && c.parentURL?.includes('/src/')) return next(s.slice(0, -3) + '.ts', c); throw e } }`))
const { INVENTORY_BOOKS, parseBookCitation, bookCitationText, pdfPage, sourceLink } = await import('../src/content/inventoryBooks.ts')
const { artifactErrors, artifactValid, sourceUrlValid } = await import('../src/domain/verification.ts')

const dir = 'src/content/artifacts'
let book = 0, credits = 0
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const artifact = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  for (const s of artifact.sources) {
    const link = sourceLink(s)
    if (/^Fotoğraf:/.test(s.text)) { credits++; assert.equal(link, undefined, `${f}: photo credit got a link`); continue }
    if (!/^(Vakıf Eserleri Envanteri|Hatay Vakıf Eserleri)\b/.test(s.text)) continue
    book++
    const c = parseBookCitation(s.text)
    assert.ok(c, `${f}: book not recognised: ${s.text}`)
    assert.ok(link?.startsWith(c.book.url), `${f}: no link for ${s.text}`)
    if (s.page) {
      const m = link.match(/#page=(\d+)$/)
      assert.ok(m, `${f}: no #page for page ${s.page}`)
      const printed = Number(s.page.match(/\d+/)[0])
      assert.ok(+m[1] >= 1 && +m[1] <= c.book.pdfPages && Math.abs(+m[1] - printed / 2) <= 3, `${f}: page ${s.page} -> ${m[1]}`)
    }
  }
}
assert.ok(book > 1800, `only ${book} book sources`)
assert.ok(credits > 600)

// Measured spot checks (pdftotext): printed page -> PDF page.
const byId = Object.fromEntries(INVENTORY_BOOKS.map((b) => [b.id, b]))
for (const [id, printed, pdf] of [['bursa-1', 177, 89], ['bursa-1', 178, 90], ['bursa-2', 16, 9], ['bursa-3', 18, 10], ['konya-1', 14, 9], ['konya-2', 12, 8], ['hatay', 13, 7], ['hatay', 459, 230]]) assert.equal(pdfPage(byId[id], printed), pdf, `${id} s. ${printed}`)
assert.equal(pdfPage(byId['bursa-1'], 5000), undefined)
assert.equal(sourceLink({ id: 'a', text: 'Vakıf Eserleri Envanteri – Bursa, Cilt 1, Osmangazi, "Hamza Bey Külliyesi"', page: '177-178' }), `${byId['bursa-1'].url}#page=89`)
assert.equal(sourceLink({ id: 'a', text: 'Vakıf Eserleri Envanteri – Bursa, II. Cilt, Yıldırım, "X"', page: '20' }), `${byId['bursa-2'].url}#page=11`)

// Composition round trip and the optional url (book link first).
const c = { book: byId['konya-2'], district: 'Meram', item: 'Sahib Ata Camii' }
assert.equal(bookCitationText(c), 'Vakıf Eserleri Envanteri – Konya, Cilt 2, Meram, "Sahib Ata Camii"')
assert.deepEqual(parseBookCitation(bookCitationText(c)), c)
assert.equal(bookCitationText({ book: byId.hatay, district: 'Antakya', item: '' }), 'Hatay Vakıf Eserleri, Antakya')
assert.equal(sourceLink({ id: 'a', text: 'Başka kitap', url: 'https://example.org/x' }), 'https://example.org/x')
assert.equal(sourceLink({ id: 'a', text: 'Başka kitap', url: 'javascript:alert(1)' }), undefined)
assert.ok(sourceLink({ id: 'a', text: 'Hatay Vakıf Eserleri, Antakya, "X"', page: '10', url: 'https://example.org/' }).startsWith(byId.hatay.url))
assert.ok(sourceUrlValid('https://example.org') && !sourceUrlValid('ftp://example.org') && !sourceUrlValid('https://u:p@example.org'))

// Validators: url and required question / point sources.
const base = JSON.parse(readFileSync(`${dir}/hamzabey-complex.json`, 'utf8'))
assert.deepEqual(artifactErrors(base), {})
assert.ok(artifactValid({ ...base, sources: base.sources.map((s, i) => i ? s : { ...s, url: 'https://example.org' }) }))
assert.ok(!artifactValid({ ...base, sources: base.sources.map((s, i) => i ? s : { ...s, url: 'javascript:x' }) }))
assert.ok(artifactErrors({ ...base, sources: base.sources.map((s, i) => i ? s : { ...s, url: 'nope' }) })['source-0-url'])
assert.equal(artifactErrors({ ...base, test: base.test.map((t, i) => i ? t : { ...t, sourceId: '' }) })['test-0-source-id'], 'Bir kaynak seçin.')
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const a = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  const e = Object.keys(artifactErrors(a)).filter((k) => /source-id/.test(k))
  assert.deepEqual(e, [], `${f}: ${e}`)
}
console.log(`Source links: ${book} book sources linked, ${credits} photo credits without a link.`)
