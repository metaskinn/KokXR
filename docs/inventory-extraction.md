# Inventory extraction: handoff

Goal: fill in per-building data for every entry in `src/content/inventory.json` (340 buildings of "Bursa Vakıf Eserleri",
Vakıf Katılım, 2026, volumes 1-3). Today each entry has only name, district, section, volume, group and a 3D-model flag.

## What exists

- `src/content/inventory.json`: the 340 entries, generated from the contents pages. Every name was checked against the raw
  contents text of the PDFs (339 matched verbatim; one differed only by a hyphenated line break).
- `src/domain/inventory.ts` (types), `src/content/inventory.ts` (labels), `src/features/places/InventoryList.tsx` (UI on the Places page).
- `tests/inventory-data.mjs` (data integrity, in `npm run test:hizli`) and `tests/inventory-list.mjs` (browser test).
- Only the 10 buildings that already have an artifact with a `model` are flagged `hasScaleModel: true`. New entries stay `false`.

## Sources

Public PDFs (download with a plain `curl`, no special headers; volume 2 is 65 MB, volume 1 is 52 MB, volume 3 is 42 MB):

- `https://www.vakifkatilim.com.tr/documents/KurumsalIletisim/yayinlarimiz/bursa-envanteri-cilt-1.pdf` (Osmangazi; 245 PDF pages)
- `.../bursa-envanteri-cilt-2.pdf` (Osmangazi and Yıldırım; 289 PDF pages)
- `.../bursa-envanteri-cilt-3.pdf` (other districts; 209 PDF pages)

Photos live in the shared Drive folder "Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi" (subfolders `Links`). Do not commit photos or
PDFs to the repo without resizing and checking the size limits; `public/` is deployed to a public URL.

## Reading page text on macOS (no installs)

```bash
swiftc -O scripts/pdf-pages.swift -o /tmp/pdf-pages          # once
/tmp/pdf-pages cilt-2.pdf 0 15 > contents.txt                # PDF pages 1-16 (0-based, inclusive)
```

`poppler` and Python PDF libraries are not installed; building poppler from source on this Intel Mac takes hours.

Page numbers: the contents list printed page numbers. The PDF stores two printed pages per PDF page (spreads), so a printed page `N`
is roughly PDF page `N / 2` plus an offset. Check the offset against one known entry before looking up a whole volume.
Contents lines in the extracted text are Turkish followed by an English duplicate; long names wrap across lines, and `%` stands for `İ`.

## Rules

- Do not invent historical information. Every fact needs the volume and printed page it came from.
- The book text is copyrighted ("all rights reserved"). Whether verbatim passages may be stored in the app depends on the written permission
  the project holds from the publisher; that decision and the permission letter belong to the project owner, not to the tool doing the work.
  Short original-wording summaries with a source note are the safe default.
- UI text stays Turkish; code, comments and docs are English.
- Work on a feature branch; do not push to `main`. Run `npm run test:hizli`, and `npm run test:tarayici` when the UI changed.
- Keep `hasScaleModel` false for new entries.
