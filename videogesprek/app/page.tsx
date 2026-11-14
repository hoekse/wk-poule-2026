import { connection } from 'next/server';
import Videogesprek from '@/components/Videogesprek';
import { clipUrl, FOTO, ITEMS, NAAM, SPECIALE_CLIPS } from '@/lib/antwoorden';
import { spraakApiBeschikbaar } from '@/lib/server/transcribeer';

export default async function Pagina() {
  // Lees de omgeving per verzoek, niet tijdens de build.
  await connection();

  const clips = {
    idle: clipUrl(SPECIALE_CLIPS.idle),
    begroeting: clipUrl(SPECIALE_CLIPS.begroeting),
    onbekend: clipUrl(SPECIALE_CLIPS.onbekend),
    antwoorden: Object.fromEntries(ITEMS.map((item) => [item.id, clipUrl(item.clip)])),
  };

  return <Videogesprek naam={NAAM} foto={FOTO} clips={clips} spraakApi={spraakApiBeschikbaar()} />;
}
