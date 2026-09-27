# Deploying NovaLine (VPS + existing Caddy)

The stack runs in Docker next to the Caddy container that already serves other sites on the VPS.
It has three services: PostgreSQL (`db`), Strapi (`cms`) and Nuxt (`web`).
Only Caddy talks to `cms` and `web`, over its Docker network. No host ports are published.

| Domain | Container |
|---|---|
| `dev.novaline.net` (staging, `noindex`) → later `novaline.net` | `novaline-web:3000` |
| `cms.dev.novaline.net` → later `cms.novaline.net` | `novaline-cms:1337` (Strapi admin) |

Plan for about 2 GB RAM: web 512 MB + cms 1 GB + db 512 MB.

---

## 1. DNS

Create A/AAAA records pointing at the VPS for:
- `dev.novaline.net`;
- `cms.dev.novaline.net`.

## 2. Find Caddy's Docker network

```bash
docker ps --format '{{.Names}}' | grep -i caddy
docker inspect <caddy-container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

## 3. Clone both repositories side by side

```bash
sudo mkdir -p /opt/novaline && sudo chown "$USER" /opt/novaline && cd /opt/novaline
git clone git@github.com:screamodev/novaline-be.git
git clone git@github.com:screamodev/novaline-fe.git
```

Both repositories must sit side by side: the compose file builds the web image from `../../novaline-fe`.

## 4. Environment files

Use `openssl rand -base64 32` for every secret below. Never reuse the dev values.

**`novaline-be/deploy/.env`** — copy it from `deploy/.env.example`:
- `DOMAIN`, `CMS_DOMAIN`;
- `SITE_ENV=staging`;
- `CADDY_NETWORK` (from step 2);
- `DATABASE_PASSWORD`.

**`novaline-be/.env`** — copy it from `novaline-be/.env.example` and set:
- `APP_KEYS` (two values, comma-separated);
- `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`;
- `FRONTEND_REVALIDATE_SECRET`: the same value as `NUXT_REVALIDATE_SECRET` below;
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: optional, for lead notifications; how to get them is in [TELEGRAM.md](TELEGRAM.md).

Leave these to the compose file: the database host and credentials, `PUBLIC_URL`, `FRONTEND_URL`.

**`novaline-fe/.env`** — copy it from `novaline-fe/.env.example` and set:
- `NUXT_REVALIDATE_SECRET`: the same value as `FRONTEND_REVALIDATE_SECRET`;
- `NUXT_OPENAI_API_KEY`, `NUXT_OPENAI_MODEL=gpt-4o-mini`;
- `NUXT_STRAPI_TOKEN`: filled in during step 5.

The compose file sets the site URLs and `NUXT_SITE_ENV` from `deploy/.env`.

## 5. First start

```bash
cd /opt/novaline/novaline-be/deploy
alias dc='docker compose -f docker-compose.prod.yml --env-file .env'

dc build
dc up -d db cms
dc logs cms | grep -A1 'Created API token'   # one-time token for the frontend
```

1. Copy the token from the log into `novaline-fe/.env` as `NUXT_STRAPI_TOKEN`.
2. Fill the CMS with content:

```bash
dc exec cms npm run seed     # idempotent: loads the content (uk + en) and media
dc up -d                     # starts web once cms is healthy
dc ps                        # all three should be "healthy"
```

## 6. Caddy

1. Append the blocks from `Caddyfile.snippet` to the Caddyfile.
2. Reload Caddy:

```bash
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

3. Open `https://cms.dev.novaline.net/admin` and create the first administrator account.

## 7. Checks

```bash
curl -sI https://dev.novaline.net | head -5              # 200, X-Robots-Tag: noindex
curl -s  https://dev.novaline.net/robots.txt             # Disallow: / on staging
curl -sI https://dev.novaline.net/home/tv                # 301 → /#tv (legacy URLs)
curl -s  https://dev.novaline.net/api/cms/global | head -c 200
```

In the browser, check four things:
1. **Assistant widget:** it answers questions.
2. **Lead form:** a submitted request appears in Strapi → Lead, plus a Telegram message if configured.
3. **Webhook:** change a price in Strapi and publish; the site updates within seconds.
4. **Radio:** `/radio` plays.

## 8. Backups

The backup covers the Postgres dump and the uploads archive, kept for 14 days in `BACKUP_DIR`.

```bash
./backup.sh
crontab -e   # add:
30 3 * * * cd /opt/novaline/novaline-be/deploy && ./backup.sh >> backups.log 2>&1
```

**Restore** (this overwrites the database and uploads):

```bash
./restore.sh backups/db-<stamp>.dump backups/uploads-<stamp>.tar.gz
```

Copy backups off the server regularly, for example with rsync or rclone to object storage.
Do a test restore once before launch.

## 9. Updating

```bash
cd /opt/novaline/novaline-be && git pull
cd ../novaline-fe && git pull
cd ../novaline-be/deploy && ./backup.sh && dc up -d --build
```

When you upgrade Strapi, run `./backup.sh` first. Then run `npm run upgrade` locally, commit, pull on the server and rebuild.

## 10. Launch: switch from dev.novaline.net to novaline.net

1. Point the DNS records `novaline.net`, `www.novaline.net` and `cms.novaline.net` at the VPS.
2. Edit `deploy/.env`:
   - `DOMAIN=novaline.net`;
   - `CMS_DOMAIN=cms.novaline.net`;
   - `SITE_ENV=production`.
3. Apply the change: `dc up -d`. This recreates web and cms with the new URLs.
4. Caddy:
   - replace the staging blocks with the production blocks from `Caddyfile.snippet` (includes the `www` → apex redirect);
   - remove the old WordPress site block;
   - reload Caddy.
5. The old WordPress URLs (`/home/tv`, `/home/radio-2`, `/contract-offer`, `/private-cabinet`, `/ru/…`) are already 301-redirected by the site.
6. Submit `https://novaline.net/sitemap.xml` in Google Search Console.
