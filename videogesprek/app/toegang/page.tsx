
const MELDINGEN: Record<string, string> = {
  onjuist: 'Die code klopt niet.',
  'geen-code': 'Er is nog geen TOEGANGSCODE ingesteld op de server.',
};

export default async function Toegang({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const { fout } = await searchParams;
  const melding = fout ? MELDINGEN[fout] : null;

  return (
    <main className="flex h-dvh flex-col items-center justify-center bg-black px-8 text-white">
      <form method="post" action="/api/toegang" className="flex w-full max-w-xs flex-col items-center gap-4">
        <h1 className="text-2xl font-light">Videogesprek</h1>
        <input
          name="code"
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="Toegangscode"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg outline-none placeholder:text-white/40 focus:bg-white/15"
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        />
        {melding && <p className="text-sm text-red-300">{melding}</p>}
        <button type="submit" className="w-full rounded-xl bg-[#34c759] py-3 text-lg font-medium text-white active:opacity-80">
          Openen
        </button>
      </form>
    </main>
  );
}
