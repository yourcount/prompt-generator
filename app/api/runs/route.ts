import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createRunId, generatePromptRun, normalizeRunInput } from "@/lib/prompt-generator/core";
import { getStorage } from "@/lib/storage";
import type { PromptRunInput, StoredRun } from "@/lib/prompt-generator/types";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const LIMIT = 10;
const rateMap = new Map<string, { count: number; expiresAt: number }>();

function getIp(headersList: Headers) {
  return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function hitRateLimit(ip: string) {
  const now = Date.now();
  const current = rateMap.get(ip);
  if (!current || current.expiresAt < now) {
    rateMap.set(ip, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  rateMap.set(ip, current);
  return current.count > LIMIT;
}

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = getIp(headerStore);
  if (hitRateLimit(ip)) {
    return NextResponse.json({ error: "Te veel runs in korte tijd. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  let raw: PromptRunInput;
  try {
    raw = (await request.json()) as PromptRunInput;
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON in de aanvraag." }, { status: 400 });
  }

  try {
    const normalized = normalizeRunInput(raw);
    const storage = getStorage();
    const currentArtifacts = await storage.readCurrentArtifacts();
    const runId = createRunId(normalized.run_metadata.source_project || "run");
    const result = generatePromptRun(normalized, {
      runId,
      currentArtifacts,
      selectedProviders: normalized.selectedProviders
    });

    if (result.qualityScore === "fail") {
      return NextResponse.json(
        {
          error: "De run is geblokkeerd door validatieproblemen.",
          blockingIssues: result.blockingIssues,
          warnings: result.warnings,
          selectedProviders: result.selectedProviders
        },
        { status: 422 }
      );
    }

    const storedRun: StoredRun = {
      id: runId,
      createdAt: result.createdAt,
      qualityScore: result.qualityScore,
      validationResult: result.validationResult,
      input: normalized,
      artifacts: result.artifacts,
      warnings: result.warnings,
      blockingIssues: result.blockingIssues,
      diffSummary: result.diffSummary,
      snapshotRef: result.snapshotRef,
      selectedProviders: result.selectedProviders
    };

    await storage.saveRun(storedRun);

    return NextResponse.json({
      id: runId,
      qualityScore: result.qualityScore,
      warnings: result.warnings,
      blockingIssues: result.blockingIssues,
      selectedProviders: result.selectedProviders
    });
  } catch (error) {
    console.error("POST /api/runs failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? `Run opslaan of genereren mislukte: ${error.message}` : "Run opslaan of genereren mislukte."
      },
      { status: 500 }
    );
  }
}
