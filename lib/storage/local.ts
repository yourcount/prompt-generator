import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getDownloadArtifactContent, inferSelectedProviders, normalizeGeneratedArtifacts } from "@/lib/prompt-generator/core";
import type { GeneratedArtifacts, RunSummary, StoredRun } from "@/lib/prompt-generator/types";
import type { StorageAdapter } from "@/lib/storage/types";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "data", "runs");
const CURRENT_DIR = path.join(BASE_DIR, "current");
const RUNS_DIR = path.join(BASE_DIR, "items");
const INDEX_FILE = path.join(BASE_DIR, "index.json");

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function writeText(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

async function writeArtifacts(runDir: string, artifacts: GeneratedArtifacts) {
  const writes = [
    [path.join(runDir, "executionBundle.md"), artifacts.executionBundle],
    [path.join(runDir, "basePrompt.md"), artifacts.basePrompt],
    [path.join(runDir, "playbook.md"), artifacts.playbook],
    [path.join(runDir, "decisionRegister.md"), artifacts.decisionRegister],
    [path.join(runDir, "promptEvents.md"), artifacts.promptEvents],
    [path.join(runDir, "runReport.md"), artifacts.runReport],
    [path.join(runDir, "provider-openai.md"), artifacts.providerPrompts.openai],
    [path.join(runDir, "provider-claude.md"), artifacts.providerPrompts.claude],
    [path.join(runDir, "provider-gemini.md"), artifacts.providerPrompts.gemini]
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);

  await Promise.all(writes.map(([filePath, value]) => writeText(filePath, value)));
}

export function createLocalStorage(): StorageAdapter {
  return {
    async readCurrentArtifacts() {
      const stored = await readJson<GeneratedArtifacts>(path.join(CURRENT_DIR, "artifacts.json"));
      return stored ? normalizeGeneratedArtifacts(stored) : null;
    },
    async saveRun(run) {
      const runDir = path.join(RUNS_DIR, run.id);
      await writeJson(path.join(runDir, "run.json"), run);
      await writeJson(path.join(runDir, "input.json"), run.input);
      await writeJson(path.join(CURRENT_DIR, "artifacts.json"), run.artifacts);
      await writeArtifacts(runDir, run.artifacts);

      const currentIndex = (await readJson<RunSummary[]>(INDEX_FILE)) ?? [];
      const summary: RunSummary = {
        id: run.id,
        createdAt: run.createdAt,
        brand: run.input.project_context.brand,
        sourceProject: run.input.run_metadata.source_project,
        qualityScore: run.qualityScore,
        validationResult: run.validationResult,
        selectedProviders: run.selectedProviders
      };
      const nextIndex = [summary, ...currentIndex.filter((item) => item.id !== run.id)].slice(0, 20);
      await writeJson(INDEX_FILE, nextIndex);
    },
    async getRun(id) {
      const run = await readJson<StoredRun>(path.join(RUNS_DIR, id, "run.json"));
      if (!run) return null;
      return {
        ...run,
        artifacts: normalizeGeneratedArtifacts(run.artifacts),
        selectedProviders: run.selectedProviders ?? inferSelectedProviders(run.artifacts)
      };
    },
    async getArtifact(id, type) {
      const run = await readJson<StoredRun>(path.join(RUNS_DIR, id, "run.json"));
      if (!run) return null;
      return getDownloadArtifactContent(run.artifacts, type);
    },
    async listRuns(limit = 10) {
      const items = (await readJson<RunSummary[]>(INDEX_FILE)) ?? [];
      return items.slice(0, limit);
    }
  };
}
