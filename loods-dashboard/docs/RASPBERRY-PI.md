# Raspberry Pi 5 als tv-computer in de loods

Doel: de Sony-tv in de loods toont 24/7 het 3D-dashboard. Een Raspberry Pi 5 (8 GB) aan de HDMI-ingang draait Chromium in
**kioskmodus**: schermvullend, zonder knoppen of balken, start vanzelf op, gaat nooit op zwart en herstart elke nacht om 03:00.

> Het tv-dashboard zelf is fase 2. Je kunt de Pi nu al klaarzetten en testen met de 3D-preview (stap 8).

## Boodschappenlijst

| Onderdeel | Opmerking |
|---|---|
| Raspberry Pi 5, 8 GB | |
| Officiële voeding 27 W USB-C | Een gewone telefoonlader geeft storingen |
| Behuizing **met actieve koeler** (bijv. de officiële case met ventilator) | 24/7 3D wordt warm |
| microSD-kaart 32 GB, A2 (bijv. SanDisk Extreme), of een SSD met M.2 HAT+ | Een SSD gaat langer mee bij 24/7 gebruik |
| Micro-HDMI → HDMI-kabel | Gebruik poort **HDMI0** (naast de USB-C) |
| Netwerkkabel (aanbevolen) of goede wifi | Kabel is het stabielst |
| Tijdelijk: USB-toetsenbord en muis | Alleen voor de installatie |

## 1. Besturingssysteem op de kaart zetten

1. Installeer **Raspberry Pi Imager** op je pc: <https://www.raspberrypi.com/software/>.
2. Kies **Raspberry Pi 5** → **Raspberry Pi OS (64-bit)** (met bureaublad) → je SD-kaart.
3. Klik op **Instellingen bewerken** (tandwiel) en vul in:
   - Hostnaam: `loods-tv`
   - Gebruiker: `loods` met een sterk wachtwoord (in je wachtwoordkluis)
   - Wifi (als je geen kabel gebruikt), land **NL**
   - Tijdzone **Europe/Amsterdam**, toetsenbord **us** (of wat je gebruikt)
   - Tabblad *Services*: **SSH aanzetten** (beheer op afstand)
4. Schrijf de kaart, stop hem in de Pi, sluit tv, netwerk en voeding aan.

## 2. Eerste keer opstarten en bijwerken

Open een **Terminal** op de Pi (of via SSH vanaf je pc: `ssh loods@loods-tv.local`):

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y chromium curl v4l-utils
sudo reboot
```

*(Heet het pakket bij jou `chromium-browser`, installeer dan dat; het script hieronder vindt beide.)*

## 3. Automatisch inloggen en scherm nooit uit

```bash
sudo raspi-config
```

- **System Options → Boot / Auto Login → Desktop Autologin**
- **Display Options → Screen Blanking → No** (scherm gaat nooit op zwart)

Kies **Finish** en herstart.

## 4. Het kioskscript

Maak het script aan:

```bash
nano ~/kiosk.sh
```

Plak dit erin (pas de `URL` aan zodra het tv-dashboard online staat):

```bash
#!/bin/bash
# Loods Hoeksema – tv in kioskmodus. Start Chromium schermvullend en herstart het als het afsluit.
URL="https://loods-tv.vercel.app"            # adres van het tv-dashboard (fase 2)
# URL="file:///home/loods/loods-3d-preview.html"   # om nu al te testen met de preview

BROWSER="$(command -v chromium || command -v chromium-browser)"
PROFIEL="$HOME/.config/loods-kiosk"

# Wacht tot er internet is (na stroomuitval kan de router later opstarten dan de Pi).
if [[ "$URL" == http* ]]; then
  until curl -s --head --max-time 5 "$URL" >/dev/null; do sleep 5; done
fi

# Geen "Chromium is niet correct afgesloten"-melding na stroomuitval.
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' \
  "$PROFIEL/Default/Preferences" 2>/dev/null

while true; do
  "$BROWSER" \
    --kiosk --noerrdialogs --disable-infobars --no-first-run \
    --disable-session-crashed-bubble --disable-features=Translate \
    --check-for-update-interval=31536000 --password-store=basic \
    --force-device-scale-factor=1 --overscroll-history-navigation=0 \
    --ignore-gpu-blocklist --enable-gpu-rasterization \
    --user-data-dir="$PROFIEL" \
    "$URL"
  sleep 3   # Chromium gesloten of vastgelopen: na 3 seconden opnieuw starten
