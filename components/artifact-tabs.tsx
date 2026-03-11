"use client";

import { useMemo, useState } from "react";

import type { GeneratedArtifacts, ProviderId } from "@/lib/prompt-generator/types";

const artifactTabs = [
  { key: "executionBundle", label: "Execution Bundle" },
  { key: "prompt", label: "Prompts" },
  { key: "playbook", label: "Playbook" },
  { key: "decisionRegister", label: "Decision Register" },
  { key: "promptEvents", label: "Prompt Events" },
  { key: "runReport", label: "Run Report" }
] as const;

const providerLabels: Record<"base" | ProviderId, string> = {
  base: "Base",
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini"
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ArtifactTabs({ runId, artifacts, downloadable = true }: { runId?: string; artifacts: GeneratedArtifacts; downloadable?: boolean }) {
  const [activeTab, setActiveTab] = useState<(typeof artifactTabs)[number]["key"]>("executionBundle");
  const [activePromptTab, setActivePromptTab] = useState<"base" | ProviderId>("base");

  const availablePromptTabs = useMemo(() => {
    const tabs: Array<"base" | ProviderId> = ["base"];
    if (artifacts.providerPrompts.openai) tabs.push("openai");
    if (artifacts.providerPrompts.claude) tabs.push("claude");
    if (artifacts.providerPrompts.gemini) tabs.push("gemini");
    return tabs;
  }, [artifacts.providerPrompts]);

  const activeContent = useMemo(() => {
    if (activeTab === "executionBundle") return artifacts.executionBundle;
    if (activeTab === "prompt") {
      if (activePromptTab === "base") return artifacts.basePrompt;
      return artifacts.providerPrompts[activePromptTab] ?? artifacts.basePrompt;
    }
    if (activeTab === "playbook") return artifacts.playbook;
    if (activeTab === "decisionRegister") return artifacts.decisionRegister;
    if (activeTab === "promptEvents") return artifacts.promptEvents;
    return artifacts.runReport;
  }, [activePromptTab, activeTab, artifacts]);

  const activeDownloadType = useMemo(() => {
    if (activeTab === "executionBundle") return "executionBundle";
    if (activeTab === "prompt") {
      return activePromptTab === "base" ? "basePrompt" : `provider-${activePromptTab}`;
    }
    if (activeTab === "playbook") return "playbook";
    if (activeTab === "decisionRegister") return "decisionRegister";
    if (activeTab === "promptEvents") return "promptEvents";
    return "runReport";
  }, [activePromptTab, activeTab]);

  const copyActive = async () => {
    await navigator.clipboard.writeText(activeContent);
  };

  const downloadActive = () => {
    const filename = `${runId ?? "prompt-run"}-${activeDownloadType}.md`;
    downloadText(filename, activeContent);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-4 shadow-glow sm:p-6">
      <div className="flex flex-wrap gap-2">
        {artifactTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === item.key ? "bg-amber text-ink" : "border border-white/10 bg-white/5 text-mist/75 hover:border-teal/40 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "prompt" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {availablePromptTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActivePromptTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePromptTab === tab ? "border border-teal/30 bg-teal/15 text-white" : "border border-white/10 bg-white/5 text-mist/75 hover:border-teal/40 hover:text-white"
              }`}
            >
              {providerLabels[tab]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copyActive} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/50 hover:bg-teal/10">
          Kopieer inhoud
        </button>
        {downloadable && runId ? (
          <a
            href={`/api/runs/${runId}/artifact/${activeDownloadType}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber/50 hover:bg-amber/10"
          >
            Download bestand
          </a>
        ) : (
          <button type="button" onClick={downloadActive} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber/50 hover:bg-amber/10">
            Download bestand
          </button>
        )}
      </div>

      <pre className="code-scroll mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-ink/80 p-4 text-sm leading-7 text-mist/90">
        <code>{activeContent}</code>
      </pre>
      {activeTab === "executionBundle" ? (
        <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-mist/90">
          Gebruik dit als compleet AI-werkpakket wanneer de AI-assistent het hele team vormt.
        </div>
      ) : null}
      {activeTab === "prompt" ? (
        <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/10 p-4 text-sm text-mist/90">
          Gebruik de base prompt als neutrale basis of kies een provider-tab voor directe inzet in je AI-workflow.
        </div>
      ) : null}
    </div>
  );
}
