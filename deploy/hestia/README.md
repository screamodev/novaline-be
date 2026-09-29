# NovaLine on the shared HestiaCP server

**Server:** `hosting.therecom.net` (SSH port 10163).
**Site:** `new.novaline.net`, a web domain of the Hestia user `novaline`.

The stack runs in Docker. Hestia's nginx stays in front and terminates TLS with its Let's Encrypt certificate.

| Path | Target |
|---|---|
| `https://new.novaline.net/` | Nuxt, `127.0.0.1:3100` |
| `https://new.novaline.net/cms/` | Strapi, `127.0.0.1:3101` (prefix stripped; admin at `/cms/admin`) |
| PostgreSQL | inside the compose network only |

Images come from GHCR. GitHub Actions (`.github/workflows/docker.yml` in both repos) publishes them on every push to `main`:
- `ghcr.io/screamodev/novaline-be`
- `ghcr.io/screamodev/novaline-fe`

The Strapi image is built with `PUBLIC_URL=https://new.novaline.net/cms` (repository variable `PUBLIC_URL` overrides it). Nothing is built on the server.

## What was changed on the server

- **Swap:** `/swapfile`, 2 GB, `vm.swappiness=10` (`/etc/sysctl.d/99-novaline-swappiness.conf`), entry in `/etc/fstab`.
- **Docker:** Docker CE from `download.docker.com`, `/etc/docker/daemon.json` with log rotation and `live-restore`. The `nftables` service stays disabled.
- **Stack:** `/opt/novaline` holds `docker-compose.yml` with `.env`, `cms.env`, `web.env` (secrets, mode 600) and `backups/`.
- **Nginx templates:** `/usr/local/hestia/data/templates/web/nginx/novaline-docker.{tpl,stpl}` (copies of the files in this folder).
- **Domain:** proxy template of `new.novaline.net` set to `novaline-docker`.

Other sites, the global Node 18 / pm2 and MariaDB are untouched.

## Operations

All commands run from `/opt/novaline` on the server.

**Status and logs:**

```bash
sudo docker compose ps
sudo docker compose logs -f --tail 100 web
```

**Update to the latest images** (after CI has finished):

```bash
sudo docker compose pull && sudo docker compose up -d
```

**Roll back to a commit** — pin `CMS_IMAGE` / `WEB_IMAGE` in `.env` to `…:<sha>`, then run `up -d`.

**Backups** (`backup.sh` / `restore.sh` from `../`, with `COMPOSE_FILE=docker-compose.yml`):

```bash
COMPOSE_FILE=docker-compose.yml ./backup.sh
```

**Detach the domain from the stack** (serves `public_html` again):

```bash
sudo /usr/local/hestia/bin/v-change-web-domain-proxy-tpl novaline new.novaline.net default
```

**Remove the stack completely** (deletes the data volumes):

```bash
sudo docker compose down -v
```
