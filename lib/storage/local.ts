import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

export function createLocalStorage(): StorageAdapter {
  return {
    async readCurrentArtifacts() {
      return readJson<GeneratedArtifacts>(path.join(CURRENT_DIR, "artifacts.json"));
    },
    async saveRun(run) {
      const runDir = path.join(RUNS_DIR, run.id);
      await writeJson(path.join(runDir, "run.json"), run);
      await writeJson(path.join(runDir, "input.json"), run.input);
      await writeJson(path.join(CURRENT_DIR, "artifacts.json"), run.artifacts);

      await Promise.all(
        Object.entries(run.artifacts).map(([key, value]) => writeText(path.join(runDir, `${key}.md`), value))
      );

      const currentIndex = (await readJson<RunSummary[]>(INDEX_FILE)) ?? [];
      const summary: RunSummary = {
        id: run.id,
        createdAt: run.createdAt,
        brand: run.input.project_context.brand,
        sourceProject: run.input.run_metadata.source_project,
        qualityScore: run.qualityScore,
        validationResult: run.validationResult
      };
      const nextIndex = [summary, ...currentIndex.filter((item) => item.id !== run.id)].slice(0, 20);
      await writeJson(INDEX_FILE, nextIndex);
    },
    async getRun(id) {
      return readJson<StoredRun>(path.join(RUNS_DIR, id, "run.json"));
    },
    async getArtifact(id, type) {
      try {
        return await readFile(path.join(RUNS_DIR, id, `${type}.md`), "utf8");
      } catch {
        return null;
      }
    },
    async listRuns(limit = 10) {
      const items = (await readJson<RunSummary[]>(INDEX_FILE)) ?? [];
      return items.slice(0, limit);
    }
  };
}
