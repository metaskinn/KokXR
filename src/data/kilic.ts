// Kılıç atölyesi metinleri. Tarihsel bilgiler yalnızca aşağıdaki kaynaklardan alınır (docs/kilic-atolyesi.md).
export const kilicKaynaklari = {
  yucel: 'Ünsal Yücel, Islamic Swords and Swordsmiths, Plate 87, s. 128',
  korkmaz: 'H. Korkmaz, İ. Özkeçeci, "Osmanlı kesici silahlarından bir form: Türk eğri kılıcı", YJAD, 2025',
  saraylar: 'Milli Saraylar, Topkapı Sarayı Koleksiyonu paylaşımı',
} as const

export type KilicKaynakId = keyof typeof kilicKaynaklari

export const kilicTanitim = {
  baslik: 'Fatih Sultan Mehmed\'in kılıcı',
  ozet: 'Çelik külçesinden başla: ateşte ısıt, örste döv, suya daldır, bile, kuşan. Sonra kılıcını test alanında dene.',
  durustluk: 'Temsilî model ve kurgusal oyun. Ölçüler kaynaktan, genişlik ve kalınlık fotoğraflardan tahmindir; birebir kopya veya 3B tarama değildir. Altın bant bitkisel süslemedir, gerçek kitabe değildir. Sıcaklık ve puanlar oyun için basitleştirilmiştir; bu kılıcın gerçekte nasıl yapıldığını anlatmaz.',
  konum: 'Asıl kılıç İstanbul\'da, Topkapı Sarayı Müzesi\'nde (Env. 1/90).',
}

export const kilicAsamaBilgileri = {
  kulce: { metin: 'Kılıç, "kılıç yumurtası" denen çelik külçesinin kılıç şekli alana dek dövülmesiyle oluşturulurdu.', kaynak: 'korkmaz' as KilicKaynakId },
  su: { metin: 'Çeşitli formüllerle yapılan sertleştirme işlemine kılıca su verilmesi denirdi.', kaynak: 'korkmaz' as KilicKaynakId },
  kusanma: { metin: 'Bir kılıcın yapımı tek kişiye ait değildir: kılıç ustaları (Seyfiye ocağı), devrin hattat, sedefkâr, kuyumcu ve nakkaşları birlikte çalışırdı.', kaynak: 'korkmaz' as KilicKaynakId },
}

// İnceleme aşamasındaki parça notları. konum: sword grubunun yerel koordinatı (metre, X namlu boyunca, Y sırta doğru).
export const kilicParcaNotlari: { id: string; baslik: string; metin: string; kaynak: KilicKaynakId; konum: [number, number, number] }[] = [
  { id: 'olcu', baslik: 'Ölçüler', metin: 'Toplam 126,5 cm, namlu 106 cm. Milli Saraylar paylaşımında uzunluk 125 cm olarak verilir; kaynaklar arasında küçük fark vardır.', kaynak: 'yucel', konum: [.5, .03, 0] },
  { id: 'namlu', baslik: 'Namlu', metin: 'Tek ağızlı, hafif eğri ve geniş sırtlı. Osmanlı dönemine ait bilinen en eski kılıç olarak anılır; namlu henüz tam eğriliğine ulaşmamıştır.', kaynak: 'korkmaz', konum: [.3, .012, 0] },
  { id: 'oluk', baslik: 'Oluklar', metin: 'Bir geniş oluk kabzadan uca uzanır; sırt kenarındaki ikincisi basamağa kadar gider.', kaynak: 'yucel', konum: [.62, .012, 0] },
  { id: 'balcak', baslik: 'Balçak', metin: 'Haç biçimli, kalın kollu ve altın kakmalıdır. Düz kollu balçak 15. yüzyıl özelliğidir.', kaynak: 'yucel', konum: [0, .07, 0] },
  { id: 'kabza', baslik: 'Kabza', metin: 'Normalden uzun kabza, dört perçinle birleştirilmiş iki mors dişi plakadır. Ayrı metal başlık yoktur; dişin kendisi başlık biçiminde şekillendirilmiştir.', kaynak: 'yucel', konum: [-.11, 0, 0] },
  { id: 'kitabe', baslik: 'Gerçek kitabe', metin: 'Gerçek kılıcın iki yüzünde altın kakma sülüs yazı vardır; Sultan Mehmed Han\'ı ve soyunu anar. Buradaki bitkisel bant temsilîdir, kitabeyi taklit etmez.', kaynak: 'yucel', konum: [.18, 0, .006] },
]
