#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL in the environment}"
output_dir="${BACKUP_DIR:-work/backups}"
mkdir -p "$output_dir"
umask 077
output_file="$output_dir/productscroll-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --file="$output_file"
pg_restore --list "$output_file" >/dev/null
printf 'Backup created and archive verified: %s\n' "$output_file"
