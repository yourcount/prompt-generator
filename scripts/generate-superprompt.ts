import { readFile } from "node:fs/promises";
import process from "node:process";

import { createRunId, generatePromptRun } from "../lib/prompt-generator/core";

async function main() {
  const inputIndex = process.argv.indexOf("--input");
  if (inputIndex === -1 || !process.argv[inputIndex + 1]) {
    console.error("Gebruik: npm run prompt:generate -- --input path/to/run.json");
    process.exit(1);
  }

  const filePath = process.argv[inputIndex + 1]!;
  const raw = JSON.parse(await readFile(filePath, "utf8"));
  const runId = createRunId(raw?.run_metadata?.source_project ?? "run");
  const result = generatePromptRun(raw, { runId });

  console.log(`Run: ${runId}`);
  console.log(`Quality: ${result.qualityScore}`);
  console.log(result.artifacts.runReport);

  if (result.qualityScore === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