done
```

Opslaan met `Ctrl+O`, `Enter`, `Ctrl+X`. Maak het uitvoerbaar:

```bash
chmod +x ~/kiosk.sh
```

## 5. Kiosk automatisch laten starten

Raspberry Pi OS gebruikt de bureaubladomgeving **labwc**. Zet het script in de opstartlijst:

```bash
mkdir -p ~/.config/labwc
echo '/home/loods/kiosk.sh &' > ~/.config/labwc/autostart
sudo reboot
```

Na het opstarten verschijnt het dashboard schermvullend. Met een toetsenbord kun je stoppen via `Alt+F4` (Chromium start na 3 seconden weer). Werken aan de Pi doe je via SSH.

> Zie je nog een muiscursor in beeld? Haal de muis los en herstart.

## 6. Elke nacht om 03:00 een volledige herstart

```bash
sudo crontab -e
```

Kies *nano* en zet onderaan:

```
0 3 * * * /sbin/reboot
```

Een volledige herstart ruimt alles op: geheugen, browser en een hangende netwerkverbinding. Het tv-dashboard herlaadt in fase 2 bovendien zelf bij verbindingsverlies.

## 7. Tv instellen (Sony)

- **Beeldmodus**: *Graphics* of *Game/PC*, zodat de randen niet wegvallen. **Weergavegebied: Volledige pixel**.
- **Energie besparen / automatisch uit**: uitzetten, anders gaat de tv na een paar uur uit.
- **BRAVIA Sync (HDMI-CEC)**: aanzetten als je de tv vanuit de Pi aan en uit wilt zetten (zie hieronder).

### Optioneel: tv 's avonds uit, 's ochtends aan (HDMI-CEC)

Test eerst (de Pi 5 heeft twee CEC-poorten; meestal is HDMI0 `/dev/cec0`):

```bash
cec-ctl -d /dev/cec0 --playback
cec-ctl -d /dev/cec0 --to 0 --standby          # tv uit
cec-ctl -d /dev/cec0 --to 0 --image-view-on    # tv aan
```

Werkt het, zet het dan in `crontab -e` (als gebruiker loods, dus zonder sudo). Bijvoorbeeld werkdagen aan om 06:30 en uit om 18:30:

```
30 6  * * 1-5 cec-ctl -d /dev/cec0 --playback && cec-ctl -d /dev/cec0 --to 0 --image-view-on
30 18 * * 1-5 cec-ctl -d /dev/cec0 --to 0 --standby
```

## 8. Nu al testen met de 3D-preview

Zo weet je vóór fase 2 of de Pi het 3D-beeld vlot genoeg toont:

1. Zet `loods-3d-preview.html` (in de map `loods-dashboard`) op een USB-stick en kopieer het naar `/home/loods/` op de Pi.
2. Zet in `~/kiosk.sh` de regel `URL="file:///home/loods/loods-3d-preview.html"` aan (haal het `#` weg) en zet een `#` voor de andere `URL`.
3. Herstart. De preview laadt Three.js van internet, dus de Pi moet online zijn.
4. Draait de rondgang vloeiend? Meld het terug. Het echte dashboard wordt lichter (max. 30 fps, pixelratio 1, pauze als er niets verandert).

## 9. Betrouwbaarheid op lange termijn

- **Wifi-stroombesparing uit** (alleen bij wifi): `sudo nmcli connection modify "<wifinaam>" 802-11-wireless.powersave 2` en herstarten.
- **Beschermen tegen stroomuitval**: als alles werkt: `sudo raspi-config` → **Performance Options → Overlay File System → Enable**. De SD-kaart wordt dan alleen-lezen en kan niet meer beschadigd raken. Voor wijzigingen zet je het tijdelijk weer uit.
- **Op afstand meekijken**: met **Raspberry Pi Connect** (gratis, <https://connect.raspberrypi.com>) zie en bedien je het scherm van de Pi vanaf je eigen pc of telefoon.
- **Temperatuur controleren**: `vcgencmd measure_temp`. Onder 70 °C is prima.

## Problemen oplossen

| Probleem | Oplossing |
|---|---|
| Zwart scherm na opstarten | Kijk of de kabel in **HDMI0** zit; kies op de tv de juiste HDMI-ingang |
| Bureaublad in plaats van dashboard | Klopt het pad in `~/.config/labwc/autostart`? Is `kiosk.sh` uitvoerbaar (`chmod +x`)? |
| "Kan deze site niet bereiken" | Internet controleren; het script wacht automatisch tot de site bereikbaar is |
| Beeld valt half buiten de tv | Tv-instelling *Volledige pixel* / *Graphics* |
| Haperend 3D-beeld | Koeler aanwezig? `vcgencmd measure_temp`; liefst netwerkkabel |
