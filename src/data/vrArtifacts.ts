// Mekanlar sekmesinin listesi. Yapı adları "Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi" klasör adlarından,
// yayınlar Vakıf Katılım "Yayınlarımız" sayfasındandır. Yapı, `eserId`'si olan eser verisinde maket varsa açılır; yoksa "VR henüz yok" yazar.
import type { MapId } from './turkeyMap'

// `konum` [boylam, enlem]: külliyenin ana camisinin yeri. `kaynak`: OSM ve Wikidata karşılıklı denetlendi (Kasım 2026).
export interface VrBuilding { ad: string; district: string; artifactId: string; position: [number, number]; source: string }
export interface VrBroadcast { ad: string; address: string }
export interface VrCity { ad: string; map: MapId; position: [number, number]; buildings: VrBuilding[]; broadcasts: VrBroadcast[] }

const PUBLIC_ROOT = 'https://www.vakifkatilim.com.tr/documents/KurumsalIletisim'

export const vrCities: VrCity[] = [
  {
    ad: 'Bursa',
    map: 'bursa',
    position: [29.06, 40.18],
    buildings: [
      { ad: 'Ulu Camii', district: 'Osmangazi', artifactId: 'ulu-mosque', position: [29.06188, 40.18392], source: 'OSM way/26434413; Wikidata Q32339' },
      { ad: 'II. Murat Külliyesi', district: 'Osmangazi', artifactId: 'muradiye-complex', position: [29.0465, 40.19101], source: 'OSM way/397551853 (Muradiye Camii); Wikidata Q65219967' },
      { ad: 'Orhan Bey Külliyesi', district: 'Osmangazi', artifactId: 'orhan-bey-complex', position: [29.06411, 40.18393], source: 'OSM way/255187109 (Gazi Orhan Camii); Wikidata Q6038154' },
      { ad: 'I. Murat Hüdavendigar Külliyesi', district: 'Osmangazi', artifactId: 'hudavendigar-complex', position: [29.0211, 40.20237], source: 'OSM way/566744652 (Hüdavendigar Cami); Wikidata Q15227537' },
      { ad: 'Hamzabey Külliyesi', district: 'Osmangazi', artifactId: 'hamzabey-complex', position: [29.04166, 40.19217], source: 'OSM way/749713611 (Hamzabey Camii); Wikidata Q132134205' },
      { ad: 'Timurtaş Paşa Külliyesi', district: 'Osmangazi', artifactId: 'timurtas-pasa-complex', position: [29.0719, 40.18812], source: 'OSM way/343648128 (Kara Timurpaşa Cami, Demirtaşpaşa Mah.); Wikidata Q127788240; Türkiye Gazetesi: Timurtaş Paşa Camii, Osmangazi, Demirtaş Mahallesi' },
      { ad: 'Yeşil Çelebi Mehmed Külliyesi', district: 'Yıldırım', artifactId: 'yesil-complex', position: [29.07465, 40.18219], source: 'OSM way/337880066 (Yeşil Camii); Wikidata Q1549086' },
      { ad: 'Yıldırım Külliyesi', district: 'Yıldırım', artifactId: 'yildirim-complex', position: [29.08243, 40.18748], source: 'OSM way/247424180 (Yıldırım Beyazıt Camii); Wikidata Q128256' },
      { ad: 'Emir Sultan', district: 'Yıldırım', artifactId: 'emir-sultan', position: [29.08103, 40.18114], source: 'OSM way/254312132 (Emir Sultan Camii); Wikidata Q1207606' },
      { ad: 'Umurbey Külliyesi', district: 'Yıldırım', artifactId: 'umurbey-complex', position: [29.07135, 40.17775], source: 'OSM way/1302643495 (Umurbey Camii); Wikidata Q116952987' },
    ],
    broadcasts: [
      { ad: 'Bursa Vakıf Eserleri, Cilt 1', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-1.pdf` },
      { ad: 'Cilt 2', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-2.pdf` },
      { ad: 'Cilt 3', address: `${PUBLIC_ROOT}/yayinlarimiz/bursa-envanteri-cilt-3.pdf` },
    ],
  },
  {
    ad: 'Konya',
    map: 'konya',
    position: [32.49, 37.87],
    buildings: [],
    broadcasts: [
      { ad: 'Konya Vakıf Eserleri, Cilt 1', address: `${PUBLIC_ROOT}/yayinlarimiz/konya-envanteri-1_cilt-web.pdf` },
      { ad: 'Cilt 2', address: `${PUBLIC_ROOT}/yayinlarimiz/konya-envanteri-2_cilt-web.pdf` },
    ],
  },
  {
    ad: 'Hatay',
    map: 'hatay',
    position: [36.16, 36.2],
    buildings: [],
    broadcasts: [{ ad: 'Hatay Vakıf Eserleri', address: `${PUBLIC_ROOT}/hatay-vakif-eserleri.pdf` }],
  },
]
