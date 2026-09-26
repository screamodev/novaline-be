# Quickstart: CMS Content Model

```bash
cd therecom
docker compose -f docker-compose.dev.yml up -d db cms        # Strapi develop + Postgres
docker compose -f docker-compose.dev.yml logs cms | grep -A1 "Created API token"   # first boot only
docker compose -f docker-compose.dev.yml exec cms npm run seed   # prototype content (uk + en)
docker compose -f docker-compose.dev.yml exec cms npm run seed   # re-run: "created 0"
cd novaline-be && STRAPI_TOKEN=<token> npm run verify:contract -- --write
```

Create the first admin at http://localhost:1337/admin. Put the printed token into `novaline-fe/.env` as `NUXT_STRAPI_TOKEN`.

## Content audit (SC-001)

Walk the prototype top to bottom and tick each item as editable in admin:
- [x] Top bar phones, cabinet link, radio link
- [x] Header tagline ("НАДІЙНЕ ПІДКЛЮЧЕННЯ ДО INTERNET")
- [x] Hero: kicker, 2 title lines, subtitle, promo, 2 CTAs, image+alt, speed chip
- [x] Trust strip ×4
- [x] Coverage copy, technology, speed, hint, map title/badge/legend/hint
- [x] Geography (4 regions, 12 districts, 46 settlements, neighbourhoods for Харків/Дніпро/Полтава)
- [x] Services ×6
- [x] Plans ×9 (3 segments), connection note, add-ons ×5
- [x] TV chips ×3, packages ×3, categories ×7, channels ×40, note
- [x] Promos ×4
- [x] Data centre facts ×4, services ×7
- [x] Shop note, items ×6, order note
- [x] Payment note, methods ×5 (steps), details ×4
- [x] News ×6
- [x] About text, stats ×4
- [x] Lead section heading
- [x] Footer tagline, email, socials, copyright
- [x] Assistant greeting, quick questions, fallback replies
- [x] Radio page copy and streams
