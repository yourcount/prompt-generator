export type LessonLabel = "success" | "regression" | "misunderstanding" | "process_change";

export type ProviderId = "openai" | "claude" | "gemini";

export type ProviderPromptMap = Partial<Record<ProviderId, string>>;

export type ProviderProfile = {
  id: ProviderId;
  label: string;
  profileVersion: string;
  recommendedModelFamily: string;
  lastVerifiedAt: string;
  bestPracticeSummary: string[];
  promptConstructionRules: string[];
  outputHints: string[];
  sourceReferences: Array<{
    label: string;
    url: string;
  }>;
};

export type PromptRunInput = {
  conversation_source: {
    type: string;
    source: string;
    summary: string;
  };
  project_context: {
    brand: string;
    audiences: string[];
    website_goal: string;
    features: string[];
    constraints: string[];
    tone_of_voice: string;
  };
  repo_artifacts: {
    paths: string[];
    categories: string[];
  };
  lessons_learned: Array<{
    label: LessonLabel;
    summary: string;
  }>;
  open_questions: string[];
  run_metadata: {
    date: string;
    operator: string;
    source_project: string;
    output_language: string;
    framework_version: string;
    template_version: string;
  };
  success_criteria: string[];
  scope_notes: string[];
  selectedProviders?: ProviderId[];
};

export type SharedArtifactKey = "basePrompt" | "playbook" | "decisionRegister" | "promptEvents" | "runReport";
export type LegacyArtifactKey = "superPrompt";
export type DownloadArtifactKey = SharedArtifactKey | LegacyArtifactKey | `provider-${ProviderId}`;

export type GeneratedArtifacts = {
  basePrompt: string;
  playbook: string;
  decisionRegister: string;
  promptEvents: string;
  runReport: string;
  providerPrompts: ProviderPromptMap;
  legacySuperPrompt?: string;
};

export type DiffItem = {
  label: string;
  status: "created" | "changed" | "unchanged";
};

export type PromptRunResult = {
  qualityScore: "pass" | "warn" | "fail";
  validationResult: "valid" | "valid_with_warnings" | "blocking_fail";
  warnings: string[];
  blockingIssues: string[];
  artifacts: GeneratedArtifacts;
  diffSummary: DiffItem[];
  snapshotRef: string;
  createdAt: string;
  selectedProviders?: ProviderId[];
};

export type StoredRun = {
  id: string;
  createdAt: string;
  qualityScore: PromptRunResult["qualityScore"];
  validationResult: PromptRunResult["validationResult"];
  input: PromptRunInput;
  artifacts: GeneratedArtifacts;
  warnings: string[];
  blockingIssues: string[];
  diffSummary: DiffItem[];
  snapshotRef: string;
  selectedProviders?: ProviderId[];
};

export type RunSummary = {
  id: string;
  createdAt: string;
  brand: string;
  sourceProject: string;
  qualityScore: PromptRunResult["qualityScore"];
  validationResult: PromptRunResult["validationResult"];
  selectedProviders?: ProviderId[];
};
