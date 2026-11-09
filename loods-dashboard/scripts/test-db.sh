#!/usr/bin/env bash
# Test de Supabase-migraties, seed en RLS op een lokale, tijdelijke Postgres.
# Gebruik:  bash scripts/test-db.sh            (draait alles en stopt de database)
#           BEHOUD=1 bash scripts/test-db.sh   (laat de database draaien, bijv. voor PostgREST)
#           BEHOUD=1 ZONDER_TESTS=1 bash ...    (schone database met alleen de startdata)
# Vereist: Postgres 15+ (initdb, pg_ctl, psql). Draait als gebruiker 'postgres' als je root bent.
set -euo pipefail

HIER="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
POORT="${POORT:-54329}"
BASIS="${BASIS:-/var/lib/postgresql/loods-test}"

als_pg() {
  if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi
}

if [ -f "$BASIS/data/postmaster.pid" ]; then
  als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" stop -m fast >/dev/null || true
fi
rm -rf "$BASIS"
als_pg mkdir -p "$BASIS"
als_pg "$PGBIN/initdb" -D "$BASIS/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" -l "$BASIS/log" \
  -o "-p $POORT -k $BASIS -c listen_addresses=localhost -c timezone=UTC" start >/dev/null

PSQL=(psql -h "$BASIS" -p "$POORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
run() { echo "→ $1"; "${PSQL[@]}" -f "$1"; }

run "$HIER/scripts/supabase-stubs.sql"
for f in "$HIER"/supabase/migrations/*.sql; do run "$f"; done
run "$HIER/supabase/seed.sql"
run "$HIER/supabase/seed.sql"   # seed moet twee keer kunnen draaien
if [ "${ZONDER_TESTS:-0}" != "1" ]; then run "$HIER/supabase/tests/fase1_test.sql"; fi

if [ "${BEHOUD:-0}" = "1" ]; then
  echo "Database draait nog op poort $POORT (socket $BASIS)."
else
  als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" stop -m fast >/dev/null
  echo "Alle databasetests geslaagd."
fi
