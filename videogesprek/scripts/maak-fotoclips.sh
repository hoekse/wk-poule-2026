#!/usr/bin/env bash
# Maakt van een foto de belscherm-foto en tijdelijke clips (licht ademend beeld,
# bij antwoorden een zoemtoon) en zet ze versleuteld in media/.
# Alleen bedoeld tot de echte clips er zijn; de echte clips vervangen deze.
# Onversleutelde tussenbestanden staan alleen in een tijdelijke map die na afloop
# wordt gewist. Nodig: ffmpeg en ImageMagick.
# Gebruik: npm run fotoclips -- <foto.jpg>
set -euo pipefail
cd "$(dirname "$0")/.."
FOTO=${1:?Gebruik: npm run fotoclips -- <foto.jpg>}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FONT=$(fc-match -f '%{file}' 'Inter:medium' 2>/dev/null || fc-match -f '%{file}' 'sans')
FPS=30

# Staand 720x1280, zonder metadata (geen locatie e.d.).
convert "$FOTO" -auto-orient -strip -resize 720x1280^ -gravity center -extent 720x1280 -quality 88 "$TMP/foto.jpg"
convert "$TMP/foto.jpg" -resize 1440x2560 "$TMP/groot.png"

# Ademhaling: 5 s per ademhaling, dus een clip van 10 s loopt naadloos rond.
# Tijdens "praten" (b..e seconden) een kleine extra beweging.
beeld() { # $1=duur $2=praat-begin $3=praat-einde
  local t="(on/$FPS)"
  local z="1.035+0.012*sin(2*PI*on/(5*$FPS))+0.007*between($t,$2,$3)*sin(2*PI*5*$t)*sin(PI*($t-$2)/($3-$2+0.0001))"
  echo "zoompan=z='$z':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=$FPS"
}
label() {
  printf "drawtext=fontfile='%s':text='%s':fontcolor=white@0.6:shadowcolor=black@0.6:shadowx=1:shadowy=1:fontsize=24:x=(w-tw)/2:y=h-150" "$FONT" "$1"
}
geluid() { # $1=duur $2=begin $3=einde
  echo "aevalsrc='between(t,$2,$3)*0.25*sin(PI*(t-$2)/($3-$2))*(0.6+0.4*sin(2*PI*5.5*t))*(sin(2*PI*170*t)+0.5*sin(2*PI*340*t)+0.25*sin(2*PI*510*t))':s=48000:d=$1"
}
VIDEO=(-c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium -crf 23 -g 30 -movflags +faststart)

maak() { # $1=bestand $2=duur $3=begin $4=einde $5=label
  ffmpeg -loglevel error -y -loop 1 -framerate $FPS -t "$2" -i "$TMP/groot.png" -f lavfi -i "$(geluid "$2" "$3" "$4")" \
    -vf "$(beeld "$2" "$3" "$4"),$(label "$5"),format=yuv420p" "${VIDEO[@]}" -c:a aac -b:a 96k -ac 1 -shortest "$TMP/$1"
}

echo "Clips maken..."
ffmpeg -loglevel error -y -loop 1 -framerate $FPS -t 10 -i "$TMP/groot.png" \
  -vf "$(beeld 10 0 0),format=yuv420p" "${VIDEO[@]}" -an "$TMP/idle.mp4"
maak begroeting.mp4 2.2 0.3 1.9 'placeholder · begroeting'
maak onbekend.mp4   2.6 0.3 2.3 'placeholder · nog een keer vragen'
maak 1.mp4          2.2 0.3 1.9 'placeholder · Ja, giet weer.'
maak 2.mp4          1.8 0.3 1.5 'placeholder · Ja, weer.'
maak 3.mp4          1.2 0.3 0.9 'placeholder · Oh.'

node scripts/versleutel-media.mjs "$TMP/foto.jpg" foto.jpg
for f in idle begroeting onbekend 1 2 3; do
  node scripts/versleutel-media.mjs "$TMP/$f.mp4" "clips/$f.mp4"
done
