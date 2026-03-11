import { NextResponse } from "next/server";

import { getStorage } from "@/lib/storage";
import type { DownloadArtifactKey } from "@/lib/prompt-generator/types";

export const runtime = "nodejs";

const allowedTypes: DownloadArtifactKey[] = [
  "executionBundle",
  "basePrompt",
  "playbook",
  "decisionRegister",
  "promptEvents",
  "runReport",
  "superPrompt",
  "provider-openai",
  "provider-claude",
  "provider-gemini"
];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;
  if (!allowedTypes.includes(type as DownloadArtifactKey)) {
    return NextResponse.json({ error: "Onbekend artifacttype." }, { status: 404 });
  }

  const artifact = await getStorage().getArtifact(id, type as DownloadArtifactKey);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact niet gevonden." }, { status: 404 });
  }

  return new NextResponse(artifact, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}-${type}.md"`
    }
  });
}
