// Çini atölyesi metinleri. Süreç bilgileri yalnızca aşağıdaki kaynaklardan alınır (docs/cini-atolyesi.md).
export const tileSources = {
  ministry: 'T.C. Kültür ve Turizm Bakanlığı, Yaşayan Kültür Mirası: "Geleneksel Çini Ustalığı" (yakegm.ktb.gov.tr)',
  workshop: 'İstanbulumSanat, "Çini Nasıl Yapılır, Çini Yapım Aşamaları Nelerdir?" (atölye anlatımı, 2020)',
} as const
export type TileSourceId = keyof typeof tileSources

export const tileIntro = {
  title: 'Çamurdan çiniye',
  summary: 'Çarkta tabağını şekillendir, deseni kömürle aktar, tahrir çek, boya ve fırına ver. Mat boyaların canlandığı anı kendin gör.',
  honesty: 'Temsilî model ve oyun. Desen uygulama için çizildi, belirli bir tarihî eserin kopyası değildir. Süreler, puan ve bisküvi sıcaklığı oyun ölçeğidir; sır pişirimi aralığı kaynaktan alınmıştır.',
}

export const tileNotes: { text: string; source: TileSourceId }[] = [
  { text: 'Çamur reçetesine göre hazırlanıp hamur haline getirilir. Atölyede şekillendirmeyi yapan ustaya "çarkçı" denir.', source: 'ministry' },
  { text: 'Şekillenen hamura astar sürülüp kurutulur; fırında pişince "bisküvi" denen pürüzsüz yüzey elde edilir.', source: 'ministry' },
  { text: 'Kâğıttaki desen çizgileri iğneyle delinir. Kömür tozlu kese üstünde gezdirilince desen deliklerden noktalar halinde geçer.', source: 'workshop' },
  { text: 'Desenin dış konturuna "tahrir" denir; siyah boya ve fırçayla elle çizilir. Bu işi yapan ustaya "tahrirci" denir.', source: 'ministry' },
  { text: 'Desenlerin içini "boyamacı" boyar. Beyaz veya lacivert fon üzerine kırmızı, kobalt mavisi, turkuaz ve yeşil, geleneksel çininin karakteristik renkleridir.', source: 'ministry' },
  { text: 'Seramiğin üzeri sırla kaplanır ve ikinci kez 900-940°C\'de pişirilir. Fırınlama işini "fırıncı" yapar.', source: 'ministry' },
  { text: '"Geleneksel Çini Ustalığı" 2016\'da UNESCO İnsanlığın Somut Olmayan Kültürel Mirası Temsili Listesi\'ne kaydedildi.', source: 'ministry' },
]

export const tileInstructions = [
  'Çamurun üstünde basılı tutup sürükle. Acele etme: hızlı çekersen çamur yalpalar.',
  'Astarı sür, sonra fırını ısıt. İbreyi aralıkta tutunca bisküvi pişer.',
  'Kömür keseciğini delikli kâğıdın üstünde gezdir, deseni tabağa geçir.',
  'Parlayan noktadan başla, basılı tutarak noktalı çizgiyi izle.',
  'Bir renk seç, desenin içine dokun. Boyalar şimdilik mat görünür.',
  'Sırı dök, sonra fırını 900-940° aralığında tut. Asıl renkler burada ortaya çıkar.',
  'Tabağını çevir, incele. Kaliten aşağıda.',
]
