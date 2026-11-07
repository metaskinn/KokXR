"""Ulu Camii maketindeki levha ve paye yazısı dokularını arşiv fotoğraflarından üretir.

Hat yazısı taklit edilmez: her doku, projedeki arşiv fotoğrafının perspektifi düzeltilmiş bir kırpımıdır.
Yazı aynalanmaz. Girdi: public/gorseller/ulu-camii/, çıktı: public/gorseller/ulu-camii/maket/.
Gereken: Pillow. Çalıştırma: python3 scripts/levha_kirp.py [kök klasör]
"""
import sys
from pathlib import Path

from PIL import Image

KOK = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
GIRDI = KOK / 'public/gorseller/ulu-camii'
CIKTI = GIRDI / 'maket'

# ad: (fotoğraf, sol üst, sağ üst, sağ alt, sol alt, çıktı genişliği, çıktı yüksekliği)
# Köşeler fotoğrafın kendi piksel koordinatlarındadır.
LEVHALAR = {
    'levha-altin': ('hat-levhasi.jpg', (0, 0), (1546, 0), (1546, 1600), (0, 1600), 900, 931),
    'paye-1': ('ic-mekan-uzun.jpg', (252, 606), (416, 606), (416, 922), (252, 922), 400, 770),
    'paye-2': ('ic-mekan-uzun.jpg', (494, 612), (586, 612), (586, 776), (494, 776), 400, 712),
    'paye-3': ('sadirvan.jpg', (94, 360), (345, 360), (345, 776), (94, 885), 520, 1000),
    'paye-4': ('sadirvan.jpg', (1275, 368), (1505, 368), (1505, 875), (1275, 770), 520, 1000),
    'paye-5': ('ic-mekan.jpg', (728, 560), (802, 582), (800, 802), (728, 770), 400, 800),
    'paye-6': ('ic-mekan.jpg', (810, 582), (872, 560), (872, 770), (810, 802), 400, 800),
    'mihrap-on': ('mihrap.jpg', (0, 0), (1600, 0), (1600, 1148), (0, 1148), 1400, 1004),
    'pencere-ic': ('ic-mekan-uzun.jpg', (1432, 130), (1570, 110), (1575, 420), (1432, 440), 420, 760),
    'sancak-yesil': ('minber.jpg', (745, 352), (873, 272), (873, 588), (745, 632), 340, 700),
    'madalyon': ('minber.jpg', (88, 733), (160, 733), (160, 795), (88, 795), 360, 310),
    'levha-kucuk': ('minber.jpg', (80, 866), (166, 851), (166, 890), (80, 899), 480, 254),
}


def katsayilar(hedef, kaynak):
    """Hedef dörtgeni kaynak dörtgene eşleyen perspektif katsayıları (Gauss eliminasyonu)."""
    a = []
    for (x, y), (u, v) in zip(hedef, kaynak):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y, v])
    n = 8
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(a[r][i]))
        a[i], a[p] = a[p], a[i]
        for r in range(n):
            if r != i:
                f = a[r][i] / a[i][i]
                a[r] = [x - f * y for x, y in zip(a[r], a[i])]
    return [a[i][8] / a[i][i] for i in range(n)]


def main():
    CIKTI.mkdir(parents=True, exist_ok=True)
    for ad, (foto, su, sa, ga, gu, w, h) in LEVHALAR.items():
        kaynak = Image.open(GIRDI / foto).convert('RGB')
        k = katsayilar([(0, 0), (w, 0), (w, h), (0, h)], [su, sa, ga, gu])
        sonuc = kaynak.transform((w, h), Image.Transform.PERSPECTIVE, k, Image.Resampling.BICUBIC)
        sonuc.save(CIKTI / f'{ad}.jpg', quality=84, optimize=True)
        print(ad, foto, kaynak.size, '->', (w, h))


if __name__ == '__main__':
    main()
