# Map data: source and licence

The application works offline with the embedded files in this folder; a live tile server is not used. The data was obtained in Kasım 2026 and simplified.

| Data | Source | Licence |
|---|---|---|
| Turkey border, provinces, land, lakes, rivers, city points on the map of Turkey (`turkey.json`) | [Natural Earth](https://www.naturalearthdata.com/) 1:10m | Public domain |
| Bursa, Konya, Hatay roads, coast, water, place names, summit heights (`bursa.json`, `konya.json`, `hatay.json`) | [OpenStreetMap](https://www.openstreetmap.org/copyright), one-time query with the Overpass API; no tiles were downloaded | ODbL, attribution: © OpenStreetMap contributors |
| Relief (`*-relief.webp`) | [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (AWS Open Data; from sources including SRTM), hillshade computed from it | Open data with source attribution |
| Artifact coordinates (`../vrArtifacts.ts`) | For each structure the OSM object and Wikidata P625 were compared; source in the data row | ODbL / CC0 |

Attribution must remain visible on the map and in OSM-derived data. The map is a computed simplification, not for route directions.

Regeneration: `node src/content/maps/data-generate.mjs <ham-klasör>`, then `node src/content/maps/relief-generate.mjs <ham-klasör>`.
