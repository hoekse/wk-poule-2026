#!/usr/bin/env bash
# Bouwt de hele stickerset opnieuw. Uitvoer komt in de map erboven.
set -euo pipefail
cd "$(dirname "$0")"
node render.js ..      # vlakke versie -> vlak/png en vlak/svg
node render3d.js ..    # 3D-stickers -> png/ en png-1024/
node overzicht.js ..   # overzicht.png
python3 whatsapp.py .. # whatsapp/meester en whatsapp/gereedschap
