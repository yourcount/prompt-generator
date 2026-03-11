# Provider Profiles

## Doel

De generator gebruikt versioned providerprofielen om een gedeelde base prompt te vertalen naar direct inzetbare prompts voor meerdere AI-platforms. Profielen worden handmatig beheerd in code en zijn bewust niet afhankelijk van runtime fetches.

## Actieve providers

### OpenAI
- Focus: sterke structuur, outputcontracten, evidence-based claims, vaste taakvolgorde.
- Bronnen:
  - https://platform.openai.com/docs/guides/prompt-engineering
  - https://platform.openai.com/docs/guides/text

### Claude
- Focus: rijke context, expliciete constraints, nuance zonder scope drift, zichtbare aannames.
- Bronnen:
  - https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
  - https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices

### Gemini
- Focus: taakdoel, contextblokken, iterative decomposition, duidelijke evaluatiecriteria.
- Bronnen:
  - https://ai.google.dev/gemini-api/docs/prompting-intro
  - https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/introduction-prompt-design

## Updatebeleid

Verhoog een profielversie wanneer ten minste een van deze situaties optreedt:
- officiële documentatie verandert aantoonbaar in werkwijze of best practices
- herhaalde regressies laten zien dat de huidige profielregels onvoldoende zijn
- de outputstructuur voor een provider bewust verandert

## Werkwijze voor updates

1. Controleer officiële docs.
2. Werk het providerprofiel in code bij.
3. Verhoog `profileVersion`.
4. Draai voorbeeldruns opnieuw.
5. Controleer parity tussen CLI en web.
