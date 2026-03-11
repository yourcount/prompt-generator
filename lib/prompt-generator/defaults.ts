import type { PromptRunInput } from "@/lib/prompt-generator/types";

export const defaultRunInput: PromptRunInput = {
  conversation_source: {
    type: "phase-summary",
    source: "Afgerond websiteproject in Codex",
    summary:
      "Samengevat traject met briefing, ontwerpkeuzes, iteratieve correcties, technische oplevering en lessons learned voor een website met frontend en beheeromgeving."
  },
  project_context: {
    brand: "Voorbeeldproject",
    audiences: [
      "Eindgebruikers die snel willen begrijpen wat de website aanbiedt",
      "Beslissers die vertrouwen en geschiktheid willen beoordelen",
      "Niet-technische contentbeheerders die content willen aanpassen zonder code"
    ],
    website_goal:
      "Bouw een duidelijke, geloofwaardige en beheersbare website die primaire conversie ondersteunt en toekomstig beheer vereenvoudigt.",
    features: [
      "Publieke website met duidelijke kernpropositie en CTA-flow",
      "Beheeromgeving voor content en media",
      "Basis kwaliteitsborging voor SEO, performance, security en a11y"
    ],
    constraints: [
      "Werk iteratief en voorkom scope drift",
      "Claims moeten herleidbaar zijn naar input of repo-artifacts",
      "Niet-technische beheerders mogen geen technische instellingen hoeven begrijpen"
    ],
    tone_of_voice: "Helder, professioneel, menselijk en taakgericht"
  },
  repo_artifacts: {
    paths: ["app/", "components/", "lib/", "docs/prompt-framework/"],
    categories: ["frontend", "admin", "seo", "security", "documentation"]
  },
  lessons_learned: [
    {
      label: "success",
      summary: "Kleine iteraties met expliciete acceptance criteria leverden minder correctierondes op."
    },
    {
      label: "regression",
      summary: "Late kwaliteitscontrole leidde tot duurdere correcties in caching, UX en content parity."
    },
    {
      label: "misunderstanding",
      summary: "Onduidelijke projectscope veroorzaakte verkeerde aannames over wat in v1 moest zitten."
    },
    {
      label: "process_change",
      summary: "Een vast inputcontract en vaste outputpaden maakten de run consistenter en beter overdraagbaar."
    }
  ],
  open_questions: [],
  run_metadata: {
    date: new Date().toISOString().slice(0, 10),
    operator: "Web App",
    source_project: "Voorbeeldproject",
    output_language: "nl",
    framework_version: "v3",
    template_version: "2026-03-v1"
  },
  success_criteria: [
    "Nieuwe projectstarts moeten binnen één prompt een stabiele structuur afdwingen.",
    "Output moet direct op de vaste framework-paden verschijnen zonder handmatige herschikking.",
    "Regressies in scope, logging en gates moeten vroeg zichtbaar zijn in het run-report."
  ],
  scope_notes: [
    "Generator blijft generiek en JSON-first.",
    "Deze run automatiseert structuur en logging, niet inhoudelijke projectanalyse."
  ]
};
