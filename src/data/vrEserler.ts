// Mekanlar sekmesinin listesi. Yapı adları "Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi" klasör adlarından,
// yayınlar Vakıf Katılım "Yayınlarımız" sayfasındandır. Yapı, `eserId`'si olan eser verisinde maket varsa açılır; yoksa "VR henüz yok" yazar.
import type { HaritaKimlik } from './turkiyeHaritasi'

// `konum` [boylam, enlem]: külliyenin ana camisinin yeri. `kaynak`: OSM ve Wikidata karşılıklı denetlendi (Kasım 2026).
export interface VrYapi { ad: string; ilce: string; eserId: string; konum: [number, number]; kaynak: string }
export interface VrYayin { ad: string; adres: string }
export interface VrSehir { ad: string; harita: HaritaKimlik; konum: [number, number]; yapilar: VrYapi[]; yayinlar: VrYayin[] }

const YAYIN_KOK = 'https://www.vakifkatilim.com.tr/documents/KurumsalIletisim'

export const vrSehirler: VrSehir[] = [
  {
    ad: 'Bursa',
    harita: 'bursa',
    konum: [29.06, 40.18],
    yapilar: [
      { ad: 'Ulu Camii', ilce: 'Osmangazi', eserId: 'ulu-camii', konum: [29.06188, 40.18392], kaynak: 'OSM way/26434413; Wikidata Q32339' },
      { ad: 'II. Murat Külliyesi', ilce: 'Osmangazi', eserId: 'muradiye-kulliyesi', konum: [29.0465, 40.19101], kaynak: 'OSM way/397551853 (Muradiye Camii); Wikidata Q65219967' },
      { ad: 'Orhan Bey Külliyesi', ilce: 'Osmangazi', eserId: 'orhan-bey-kulliyesi', konum: [29.06411, 40.18393], kaynak: 'OSM way/255187109 (Gazi Orhan Camii); Wikidata Q6038154' },
      { ad: 'I. Murat Hüdavendigar Külliyesi', ilce: 'Osmangazi', eserId: 'hudavendigar-kulliyesi', konum: [29.0211, 40.20237], kaynak: 'OSM way/566744652 (Hüdavendigar Cami); Wikidata Q15227537' },
      { ad: 'Hamzabey Külliyesi', ilce: 'Osmangazi', eserId: 'hamzabey-kulliyesi', konum: [29.04166, 40.19217], kaynak: 'OSM way/749713611 (Hamzabey Camii); Wikidata Q132134205' },
      { ad: 'Timurtaş Paşa Külliyesi', ilce: 'Osmangazi', eserId: 'timurtas-pasa-kulliyesi', konum: [29.0719, 40.18812], kaynak: 'OSM way/343648128 (Kara Timurpaşa Cami, Demirtaşpaşa Mah.); Wikidata Q127788240; Türkiye Gazetesi: Timurtaş Paşa Camii, Osmangazi, Demirtaş Mahallesi' },
      { ad: 'Yeşil Çelebi Mehmed Külliyesi', ilce: 'Yıldırım', eserId: 'yesil-kulliyesi', konum: [29.07465, 40.18219], kaynak: 'OSM way/337880066 (Yeşil Camii); Wikidata Q1549086' },
      { ad: 'Yıldırım Külliyesi', ilce: 'Yıldırım', eserId: 'yildirim-kulliyesi', konum: [29.08243, 40.18748], kaynak: 'OSM way/247424180 (Yıldırım Beyazıt Camii); Wikidata Q128256' },
      { ad: 'Emir Sultan', ilce: 'Yıldırım', eserId: 'emir-sultan', konum: [29.08103, 40.18114], kaynak: 'OSM way/254312132 (Emir Sultan Camii); Wikidata Q1207606' },
      { ad: 'Umurbey Külliyesi', ilce: 'Yıldırım', eserId: 'umurbey-kulliyesi', konum: [29.07135, 40.17775], kaynak: 'OSM way/1302643495 (Umurbey Camii); Wikidata Q116952987' },
    ],
    yayinlar: [
      { ad: 'Bursa Vakıf Eserleri, Cilt 1', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-1.pdf` },
      { ad: 'Cilt 2', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-2.pdf` },
      { ad: 'Cilt 3', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-3.pdf` },
    ],
  },
  {
    ad: 'Konya',
    harita: 'konya',
    konum: [32.49, 37.87],
    yapilar: [],
    yayinlar: [
      { ad: 'Konya Vakıf Eserleri, Cilt 1', adres: `${YAYIN_KOK}/yayinlarimiz/konya-envanteri-1_cilt-web.pdf` },
      { ad: 'Cilt 2', adres: `${YAYIN_KOK}/yayinlarimiz/konya-envanteri-2_cilt-web.pdf` },
    ],
  },
  {
    ad: 'Hatay',
    harita: 'hatay',
    konum: [36.16, 36.2],
    yapilar: [],
    yayinlar: [{ ad: 'Hatay Vakıf Eserleri', adres: `${YAYIN_KOK}/hatay-vakif-eserleri.pdf` }],
  },
]
