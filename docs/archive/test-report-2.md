# Test Report 2 — 3 Kasım 2026, 15:30

**Tested by:** Claude (automatically with Playwright; Antigravity was not run in this session because it required permission)
**Browsers:** Chromium 156 (software WebGL, SwiftShader) · Firefox 157
**Script:** `tests/uctan-uca.mjs` — can be re-run with `npm run test:e2e`

## Result: 15/15 steps, passed in all three configurations

| # | Step | Chromium 1280 | Chromium 360 | Firefox 1280 |
|---|------|:-:|:-:|:-:|
| 1a | The first Tab goes to the "Ana içeriğe geç" link (previous bug #3) | ✅ | ✅ | ✅ |
| 1b | favicon 200 (previous bug #4) | ✅ | ✅ | ✅ |
| — | Home page: heading, 2 cards, no overflow | ✅ | ✅ | ✅ |
| 1c | The test is solved 3/3 with the keyboard only (previous critical bug #1) | ✅ | ✅ | ✅ |
| 1d | When the discovery point in the photograph is clicked, the card is in the visible area (previous bug #2) | ✅ | ✅ | ✅ |
| 2 | Model: open, drag-rotate, wheel, Parçala/Birleştir, arrow keys/+, reset, representative label | ✅ | ✅ | ✅ |
| 3 | 360° tour: the 360TR player loads (3 canvases), a fallback link exists | ✅ | ✅ | ✅ |
| 4 | Walkthrough Ulu Camii: Giriş kapısı → İbadet alanı → Şadırvan → Minber, honesty label | ✅ | ✅ | ✅ |
| 4 | Walkthrough Muradiye: Caminin giriş kapısı → İç mekân → Mihrap → İç mekân | ✅ | ✅ | ✅ |
| 5 | Restoration: place with the keyboard + rotate with R; complete the board, sourced information | ✅ | ✅ | ✅ |
| 6 | Management: change the Ulu Camii summary → it appears on the home page → return to default | ✅ | ✅ | ✅ |
| 6b | Management: "Kaynaklı bilgi" cannot be selected without a source; add a new artifact → home page + artifact page → delete | ✅ | ✅ | ✅ |
| 7 | Badges: test badge + restoration badge are saved, appear on the card | ✅ | ✅ | ✅ |
| 7b | `/eser/yok` → "Sayfa bulunamadı" | ✅ | ✅ | ✅ |
| 7c | No horizontal overflow: `/`, two artifacts, `/yonetim`, `/yonetim/yeni` | ✅ | ✅ | ✅ |

**Console:** No errors belonging to the application, no 4xx/5xx on application addresses.
The 360TR player itself gives `krpano.get is not a function` errors (inside the iframe, not our code; the player works).

## Minor problems found

1. **[Low]** Extra space in the accessible name of the links in the management list: the screen reader reads "Düzenle : Bursa Ulu Camii"
   (`src/pages/Yonetim.tsx`, `sr-only` span). It does not affect function.
2. **[Info]** The 360° tour requires the internet; blockers such as Brave Shields can stop the iframe (a fallback link exists).
3. **[Info]** The Three.js chunk is 568 kB (gzip 143 kB); it loads only when the model/walkthrough is opened, the home page is not affected.

## Not tested

- Real phone and iOS tilt (gyroscope) permission — only with browser emulation
- Performance on a device with a real GPU (tests were done with software WebGL; it should be faster on a real device)
- Manual listening with a screen reader (NVDA/VoiceOver)

## Demo flow suggestion (3 min)

1. Home page (10 sec) → **Ulu Camii**: "Maketi eline al" → rotate → **Parçala** (piers, şadırvan) → Birleştir (40 sec)
2. "360° turu başlat" → move from the mihrab to the ablution basin (30 sec) — *internet is required; have the backup video ready*
3. **Muradiye**: Virtual walkthrough → courtyard → tombs garden → Cem Sultan Türbesi (30 sec)
4. Restoration task: place 2–3 pieces, show the hint (keeping most of it solved beforehand saves time) (30 sec)
5. **Management**: change a summary → it appears instantly on the home page → the rule "content without a source cannot be marked as sourced" (30 sec)
