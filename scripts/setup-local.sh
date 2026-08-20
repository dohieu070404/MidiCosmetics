#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
target="$project_root/.env.docker.local"

if [ -f "$target" ] && [ "${1:-}" != "--force" ]; then
  echo '.env.docker.local already exists. Use --force only to rotate local credentials.' >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo 'OpenSSL is required to generate random local credentials.' >&2
  exit 1
fi

umask 077
database_password=$(openssl rand -hex 32)
access_secret=$(openssl rand -hex 48)
refresh_secret=$(openssl rand -hex 48)

{
  printf '%s\n' '# Generated local-only credentials. Never commit this file.'
  printf 'POSTGRES_PASSWORD=%s\n' "$database_password"
  printf 'DATABASE_URL=postgresql://midi:%s@database:5432/midi_cosmetics?schema=public\n' "$database_password"
  printf 'DIRECT_URL=postgresql://midi:%s@database:5432/midi_cosmetics?schema=public\n' "$database_password"
  printf 'JWT_ACCESS_SECRET=%s\n' "$access_secret"
  printf 'JWT_REFRESH_SECRET=%s\n' "$refresh_secret"
} > "$target"

echo 'Created .env.docker.local with random local-only credentials.'
echo 'No sample admin account will be created or changed.'
