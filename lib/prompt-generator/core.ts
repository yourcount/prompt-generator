import crypto from "node:crypto";

import { getProviderProfile, getProviderProfiles } from "@/lib/prompt-generator/providers";
import type {
  DiffItem,
  DownloadArtifactKey,
  GeneratedArtifacts,
  PromptRunInput,
  PromptRunResult,
  ProviderId,
  ProviderProfile,
  ProviderPromptMap,
  SharedArtifactKey
} from "@/lib/prompt-generator/types";

const ROOT_KEYS = [
  "conversation_source",
  "project_context",
  "repo_artifacts",
  "reference_sources",
  "brand_system",
  "lessons_learned",
  "open_questions",
  "run_metadata"
] as const;

const LESSON_LABELS = ["success", "regression", "misunderstanding", "process_change"] as const;
const DEFAULT_PROVIDERS: ProviderId[] = ["openai", "claude", "gemini"];

const EVENT_CONFIDENCE: Record<string, number> = {
  context_extracted: 0.95,
  assumption_added: 0.72,
  decision_made: 0.91,
  risk_flagged: 0.89,
  gate_passed: 0.93,
  gate_failed: 0.84,
  prompt_revised: 0.94
};

export type ValidationSummary = {
  blockingIssues: string[];
  warnings: string[];
};

