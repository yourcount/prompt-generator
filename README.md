# Prompt Foundry

Publieke Next.js webapp voor een provider-agnostische prompt generator. De site maakt de generator bruikbaar zonder terminal: met uitleg, een wizard, advanced JSON-invoer, directe artifactweergave en downloadbare output voor OpenAI, Claude en Gemini.

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
npm run prompt:generate -- --input examples/generic-starter.json
npm run prompt:generate -- --input examples/generic-starter.json --providers openai,claude
```

## Opslag

### Development

Runs worden opgeslagen onder `data/runs/`.

### Production / Vercel

Set minimaal:

```bash
BLOB_READ_WRITE_TOKEN=...
```

De Blob-adapter gebruikt publieke objecten en overschrijft alleen de current alias-bestanden gecontroleerd. Snapshot-runs krijgen unieke paden en vermijden write-collisions.

## Kernroutes

- `/` uitleg en CTA
- `/hoe-het-werkt` workflow-uitleg
- `/generator` wizard + advanced panel
- `/voorbeelden` reference cases
- `/artifacts` recente runs
- `/runs/[id]` artifactviewer per run

## Providerprofielen

Zie [`docs/PROVIDER_PROFILES.md`](./docs/PROVIDER_PROFILES.md) voor:
- verschillen per provider
- bronverwijzingen
- updatebeleid voor profielversies

## Notities

- Bohèm is alleen referentiemateriaal.
- De generator zelf blijft generiek.
- Blocking validation issues worden niet opgeslagen als succesvolle run.
- Oude runs zonder providerprompts blijven leesbaar via de base prompt fallback.
