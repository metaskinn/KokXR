# UI design — 3 November 2026

Goal: a Turkish-language, simple and modern digital heritage interface. Bring the photographs, the artifact selection and the vase workshop to the front; keep the existing content and experiences.

## Research and decisions

- [Material Design 3 — color roles](https://m3.material.io/m3/pages/color-roles?s=m3): separate the roles of surface, primary action, secondary text and accent. In the app these are defined with variables in `src/app/styles/index.css`. Bronze was used for small headings, green for primary actions.
- [Material Design 3 — typography](https://m3.material.io/styles/typography/applying-type): separate scales for headings, body and labels. Short, large serif headings on the home page; a system sans-serif font for content and controls. No external font requests.
- [NN/g — Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/): foreground the information related to the task, reduce visual noise. A single main call to action, open artifact cards and a separate workshop area on the home page; section links on the artifact pages.
- [WCAG 2.2 — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): target of at least 4.5:1 for normal text. Color alone does not convey state; the selected piece, the active menu item and the correct/incorrect answers also carry a line, text and a marker.
- [WCAG 2.2 — Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): visible keyboard focus and navigation that does not cover content. The top menu was not made sticky; the skip link was kept. On route change, focus moves to the main content.
- [WCAG 2.2 — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): the minimum criterion is 24 CSS pixels and its exceptions. In this design the main navigation was kept at least 44px and standard buttons at least 46px tall.

## Palette

| Role | Color | Contrast measured for the pairing |
| --- | --- | --- |
| Background | `#faf9f6` | — |
| Primary text | `#253a34` | 11.51:1 on the background |
| Secondary text | `#626b64` | 5.24:1 on the background |
| Primary action | `#244e40` | 9.38:1 with white text |
| Light surface | `#edf2ed` | 8.27:1 with primary-action-colored text |
| Bronze accent | `#8c6035` | 5.19:1 on the background |
| Large-heading accent | `#607767` | 4.60:1 on the background |

These ratios are measurements of the selected pairings; they are not a comprehensive WCAG conformance statement for the whole application.

## Implemented structure

- Shared brand, a menu with an active-page indicator, and a footer.
- Photo-led entry, a main call to action to the artifact list, a secondary workshop link.
- Artifact cards show location, summary, available experience and question count.
- A separate workshop introduction with an original SVG vase drawing; explanation that the model is representative.
- On the artifact detail page, a summary panel and shortcuts to gallery/history/quiz/sources.
- Consistent spacing, controls and surface styles across the gallery, quiz, admin, forms and the vase screen.
- Single column on mobile; styles for reduced motion and forced-colors mode.

## Verification

- `npm run build`
- `node tests/ui.mjs`: with Google Chrome at 1440, 768, 360 and 320px; six routes, overflow, headings, section targets, navigation measurements, skip link, route focus, selected color pairings and reduced motion.
- `node tests/vase.mjs`: with Google Chrome at 1280 and 360px; inspection, wrong piece/direction, full repair, dragging on desktop, touch on phone, and restart.
- The existing `tests/end-to-end.mjs` scenarios were additionally run with a temporary copy adapted to the installed Chrome and the development server. The original scenario file was not changed.
- Screenshots are in `test-sonuclari/`, which is kept out of git. Firefox was not run in this environment.

### Result note

- UI checks: six routes passed at each of the four widths; the eight selected text/background pairs fall in the 4.60–12.35:1 range.
- Vase scenarios: passed at 1280 and 360px.
- Existing end-to-end scenarios: 15/15 passed separately in Chrome at 1280 and 360px, no local HTTP 404.
- The 360TR iframe was opened; console errors related to the provider's `krpano.get` calls and one iframe console error were recorded. These were not changed within the scope of the design work.

## Photo and palette revision

User direction: improve photo sizes/layout and navigation between photos; limit the yellow-brown warmth to about 10%; make the priority actions stand out.

- In the CSS palette, 90% of the existing colors was kept and a 10% warm target color was added (sRGB channel blending; the percentage should not be read as a perceptual change). Warm sand was used for light colors and brown for dark colors as the target. Status/error colors were kept. For the large-heading accent, an additional darkening of two channel levels was applied for contrast.
- Neutral/light surfaces and secondary texts were merged into shared variables. The green primary action stayed in the primary-action role and bronze in the small-accent role. No filter was applied to the photo colors.
- Current palette: background `#f8f5ef`, primary text `#314035`, secondary text `#686c60`, primary action `#305240`, light surface `#ecefe7`, bronze `#8e6236`.
- Current selected contrasts: primary text 10.08:1; secondary text 4.95:1; bronze 4.89:1; white/primary button 8.73:1; green/light surface 7.51:1; photo caption 11.18:1; hero accent 4.53:1; workshop description 4.63:1.
- On the artifact page, the photo gallery was positioned as the first experience; the main action leading to the photo section was made more prominent.
- On the home page photo, the caption was moved to its own line; the text does not cover the image. Artifact cards use an aspect ratio that depends on the screen width.
- The gallery is fitted to a fixed height; photos are not cropped or stretched. Discovery markers are positioned relative to the photo's actual image area. Small photos are also shown in full.
- The main gallery has previous/next buttons, a counter, a visible enlarge action, arrow keys and horizontal swiping on phones. The selected thumbnail stays visible within the strip; the page's vertical position is not changed for this.
- The enlarge dialog has 100–300% zoom, panning to inspect detail, fit-to-screen, previous/next, Escape and focus return. When zoomed in, the arrow keys are left to panning the photo.
- In the virtual tour, the stop name and direction buttons were moved outside the photo. The option "Fotoğrafın tamamını göster" turns off the depth effect and enables the uncropped photo mode; navigation between stops continues.

The interaction decisions rest on the user-control, clear-navigation and focus-preservation principles in the [WAI Carousel Controls](https://www.w3.org/WAI/tutorials/carousels/controls/) and [WAI Carousel Functionality](https://www.w3.org/WAI/tutorials/carousels/functionality/) guides. There is no automatic photo advance.

Gallery checks: `node tests/gallery.mjs`. Color measurement only: `node tests/ui.mjs --contrast-only`.

## Simple interface revision — 7 November 2026

User direction: the site looks "as if made with artificial intelligence"; make it cleaner and more user-friendly in line with the value proposition.

- The value proposition is "Dokunamadığın tarihe dokun": the artifact itself (photo, model, workshop) comes to the front, the interface steps back.
- Removed decorations: beige background and green-bronze palette, serif accent headings, letter-spaced uppercase eyebrow labels, card numbers, shadowed cards and hover scaling, the logo box in the menu, the slogan in the footer. In the sword and tile workshops: serif headings, gradient buttons and panels, labels with 7–10 px letter spacing, and the glowing "live" dot.
- New language: white background, system font, a single accent color Iznik blue (a tie to Bursa tilework). Artifact cards show photo, location, name and a short summary, truncated after three lines. No colored box on the artifact title; period and foundation, one line between rules. Workshop tabs are pill-shaped buttons.
- Variable names: `--yesil*` → `--vurgu*`; new `--yuzey-gri`, `--yaricap`.

| Role | Color | Contrast |
| --- | --- | --- |
| Background | `#ffffff` | — |
| Primary text | `#1c2024` | 16.39:1 |
| Secondary text | `#59616a` | 6.28:1 (5.81:1 on the gray surface) |
| Accent, link | `#1f4fa3` | 7.76:1; 7.76:1 with white text |
| Light accent surface | `#edf2fb` | 6.91:1 with accent text |
| Control line | `#858d96` | 3.36:1 (non-text element) |

The 3D scene and map colors were not changed in this revision; only the green tone on the vase and restoration floor was pulled to a neutral dark gray.

## Lively education theme — 7 November 2026

The user did not like the plain white theme from a UI/UX standpoint; from three options they chose the "lively education" direction (canlı eğitim) and the whole site. Rationale: the target audience is students.

- Cream background `#fbf7f0`, white cards (20 px corners, soft shadow, slight lift on hover). Bold pill-shaped buttons.
- Tile (çini) palette: turquoise `#0b6e6d` primary action, coral `#c8432f` brand and focus, mustard `#e5a823` info card and task-card stripe. On artifact cards, a top stripe in turn turquoise/coral/mustard; "3B maket", the photo count and the discovery-point count are colored labels.
- On the artifact detail page the info card overlaps below the cover photo; sections are separate white cards, with a round arrow button in the collapsible heading.
- In the workshops, the scene and the task card share the same rounded card language; the current step is mustard, completed steps are turquoise.

| Pairing | Contrast |
| --- | --- |
| Primary text `#1e2933` / background | 13.85:1 |
| Secondary `#5b6168` / background | 5.86:1 (5.33:1 on the sand surface) |
| Turquoise `#0b6e6d` / background | 5.67:1; 6.06:1 with white text |
| Dark turquoise / light turquoise | 7.07:1 |
| Dark coral / light coral | 6.02:1 |
| Dark mustard / light mustard | 6.05:1 |
| Control line `#8c8478` | 3.46:1 (non-text) |
