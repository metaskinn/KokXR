# Adding an artifact (modular)

**Preferred: add artifacts from the admin panel (`/admin`)** — photos are uploaded to the private Neon bucket and the record waits for curator approval. The file route below is for bulk loading: one artifact = one JSON file in `src/content/artifacts/` + its photos uploaded with `node scripts/storage-upload-images.mjs` (photos are no longer kept in `public/images/`; only scale-model textures are), then `npm run db:setup`. The app discovers the file
automatically (`import.meta.glob`), so no shared file is edited and two people adding different works never conflict.

1. `node scripts/new-artifact.mjs <inventory-id> <english-slug>` writes a draft to `drafts/artifacts/<slug>.json` from the
   inventory entry and its book summary. Drafts are not loaded by the app.
2. Fill in the `TODO` fields: photos (every image needs `credit`, and the same text must appear in `sources`), three quiz questions
   with four options each, optional hotspots. Only state facts the book or a cited source gives; leave a field out instead of guessing.
3. Move the file to `src/content/artifacts/`. The `inventoryId` field links it to its inventory row: the row then opens the full
   artifact page (`/artifact/<slug>`) instead of the plain inventory page.
4. `npm run test:hizli` checks the link, id uniqueness and that every referenced image file exists.

A 3D scale model is a separate step: add `model` to the artifact and set `hasScaleModel: true` on its inventory row.
