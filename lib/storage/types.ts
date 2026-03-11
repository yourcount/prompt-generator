import type { DownloadArtifactKey, GeneratedArtifacts, RunSummary, StoredRun } from "@/lib/prompt-generator/types";

export type StorageAdapter = {
  readCurrentArtifacts(): Promise<GeneratedArtifacts | null>;
  saveRun(run: StoredRun): Promise<void>;
  getRun(id: string): Promise<StoredRun | null>;
  getArtifact(id: string, type: DownloadArtifactKey): Promise<string | null>;
  listRuns(limit?: number): Promise<RunSummary[]>;
};
