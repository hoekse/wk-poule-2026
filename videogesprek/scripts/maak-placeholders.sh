#!/usr/bin/env bash
# Maakt tijdelijke placeholder-clips, een placeholder-foto en de app-iconen.
# Vervang de clips en foto.jpg later door het echte materiaal (zie README).
# Nodig: ffmpeg en ImageMagick (convert).
# Gebruik: npm run placeholders
set -euo pipefail
cd "$(dirname "$0")/.."

CLIPS=public/clips
mkdir -p "$CLIPS" public/icons
FONT=$(fc-match -f '%{file}' 'Inter:medium' 2>/dev/null || true)
[ -f "$FONT" ] || FONT=$(fc-match -f '%{file}' 'sans' 2>/dev/null)
W=720; H=1280; FPS=30

# Achtergrond: donkere gradient met een zacht "hoofd" dat rustig ademt.
# De ademhaling heeft een periode van 5 s, dus een clip van 10 s loopt naadloos rond.
# PRAAT=1 laat het hoofd sneller trillen alsof hij praat (alleen tijdens het geluid).
achtergrond() { # $1=duur  $2=praat-begin  $3=praat-einde
  local adem="(1+0.025*sin(2*PI*T/5))"
  local praat="(1+0.04*between(T,$2,$3)*sin(2*PI*7*T)*sin(PI*(T-$2)/($3-$2+0.0001)))"
  local r="(150*$adem*$praat)"
  echo "color=c=black:s=${W}x${H}:r=${FPS}:d=$1,format=gray,geq=lum='18+22*(1-Y/H)+150*exp(-(pow(X-W/2,2)+pow((Y-H*0.40)*0.85,2))/(2*pow($r,2)))+70*exp(-(pow(X-W/2,2)/(2*pow(260,2))+pow(Y-H*0.95,2)/(2*pow(180,2))))',format=yuv420p"
}

label() { # $1=regel 1  $2=regel 2
  printf "drawtext=fontfile='%s':text='%s':fontcolor=white@0.85:fontsize=40:x=(w-tw)/2:y=h*0.72,drawtext=fontfile='%s':text='%s':fontcolor=white@0.6:fontsize=30:x=(w-tw)/2:y=h*0.72+60,drawtext=fontfile='%s':text='PLACEHOLDER':fontcolor=white@0.35:fontsize=24:x=(w-tw)/2:y=h*0.72+120" \
    "$FONT" "$1" "$FONT" "$2" "$FONT"
}

# Spraakachtig geluid: zoemtoon met lettergrepen, in en uit gefade.
geluid() { # $1=duur  $2=begin  $3=einde
  echo "aevalsrc='between(t,$2,$3)*0.35*sin(PI*(t-$2)/($3-$2))*(0.6+0.4*sin(2*PI*5.5*t))*(sin(2*PI*170*t)+0.5*sin(2*PI*340*t)+0.25*sin(2*PI*510*t))':s=48000:d=$1"
}

maak_clip() { # $1=bestand  $2=duur  $3=praat-begin  $4=praat-einde  $5=regel1  $6=regel2
  ffmpeg -loglevel error -y \
    -f lavfi -i "$(achtergrond "$2" "$3" "$4"),$(label "$5" "$6")" \
    -f lavfi -i "$(geluid "$2" "$3" "$4")" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium -crf 26 -g 30 \
    -c:a aac -b:a 96k -ac 1 -shortest -movflags +faststart \
    "$CLIPS/$1"
  echo "  $CLIPS/$1"
}

echo "Clips:"
# Luisterlus: 10 s, geen geluid, begin = eind.
ffmpeg -loglevel error -y -f lavfi -i "$(achtergrond 10 0 0)" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium -crf 26 -g 30 -an -movflags +faststart \
  "$CLIPS/idle.mp4"
echo "  $CLIPS/idle.mp4"
maak_clip begroeting.mp4 2.2 0.3 1.9 'Begroeting' 'Hoi!'
maak_clip onbekend.mp4   2.6 0.3 2.3 'Niet herkend' 'Dat moet je me nog een keer vragen.'
maak_clip 1.mp4          2.2 0.3 1.9 'Antwoord 1' 'Ja, giet weer.'
maak_clip 2.mp4          1.8 0.3 1.5 'Antwoord 2' 'Ja, weer.'
maak_clip 3.mp4          1.2 0.3 0.9 'Antwoord 3' 'Oh.'

if [ ! -f public/foto.jpg ] || [ "${1:-}" = "--foto" ]; then
  ffmpeg -loglevel error -y -i "$CLIPS/idle.mp4" -frames:v 1 -q:v 3 public/foto.jpg
  echo "Foto: public/foto.jpg (placeholder)"
fi

# App-iconen: groene cirkel met witte hoorn. Geen gezicht, want iconen zijn openbaar.
HOORN="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
icoon() { # $1=bestand $2=grootte $3=maskable(0/1)
  local s=$2 c=$(( $2 / 2 )) r scale off
  if [ "$3" = 1 ]; then r=0; scale=$(echo "$s*0.42/24" | bc -l); else r=$(echo "$s*0.40" | bc -l); scale=$(echo "$s*0.40/24" | bc -l); fi
  off=$(echo "$c - 12*$scale" | bc -l)
  if [ "$3" = 1 ]; then
    convert -size ${s}x${s} xc:'#34c759' -fill white -draw "translate $off,$off scale $scale,$scale path '$HOORN'" "$1"
  else
    convert -size ${s}x${s} xc:'#111111' -fill '#34c759' -draw "circle $c,$c $c,$(echo "$c-$r" | bc -l)" \
      -fill white -draw "translate $off,$off scale $scale,$scale path '$HOORN'" "$1"
  fi
  echo "  $1"
}
echo "Iconen:"
icoon public/icons/icon-192.png 192 0
icoon public/icons/icon-512.png 512 0
icoon public/icons/icon-maskable-512.png 512 1
icoon public/icons/apple-touch-icon.png 180 1
convert public/icons/icon-192.png -resize 48x48 public/favicon.ico 2>/dev/null || true
