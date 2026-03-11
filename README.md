# Prompt Foundry

Publieke Next.js webapp voor de v3 superprompt generator. De site maakt de generator bruikbaar zonder terminal: met uitleg, een wizard, advanced JSON-invoer, directe artifactweergave en downloadbare output.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shared generator core voor web + CLI
- Storage adapters:
  - lokaal filesystem in development
  - Vercel Blob in production

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run prompt:generate -- --input examples/prompt-foundry-webapp.json
```

## Opslag

### Development

Runs worden opgeslagen onder `data/runs/`.

### Production / Vercel

Set minimaal:

```bash
BLOB_READ_WRITE_TOKEN=...
```

De huidige Blob-adapter schrijft met `access: "public"`. Gebruik dus een Blob-setup die publieke objecten toelaat, of pas de adapter aan als je private blobs met server-side reads wilt gebruiken.

## Kernroutes

- `/` uitleg en CTA
- `/hoe-het-werkt` workflow-uitleg
- `/generator` wizard + advanced panel
- `/voorbeelden` reference cases
- `/artifacts` recente runs
- `/runs/[id]` artifactviewer per run

## Notities

- Bohèm is alleen referentiemateriaal.
- De generator zelf blijft generiek.
- Blocking validation issues worden niet opgeslagen als succesvolle run.
