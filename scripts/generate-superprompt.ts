import { readFile } from "node:fs/promises";
import process from "node:process";

import { createRunId, generatePromptRun, normalizeRunInput } from "../lib/prompt-generator/core";
import type { ProviderId } from "../lib/prompt-generator/types";

function parseProviders() {
  const providersIndex = process.argv.indexOf("--providers");
  if (providersIndex === -1 || !process.argv[providersIndex + 1]) return undefined;
  return process.argv[providersIndex + 1]!.split(",").map((value) => value.trim()).filter(Boolean) as ProviderId[];
}

async function main() {
  const inputIndex = process.argv.indexOf("--input");
  if (inputIndex === -1 || !process.argv[inputIndex + 1]) {
    console.error("Gebruik: npm run prompt:generate -- --input path/to/run.json [--providers openai,claude,gemini]");
    process.exit(1);
  }

  const filePath = process.argv[inputIndex + 1]!;
  const raw = JSON.parse(await readFile(filePath, "utf8"));
  const normalized = normalizeRunInput(raw);
  const selectedProviders = parseProviders() ?? normalized.selectedProviders;
  const runId = createRunId(normalized.run_metadata.source_project ?? "run");
  const result = generatePromptRun(normalized, { runId, selectedProviders });
  const selected = result.selectedProviders ?? normalized.selectedProviders ?? [];

  console.log(`Run: ${runId}`);
  console.log(`Quality: ${result.qualityScore}`);
  console.log(`Providers: ${selected.join(", ")}`);
  console.log(result.artifacts.runReport);

  if (result.qualityScore === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
