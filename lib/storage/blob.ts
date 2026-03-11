import { list, put } from "@vercel/blob";

import { getDownloadArtifactContent, inferSelectedProviders, normalizeGeneratedArtifacts } from "@/lib/prompt-generator/core";
import type { GeneratedArtifacts, RunSummary, StoredRun } from "@/lib/prompt-generator/types";
import type { StorageAdapter } from "@/lib/storage/types";

const PREFIX = "prompt-generator";
const INDEX_PATH = `${PREFIX}/index.json`;

async function readTextFromUrl(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Blob read failed: ${response.status}`);
  }
  return response.text();
}

async function readJsonFromBlob<T>(pathname: string): Promise<T | null> {
  const result = await list({ prefix: pathname, limit: 1, mode: "folded" });
  const blob = result.blobs.find((item) => item.pathname === pathname);
  if (!blob) return null;
  try {
    return JSON.parse(await readTextFromUrl(blob.url)) as T;
  } catch {
    return null;
  }
}

async function putJson(pathname: string, value: unknown, allowOverwrite = false) {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite,
    contentType: "application/json"
  });
}

async function putText(pathname: string, value: string, allowOverwrite = false) {
  await put(pathname, value, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite,
    contentType: "text/markdown; charset=utf-8"
  });
}

async function writeArtifacts(base: string, artifacts: GeneratedArtifacts) {
  await Promise.all([
    putText(`${base}/basePrompt.md`, artifacts.basePrompt),
    putText(`${base}/playbook.md`, artifacts.playbook),
    putText(`${base}/decisionRegister.md`, artifacts.decisionRegister),
    putText(`${base}/promptEvents.md`, artifacts.promptEvents),
    putText(`${base}/runReport.md`, artifacts.runReport),
    putText(`${base}/provider-openai.md`, artifacts.providerPrompts.openai ?? ""),
    putText(`${base}/provider-claude.md`, artifacts.providerPrompts.claude ?? ""),
    putText(`${base}/provider-gemini.md`, artifacts.providerPrompts.gemini ?? "")
  ]);
}

export function createBlobStorage(): StorageAdapter {
  return {
    async readCurrentArtifacts() {
      const stored = await readJsonFromBlob<GeneratedArtifacts>(`${PREFIX}/current/artifacts.json`);
      return stored ? normalizeGeneratedArtifacts(stored) : null;
    },
    async saveRun(run) {
      const base = `${PREFIX}/runs/${run.id}`;
      await putJson(`${base}/run.json`, run);
      await putJson(`${base}/input.json`, run.input);
      await putJson(`${PREFIX}/current/artifacts.json`, run.artifacts, true);
      await writeArtifacts(base, run.artifacts);

      const currentIndex = (await readJsonFromBlob<RunSummary[]>(INDEX_PATH)) ?? [];
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
      await putJson(INDEX_PATH, nextIndex, true);
    },
    async getRun(id) {
      const run = await readJsonFromBlob<StoredRun>(`${PREFIX}/runs/${id}/run.json`);
      if (!run) return null;
      return {
        ...run,
        artifacts: normalizeGeneratedArtifacts(run.artifacts),
        selectedProviders: run.selectedProviders ?? inferSelectedProviders(run.artifacts)
      };
    },
    async getArtifact(id, type) {
      const run = await readJsonFromBlob<StoredRun>(`${PREFIX}/runs/${id}/run.json`);
      if (!run) return null;
      return getDownloadArtifactContent(run.artifacts, type);
    },
    async listRuns(limit = 10) {
      const items = (await readJsonFromBlob<RunSummary[]>(INDEX_PATH)) ?? [];
      return items.slice(0, limit);
    }
  };
}
