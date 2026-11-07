#!/usr/bin/env python3
"""Envanter kitabının .idml dosyasından hikâye metinlerini ve sayfa aralıklarını çıkarır.
Kullanım: python3 -I scripts/idml_cikar.py <dosya.idml | Drive indirme JSON'u> <çıktı.json>
Çıktı: [{hikaye, sayfalar:[ilk, son], metin}] — Türkçe/İngilizce ayrımı elle yapılır; metin kitapta olduğu gibi kalır."""
import base64, io, json, re, sys, zipfile
from html import unescape

def ac(yol):
    ham = open(yol, 'rb').read()
    if ham[:2] != b'PK':  # Drive MCP indirmesi: {"content": base64}
        ham = base64.b64decode(json.loads(ham)['content'])
    return zipfile.ZipFile(io.BytesIO(ham))

def metin(xml):
    paragraflar = re.findall(r'<ParagraphStyleRange.*?</ParagraphStyleRange>', xml, re.S)
    satirlar = [unescape(''.join(re.findall(r'<Content>(.*?)</Content>', p, re.S))).strip() for p in paragraflar]
    return '\n'.join(s for s in satirlar if s and not s.startswith('<?ACE'))

def main(girdi, cikti):
    z = ac(girdi)
    sayfalar = {}
    for ad in z.namelist():
        if ad.startswith('Spreads/'):
            x = z.read(ad).decode('utf8')
            adlar = [int(a) for a in re.findall(r'<Page [^>]*Name="(\d+)"', x)]
            for h in re.findall(r'<TextFrame [^>]*ParentStory="([^"]*)"', x):
                sayfalar.setdefault(h, set()).update(adlar)
    sonuc = []
    for ad in sorted(n for n in z.namelist() if n.startswith('Stories/')):
        h = re.search(r'Story_(\w+)\.xml', ad).group(1)
        t = metin(z.read(ad).decode('utf8'))
        if t:
            p = sorted(sayfalar.get(h, []))
            sonuc.append({'hikaye': h, 'sayfalar': [p[0], p[-1]] if p else [], 'metin': t})
    json.dump(sonuc, open(cikti, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(sonuc)} hikâye yazıldı: {cikti}')

if __name__ == '__main__':
    main(*sys.argv[1:3])
