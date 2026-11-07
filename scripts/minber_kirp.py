"""Minber bölgesi dokuları: arşiv fotoğraflarından perspektifi düzeltilmiş kırpımlar.
Çıktı: minber-atlas(.jpg, -1024.jpg) ve minber-kundekari(.jpg, -512.jpg). PIL dışında bağımlılık yok.
Kullanım: minber_kirp.py <arşiv Links klasörü> <public/gorseller/ulu-camii/maket>
Bölge dikdörtgenleri ekrana yazılır: src/components/maket/ulucami/minber.ts içindeki BOLGE ile aynı kalmalı."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
import json, sys, os

ARSIV = sys.argv[1]
CIKTI = sys.argv[2]
Image.MAX_IMAGE_PIXELS = None


def katsayi(hedef, kaynak):
    """PIL PERSPECTIVE katsayıları (Gauss eleme; numpy yok)."""
    A, b = [], []
    for (x, y), (u, v) in zip(hedef, kaynak):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    n = 8
    M = [r + [c] for r, c in zip(A, b)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]


_onbellek = {}
def foto(ad):
    if ad not in _onbellek:
        _onbellek[ad] = Image.open(os.path.join(ARSIV, ad)).convert('RGB')
    return _onbellek[ad]


def duzelt(ad, koseler, g, y):
    """koseler: sol üst, sağ üst, sağ alt, sol alt (tam çözünürlük pikseli)."""
    k = katsayi([(0, 0), (g, 0), (g, y), (0, y)], koseler)
    return foto(ad).transform((g, y), Image.PERSPECTIVE, k, Image.BICUBIC)


def onizleme(ox, oy, f, x0, y0):
    return lambda px, py: (x0 + f * px, y0 + f * py)


F99 = 'ERD04999 kopya.jpg'
F98 = 'ERD04998 kopya-2.jpg'
F65 = 'DJI_20241210010423_0173_D_ODAK.jpg'
F85 = 'DJI_20241210024324_0276_D_ODAK.jpg'
F103 = 'ERD05030 kopya.jpg'
F89 = 'DJI_20241210050233_0334_D_ODAK.jpg'

# Önizleme ölçekleri: incelenen kırpımların tam çözünürlüğe çevrimi.
p99 = onizleme(0, 0, 2200 / 1204, 1320, 155)        # ac.py 99 1500 .33 .03 .88 .56
p98 = onizleme(0, 0, 1680 / 1112, 1600, 705)        # ac.py 98 1400 .40 .15 .82 .60
p65 = onizleme(0, 0, 2510 / 943, 0, 0)
p85 = onizleme(0, 0, 5272 / 1400, 0, 0)
p103 = onizleme(0, 0, 3184 / 764, 0, 0)
p89 = onizleme(0, 0, (0.14 * 6529) / 914, 0.28 * 6529, 0.55 * 5760)

atlas = Image.new('RGB', (2048, 2048), (34, 20, 12))
bolge = {}
def koy(ad, im, x, y):
    atlas.paste(im, (x, y))
    bolge[ad] = [x, y, im.width, im.height]


# --- Köşk kuzey yüzü (g98): sütun başından perdeli nişin altına ---
def aynala(im, kose):
    """Fotoğrafta başka bir öğenin kapattığı köşeyi yüzün simetrik yarısıyla doldurur (yazı içermeyen köşeler)."""
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).polygon(kose, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3))
    return Image.composite(ImageOps.mirror(im), im, m)


koy('koskKuzey', aynala(duzelt(F98, [p98(737, 292), p98(978, 172), p98(976, 806), p98(772, 826)], 480, 1336), [(480, 900), (480, 1336), (130, 1336), (190, 1215)]), 0, 0)
# --- Köşk batı yüzü (g99): niş, kafes, altın çerçeveli pano, kûfî şerit ---
koy('koskBati', aynala(duzelt(F99, [p99(905, 378), p99(1137, 378), p99(1137, 990), p99(905, 990)], 480, 1266), [(262, 0), (480, 0), (480, 430)]), 490, 0)
# --- Kapı üstü kitabesi ve tacı (g98) ---
koy('kapiPano', duzelt(F98, [p98(100, 1128), p98(252, 1100), p98(252, 1224), p98(102, 1248)], 512, 440), 980, 0)
tac = duzelt(F98, [p98(78, 868), p98(278, 861), p98(278, 1018), p98(78, 1078)], 512, 320)
# Arka plandaki açık duvarı koyu cevize çevirir: kesim çizgisinden taşan piksel beyaz görünmesin.
piks = tac.load()
for ty in range(tac.height):
    for tx in range(tac.width):
        r, g, b = piks[tx, ty]
        if min(r, g, b) > 95 and max(r, g, b) - min(r, g, b) < 90:
            piks[tx, ty] = (28, 16, 9)
koy('kapiTac', tac, 980, 450)
# --- Mahfil merdiveninin yan panosu: deri üzeri bitkisel süsleme (g65) ---
koy('deri', duzelt(F65, [p65(168, 790), p65(690, 790), p65(690, 1296), p65(168, 1296)], 512, 496), 1500, 0)
# --- Kürsü: damarlı mermer ve kitabe (g103) ---
mermer = duzelt(F103, [p103(272, 615), p103(632, 615), p103(632, 660), p103(272, 660)], 512, 128)
mer2 = Image.new('RGB', (1024, 128))
mer2.paste(mermer, (0, 0)); mer2.paste(ImageOps.mirror(mermer), (512, 0))
koy('mermer', mer2, 980, 810)
koy('kitabe', duzelt(F103, [p103(294, 528), p103(630, 528), p103(630, 618), p103(294, 618)], 512, 137), 1500, 510)
koy('kaide', duzelt(F103, [p103(296, 880), p103(612, 880), p103(614, 1018), p103(294, 1018)], 256, 112), 1500, 660)
# --- Ceviz: mahfil kirişi (g85) ---
def koyu(im, kr, kg, kb):
    r, g, b = im.split()
    return Image.merge('RGB', (r.point(lambda v: v * kr), g.point(lambda v: v * kg), b.point(lambda v: v * kb)))


# Fotoğraftaki flaşlı kiriş rengini mahfilin genel koyu cevizine indirir.
koy('ceviz', koyu(duzelt(F85, [p85(135, 584), p85(735, 584), p85(735, 610), p85(135, 610)], 1060, 84), 0.5, 0.56, 0.6), 980, 945)
# --- Yıldızlı ahşap pano (g85) ---
koy('panoYildiz', duzelt(F85, [p85(1172, 830), p85(1365, 830), p85(1365, 910), p85(1172, 910)], 280, 116), 1762, 660)
# --- Dolap önü: kavsaralı kafes ve raflar (g89) ---
koy('dolap', duzelt(F89, [p89(198, 125), p89(480, 125), p89(480, 515), p89(198, 515)], 360, 498), 0, 1345)
# --- Yanları için ahşap yüzey (g89) ---
koy('dolapYan', koyu(duzelt(F89, [p89(660, 210), p89(708, 210), p89(708, 430), p89(660, 430)], 120, 400), 0.62, 0.66, 0.7), 370, 1345)

os.makedirs(CIKTI, exist_ok=True)
atlas.save(os.path.join(CIKTI, 'minber-atlas.jpg'), quality=86)
atlas.resize((1024, 1024), Image.LANCZOS).save(os.path.join(CIKTI, 'minber-atlas-1024.jpg'), quality=84)
print(json.dumps(bolge))

# --- Kündekâri: minberin batı yüzünde cam yansıması olmayan bölgeden, aynalanarak dikişsiz ---
kaynak = duzelt(F99, [p99(925, 1000), p99(1117, 1000), p99(1117, 1272), p99(925, 1272)], 512, 720)
leke = kaynak.filter(ImageFilter.GaussianBlur(70))
ort = tuple(int(sum(kaynak.resize((1, 1)).getpixel((0, 0))[i] for _ in [0])) for i in range(3))
kanal = []
for i in range(3):
    a, b = kaynak.getchannel(i), leke.getchannel(i)
    kanal.append(ImageChops.add(a, ImageChops.invert(b), scale=1, offset=ort[i] - 255))
duz = Image.merge('RGB', kanal)
tam = Image.new('RGB', (1024, 1440))
tam.paste(duz, (0, 0)); tam.paste(ImageOps.mirror(duz), (512, 0))
alt = ImageOps.flip(tam.crop((0, 0, 1024, 720)))
tam.paste(alt, (0, 720))
tam.save(os.path.join(CIKTI, 'minber-kundekari.jpg'), quality=86)
tam.resize((512, 720), Image.LANCZOS).save(os.path.join(CIKTI, 'minber-kundekari-512.jpg'), quality=84)
print(ort)
