// Topluluk katkısı girdi doğrulaması (saf mantık).
import assert from 'node:assert/strict'
import { katkiHatasi, temizle, yeniKatki, BASLIK_EN_FAZLA, METIN_EN_FAZLA } from '../src/data/katki.ts'

assert.equal(katkiHatasi('Çocukluk anım', 'Bu çeşmeden su içerdik.'), '')
assert.match(katkiHatasi('', 'metin'), /zorunlu/)
assert.match(katkiHatasi('Başlık', '   '), /zorunlu/)
assert.match(katkiHatasi('x'.repeat(BASLIK_EN_FAZLA + 1), 'metin'), /en fazla/)
assert.match(katkiHatasi('Başlık', 'x'.repeat(METIN_EN_FAZLA + 1)), /en fazla/)
assert.match(katkiHatasi('Başlık', 'bana ali@ornek.com adresinden yazın'), /kişisel/)
assert.match(katkiHatasi('Başlık', 'beni 0532 123 45 67 numarasından arayın'), /kişisel/)
assert.equal(temizle('  a\u0000b \t\t c\n\n\n\nd  '), 'ab c\n\nd')
const k = yeniKatki('ulu-camii', ' Başlık ', ' <b>metin</b> ')
assert.equal(k.durum, 'beklemede')
assert.equal(k.baslik, 'Başlık')
assert.equal(k.metin, '<b>metin</b>') // etiketler silinmez; React metni kaçırarak gösterir
console.log('Katkı doğrulaması: zorunlu alan, uzunluk, kişisel veri ve temizleme başarılı.')
