// List for the Places tab. Building names come from the folder names of "Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi";
// publications come from Vakıf Katılım's "Yayınlarımız" page. A building opens if the artifact data for its `artifactId` has a model; otherwise it shows "VR henüz yok".
import type { MapId } from './turkeyMap'

// `position` [longitude, latitude]: location of the complex's main mosque. `source`: OSM and Wikidata cross-checked (November 2026).
export interface VrBuilding { name: string; district: string; artifactId: string; position: [number, number]; source: string }
export interface VrBroadcast { name: string; address: string }
export interface VrCity { name: string; map: MapId; position: [number, number]; buildings: VrBuilding[]; broadcasts: VrBroadcast[] }

const PUBLIC_ROOT = 'https://www.vakifkatilim.com.tr/documents/KurumsalIletisim'

export const vrCities: VrCity[] = [
  {
    name: 'Bursa',
    map: 'bursa',
    position: [29.06, 40.18],
    buildings: [
      { name: 'Ulu Camii', district: 'Osmangazi', artifactId: 'ulu-mosque', position: [29.06188, 40.18392], source: 'OSM way/26434413; Wikidata Q32339' },
      { name: 'II. Murat Külliyesi', district: 'Osmangazi', artifactId: 'muradiye-complex', position: [29.0465, 40.19101], source: 'OSM way/397551853 (Muradiye Camii); Wikidata Q65219967' },
      { name: 'Orhan Bey Külliyesi', district: 'Osmangazi', artifactId: 'orhan-bey-complex', position: [29.06411, 40.18393], source: 'OSM way/255187109 (Gazi Orhan Camii); Wikidata Q6038154' },
      { name: 'I. Murat Hüdavendigar Külliyesi', district: 'Osmangazi', artifactId: 'hudavendigar-complex', position: [29.0211, 40.20237], source: 'OSM way/566744652 (Hüdavendigar Cami); Wikidata Q15227537' },
      { name: 'Hamzabey Külliyesi', district: 'Osmangazi', artifactId: 'hamzabey-complex', position: [29.04166, 40.19217], source: 'OSM way/749713611 (Hamzabey Camii); Wikidata Q132134205' },
      { name: 'Timurtaş Paşa Külliyesi', district: 'Osmangazi', artifactId: 'timurtas-pasa-complex', position: [29.0719, 40.18812], source: 'OSM way/343648128 (Kara Timurpaşa Cami, Demirtaşpaşa Mah.); Wikidata Q127788240; Türkiye Gazetesi: Timurtaş Paşa Camii, Osmangazi, Demirtaş Mahallesi' },
      { name: 'Yeşil Çelebi Mehmed Külliyesi', district: 'Yıldırım', artifactId: 'yesil-complex', position: [29.07465, 40.18219], source: 'OSM way/337880066 (Yeşil Camii); Wikidata Q1549086' },
      { name: 'Yıldırım Külliyesi', district: 'Yıldırım', artifactId: 'yildirim-complex', position: [29.08243, 40.18748], source: 'OSM way/247424180 (Yıldırım Beyazıt Camii); Wikidata Q128256' },
      { name: 'Emir Sultan', district: 'Yıldırım', artifactId: 'emir-sultan', position: [29.08103, 40.18114], source: 'OSM way/254312132 (Emir Sultan Camii); Wikidata Q1207606' },
      { name: 'Umurbey Külliyesi', district: 'Yıldırım', artifactId: 'umurbey-complex', position: [29.07135, 40.17775], source: 'OSM way/1302643495 (Umurbey Camii); Wikidata Q116952987' },
    ],
    broadcasts: [
      { name: 'Bursa Vakıf Eserleri, Cilt 1', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-1.pdf` },
      { name: 'Cilt 2', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-2.pdf` },
      { name: 'Cilt 3', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-3.pdf` },
    ],
  },
  {
    name: 'Konya',
    map: 'konya',
    position: [32.49, 37.87],
    buildings: [
      { name: 'Mevlâna Külliyesi', district: 'Karatay', artifactId: 'konya-karatay-mevlana-tomb-museum', position: [32.50496, 37.87068], source: 'OSM way/491583514 (Mevlâna Müzesi)' },
    ],
    broadcasts: [
      { name: 'Konya Vakıf Eserleri, Cilt 1', address: `${PUBLIC_ROOT}/yayinlarimiz/konya-envanteri-1_cilt-web.pdf` },
      { name: 'Cilt 2', address: `${PUBLIC_ROOT}/yayinlarimiz/konya-envanteri-2_cilt-web.pdf` },
    ],
  },
  {
    name: 'Hatay',
    map: 'hatay',
    position: [36.16, 36.2],
    buildings: [
      { name: 'Sokullu Mehmet Paşa Külliyesi', district: 'Payas', artifactId: 'hatay-payas-sokullu-mehmet-pasha-mosque-complex', position: [36.2033, 36.75425], source: 'OSM relation/7325781 (Sokullu Mehmet Paşa Külliyesi)' },
    ],
    broadcasts: [{ name: 'Hatay Vakıf Eserleri', address: `${PUBLIC_ROOT}/hatay-vakif-eserleri.pdf` }],
  },
]
