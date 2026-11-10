#!/usr/bin/env bash
# Bouwt de hele stickerset opnieuw. Uitvoer komt in de map erboven.
set -euo pipefail
cd "$(dirname "$0")"
node render.js ..      # gereedschap -> png/ svg/, vlakke Meester -> vlak/
node render3d.js ..    # 3D-Meester -> png/ en png-1024/
node overzicht.js ..   # overzicht.png
python3 whatsapp.py .. # whatsapp/meester en whatsapp/gereedschap
