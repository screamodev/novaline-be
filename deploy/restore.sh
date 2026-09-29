#!/usr/bin/env sh
# Restores a backup made by backup.sh. Overwrites the current database and uploads!
#   ./restore.sh backups/db-20260927-033000.dump backups/uploads-20260927-033000.tar.gz
set -eu
cd "$(dirname "$0")"
set -a; . "${ENV_FILE:-./.env}"; set +a

DB_DUMP="${1:?usage: restore.sh <db-*.dump> <uploads-*.tar.gz>}"
UPLOADS="${2:?usage: restore.sh <db-*.dump> <uploads-*.tar.gz>}"
COMPOSE="docker compose -f ${COMPOSE_FILE:-docker-compose.prod.yml} --env-file ${ENV_FILE:-.env}"

echo "This replaces the database '$DATABASE_NAME' and all uploads. Type 'restore' to continue:"
read -r answer
[ "$answer" = "restore" ] || { echo "aborted"; exit 1; }

$COMPOSE stop web cms
$COMPOSE up -d db
until $COMPOSE exec -T db pg_isready -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" >/dev/null 2>&1; do sleep 2; done

$COMPOSE exec -T db pg_restore -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" --clean --if-exists --no-owner < "$DB_DUMP"
$COMPOSE run --rm --no-deps -T --entrypoint sh cms -c 'rm -rf /opt/app/public/uploads/* && tar -xzf - -C /opt/app/public' < "$UPLOADS"

$COMPOSE up -d
echo "restore done"
