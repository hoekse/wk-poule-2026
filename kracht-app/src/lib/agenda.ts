import { plusDagen, weekdag } from './datum';
import type { Datum, Instellingen } from './types';

const DAGCODE = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/** Agendabestand (.ics) met een wekelijks terugkerende afspraak per trainingsdag en een herinnering een uur van tevoren. */
export function maakIcs(inst: Pick<Instellingen, 'trainingsdagen' | 'trainingstijd'>, vanaf: Datum, duurMinuten = 75): string {
  const [uur, minuut] = (inst.trainingstijd || '18:00').split(':').map(Number);
  const tijd = `${String(uur).padStart(2, '0')}${String(minuut).padStart(2, '0')}00`;
  const eindMin = uur * 60 + minuut + duurMinuten;
  const eindTijd = `${String(Math.floor(eindMin / 60) % 24).padStart(2, '0')}${String(eindMin % 60).padStart(2, '0')}00`;
  const nu = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const regels = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kracht//Trainingsschema//NL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const dag of [...inst.trainingsdagen].sort()) {
    let d = vanaf;
    while (weekdag(d) !== dag) d = plusDagen(d, 1);
    const datum = d.replace(/-/g, '');
    regels.push(
      'BEGIN:VEVENT',
      `UID:kracht-${DAGCODE[dag - 1].toLowerCase()}-${datum}@kracht`,
      `DTSTAMP:${nu}`,
      `DTSTART:${datum}T${tijd}`,
      `DTEND:${datum}T${eindTijd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DAGCODE[dag - 1]}`,
      'SUMMARY:Krachttraining FitButiq',
      'LOCATION:FitButiq\\, Spoorstraat 1\\, IJsselmuiden',
      'DESCRIPTION:Open de Kracht-app en tik op Start.',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Over een uur trainen bij FitButiq',
      'TRIGGER:-PT60M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  regels.push('END:VCALENDAR');
  return regels.join('\r\n') + '\r\n';
}
