import type { ArtifactKey, DiffItem, GeneratedArtifacts, PromptRunInput, PromptRunResult } from "@/lib/prompt-generator/types";

const ROOT_KEYS = [
  "conversation_source",
  "project_context",
  "repo_artifacts",
  "lessons_learned",
  "open_questions",
  "run_metadata"
] as const;

const LESSON_LABELS = ["success", "regression", "misunderstanding", "process_change"] as const;

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

function renderAssumptions(input: PromptRunInput) {
  const assumptions = [
    `Frameworkversie: ${input.run_metadata.framework_version}`,
    `Templateversie: ${input.run_metadata.template_version}`,
    `Outputtaal: ${input.run_metadata.output_language}`,
    "Generator werkt als scaffold + merge en verzint geen projectspecifieke inhoud."
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
  return `${timestampToken(date)}-${slugify(sourceProject)}`;
}

export function normalizeRunInput(raw: unknown): PromptRunInput {
  const value = isPlainObject(raw) ? raw : {};
  const conversationSource = isPlainObject(value.conversation_source) ? value.conversation_source : {};
  const projectContext = isPlainObject(value.project_context) ? value.project_context : {};
  const repoArtifacts = isPlainObject(value.repo_artifacts) ? value.repo_artifacts : {};
  const runMetadata = isPlainObject(value.run_metadata) ? value.run_metadata : {};
  const lessonsLearned = Array.isArray(value.lessons_learned) ? value.lessons_learned : [];

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
    scope_notes: Array.isArray(value.scope_notes) ? value.scope_notes.map(normalizeString).filter(Boolean) : []
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
  if (input.run_metadata.framework_version && input.run_metadata.framework_version !== "v3") {
    blockingIssues.push("run_metadata.framework_version moet v3 zijn");
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

  if (input.success_criteria.length === 0) {
    warnings.push("success_criteria ontbreekt; output krijgt placeholders voor succescriteria.");
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

function renderSuperPrompt(input: PromptRunInput) {
  const statusBlock = input.open_questions.length > 0
    ? `## Status\n\nDeze run is nog niet \`plan_complete\`.\n\nReden:\n${renderBulletList(input.open_questions, "[Aanvullen: open ambiguity]")}\n\nLos deze high-impact ambiguities eerst op voordat deze output als definitief wordt gebruikt.`
    : "## Plan complete\n\nDeze run heeft geen open high-impact ambiguities en mag als `plan_complete` worden behandeld.";

  return `# Super Prompt ${input.run_metadata.framework_version} voor ${input.project_context.brand}

## Doel

Je bent een Codex-only website delivery system voor ${input.project_context.brand}. Je doel is om een websiteproject iteratief, repo-gedekt en zonder hallucinaties uit te voeren.

Projectdoel:

- ${input.project_context.website_goal}

Succescriteria:

${renderSuccessCriteria(input.success_criteria, input.project_context.brand)}

Feature scope voor deze run:

${renderBulletList(input.project_context.features, "[Aanvullen: feature focus]")}

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

Schrijf exact deze vier outputs:

- \`docs/prompt-framework/output/SUPER_PROMPT.md\`
- \`docs/prompt-framework/output/PROMPT_PLAYBOOK.md\`
- \`docs/prompt-framework/output/logs/prompt-events.jsonl\`
- \`docs/prompt-framework/output/logs/decision-register.md\`

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

## Aannames

${renderAssumptions(input)}

${statusBlock}
`;
}

function renderPlaybook(input: PromptRunInput) {
  return `# Prompt Playbook ${input.run_metadata.framework_version}

## Doel van deze versie

Deze versie scaffoldt een herhaalbare superprompt voor ${input.project_context.brand} op basis van een JSON-runbestand. De generator automatiseert structuur, logging en vaste secties, maar laat projectspecifieke verfijning expliciet zichtbaar.

Projectdoel:

- ${input.project_context.website_goal}

## Waarom deze keuzes zijn gemaakt

| Onderdeel | Keuze | Waarom |
| --- | --- | --- |
| Inputformaat | JSON met formeel contract | Eenvoudig te valideren en scriptbaar |
| Automatisering | Scaffold + merge | Houdt output bruikbaar zonder inhoud te verzinnen |
| Outputlocaties | Vast en toegankelijk | Maakt tooling, review en downloads consistent |
| Snapshot-history | Per-run snapshot naast current output | Verbetert traceability en rollback |

## Lessons learned

${renderLessonsByLabel(input.lessons_learned)}

## Wat meenemen naar volgende run

${renderBulletList(input.lessons_learned.map((lesson) => lesson.summary), "[Aanvullen: takeaway]")}

## Herbruikbare promptpatronen

- Eerst context, dan plan, dan uitvoering
- 1 feature per iteratie
- Gates zijn hard blockers
- Geen stille aannames

## Anti-patronen

- Meteen implementeren zonder gesloten context
- Repo-feiten aannemen zonder bewijs
- Open high-impact ambiguities negeren
- Output buiten vaste artifactpaden schrijven

## Updateprotocol

1. Werk het JSON-runbestand bij.
2. Draai de generator opnieuw.
3. Vergelijk current output en diff-samenvatting.
4. Beoordeel warnings en blocking issues in het run-report.
5. Bewaar snapshot-history als audit trail.
`;
}

function renderDecisionRegister(input: PromptRunInput) {
  const decisions = [
    "Inputformaat is JSON met formeel schema en semantische checks.",
    "Automation mode is scaffold + merge.",
    "Current output blijft leidend naast immutable snapshots.",
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

function buildDiffSummary(artifacts: GeneratedArtifacts, currentArtifacts?: Partial<GeneratedArtifacts> | null): DiffItem[] {
  return [
    ["SUPER_PROMPT.md", "superPrompt"],
    ["PROMPT_PLAYBOOK.md", "playbook"],
    ["decision-register.md", "decisionRegister"],
    ["prompt-events.jsonl", "promptEvents"],
    ["run-report.md", "runReport"]
  ].map(([label, key]) => {
    const typedKey = key as ArtifactKey;
    const current = currentArtifacts?.[typedKey];
    const next = artifacts[typedKey];
    return {
      label,
      status: current == null ? "created" : current === next ? "unchanged" : "changed"
    };
  });
}

function summarizeDiff(diffSummary: DiffItem[]) {
  return diffSummary.map((item) => `- ${item.label}: ${item.status}`).join("\n");
}

function renderPromptEvents(input: PromptRunInput, result: Pick<PromptRunResult, "qualityScore">) {
  const baseTime = new Date(`${input.run_metadata.date}T10:00:00Z`).getTime();
  const stamps = Array.from({ length: 5 }, (_, index) => new Date(baseTime + index * 60_000).toISOString());

  const events = [
    {
      worker: "Conversation Analyst",
      event_type: "context_extracted",
      summary: `Runcontext voor ${input.run_metadata.source_project} uit JSON-input en repo-artifacts samengevoegd.`,
      artifact_ref: "SUPER_PROMPT.md",
      timestamp: stamps[0]
    },
    {
      worker: "Prompt Best-Practices Researcher",
      event_type: "decision_made",
      summary: "Promptregels, gates en outputcontract zijn afgeleid uit de gedeelde generatorcore.",
      artifact_ref: "PROMPT_PLAYBOOK.md",
      timestamp: stamps[1]
    },
    {
      worker: "Website Delivery Architect",
      event_type: "decision_made",
      summary: "Artifacts zijn opnieuw opgebouwd met diff, report en snapshot-geschikte output.",
      artifact_ref: "decision-register.md",
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
      artifact_ref: "SUPER_PROMPT.md",
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
  result: Pick<PromptRunResult, "qualityScore" | "validationResult" | "warnings" | "blockingIssues" | "artifacts" | "diffSummary">
) {
  const placeholderCounts = {
    superPrompt: countPlaceholders(result.artifacts.superPrompt),
    playbook: countPlaceholders(result.artifacts.playbook),
    decisionRegister: countPlaceholders(result.artifacts.decisionRegister),
    promptEvents: countPlaceholders(result.artifacts.promptEvents)
  };

  return `# Run Report

## Run metadata

- Date: ${input.run_metadata.date}
- Operator: ${input.run_metadata.operator}
- Source project: ${input.run_metadata.source_project}
- Framework version: ${input.run_metadata.framework_version}
- Template version: ${input.run_metadata.template_version}

## Validation result

- Result: ${result.validationResult}
- Quality score: ${result.qualityScore}

## Blocking issues

${renderBulletList(result.blockingIssues, "Geen blocking issues.")}

## Warnings

${renderBulletList(result.warnings, "Geen warnings.")}

## Placeholder count per artifact

- SUPER_PROMPT.md: ${placeholderCounts.superPrompt}
- PROMPT_PLAYBOOK.md: ${placeholderCounts.playbook}
- decision-register.md: ${placeholderCounts.decisionRegister}
- prompt-events.jsonl: ${placeholderCounts.promptEvents}

## Current-versus-previous summary

${summarizeDiff(result.diffSummary)}
`;
}

export function generatePromptRun(rawInput: unknown, options: GeneratePromptRunOptions): PromptRunResult {
  const input = normalizeRunInput(rawInput);
  const { blockingIssues, warnings: initialWarnings } = validateRunInput(input);

  const baseArtifacts: GeneratedArtifacts = {
    superPrompt: renderSuperPrompt(input),
    playbook: renderPlaybook(input),
    decisionRegister: renderDecisionRegister(input),
    promptEvents: "",
    runReport: ""
  };

  const warnings = [...initialWarnings];
  const placeholderCount = countPlaceholders(baseArtifacts.superPrompt) + countPlaceholders(baseArtifacts.playbook) + countPlaceholders(baseArtifacts.decisionRegister);
  if (placeholderCount > 0) {
    warnings.push(`Artifacts bevatten ${placeholderCount} placeholder(s).`);
  }
  if (input.open_questions.length > 0) {
    warnings.push(`Open ambiguities aanwezig: ${input.open_questions.length}.`);
  }

  const validationResult: PromptRunResult["validationResult"] = blockingIssues.length > 0 ? "blocking_fail" : warnings.length > 0 ? "valid_with_warnings" : "valid";
  const qualityScore: PromptRunResult["qualityScore"] = blockingIssues.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";

  baseArtifacts.promptEvents = renderPromptEvents(input, { qualityScore });

  const diffSummary = buildDiffSummary(baseArtifacts, options.currentArtifacts);

  const partialResult: Pick<
    PromptRunResult,
    "qualityScore" | "validationResult" | "warnings" | "blockingIssues" | "artifacts" | "diffSummary"
  > = {
    qualityScore,
    validationResult,
    warnings,
    blockingIssues,
    artifacts: baseArtifacts,
    diffSummary
  };

  baseArtifacts.runReport = renderRunReport(input, partialResult);

  return {
    qualityScore,
    validationResult,
    warnings,
    blockingIssues,
    artifacts: baseArtifacts,
    diffSummary: buildDiffSummary(baseArtifacts, options.currentArtifacts),
    snapshotRef: options.runId,
    createdAt: options.createdAt ?? new Date().toISOString()
  };
}
