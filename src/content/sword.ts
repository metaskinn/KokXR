// Sword workshop texts. Historical information is taken only from the sources below (docs/sword-workshop.md).
export const swordSources = {
  yucel: 'Ünsal Yücel, Islamic Swords and Swordsmiths, Plate 87, s. 128',
  korkmaz: 'H. Korkmaz, İ. Özkeçeci, "Osmanlı kesici silahlarından bir form: Türk eğri kılıcı", YJAD, 2025',
  saraylar: 'Milli Saraylar, Topkapı Sarayı Koleksiyonu paylaşımı',
} as const

export type SwordSourceId = keyof typeof swordSources

export const swordIntro = {
  title: 'Fatih Sultan Mehmed\'in kılıcı',
  summary: 'Çelik külçesinden başla: ateşte ısıt, örste döv, suya daldır, bile, kuşan. Sonra kılıcını test alanında dene.',
  honesty: 'Temsilî model ve kurgusal oyun. Ölçüler kaynaktan, genişlik ve kalınlık fotoğraflardan tahmindir; birebir kopya veya 3B tarama değildir. Altın bant bitkisel süslemedir, gerçek kitabe değildir. Sıcaklık ve puanlar oyun için basitleştirilmiştir; bu kılıcın gerçekte nasıl yapıldığını anlatmaz.',
  position: 'Asıl kılıç İstanbul\'da, Topkapı Sarayı Müzesi\'nde (Env. 1/90).',
}

export const swordStageInfo = {
  ingot: { text: 'Kılıç, "kılıç yumurtası" denen çelik külçesinin kılıç şekli alana dek dövülmesiyle oluşturulurdu.', source: 'korkmaz' as SwordSourceId },
  water: { text: 'Çeşitli formüllerle yapılan sertleştirme işlemine kılıca su verilmesi denirdi.', source: 'korkmaz' as SwordSourceId },
  equip: { text: 'Bir kılıcın yapımı tek kişiye ait değildir: kılıç ustaları (Seyfiye ocağı), devrin hattat, sedefkâr, kuyumcu ve nakkaşları birlikte çalışırdı.', source: 'korkmaz' as SwordSourceId },
}

// Part notes for the inspection stage. position: local coordinate within the sword group (metres, X along the blade, Y toward the spine).
export const swordPartNotes: { id: string; title: string; text: string; source: SwordSourceId; position: [number, number, number] }[] = [
  { id: 'measurement', title: 'Ölçüler', text: 'Toplam 126,5 cm, namlu 106 cm. Milli Saraylar paylaşımında uzunluk 125 cm olarak verilir; kaynaklar arasında küçük fark vardır.', source: 'yucel', position: [.5, .03, 0] },
  { id: 'blade', title: 'Namlu', text: 'Tek ağızlı, hafif eğri ve geniş sırtlı. Osmanlı dönemine ait bilinen en eski kılıç olarak anılır; namlu henüz tam eğriliğine ulaşmamıştır.', source: 'korkmaz', position: [.3, .012, 0] },
  { id: 'fuller', title: 'Oluklar', text: 'Bir geniş oluk kabzadan uca uzanır; sırt kenarındaki ikincisi basamağa kadar gider.', source: 'yucel', position: [.62, .012, 0] },
  { id: 'guard', title: 'Balçak', text: 'Haç biçimli, kalın kollu ve altın kakmalıdır. Düz kollu balçak 15. yüzyıl özelliğidir.', source: 'yucel', position: [0, .07, 0] },
  { id: 'hilt', title: 'Kabza', text: 'Normalden uzun kabza, dört perçinle birleştirilmiş iki mors dişi plakadır. Ayrı metal başlık yoktur; dişin kendisi başlık biçiminde şekillendirilmiştir.', source: 'yucel', position: [-.11, 0, 0] },
  { id: 'inscription', title: 'Gerçek kitabe', text: 'Gerçek kılıcın iki yüzünde altın kakma sülüs yazı vardır; Sultan Mehmed Han\'ı ve soyunu anar. Buradaki bitkisel bant temsilîdir, kitabeyi taklit etmez.', source: 'yucel', position: [.18, 0, .006] },
]
