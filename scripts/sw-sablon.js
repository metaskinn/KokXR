// Service worker şablonu. vite.config.ts derlemede sürümü ve ön bellek listesini yazar, çıktı: dist/sw.js
const ONBELLEK = 'kokxr-__SURUM__'
const ON_YUKLEME = __ON_YUKLEME__

self.addEventListener('install', (olay) => {
  olay.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(ON_YUKLEME)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.startsWith('kokxr-') && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  )
})

async function sakla(istek, yanit) {
  if (!yanit.ok || yanit.type !== 'basic') return
  // Depolama dolarsa yanıt yine kullanıcıya gider.
  try { await (await caches.open(ONBELLEK)).put(istek, yanit) } catch { /* yer yok */ }
}

async function sayfaGetir(istek) {
  try {
    return await fetch(istek)
  } catch {
    return (await caches.match('/index.html')) ?? Response.error()
  }
}

async function dosyaGetir(istek, olay) {
  const kayitli = await caches.match(istek)
  const guncelle = fetch(istek).then((yanit) => { olay.waitUntil(sakla(istek, yanit.clone())); return yanit })
  if (kayitli) { olay.waitUntil(guncelle.catch(() => {})); return kayitli }
  return guncelle
}

self.addEventListener('fetch', (olay) => {
  const { request: istek } = olay
  const adres = new URL(istek.url)
  // Başka sitelere (360° tur, Supabase) ve kısmi isteklere karışılmaz.
  if (istek.method !== 'GET' || adres.origin !== self.location.origin || istek.headers.has('range')) return
  if (istek.mode === 'navigate') olay.respondWith(sayfaGetir(istek))
  else olay.respondWith(dosyaGetir(istek, olay))
})
