#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  migrate -path /app/migrations -database "$DATABASE_URL" up
fi

exec /expense-tracker
