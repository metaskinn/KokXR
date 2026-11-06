"""Ulu Camii iç duvar dokularını arşiv fotoğraflarından üretir (perspektif düzeltme, atlas).

Çıktılar (public/gorseller/ulu-camii/maket/):
  ic-pencere.webp: 1024 px atlas. Üst sıra kafesi, kıble penceresi, nişin tepeliği (saydam kenarlı), düz renkler.
  kabe-ortusu.jpg, kabe-ortusu-1024.jpg: vitrindeki örtünün düzeltilmiş kırpımı. Yazılar fotoğraftan gelir, çizilmez.
Köşeler fotoğrafın kendi pikselleridir. Tepelik fotoğrafta tek yandan temiz göründüğü için aynalanmıştır.
Gereken: Pillow. Çalıştırma: python3 scripts/ulu_icduvar_kirp.py <arşiv Links klasörü>
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

Image.MAX_IMAGE_PIXELS = None
LINKS = Path(sys.argv[1])
CIKTI = Path(__file__).resolve().parent.parent / 'public/gorseller/ulu-camii/maket'


def coz(A, b):
    """Gauss eliminasyonu."""
    n = len(b)
    M = [list(A[i]) + [b[i]] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                o = M[r][i] / M[i][i]
                M[r] = [x - o * y for x, y in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


def duzelt(foto, sol_ust, sag_ust, sag_alt, sol_alt, g, y):
    """Dörtgeni g×y dikdörtgene açar."""
    kaynak = [sol_ust, sag_ust, sag_alt, sol_alt]
    hedef = [(0, 0), (g, 0), (g, y), (0, y)]
    A, b = [], []
    for (hx, hy), (kx, ky) in zip(hedef, kaynak):
        A.append([hx, hy, 1, 0, 0, 0, -kx * hx, -kx * hy]); b.append(kx)
        A.append([0, 0, 0, hx, hy, 1, -ky * hx, -ky * hy]); b.append(ky)
    return foto.transform((g, y), Image.PERSPECTIVE, tuple(coz(A, b)), Image.BICUBIC)


def duz_renk(foto, x0, y0, x1, y1, boy=60):
    return foto.crop((x0, y0, x1, y1)).resize((1, 1), Image.BOX).resize((boy, boy))


def tepelik(foto):
    """Niş kemerinin üstündeki yaprak bezeme: yatay kaymayı düzelt, duvarı ve kemer içini saydam yap, aynala."""
    x0, y0 = 4600, 2900
    KAYMA, EKSEN, UST = 0.39, 355, 60
    parca = foto.crop((x0, y0, x0 + 539, y0 + 806))
    # Çıktı (x, y) -> kaynak (x, y + kayma * (x - eksen) + üst)
    duz = parca.transform((EKSEN, 760), Image.AFFINE, (1, 0, 0, KAYMA, 1, -KAYMA * EKSEN + UST), Image.BICUBIC)
    g, y = duz.size
    p = duz.load()
    duvar = lambda r, gr, b: r > 205 and gr > 165 and b > 120 and r - b < 95
    gorulen = bytearray(g * y)
    yigin = [(0, v) for v in range(0, y, 4)] + [(u, 0) for u in range(0, g, 4)]
    while yigin:
        u, v = yigin.pop()
        if not (0 <= u < g and 0 <= v < y) or gorulen[v * g + u] or not duvar(*p[u, v]):
            continue
        gorulen[v * g + u] = 1
        yigin += [(u + 1, v), (u - 1, v), (u, v + 1), (u, v - 1)]
    maske = Image.frombytes('L', (g, y), bytes(0 if d else 255 for d in gorulen))
    maske = maske.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    # Kemer içi ve halkası geometriyle çizilir; yalnız bezeme kalsın.
    kemer = Image.new('L', (g, y), 255)
    dr = ImageDraw.Draw(kemer)
    AY = KEMER_TABAN = 640
    dr.ellipse((EKSEN - 262, KEMER_TEPE, EKSEN + 262, AY + (AY - KEMER_TEPE)), fill=0)
    dr.rectangle((0, KEMER_TABAN, g, y), fill=0)
    maske = ImageChops.multiply(maske, kemer)
    rgba = duz.convert('RGBA')
    rgba.putalpha(maske)
    tam = Image.new('RGBA', (EKSEN * 2, y), (0, 0, 0, 0))
    tam.paste(rgba, (0, 0))
    tam.paste(rgba.transpose(Image.FLIP_LEFT_RIGHT), (EKSEN, 0))
    kirp = tam.crop(tam.getbbox())
    # Üstte fotoğraftaki levhanın çerçevesi kalır: bezeme bu sınırın altındadır.
    alt = kirp.crop((0, int(kirp.height * 0.135), kirp.width, kirp.height))
    print('tepelik kaynak boyu', alt.crop(alt.getbbox()).size)
    return alt.crop(alt.getbbox())


KEMER_TEPE = 300


def main():
    a = Image.open(LINKS / 'ERD05018 kopya.jpg').convert('RGB')
    # Üst sıra pencere: alçı kafes (kırpım ofseti 3200, 100)
    k = lambda x, y: (3200 + x, 100 + y)
    kafes = duzelt(a, k(175, 457), k(770, 26), k(768, 975), k(152, 1230), 624, 1024)
    kirmizi = duz_renk(a, *k(112, 1000), *k(142, 1040))
    cam = duz_renk(a, *k(680, 600), *k(705, 660))
    b = Image.open(LINKS / 'ERD05161-Geliştirilmiş-NR kopya-2.jpg').convert('RGB')
    # Kıble penceresi: yeşil levhanın batısındaki oyma alçı kafes (kırpım ofseti 1000, 100)
    k3 = lambda x, y: (1000 + x, 100 + y)
    kible = duzelt(b, k3(85, 112), k3(475, 93), k3(475, 1165), k3(85, 1095), 280, 540)
    kahve = duz_renk(b, *k3(490, 500), *k3(525, 620))
    c = Image.open(LINKS / 'DJI_20241210035234_0288_D_ODAK-3.jpg').convert('RGB')
    # Alt pencere camı: DJI_0288 kuzey duvarı, sol niş
    cam_alt = duz_renk(c, 2200 + 150, 2000 + 300, 2200 + 225, 2000 + 395)
    tepe = tepelik(c)
    tepe.thumbnail((392, 330), Image.LANCZOS)
    # Fotoğraftaki pembe beyaz ayarı: öteki kareler (ERD05161) bu bezemeyi daha kahverengi gösterir.
    alfa = tepe.getchannel('A')
    tepe = ImageEnhance.Brightness(ImageEnhance.Color(tepe.convert('RGB')).enhance(0.7)).enhance(0.8).convert('RGBA')
    tepe.putalpha(alfa)

    atlas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    atlas.paste(kafes, (0, 0))
    tx = 628 + (392 - tepe.width) // 2
    atlas.paste(tepe, (tx, 4), tepe)
    atlas.paste(kible, (684, 340))
    atlas.paste(kirmizi, (640, 900))
    atlas.paste(cam, (720, 900))
    atlas.paste(kahve, (800, 900))
    atlas.paste(cam_alt, (880, 900))
    atlas.save(CIKTI / 'ic-pencere.webp', quality=88, method=6)
    print('tepelik', tepe.size, 'konum', tx, 4)

    # Kâbe örtüsü (kırpım ofseti 2550, 2050)
    k2 = lambda x, y: (2550 + x, 2050 + y)
    ortu = duzelt(a, k2(428, 305), k2(1432, 128), k2(1362, 1240), k2(178, 1152), 1400, 1180)
    ortu.save(CIKTI / 'kabe-ortusu.jpg', quality=88)
    ortu.resize((1024, 863), Image.LANCZOS).save(CIKTI / 'kabe-ortusu-1024.jpg', quality=86)


main()
