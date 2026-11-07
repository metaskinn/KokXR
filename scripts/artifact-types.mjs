// Builds src/content/artifact-types.json: for each artifact the building types found in its own name
// (whole words such as "Camii", "Türbesi", "Hanı") and, for Bursa, the inventory book's section.
// A name such as "X Camii ve Haziresi" gets both types. Names with no type word get "diger".
// Usage: node scripts/artifact-types.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = 'src/content/artifacts'
const inventory = JSON.parse(readFileSync('src/content/inventory.json', 'utf8'))
const sectionOf = new Map(inventory.filter((e) => e.artifactId).map((e) => [e.artifactId, e.section]))

// Type words matched as whole words (Turkish suffixed forms included).
const words = [
  ['cami', /^(camii?|cami'?si|camisi|mescidi?|mescit|mescid|namazgâh|namazgah)$/],
  ['turbe', /^(türbesi|türbe|türbeleri|kümbeti|kümbet|haziresi|hazire|mezarı|mezarlığı|kabri|makamı|makam)$/],
  ['kulliye', /^(külliyesi|külliye)$/],
  ['medrese', /^(medresesi|medrese|mektebi|mektep|darülkurra|darülhuffazı|darülhadis|okulu|ortaokulu|ilkokulu|kütüphanesi|muallimhane)$/],
  ['han', /^(hanı|han|kervansarayı|kervansaray|bedesteni|bedesten|çarşısı|çarşı|arastası|arasta|dükkânları|dükkanları)$/],
  ['hamam', /^(hamamı|hamam)$/],
  ['su', /^(çeşmesi|çeşme|sebili|sebil|sarnıcı|sarnıç|şadırvanı|köprüsü|köprü|değirmeni)$/],
  ['tekke', /^(tekkesi|tekke|zaviyesi|zaviye|dergâhı|dergahı|dergâh|hanikahı|hanikâhı|tabhanesi|tabhane)$/],
  ['kilise', /^(kilisesi|kilise|manastırı)$/],
  ['imaret', /^(imareti|imaret|darüşşifası|darüşşifa)$/],
  ['sivil', /^(evi|ev|konut|konağı|konak|konakları|binası|bina|tiyatrosu|müzesi|otel|otelı)$/],
]
// Inventory sections that name a single building type directly.
const sectionType = { mosque: 'cami', tomb: 'turbe', education: 'medrese', commercial: 'han', sufi: 'tekke' }

const lower = (s) => s.toLocaleLowerCase('tr')
const out = {}
const counts = {}
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const a = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'))
  // Text in parentheses is an alternative name, not a type ("Kerhan (Yemeniciler) Mescidi").
  const tokens = lower(a.name.replace(/\([^)]*\)/g, ' ')).split(/[^\p{L}'’]+/u).filter(Boolean)
  const types = new Set()
  for (const t of tokens) for (const [type, re] of words) if (re.test(t)) types.add(type)
  const section = sectionType[sectionOf.get(a.id)]
  if (section) types.add(section)
  if (!types.size) types.add('diger')
  out[a.id] = [...types]
  for (const t of types) counts[t] = (counts[t] ?? 0) + 1
}
writeFileSync('src/content/artifact-types.json', JSON.stringify(out, null, 0).replace(/\],"/g, '],\n"') + '\n')
console.log(`artifact-types.json: ${Object.keys(out).length} artifacts`, counts)
