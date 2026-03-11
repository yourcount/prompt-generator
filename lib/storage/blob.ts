import { list, put } from "@vercel/blob";

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

async function putJson(pathname: string, value: unknown) {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json"
  });
}

async function putText(pathname: string, value: string) {
  await put(pathname, value, {
    access: "public",
    addRandomSuffix: false,
    contentType: "text/markdown; charset=utf-8"
  });
}

export function createBlobStorage(): StorageAdapter {
  return {
    async readCurrentArtifacts() {
      return readJsonFromBlob<GeneratedArtifacts>(`${PREFIX}/current/artifacts.json`);
    },
    async saveRun(run) {
      const base = `${PREFIX}/runs/${run.id}`;
      await putJson(`${base}/run.json`, run);
      await putJson(`${base}/input.json`, run.input);
      await putJson(`${PREFIX}/current/artifacts.json`, run.artifacts);
      await Promise.all(
        Object.entries(run.artifacts).map(([key, value]) => putText(`${base}/${key}.md`, value))
      );

      const currentIndex = (await readJsonFromBlob<RunSummary[]>(INDEX_PATH)) ?? [];
      const summary: RunSummary = {
        id: run.id,
        createdAt: run.createdAt,
        brand: run.input.project_context.brand,
        sourceProject: run.input.run_metadata.source_project,
        qualityScore: run.qualityScore,
        validationResult: run.validationResult
      };
      const nextIndex = [summary, ...currentIndex.filter((item) => item.id !== run.id)].slice(0, 20);
      await putJson(INDEX_PATH, nextIndex);
    },
    async getRun(id) {
      return readJsonFromBlob<StoredRun>(`${PREFIX}/runs/${id}/run.json`);
    },
    async getArtifact(id, type) {
      const pathname = `${PREFIX}/runs/${id}/${type}.md`;
      const result = await list({ prefix: pathname, limit: 1, mode: "folded" });
      const blob = result.blobs.find((item) => item.pathname === pathname);
      return blob ? readTextFromUrl(blob.url) : null;
    },
    async listRuns(limit = 10) {
      const items = (await readJsonFromBlob<RunSummary[]>(INDEX_PATH)) ?? [];
      return items.slice(0, limit);
    }
  };
}
