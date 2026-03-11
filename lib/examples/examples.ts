import { defaultRunInput } from "@/lib/prompt-generator/defaults";
import type { PromptRunInput } from "@/lib/prompt-generator/types";

export type ExampleCase = {
  slug: string;
  title: string;
  summary: string;
  whyItMatters: string;
  input: PromptRunInput;
};

const bohemInput: PromptRunInput = {
  ...defaultRunInput,
  project_context: {
    brand: "Bohèm",
    audiences: [
      "Theaterprogrammeurs die snel vertrouwen en boekbaarheid willen beoordelen",
      "Culturele eventorganisatoren die een match met setting en publiek zoeken",
      "Muziekliefhebbers die emotionele connectie en luisterintentie zoeken",
      "Niet-technische editors die content zelfstandig willen beheren"
    ],
    website_goal:
      "Bouw een warme, theatraal-professionele website die boekingen verhoogt, vertrouwen opbouwt en beheersbaar blijft voor niet-technische gebruikers.",
    features: [
      "One-page artist website met sterke hero en boekingsflow",
      "Admin editor voor content en media",
      "Super-admin backend voor SEO, users, cache en system controls",
      "Vercel-ready hosting, caching en live content updates"
    ],
    constraints: [
      "Mobile-first en visueel premium",
      "WCAG-basis, semantische HTML en duidelijke focus states",
      "Geen stille regressies in caching, SEO of security",
      "Niet-technische editors mogen geen technische backend zien"
    ],
    tone_of_voice: "Warm, theatraal, doorleefd, professioneel en menselijk"
  },
  repo_artifacts: {
    paths: ["app/", "components/", "lib/", "docs/release-matrix.md", "docs/prompt-framework/"],
    categories: ["frontend", "admin", "super-admin", "seo", "security", "caching", "deployment"]
  },
  run_metadata: {
    ...defaultRunInput.run_metadata,
    source_project: "Bohèm"
  },
  success_criteria: [
    "Boekingsgerichte en fangerichte flows moeten zonder scopeverwarring gestart kunnen worden.",
    "Admin- en frontendbeslissingen moeten expliciet in het framework terugkomen.",
    "Lessons learned uit Vercel, caching en beheerervaring moeten toekomstige runs aantoonbaar verbeteren."
  ],
  scope_notes: [
    "Bohèm blijft een leer- en referentiecase, niet de default voor nieuwe runs.",
    "Deze input mag gebruikt worden om regressies in branding, content parity en beheerflows te illustreren."
  ]
};

export const exampleCases: ExampleCase[] = [
  {
    slug: "generic-starter",
    title: "Generieke starter",
    summary: "Neutraal voorbeeld voor nieuwe projecten, zonder merk-specifieke ballast.",
    whyItMatters: "Laat zien hoe een goede runinput eruitziet voor een nieuw project.",
    input: defaultRunInput
  },
  {
    slug: "prompt-foundry-webapp",
    title: "Prompt Foundry webapp",
    summary: "De projectspecifieke run waarmee deze webinterface zelf is gespecificeerd.",
    whyItMatters: "Laat zien hoe je de generator gebruikt om een volgende generator-interface of website te definiëren.",
    input: {
      ...defaultRunInput,
      conversation_source: {
        type: "phase-summary",
        source: "Implementatiebrief voor Prompt Foundry",
        summary: "Nieuwe publieke webapp die de v3 prompt-generator als wizard, advanced panel en artifactviewer beschikbaar maakt, inclusief uitleg, voorbeelden en Vercel-ready opslag."
      },
      project_context: {
        brand: "Prompt Foundry",
        audiences: [
          "Niet-technische makers die een generator zonder terminal willen gebruiken",
          "Technische builders die parity tussen CLI en web willen behouden",
          "Projectleads die alle output van een generator-run direct willen kunnen delen"
        ],
        website_goal: "Bouw een publieke, gebruiksvriendelijke webinterface voor de v3 prompt-generator, inclusief uitleg, echte runs en toegankelijke artifacts.",
        features: [
          "Wizard-first generatorinterface met advanced JSON-panel",
          "Artifactviewer met tabs, kopieeracties en downloads",
          "Runopslag met current output en snapshots",
          "Uitlegpagina's en reference cases"
        ],
        constraints: [
          "Generator moet generiek blijven",
          "Web en CLI moeten dezelfde core logica delen",
          "Productie-opslag moet Vercel-ready zijn",
          "Geen login in v1"
        ],
        tone_of_voice: "Helder, warm, deskundig en taakgericht"
      },
      repo_artifacts: {
        paths: ["app/", "components/", "lib/", "scripts/"],
        categories: ["generator-core", "web-ui", "storage", "api", "documentation"]
      },
      run_metadata: {
        ...defaultRunInput.run_metadata,
        source_project: "Prompt Foundry"
      },
      success_criteria: [
        "Een gemengd publiek moet zonder terminal een valide generator-run kunnen starten.",
        "Artifacts moeten direct leesbaar, kopieerbaar en downloadbaar zijn.",
        "Parity tussen web en CLI moet intact blijven."
      ],
      scope_notes: [
        "Bohèm blijft een reference case.",
        "Outputviewer moet ook zonder voorkennis begrijpelijk zijn."
      ]
    }
  },
  {
    slug: "bohem-reference",
    title: "Bohèm referentiecase",
    summary: "Concrete leer-case uit een iteratief websiteproject met frontend, CMS en deploymentlessons.",
    whyItMatters: "Laat zien hoe echte lessons learned worden meegenomen zonder het framework merkgebonden te maken.",
    input: bohemInput
  }
];

export function getExampleBySlug(slug: string) {
  return exampleCases.find((example) => example.slug === slug) ?? null;
}
