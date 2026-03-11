import type { ProviderId, ProviderProfile } from "@/lib/prompt-generator/types";

const VERIFIED_DATE = "2026-03-11";

const providerProfiles: Record<ProviderId, ProviderProfile> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    profileVersion: "2026.03-openai-v1",
    recommendedModelFamily: "GPT-5 / nieuwste reasoning + responses modellen",
    lastVerifiedAt: VERIFIED_DATE,
    bestPracticeSummary: [
      "Werk met een strak gestructureerde prompt en expliciete outputcontracten.",
      "Laat het model eerst context ordenen en pas daarna plannen of uitvoeren.",
      "Vraag om evidence-based claims en expliciete aannames bij ontbrekende informatie."
    ],
    promptConstructionRules: [
      "Gebruik duidelijke secties met rol, doel, constraints, workflow en outputformat.",
      "Zet stopregels en verificatiestappen expliciet boven de taakuitvoering.",
      "Maak randvoorwaarden en kwaliteitsgates hard en meetbaar."
    ],
    outputHints: [
      "Geschikt voor directe inzet in ChatGPT, API system/developer prompts of agent-workflows.",
      "Behoud markdownkoppen zodat het model de structuur makkelijk volgt."
    ],
    sourceReferences: [
      { label: "OpenAI prompt engineering guide", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
      { label: "OpenAI responses prompting guide", url: "https://platform.openai.com/docs/guides/text" }
    ]
  },
  claude: {
    id: "claude",
    label: "Claude",
    profileVersion: "2026.03-claude-v1",
    recommendedModelFamily: "Claude 4.x familie",
    lastVerifiedAt: VERIFIED_DATE,
    bestPracticeSummary: [
      "Claude werkt goed met heldere rolafbakening, rijke context en expliciete kwaliteitscriteria.",
      "Beschrijf gewenste denkstappen en nuance, maar houd de taakgrenzen hard.",
      "Maak veilige aannames expliciet zichtbaar in plaats van impliciet."
    ],
    promptConstructionRules: [
      "Gebruik compacte maar duidelijke contextblokken en benoem wat buiten scope valt.",
      "Vraag om gestructureerde output met controlepunten per fase.",
      "Leg uit hoe ambiguities moeten worden behandeld voordat uitvoering start."
    ],
    outputHints: [
      "Geschikt voor Claude web, console en API-berichten.",
      "Gebruik expliciete beoordelingscriteria zodat nuance niet tot scope drift leidt."
    ],
    sourceReferences: [
      { label: "Anthropic prompt engineering overview", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview" },
      { label: "Anthropic Claude 4 best practices", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices" }
    ]
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    profileVersion: "2026.03-gemini-v1",
    recommendedModelFamily: "Gemini 2.5 / nieuwste Gemini redeneerfamilie",
    lastVerifiedAt: VERIFIED_DATE,
    bestPracticeSummary: [
      "Gemini profiteert van duidelijke taakdoelen, contextblokken en expliciete evaluatiecriteria.",
      "Breek complexe taken op in controleerbare stappen en vraag om samenvatting van aannames.",
      "Gebruik consistente formatting en outputschema's om drift te beperken."
    ],
    promptConstructionRules: [
      "Zet doel, context, constraints en outputformat vroeg en compact neer.",
      "Gebruik iterative decomposition: eerst inventarisatie, dan plan, dan uitvoering.",
      "Vraag om een korte validatiecheck voordat finale output wordt geleverd."
    ],
    outputHints: [
      "Geschikt voor Gemini app, API en Vertex/Gemini workflows.",
      "Strakke markdownsecties en expliciete criteria verbeteren voorspelbaarheid."
    ],
    sourceReferences: [
      { label: "Gemini prompt design guide", url: "https://ai.google.dev/gemini-api/docs/prompting-intro" },
      { label: "Google AI prompting strategies", url: "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/introduction-prompt-design" }
    ]
  }
};

export function getProviderProfiles(): ProviderProfile[] {
  return [providerProfiles.openai, providerProfiles.claude, providerProfiles.gemini];
}

export function getProviderProfile(providerId: ProviderId): ProviderProfile {
  return providerProfiles[providerId];
}
