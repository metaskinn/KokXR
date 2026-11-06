// VR Eserler sekmesinin listesi. Yapı adları "Vakıf Eserleri Envanteri - Bursa Fotoğraf Arşivi" klasör adlarından,
// yayınlar Vakıf Katılım "Yayınlarımız" sayfasındandır. Yapı, `eserId`'si olan eser verisinde maket veya restorasyon görevi varsa açılır; yoksa "VR henüz yok" yazar.
export interface VrYapi { ad: string; ilce: string; eserId: string }
export interface VrYayin { ad: string; adres: string }
export interface VrSehir { ad: string; konum: [number, number]; yapilar: VrYapi[]; yayinlar: VrYayin[] }

const YAYIN_KOK = 'https://www.vakifkatilim.com.tr/documents/KurumsalIletisim'

export const vrSehirler: VrSehir[] = [
  {
    ad: 'Bursa',
    konum: [29.06, 40.18],
    yapilar: [
      { ad: 'Ulu Camii', ilce: 'Osmangazi', eserId: 'ulu-camii' },
      { ad: 'II. Murat Külliyesi', ilce: 'Osmangazi', eserId: 'muradiye-kulliyesi' },
      { ad: 'Orhan Bey Külliyesi', ilce: 'Osmangazi', eserId: 'orhan-bey-kulliyesi' },
      { ad: 'I. Murat Hüdavendigar Külliyesi', ilce: 'Osmangazi', eserId: 'hudavendigar-kulliyesi' },
      { ad: 'Hamzabey Külliyesi', ilce: 'Osmangazi', eserId: 'hamzabey-kulliyesi' },
      { ad: 'Timurtaş Paşa Külliyesi', ilce: 'Osmangazi', eserId: 'timurtas-pasa-kulliyesi' },
      { ad: 'Yeşil Çelebi Mehmed Külliyesi', ilce: 'Yıldırım', eserId: 'yesil-kulliyesi' },
      { ad: 'Yıldırım Külliyesi', ilce: 'Yıldırım', eserId: 'yildirim-kulliyesi' },
      { ad: 'Emir Sultan', ilce: 'Yıldırım', eserId: 'emir-sultan' },
      { ad: 'Umurbey Külliyesi', ilce: 'Yıldırım', eserId: 'umurbey-kulliyesi' },
    ],
    yayinlar: [
      { ad: 'Bursa Vakıf Eserleri, Cilt 1', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-1.pdf` },
      { ad: 'Cilt 2', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-2.pdf` },
      { ad: 'Cilt 3', adres: `${YAYIN_KOK}/yayinlarimiz/bursa-envanteri-cilt-3.pdf` },
    ],
  },
  {
    ad: 'Konya',
    konum: [32.49, 37.87],
    yapilar: [],
    yayinlar: [
      { ad: 'Konya Vakıf Eserleri, Cilt 1', adres: `${YAYIN_KOK}/yayinlarimiz/konya-envanteri-1_cilt-web.pdf` },
      { ad: 'Cilt 2', adres: `${YAYIN_KOK}/yayinlarimiz/konya-envanteri-2_cilt-web.pdf` },
    ],
  },
  {
    ad: 'Hatay',
    konum: [36.16, 36.2],
    yapilar: [],
    yayinlar: [{ ad: 'Hatay Vakıf Eserleri', adres: `${YAYIN_KOK}/hatay-vakif-eserleri.pdf` }],
  },
]
