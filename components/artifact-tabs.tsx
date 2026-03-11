"use client";

import { useMemo, useState } from "react";

import type { GeneratedArtifacts } from "@/lib/prompt-generator/types";

const order: Array<{ key: keyof GeneratedArtifacts; label: string; type: string }> = [
  { key: "superPrompt", label: "SUPER_PROMPT", type: "superPrompt" },
  { key: "playbook", label: "PROMPT_PLAYBOOK", type: "playbook" },
  { key: "decisionRegister", label: "Decision Register", type: "decisionRegister" },
  { key: "promptEvents", label: "Prompt Events", type: "promptEvents" },
  { key: "runReport", label: "Run Report", type: "runReport" }
];

export function ArtifactTabs({ runId, artifacts }: { runId: string; artifacts: GeneratedArtifacts }) {
  const [activeKey, setActiveKey] = useState<keyof GeneratedArtifacts>("superPrompt");
  const activeItem = useMemo(() => order.find((item) => item.key === activeKey) ?? order[0], [activeKey]);

  const copyActive = async () => {
    await navigator.clipboard.writeText(artifacts[activeItem.key]);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-4 shadow-glow sm:p-6">
      <div className="flex flex-wrap gap-2">
        {order.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveKey(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeKey === item.key ? "bg-amber text-ink" : "border border-white/10 bg-white/5 text-mist/75 hover:border-teal/40 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copyActive} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/50 hover:bg-teal/10">
          Kopieer inhoud
        </button>
        <a
          href={`/api/runs/${runId}/artifact/${activeItem.type}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber/50 hover:bg-amber/10"
        >
          Download bestand
        </a>
      </div>
      <pre className="code-scroll mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-ink/80 p-4 text-sm leading-7 text-mist/90">
        <code>{artifacts[activeItem.key]}</code>
      </pre>
      {activeKey === "superPrompt" ? (
        <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/10 p-4 text-sm text-mist/90">
          Gebruik deze prompt in Codex als startpunt voor een nieuw websiteproject.
        </div>
      ) : null}
    </div>
  );
}
