import type { PromptRunInput, ProviderId } from "@/lib/prompt-generator/types";

export async function createRun(input: PromptRunInput) {
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { error: text } : {};
  }

  const body = (payload ?? {}) as {
    error?: string;
    blockingIssues?: string[];
    warnings?: string[];
    id?: string;
    qualityScore?: string;
    selectedProviders?: ProviderId[];
  };

  if (!response.ok) {
    const details = [body.error, ...(body.blockingIssues ?? []), ...(body.warnings ?? [])].filter(Boolean).join("\n");
    throw new Error(details || "Kon de run niet genereren.");
  }

  return body as { id: string; qualityScore: string; warnings: string[]; blockingIssues: string[]; selectedProviders: ProviderId[] };
}
