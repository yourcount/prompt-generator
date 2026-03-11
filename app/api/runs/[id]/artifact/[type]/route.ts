import { NextResponse } from "next/server";

import { getStorage } from "@/lib/storage";
import type { ArtifactKey } from "@/lib/prompt-generator/types";

export const runtime = "nodejs";

const allowedTypes: ArtifactKey[] = ["superPrompt", "playbook", "decisionRegister", "promptEvents", "runReport"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;
  if (!allowedTypes.includes(type as ArtifactKey)) {
    return NextResponse.json({ error: "Onbekend artifacttype." }, { status: 404 });
  }

  const artifact = await getStorage().getArtifact(id, type as ArtifactKey);
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
