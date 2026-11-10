"""Maakt de WhatsApp-bestanden: 512x512 WebP (< 100 KB) per pakket + tray.png (96x96).
Gebruik: python3 whatsapp.py [map]"""
import json, os, sys
from PIL import Image

base = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
data = json.load(open(os.path.join(base, 'stickers.json')))
for pack in ('meester', 'gereedschap'):
    os.makedirs(os.path.join(base, 'whatsapp', pack), exist_ok=True)
largest = 0
for s in data:
    im = Image.open(os.path.join(base, 'png', s['id'] + '.png')).convert('RGBA')
    assert im.size == (512, 512), (s['id'], im.size)
    out = os.path.join(base, 'whatsapp', s['pack'], s['id'] + '.webp')
    q = 90
    while True:
        im.save(out, 'WEBP', quality=q, method=6)
        if os.path.getsize(out) < 100_000 or q <= 40:
            break
        q -= 5
    largest = max(largest, os.path.getsize(out))
for pack, src in (('meester', 'meester-lacht'), ('gereedschap', 'kwast-komt-goed')):
    Image.open(os.path.join(base, 'png', src + '.png')).convert('RGBA').resize((96, 96), Image.LANCZOS) \
        .save(os.path.join(base, 'whatsapp', pack, 'tray.png'), optimize=True)
print(f'whatsapp klaar, grootste bestand {largest // 1024} KB')
