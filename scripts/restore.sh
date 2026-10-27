#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to a NEW EMPTY database}"
: "${1:?Pass the path to a pg_dump custom archive}"
if [[ "$(psql "$RESTORE_DATABASE_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'")" != "0" ]]; then
  printf 'Refusing to restore into a nonempty database.\n' >&2; exit 1
fi
pg_restore --dbname="$RESTORE_DATABASE_URL" --no-owner --exit-on-error "$1"
printf 'Restore completed. Verify application queries before switching traffic.\n'
