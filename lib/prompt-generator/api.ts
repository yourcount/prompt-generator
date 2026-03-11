import type { PromptRunInput } from "@/lib/prompt-generator/types";

export async function createRun(input: PromptRunInput) {
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = await response.json();
  if (!response.ok) {
    const details = [payload.error, ...(payload.blockingIssues ?? []), ...(payload.warnings ?? [])].filter(Boolean).join("\n");
    throw new Error(details || "Kon de run niet genereren.");
  }

  return payload as { id: string; qualityScore: string; warnings: string[]; blockingIssues: string[] };
}
