# novaline-be

Strapi 5 CMS for the NovaLine ISP website (content, coverage geography, leads). PostgreSQL 16.

## Run

```bash
cp .env.example .env          # generate secrets: openssl rand -base64 32
docker compose up --build     # Strapi + Postgres → http://localhost:1337/admin
# or locally against the compose Postgres:
docker compose up -d db && npm run develop
```

Full stack (with the Nuxt frontend): `docker compose up --build` in the parent `therecom/` folder.

## Seed & contract

```bash
docker compose -f docker-compose.dev.yml exec cms npm run seed     # idempotent, uk + en prototype content
STRAPI_TOKEN=<frontend-server token> npm run verify:contract       # checks the REST contract
npm run types                                                      # regenerate types/generated
```

On first boot Strapi creates the `frontend-server` API token (read content + create leads) and logs it once —
copy it into `novaline-fe/.env` as `NUXT_STRAPI_TOKEN`. Bootstrap also sets locales (uk default, en), public read
permissions (leads stay private) and the revalidate webhook to `FRONTEND_URL`.

## Production

Deployment to the VPS behind the existing Caddy (compose, Caddyfile snippet, backups, launch switch): see [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## Specs

Spec-driven development with [GitHub Spec Kit](https://github.com/github/spec-kit): constitution in `.specify/memory/constitution.md`, features in `specs/NNN-*/`.
