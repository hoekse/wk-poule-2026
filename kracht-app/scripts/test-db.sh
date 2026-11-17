#!/usr/bin/env bash
# Test de Supabase-migratie en de beveiliging op een lokale, tijdelijke Postgres (15+).
set -euo pipefail
HIER="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
POORT="${POORT:-54331}"
BASIS="${BASIS:-/var/lib/postgresql/kracht-test}"
als_pg() { if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
if [ -f "$BASIS/data/postmaster.pid" ]; then als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" stop -m fast >/dev/null || true; fi
rm -rf "$BASIS"; als_pg mkdir -p "$BASIS"
als_pg "$PGBIN/initdb" -D "$BASIS/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" -l "$BASIS/log" -o "-p $POORT -k $BASIS -c listen_addresses=localhost" start >/dev/null
PSQL=(psql -h "$BASIS" -p "$POORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
for f in "$HIER/scripts/supabase-stubs.sql" "$HIER"/supabase/migrations/*.sql "$HIER"/supabase/migrations/*.sql "$HIER/supabase/tests/kracht_test.sql"; do
  echo "→ ${f#$HIER/}"; "${PSQL[@]}" -f "$f"
done
als_pg "$PGBIN/pg_ctl" -D "$BASIS/data" stop -m fast >/dev/null