export type GeneratePromptRunOptions = {
  currentArtifacts?: Partial<GeneratedArtifacts> | null;
  runId: string;
  createdAt?: string;
  selectedProviders?: ProviderId[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeProvider(value: unknown): ProviderId | null {
  if (value === "openai" || value === "claude" || value === "gemini") return value;
  return null;
}

function dedupeProviders(values: ProviderId[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function renderBulletList(items: string[], emptyPlaceholder: string) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${emptyPlaceholder}`;
}

function renderLessonsByLabel(lessons: PromptRunInput["lessons_learned"]) {
  const grouped: Record<(typeof LESSON_LABELS)[number], string[]> = {
    success: [],
    regression: [],
    misunderstanding: [],
    process_change: []
  };

  for (const lesson of lessons) {
    grouped[lesson.label].push(lesson.summary);
  }

  return [
    "### Success",
    renderBulletList(grouped.success, "[Aanvullen: success lesson]"),
    "",
    "### Regression",
    renderBulletList(grouped.regression, "[Aanvullen: regression lesson]"),
    "",
    "### Misunderstanding",
    renderBulletList(grouped.misunderstanding, "[Aanvullen: misunderstanding lesson]"),
    "",
    "### Process Change",
    renderBulletList(grouped.process_change, "[Aanvullen: process change lesson]")
  ].join("\n");
}

function renderSuccessCriteria(items: string[], brand: string) {
  return items.length
    ? renderBulletList(items, `[Aanvullen: concrete succescriteria voor ${brand}]`)
    : `- [Aanvullen: concrete succescriteria voor ${brand}]`;
}

function renderScopeNotes(items: string[]) {
  return items.length ? `\n## Scope Notes\n\n${renderBulletList(items, "[Aanvullen: scope note]")}\n` : "";
}

function renderOptionalSection(title: string, items: string[], emptyText: string) {
  return `## ${title}\n\n${items.length ? renderBulletList(items, emptyText) : `- ${emptyText}`}\n`;
}

function renderAssumptions(input: PromptRunInput, selectedProviders: ProviderId[]) {
  const assumptions = [
    `Frameworkversie: ${input.run_metadata.framework_version}`,
    `Templateversie: ${input.run_metadata.template_version}`,
    `Outputtaal: ${input.run_metadata.output_language}`,
    `Actieve providerprofielen: ${selectedProviders.join(", ")}`,
    "Generator werkt als scaffold + merge en verzint geen projectspecifieke inhoud.",
    "Providerprofielen zijn versioned in code en handmatig geverifieerd tegen officiële documentatie."
  ];

  if (input.open_questions.length > 0) {
    assumptions.push("Open ambiguities blokkeren plan_complete totdat ze expliciet zijn opgelost.");
  }

  if (input.success_criteria.length === 0) {
    assumptions.push("Succescriteria ontbreken nog; de output houdt daarom een placeholder zichtbaar.");
  }

  return renderBulletList(assumptions, "[Aanvullen: aanname]");
}

function countPlaceholders(text: string) {
  const matches = text.match(/\[Aanvullen:/g);
  return matches ? matches.length : 0;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "run";
}

function timestampToken(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

export function createRunId(sourceProject: string, date = new Date()) {
  return `${timestampToken(date)}-${slugify(sourceProject)}-${crypto.randomUUID().slice(0, 8)}`;
}

export function inferSelectedProviders(artifacts: Partial<GeneratedArtifacts> | null | undefined): ProviderId[] {
  const providers: ProviderId[] = [];
  if (artifacts?.providerPrompts?.openai) providers.push("openai");
  if (artifacts?.providerPrompts?.claude) providers.push("claude");
  if (artifacts?.providerPrompts?.gemini) providers.push("gemini");
  return providers.length ? providers : [...DEFAULT_PROVIDERS];
}

export function normalizeGeneratedArtifacts(raw: unknown): GeneratedArtifacts {
  const value = isPlainObject(raw) ? raw : {};
  const providerPromptsValue = isPlainObject(value.providerPrompts) ? value.providerPrompts : {};
  const basePrompt = normalizeString(value.basePrompt) || normalizeString(value.superPrompt);

  const normalized: GeneratedArtifacts = {
    executionBundle: normalizeString(value.executionBundle),
    basePrompt,
    playbook: normalizeString(value.playbook),
    decisionRegister: normalizeString(value.decisionRegister),
    promptEvents: normalizeString(value.promptEvents),
    runReport: normalizeString(value.runReport),
    providerPrompts: {
      openai: normalizeString(providerPromptsValue.openai),
      claude: normalizeString(providerPromptsValue.claude),
      gemini: normalizeString(providerPromptsValue.gemini)
    },
    legacySuperPrompt: normalizeString(value.superPrompt) || basePrompt
  };

  if (!normalized.executionBundle && normalized.basePrompt) {
    const fallbackProviders = inferSelectedProviders(normalized);
    normalized.executionBundle = renderExecutionBundle(
      {
        conversation_source: { type: "", source: "", summary: "" },
        project_context: { brand: "", audiences: [], website_goal: "", features: [], constraints: [], tone_of_voice: "" },
        repo_artifacts: { paths: [], categories: [] },
        reference_sources: { existing_sites: [], content_priorities: [] },
        brand_system: { known_assets: [], style_guidelines: [], color_notes: [], typography_notes: [] },
        lessons_learned: [],
        open_questions: [],
        run_metadata: { date: "", operator: "", source_project: "", output_language: "nl", framework_version: "v4", template_version: "" },
        success_criteria: [],
        scope_notes: [],
        selectedProviders: fallbackProviders
      },
      {
        selectedProviders: fallbackProviders,
        qualityScore: "warn",
        validationResult: "valid_with_warnings",
        warnings: ["Legacy run: execution bundle is achteraf afgeleid uit bestaande artifacts."],
        blockingIssues: [],
        playbook: normalized.playbook,
        decisionRegister: normalized.decisionRegister,
        basePrompt: normalized.basePrompt,
        providerPrompts: normalized.providerPrompts
      }
    );
  }

  return normalized;
}

function renderExecutionBundle(
  input: PromptRunInput,
  params: {
    selectedProviders: ProviderId[];
    qualityScore: PromptRunResult["qualityScore"];
    validationResult: PromptRunResult["validationResult"];
    warnings: string[];
    blockingIssues: string[];
    playbook: string;
    decisionRegister: string;
    basePrompt: string;
    providerPrompts: ProviderPromptMap;
  }
) {
  const selectedPromptSections = params.selectedProviders
    .map((provider) => {
      const profile = getProviderProfile(provider);
      const prompt = params.providerPrompts[provider];
      if (!prompt) return "";
      return `## ${profile.label} Prompt\n\n${prompt}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `# Execution Bundle voor ${input.project_context.brand}

## Run status

- Quality score: ${params.qualityScore}
- Validation result: ${params.validationResult}
- Providers: ${params.selectedProviders.join(", ")}
- Blocking issues: ${params.blockingIssues.length}
- Warnings: ${params.warnings.length}

${params.blockingIssues.length > 0 ? `Stopregel: voer niets uit voordat deze blocking issues zijn opgelost.\n\n${renderBulletList(params.blockingIssues, "Geen blocking issues.")}` : "Stopregel: geen blocking issues; uitvoering mag starten binnen de vastgelegde grenzen."}

## Artifact priority order

1. Run Report
2. Decision Register
3. Playbook
4. Base Prompt
5. Geselecteerde providerprompt(s)
6. Prompt Events alleen bij twijfel, audit of regressieanalyse

## Operating rules

- Als blocking issues bestaan: niet uitvoeren, eerst expliciet oplossen of escaleren.
- Decision Register gaat voor als artifacts onderling lijken te conflicteren.
- Base Prompt is de inhoudelijke bron van waarheid.
- De providerprompt bepaalt hoe de instructies model-specifiek moeten worden uitgevoerd.
- Playbook bepaalt werkwijze, patroonhergebruik en anti-patronen.
- Prompt Events zijn auditinformatie en worden niet als primaire instructielaag gebruikt.

## Execution brief

- Project: ${input.project_context.brand}
- Doel: ${input.project_context.website_goal}
- Tone of voice: ${input.project_context.tone_of_voice}
- Doelgroepen:
${renderBulletList(input.project_context.audiences, "[Aanvullen: doelgroep]")}

- Feature focus:
${renderBulletList(input.project_context.features, "[Aanvullen: feature focus]")}

- Constraints:
${renderBulletList(input.project_context.constraints, "[Aanvullen: constraint]")}

## Embedded artifacts

## Run Report

[Gebruik dit eerst als kwaliteitsfilter.]

${params.warnings.length > 0 ? `### Warnings\n${renderBulletList(params.warnings, "Geen warnings.")}\n` : "### Warnings\n- Geen warnings.\n"}

${params.blockingIssues.length > 0 ? `### Blocking issues\n${renderBulletList(params.blockingIssues, "Geen blocking issues.")}\n` : "### Blocking issues\n- Geen blocking issues.\n"}

## Decision Register

${params.decisionRegister}

## Playbook

${params.playbook}

## Base Prompt

${params.basePrompt}

${selectedPromptSections}

## Prompt Events

Prompt Events zijn beschikbaar als aparte auditlog. Gebruik ze alleen als debug- of verificatielaag, niet als primaire instructiebron.
`;
}

export function normalizeRunInput(raw: unknown): PromptRunInput {
  const value = isPlainObject(raw) ? raw : {};
  const conversationSource = isPlainObject(value.conversation_source) ? value.conversation_source : {};
  const projectContext = isPlainObject(value.project_context) ? value.project_context : {};
  const repoArtifacts = isPlainObject(value.repo_artifacts) ? value.repo_artifacts : {};
  const referenceSources = isPlainObject(value.reference_sources) ? value.reference_sources : {};
  const brandSystem = isPlainObject(value.brand_system) ? value.brand_system : {};
  const runMetadata = isPlainObject(value.run_metadata) ? value.run_metadata : {};
  const lessonsLearned = Array.isArray(value.lessons_learned) ? value.lessons_learned : [];
  const selectedProviders = Array.isArray(value.selectedProviders) ? value.selectedProviders.map(normalizeProvider).filter(Boolean) as ProviderId[] : [];

  return {
    conversation_source: {
      type: normalizeString(conversationSource.type),
      source: normalizeString(conversationSource.source),
      summary: normalizeString(conversationSource.summary)
    },
    project_context: {
      brand: normalizeString(projectContext.brand),
      audiences: Array.isArray(projectContext.audiences) ? projectContext.audiences.map(normalizeString).filter(Boolean) : [],
      website_goal: normalizeString(projectContext.website_goal),
      features: Array.isArray(projectContext.features) ? projectContext.features.map(normalizeString).filter(Boolean) : [],
      constraints: Array.isArray(projectContext.constraints) ? projectContext.constraints.map(normalizeString).filter(Boolean) : [],
      tone_of_voice: normalizeString(projectContext.tone_of_voice)
    },
    repo_artifacts: {
      paths: Array.isArray(repoArtifacts.paths) ? repoArtifacts.paths.map(normalizeString).filter(Boolean) : [],
      categories: Array.isArray(repoArtifacts.categories) ? repoArtifacts.categories.map(normalizeString).filter(Boolean) : []
    },
    reference_sources: {
      existing_sites: Array.isArray(referenceSources.existing_sites) ? referenceSources.existing_sites.map(normalizeString).filter(Boolean) : [],
      content_priorities: Array.isArray(referenceSources.content_priorities) ? referenceSources.content_priorities.map(normalizeString).filter(Boolean) : []
    },
    brand_system: {
      known_assets: Array.isArray(brandSystem.known_assets) ? brandSystem.known_assets.map(normalizeString).filter(Boolean) : [],
      style_guidelines: Array.isArray(brandSystem.style_guidelines) ? brandSystem.style_guidelines.map(normalizeString).filter(Boolean) : [],
      color_notes: Array.isArray(brandSystem.color_notes) ? brandSystem.color_notes.map(normalizeString).filter(Boolean) : [],
      typography_notes: Array.isArray(brandSystem.typography_notes) ? brandSystem.typography_notes.map(normalizeString).filter(Boolean) : []
    },
    lessons_learned: lessonsLearned
      .filter(isPlainObject)
      .map((lesson) => ({
        label: normalizeString(lesson.label) as PromptRunInput["lessons_learned"][number]["label"],
        summary: normalizeString(lesson.summary)
      }))
      .filter((lesson) => lesson.label || lesson.summary),
    open_questions: Array.isArray(value.open_questions) ? value.open_questions.map(normalizeString).filter(Boolean) : [],
    run_metadata: {
      date: normalizeString(runMetadata.date),
      operator: normalizeString(runMetadata.operator),
      source_project: normalizeString(runMetadata.source_project),
      output_language: isNonEmptyString(runMetadata.output_language) ? normalizeString(runMetadata.output_language) : "nl",
      framework_version: normalizeString(runMetadata.framework_version),
      template_version: normalizeString(runMetadata.template_version)
    },
    success_criteria: Array.isArray(value.success_criteria) ? value.success_criteria.map(normalizeString).filter(Boolean) : [],
    scope_notes: Array.isArray(value.scope_notes) ? value.scope_notes.map(normalizeString).filter(Boolean) : [],
    selectedProviders: dedupeProviders(selectedProviders.length ? selectedProviders : [...DEFAULT_PROVIDERS])
  };
}

export function validateRunInput(input: PromptRunInput): ValidationSummary {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  for (const key of ROOT_KEYS) {
    if (!(key in input)) {
      blockingIssues.push(`${key} ontbreekt`);
    }
  }

  if (!input.conversation_source.type) blockingIssues.push("conversation_source.type ontbreekt");
  if (!input.conversation_source.source) blockingIssues.push("conversation_source.source ontbreekt");
  if (!input.conversation_source.summary) blockingIssues.push("conversation_source.summary ontbreekt");
  if (!input.project_context.brand) blockingIssues.push("project_context.brand ontbreekt");
  if (!input.project_context.website_goal) blockingIssues.push("project_context.website_goal ontbreekt");
  if (!input.project_context.tone_of_voice) blockingIssues.push("project_context.tone_of_voice ontbreekt");
  if (!input.run_metadata.date) blockingIssues.push("run_metadata.date ontbreekt");
  if (!input.run_metadata.operator) blockingIssues.push("run_metadata.operator ontbreekt");
  if (!input.run_metadata.source_project) blockingIssues.push("run_metadata.source_project ontbreekt");
  if (!input.run_metadata.framework_version) blockingIssues.push("run_metadata.framework_version ontbreekt");
  if (!input.run_metadata.template_version) blockingIssues.push("run_metadata.template_version ontbreekt");
  if (input.run_metadata.framework_version && input.run_metadata.framework_version !== "v4") {
    blockingIssues.push("run_metadata.framework_version moet v4 zijn");
  }

  if (input.lessons_learned.length < 3) {
    blockingIssues.push("lessons_learned moet minimaal 3 items bevatten");
  }

  if (input.project_context.audiences.length < 1) {
    blockingIssues.push("project_context.audiences moet minimaal 1 item bevatten");
  }

  if (input.project_context.features.length < 1) {
    blockingIssues.push("project_context.features moet minimaal 1 item bevatten");
  }

  if (input.repo_artifacts.paths.length < 1 && input.repo_artifacts.categories.length < 1) {
    blockingIssues.push("repo_artifacts moet minimaal 1 path of categorie bevatten");
  }

  if ((input.selectedProviders ?? []).length < 1) {
    blockingIssues.push("selectedProviders moet minimaal 1 provider bevatten");
  }

  if (input.success_criteria.length === 0) {
    warnings.push("success_criteria ontbreekt; output krijgt placeholders voor succescriteria.");
  }

  if (input.reference_sources.existing_sites.length === 0) {
    warnings.push("reference_sources.existing_sites ontbreekt; bestaande websites worden niet meegenomen als contentbron.");
  }

  if (input.brand_system.known_assets.length === 0 && input.brand_system.style_guidelines.length === 0) {
    warnings.push("brand_system bevat nog geen concrete huisstijlinput.");
  }

  input.lessons_learned.forEach((lesson, index) => {
    if (!lesson.label) {
      blockingIssues.push(`lessons_learned[${index}].label ontbreekt`);
    } else if (!LESSON_LABELS.includes(lesson.label)) {
      blockingIssues.push(`lessons_learned[${index}].label is ongeldig`);
    }
    if (!lesson.summary) {
      blockingIssues.push(`lessons_learned[${index}].summary ontbreekt`);
    }
  });

  return { blockingIssues, warnings };
}

function renderBasePrompt(input: PromptRunInput, selectedProviders: ProviderId[]) {
  const statusBlock = input.open_questions.length > 0
    ? `## Status\n\nDeze run is nog niet \`plan_complete\`.\n\nReden:\n${renderBulletList(input.open_questions, "[Aanvullen: open ambiguity]")}\n\nLos deze high-impact ambiguities eerst op voordat deze output als definitief wordt gebruikt.`
    : "## Plan complete\n\nDeze run heeft geen open high-impact ambiguities en mag als `plan_complete` worden behandeld.";

  return `# Base Prompt ${input.run_metadata.framework_version} voor ${input.project_context.brand}

## Doel

Je bent een provider-agnostisch AI delivery system voor ${input.project_context.brand}. Je doel is om een website- of producttraject iteratief, evidence-based en zonder hallucinaties uit te voeren.

Projectdoel:

- ${input.project_context.website_goal}

Succescriteria:

${renderSuccessCriteria(input.success_criteria, input.project_context.brand)}

Feature scope voor deze run:

${renderBulletList(input.project_context.features, "[Aanvullen: feature focus]")}

Actieve providerprofielen:

${renderBulletList(selectedProviders.map((provider) => getProviderProfile(provider).label), "[Aanvullen: provider]")}

## Stopregel

Voer nooit implementatie uit voordat deze volgorde expliciet is afgerond:

1. contextinventarisatie
2. planvorming
3. uitvoering

Als context of plan niet decision-complete is, stop en vraag of log een expliciete aanname.

## Persona's en gebruikersdoelen

${renderBulletList(input.project_context.audiences, "[Aanvullen: doelgroep]")}

## MVP-scope

- Werk altijd aan precies een feature, bugcluster of subsystem per iteratie
- Lever per iteratie concrete output: code, docs of validatie
- Gebruik gedeelde artifacts als bron van waarheid voor alle providerprompts

Huidige trajectscope:

${renderBulletList(input.project_context.features, "[Aanvullen: scoped feature]")}

## Out-of-scope

- Geen ongeplande feature creep
- Geen stille architectuurwijzigingen zonder rationale
- Geen gokwerk bij ontbrekende context

## Scope-context

Constraints:

${renderBulletList(input.project_context.constraints, "[Aanvullen: projectspecifieke scope guard]")}

Tone of voice:

- ${input.project_context.tone_of_voice}
${renderScopeNotes(input.scope_notes)}## Workers

### Worker 1: Conversation Analyst

- doelen
- constraints
- impliciete voorkeuren
- misverstanden en correcties
- lessons learned extractie
- confidence en open ambiguities

### Worker 2: Prompt Best-Practices Researcher

- toe te passen promptprincipes
- anti-hallucinatiepatronen
- verificatie- en bewijsregels
- outputstructuur-aanbevelingen
- rationale per patroon

### Worker 3: Website Delivery Architect

- fasering
- scope guards
- acceptance criteria
- interface-/artifactcontract
- failure modes

### Worker 4: QA & Risk Reviewer

- ontbrekende randgevallen
- kwaliteitsgates
- risico's per artifact
- stop/go oordeel
- regressiechecks

### Worker 5: Documentation & Logging Worker

- definitieve artifacts
- assumptions register
- JSONL events
- changelog
- revisienotities

## Outputformaten

Schrijf gedeelde artifacts en providerprompts zodanig dat ze direct herbruikbaar zijn in andere AI-workflows.

## Validatiegates

- Context Completeness Gate
- Prompt Safety Gate
- Delivery Readiness Gate
- Documentation Integrity Gate

## Open ambiguities

${input.open_questions.length > 0 ? renderBulletList(input.open_questions, "[Aanvullen: open ambiguity]") : "Geen open high-impact ambiguities."}

## Logging- en documentatieverplichtingen

- Log decisions, gates, risks en revisies in JSONL
- Bewaar structurele keuzes in het decision register
- Log elke aanname expliciet
- Voeg confidence toe aan observaties en conclusies

## Anti-hallucinatie-regels

- Niet gokken bij ontbrekende informatie
- Eerst transcript en repo inspecteren, daarna pas aannemen
- Elke niet-geverifieerde claim labelen als aanname
- Evidence-based claims moeten bron of repo-verwijzing hebben
- Geen implementatie zonder gesloten context- en plangates

## Repo-artifacts

Concrete paden:

${renderBulletList(input.repo_artifacts.paths, "[Aanvullen: concreet pad]")}

Artifact-categorieen:

${renderBulletList(input.repo_artifacts.categories, "[Aanvullen: artifactcategorie]")}

${renderOptionalSection("Bestaande sites om te onderzoeken", input.reference_sources.existing_sites, "[Aanvullen: bestaande site of URL]")}

${renderOptionalSection("Contentprioriteiten voor site-analyse", input.reference_sources.content_priorities, "[Aanvullen: welke content uit bestaande sites belangrijk is]")}

${renderOptionalSection("Bekende huisstijl-assets", input.brand_system.known_assets, "[Aanvullen: logo, beeldbank, brand board of ander asset]")}

${renderOptionalSection("Huisstijlrichtlijnen", input.brand_system.style_guidelines, "[Aanvullen: stijlregel of merkguardrail]")}

${renderOptionalSection("Kleurnotities", input.brand_system.color_notes, "[Aanvullen: kleur of paletnotitie]")}

${renderOptionalSection("Typografienotities", input.brand_system.typography_notes, "[Aanvullen: typografie of fontnotitie]")}

## Aannames

${renderAssumptions(input, selectedProviders)}

${statusBlock}
`;
}

function renderProviderPrompt(input: PromptRunInput, basePrompt: string, profile: ProviderProfile) {
  return `# ${profile.label} Prompt voor ${input.project_context.brand}

Gebruik dit als direct inzetbare prompt voor ${profile.label}. Laat de AI deze structuur volgen en behoud de markdownkoppen.

## Providerprofiel

- Profielversie: ${profile.profileVersion}
- Aanbevolen modelfamilie: ${profile.recommendedModelFamily}
- Laatst geverifieerd: ${profile.lastVerifiedAt}

### Best-practice samenvatting
${renderBulletList(profile.bestPracticeSummary, "[Aanvullen: best practice]")}

### Constructieregels
${renderBulletList(profile.promptConstructionRules, "[Aanvullen: rule]")}

### Output hints
${renderBulletList(profile.outputHints, "[Aanvullen: output hint]")}

### Officiële bronnen
${profile.sourceReferences.map((reference) => `- [${reference.label}](${reference.url})`).join("\n")}

## Direct inzetbare prompt

Je werkt met ${profile.label}. Volg onderstaande instructies strikt.

1. Lees eerst de volledige context.
2. Sluit context- en plangates voordat je uitvoert.
3. Maak aannames expliciet zichtbaar.
4. Lever output exact volgens de gevraagde structuur.
5. Gebruik alleen evidence-based claims of gelabelde aannames.

### Extra providerinstructies
${renderBulletList(profile.promptConstructionRules, "[Aanvullen: provider instructie]")}

### Basisspecificatie

${basePrompt}
`;
}

function renderPlaybook(input: PromptRunInput, selectedProviders: ProviderId[]) {
  const providerLines = selectedProviders.map((provider) => {
    const profile = getProviderProfile(provider);
    return `| ${profile.label} | ${profile.profileVersion} | ${profile.recommendedModelFamily} | ${profile.lastVerifiedAt} |`;
  }).join("\n");

  return `# Prompt Playbook ${input.run_metadata.framework_version}

## Doel van deze versie

Deze versie scaffoldt een herhaalbare prompt-run voor ${input.project_context.brand} op basis van een JSON-runbestand. De generator automatiseert structuur, logging en vaste secties, maar laat projectspecifieke verfijning expliciet zichtbaar.

Projectdoel:

- ${input.project_context.website_goal}

## Waarom deze keuzes zijn gemaakt

| Onderdeel | Keuze | Waarom |
| --- | --- | --- |
| Inputformaat | JSON met formeel contract | Eenvoudig te valideren en scriptbaar |
| Automatisering | Scaffold + merge | Houdt output bruikbaar zonder inhoud te verzinnen |
| Outputlocaties | Vast en toegankelijk | Maakt tooling, review en downloads consistent |
| Providerlaag | Base prompt + providerprofielen | Houdt één bron van waarheid en directe AI-inzet per provider |
| Referentieonderzoek | Bestaande sites en huisstijl als expliciete input | Voorkomt dat bestaande merk- en contentbronnen buiten beeld vallen |
| Snapshot-history | Per-run snapshot naast current output | Verbetert traceability en rollback |

## Providerprofielen

| Provider | Profielversie | Aanbevolen familie | Laatst geverifieerd |
| --- | --- | --- | --- |
${providerLines}

## Lessons learned

${renderLessonsByLabel(input.lessons_learned)}

## Wat meenemen naar volgende run

${renderBulletList(input.lessons_learned.map((lesson) => lesson.summary), "[Aanvullen: takeaway]")}

## Extra contextbronnen

${renderOptionalSection("Bestaande sites", input.reference_sources.existing_sites, "[Aanvullen: bestaande site of URL]")}

${renderOptionalSection("Huisstijlrichtlijnen", input.brand_system.style_guidelines, "[Aanvullen: huisstijlrichtlijn]")}

## Herbruikbare promptpatronen

- Eerst context, dan plan, dan uitvoering
- 1 feature of besliscluster per iteratie
- Gates zijn hard blockers
- Geen stille aannames
- Provider-specifieke promptvorm komt uit versioned profielen, niet uit vrije interpretatie

## Anti-patronen

- Meteen implementeren zonder gesloten context
- Repo-feiten aannemen zonder bewijs
- Open high-impact ambiguities negeren
- Output buiten vaste artifactpaden schrijven
- Provider-specifieke nuances verstoppen in generieke copy

## Updateprotocol

1. Werk het JSON-runbestand bij.
2. Herzie providerprofielen alleen op basis van officiële documentatie of aantoonbare regressies.
3. Draai de generator opnieuw.
4. Vergelijk current output en diff-samenvatting.
5. Beoordeel warnings en blocking issues in het run-report.
6. Bewaar snapshot-history als audit trail.
`;
}

function renderDecisionRegister(input: PromptRunInput) {
  const decisions = [
    "Inputformaat is JSON met formeel schema en semantische checks.",
    "Automation mode is scaffold + merge.",
    "Current output blijft leidend naast immutable snapshots.",
    "Prompt-output wordt opgesplitst in base prompt en provider-specifieke promptvarianten.",
    input.open_questions.length > 0
      ? "Run blijft geblokkeerd totdat open high-impact ambiguities zijn opgelost."
      : "Run heeft geen open high-impact ambiguities en mag plan_complete zijn."
  ];

  return `# Decision Register

## Besluiten

${decisions
    .map(
      (decision, index) => `### [${input.run_metadata.date}] Besluit ${index + 1}\n\n- Besluit: ${decision}\n- Alternatieven: Handmatig proces, minder strikte gating, losse outputbestanden\n- Reden: Betrouwbare workflow en overdraagbare artifacts\n- Impact: Strakkere input, voorspelbare output\n- Revisietrigger: Herzien bij nieuwe bewezen workflowbehoeften`
    )
    .join("\n\n")}
`;
}

function compareText(current: string | undefined, next: string) {
  return current == null ? "created" : current === next ? "unchanged" : "changed";
}

function buildDiffSummary(artifacts: GeneratedArtifacts, currentArtifacts?: Partial<GeneratedArtifacts> | null): DiffItem[] {
  const items: DiffItem[] = [
    { label: "EXECUTION_BUNDLE.md", status: compareText(currentArtifacts?.executionBundle, artifacts.executionBundle) },
    { label: "BASE_PROMPT.md", status: compareText(currentArtifacts?.basePrompt, artifacts.basePrompt) },
    { label: "PROMPT_PLAYBOOK.md", status: compareText(currentArtifacts?.playbook, artifacts.playbook) },
    { label: "decision-register.md", status: compareText(currentArtifacts?.decisionRegister, artifacts.decisionRegister) },
    { label: "prompt-events.jsonl", status: compareText(currentArtifacts?.promptEvents, artifacts.promptEvents) },
    { label: "run-report.md", status: compareText(currentArtifacts?.runReport, artifacts.runReport) }
  ];

  for (const profile of getProviderProfiles()) {
    const current = currentArtifacts?.providerPrompts?.[profile.id];
    const next = artifacts.providerPrompts[profile.id];
    if (!current && !next) continue;
    items.push({ label: `${profile.label.toUpperCase()}_PROMPT.md`, status: next ? compareText(current, next) : "unchanged" });
  }

  return items;
}

function summarizeDiff(diffSummary: DiffItem[]) {
  return diffSummary.map((item) => `- ${item.label}: ${item.status}`).join("\n");
}

function renderPromptEvents(input: PromptRunInput, result: Pick<PromptRunResult, "qualityScore">, selectedProviders: ProviderId[]) {
  const baseTime = new Date(`${input.run_metadata.date}T10:00:00Z`).getTime();
  const stamps = Array.from({ length: 5 }, (_, index) => new Date(baseTime + index * 60_000).toISOString());

  const events = [
    {
      worker: "Conversation Analyst",
      event_type: "context_extracted",
      summary: `Runcontext voor ${input.run_metadata.source_project} uit JSON-input en repo-artifacts samengevoegd.`,
      artifact_ref: "EXECUTION_BUNDLE.md",
      timestamp: stamps[0]
    },
    {
      worker: "Prompt Best-Practices Researcher",
      event_type: "decision_made",
      summary: `Providerprofielen toegepast voor ${selectedProviders.join(", ")}.`,
      artifact_ref: "BASE_PROMPT.md",
      timestamp: stamps[1]
    },
    {
      worker: "Website Delivery Architect",
      event_type: "decision_made",
      summary: "Artifacts zijn opnieuw opgebouwd met gedeelde basis en provider-specifieke promptvarianten.",
      artifact_ref: "PROMPT_PLAYBOOK.md",
      timestamp: stamps[2]
    },
    {
      worker: "QA & Risk Reviewer",
      event_type: result.qualityScore === "fail" ? "gate_failed" : "gate_passed",
      summary:
        result.qualityScore === "fail"
          ? "Delivery Readiness Gate gefaald op basis van blocking issues."
          : "Context Completeness Gate en Delivery Readiness Gate zijn geslaagd.",
      artifact_ref: "run-report.md",
      timestamp: stamps[3]
    },
    {
      worker: "Documentation & Logging Worker",
      event_type: "prompt_revised",
      summary: `Artifacts opnieuw gegenereerd voor ${input.run_metadata.source_project}.`,
      artifact_ref: "output/",
      timestamp: stamps[4]
    }
  ];

  if (input.open_questions.length > 0) {
    events.splice(3, 0, {
      worker: "QA & Risk Reviewer",
      event_type: "risk_flagged",
      summary: `Open ambiguities blokkeren plan_complete: ${input.open_questions.length} item(s).`,
      artifact_ref: "BASE_PROMPT.md",
      timestamp: new Date(baseTime + 150_000).toISOString()
    });
  }

  return `${events
    .map((event) =>
      JSON.stringify({
        ...event,
        confidence: EVENT_CONFIDENCE[event.event_type]
      })
    )
    .join("\n")}\n`;
}

function renderRunReport(
  input: PromptRunInput,
  result: Pick<PromptRunResult, "qualityScore" | "validationResult" | "warnings" | "blockingIssues" | "artifacts" | "diffSummary" | "selectedProviders">
) {
  const selectedProviders = result.selectedProviders ?? inferSelectedProviders(result.artifacts);
  const providerPlaceholderCount = Object.values(result.artifacts.providerPrompts).reduce((sum, artifact) => sum + (artifact ? countPlaceholders(artifact) : 0), 0);
  const placeholderCounts = {
    executionBundle: countPlaceholders(result.artifacts.executionBundle),
    basePrompt: countPlaceholders(result.artifacts.basePrompt),
    playbook: countPlaceholders(result.artifacts.playbook),
    decisionRegister: countPlaceholders(result.artifacts.decisionRegister),
    promptEvents: countPlaceholders(result.artifacts.promptEvents),
    providerPrompts: providerPlaceholderCount
  };

  return `# Run Report

## Run metadata

- Date: ${input.run_metadata.date}
- Operator: ${input.run_metadata.operator}
- Source project: ${input.run_metadata.source_project}
- Framework version: ${input.run_metadata.framework_version}
- Template version: ${input.run_metadata.template_version}
- Providers: ${selectedProviders.join(", ")}

## Validation result

- Result: ${result.validationResult}
- Quality score: ${result.qualityScore}

## Blocking issues

${renderBulletList(result.blockingIssues, "Geen blocking issues.")}

## Warnings

${renderBulletList(result.warnings, "Geen warnings.")}

## Placeholder count per artifact

- EXECUTION_BUNDLE.md: ${placeholderCounts.executionBundle}
- BASE_PROMPT.md: ${placeholderCounts.basePrompt}
- PROMPT_PLAYBOOK.md: ${placeholderCounts.playbook}
- decision-register.md: ${placeholderCounts.decisionRegister}
- prompt-events.jsonl: ${placeholderCounts.promptEvents}
- provider prompts: ${placeholderCounts.providerPrompts}

## Open ambiguities

- ${input.open_questions.length}

## Current-versus-previous summary

${summarizeDiff(result.diffSummary)}
`;
}

export function getDownloadArtifactContent(artifacts: GeneratedArtifacts, type: DownloadArtifactKey): string | null {
  switch (type) {
    case "executionBundle":
      return artifacts.executionBundle || null;
    case "basePrompt":
      return artifacts.basePrompt;
    case "playbook":
      return artifacts.playbook;
    case "decisionRegister":
      return artifacts.decisionRegister;
    case "promptEvents":
      return artifacts.promptEvents;
    case "runReport":
      return artifacts.runReport;
    case "superPrompt":
      return artifacts.legacySuperPrompt ?? artifacts.basePrompt;
    case "provider-openai":
      return artifacts.providerPrompts.openai ?? null;
    case "provider-claude":
      return artifacts.providerPrompts.claude ?? null;
    case "provider-gemini":
      return artifacts.providerPrompts.gemini ?? null;
    default:
      return null;
  }
}

export function generatePromptRun(rawInput: unknown, options: GeneratePromptRunOptions): PromptRunResult {
  const input = normalizeRunInput(rawInput);
  const selectedProviders = dedupeProviders(options.selectedProviders ?? input.selectedProviders ?? [...DEFAULT_PROVIDERS]);
  input.selectedProviders = selectedProviders;

  const { blockingIssues, warnings: initialWarnings } = validateRunInput(input);
  const basePrompt = renderBasePrompt(input, selectedProviders);

  const providerPrompts: ProviderPromptMap = {};
  for (const provider of selectedProviders) {
    providerPrompts[provider] = renderProviderPrompt(input, basePrompt, getProviderProfile(provider));
  }

  const baseArtifacts: GeneratedArtifacts = {
    executionBundle: "",
    basePrompt,
    playbook: renderPlaybook(input, selectedProviders),
    decisionRegister: renderDecisionRegister(input),
    promptEvents: "",
    runReport: "",
    providerPrompts,
    legacySuperPrompt: basePrompt
  };

  const warnings = [...initialWarnings];
  const placeholderCount = [
    baseArtifacts.executionBundle,
    baseArtifacts.basePrompt,
    baseArtifacts.playbook,
    baseArtifacts.decisionRegister,
    ...Object.values(baseArtifacts.providerPrompts)
  ].reduce((sum, artifact) => sum + (artifact ? countPlaceholders(artifact) : 0), 0);

  if (placeholderCount > 0) {
    warnings.push(`Artifacts bevatten ${placeholderCount} placeholder(s).`);
  }
  if (input.open_questions.length > 0) {
    warnings.push(`Open ambiguities aanwezig: ${input.open_questions.length}.`);
  }

  const validationResult: PromptRunResult["validationResult"] = blockingIssues.length > 0 ? "blocking_fail" : warnings.length > 0 ? "valid_with_warnings" : "valid";
  const qualityScore: PromptRunResult["qualityScore"] = blockingIssues.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";

  baseArtifacts.promptEvents = renderPromptEvents(input, { qualityScore }, selectedProviders);
  const diffSummary = buildDiffSummary(baseArtifacts, options.currentArtifacts);

  const partialResult: Pick<PromptRunResult, "qualityScore" | "validationResult" | "warnings" | "blockingIssues" | "artifacts" | "diffSummary" | "selectedProviders"> = {
    qualityScore,
    validationResult,
    warnings,
    blockingIssues,
    artifacts: baseArtifacts,
    diffSummary,
    selectedProviders
  };

  baseArtifacts.executionBundle = renderExecutionBundle(input, {
    selectedProviders,
    qualityScore,
    validationResult,
    warnings,
    blockingIssues,
    playbook: baseArtifacts.playbook,
    decisionRegister: baseArtifacts.decisionRegister,
    basePrompt: baseArtifacts.basePrompt,
    providerPrompts: baseArtifacts.providerPrompts
  });

  baseArtifacts.runReport = renderRunReport(input, partialResult);

  return {
    qualityScore,
    validationResult,
    warnings,
    blockingIssues,
    artifacts: baseArtifacts,
    diffSummary: buildDiffSummary(baseArtifacts, options.currentArtifacts),
    snapshotRef: options.runId,
    createdAt: options.createdAt ?? new Date().toISOString(),
    selectedProviders
  };
}
