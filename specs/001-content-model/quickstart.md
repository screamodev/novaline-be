# Quickstart: CMS Content Model

```bash
cd therecom
docker compose up -d db
cd novaline-be && cp .env.example .env   # fill secrets
npm run develop                           # create the first admin at http://localhost:1337/admin
npm run seed                              # loads prototype content (uk + en), prints the frontend token once
npm run seed                              # re-run: "0 created"
npx tsx scripts/verify-contract.ts        # checks R1–R20 + W1 against the contract
```

Put the printed token into `novaline-fe/.env` as `NUXT_STRAPI_TOKEN`.

## Content audit (SC-001)

Walk the prototype top to bottom and tick each item as editable in admin:
- [ ] Top bar phones, cabinet link, radio link
- [ ] Header tagline ("НАДІЙНЕ ПІДКЛЮЧЕННЯ ДО INTERNET")
- [ ] Hero: kicker, 2 title lines, subtitle, promo, 2 CTAs, image+alt, speed chip
- [ ] Trust strip ×4
- [ ] Coverage copy, technology, speed, hint, map title/badge/legend/hint
- [ ] Geography (4 regions, 12 districts, 46 settlements, neighbourhoods for Харків/Дніпро/Полтава)
- [ ] Services ×6
- [ ] Plans ×9 (3 segments), connection note, add-ons ×5
- [ ] TV chips ×3, packages ×3, categories ×7, channels ×40, note
- [ ] Promos ×4
- [ ] Data centre facts ×4, services ×7
- [ ] Shop note, items ×6, order note
- [ ] Payment note, methods ×5 (steps), details ×4
- [ ] News ×6
- [ ] About text, stats ×4
- [ ] Lead section heading
- [ ] Footer tagline, email, socials, copyright
- [ ] Assistant greeting, quick questions, fallback replies
- [ ] Radio page copy and streams
