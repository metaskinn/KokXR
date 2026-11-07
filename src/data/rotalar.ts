// Hazır rotalar: sıra yalnız gezi önerisidir, tarihsel sıra iddiası değildir. Eser kimlikleri src/data/eserler/ altındadır.
export interface Rota { id: string; ad: string; aciklama: string; eserIdleri: string[] }

export const rotalar: Rota[] = [
  { id: 'ilk-baskent', ad: "Osmanlı'nın ilk başkenti", aciklama: 'Bursa’daki erken dönem külliyeleri ve Ulu Camii.',
    eserIdleri: ['orhan-bey-kulliyesi', 'hudavendigar-kulliyesi', 'muradiye-kulliyesi', 'ulu-camii'] },
  { id: 'hanlar-carsi', ad: 'Hanlar ve çarşı', aciklama: 'Koza Han, Çarşı ve Hanlar Bölgesi’nde Orhan Camii ile Ulucami arasında yer alır.',
    eserIdleri: ['koza-han', 'ulu-camii'] },
  { id: 'tahtakale', ad: 'Tahtakale: medrese ve hamam', aciklama: 'Eyne Bey Hamamı, Eyne Bey Subaşı Medresesi’ne bitişiktir.',
    eserIdleri: ['eyne-bey-medresesi', 'eyne-bey-hamami'] },
]
