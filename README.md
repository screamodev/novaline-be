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

## Specs

Spec-driven development with [GitHub Spec Kit](https://github.com/github/spec-kit): constitution in `.specify/memory/constitution.md`, features in `specs/NNN-*/`.
