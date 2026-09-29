#!/usr/bin/env sh
# Nightly backup: PostgreSQL dump + Strapi uploads archive, rotated after BACKUP_KEEP_DAYS.
#   ./backup.sh                      (from novaline-be/deploy)
#   cron: 30 3 * * * cd /opt/novaline/novaline-be/deploy && ./backup.sh >> backups.log 2>&1
set -eu
cd "$(dirname "$0")"
set -a; . "${ENV_FILE:-./.env}"; set +a

DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE="docker compose -f ${COMPOSE_FILE:-docker-compose.prod.yml} --env-file ${ENV_FILE:-.env}"
mkdir -p "$DIR"

$COMPOSE exec -T db pg_dump -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" --format=custom --no-owner > "$DIR/db-$STAMP.dump"
$COMPOSE exec -T cms tar -czf - -C /opt/app/public uploads > "$DIR/uploads-$STAMP.tar.gz"

# Refuse to keep (and rotate against) an empty dump.
[ -s "$DIR/db-$STAMP.dump" ] || { echo "backup failed: empty dump" >&2; exit 1; }

find "$DIR" -name 'db-*.dump' -mtime +"$KEEP" -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP" -delete
echo "[$STAMP] backup ok: $(du -h "$DIR/db-$STAMP.dump" | cut -f1) db, $(du -h "$DIR/uploads-$STAMP.tar.gz" | cut -f1) uploads"
