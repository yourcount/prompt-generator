import { SectionShell } from "@/components/section-shell";
import { WorkflowVisual } from "@/components/workflow-visual";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <SectionShell eyebrow="Uitleg" title="Zo werkt de prompt generator" intro="De generator verwacht geen losse creatieve prompt, maar een gestructureerde runinput. Daardoor blijven output, quality gates en lessons learned controleerbaar.">
        <WorkflowVisual />
      </SectionShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell title="Wat voer je in?" intro="De wizard vraagt projectcontext, doelgroepen, repo-artifacts, lessons learned en open vragen. Daarmee kan de generator relevante scope en risico’s zichtbaar houden.">
          <ul className="space-y-3 text-sm leading-7 text-mist/80">
            <li>Projectcontext bepaalt doel en toon.</li>
            <li>Repo-artifacts maken claims evidence-based.</li>
            <li>Lessons learned voorkomen herhaalde fouten.</li>
            <li>Open questions zorgen dat high-impact ambiguities niet verdwijnen.</li>
          </ul>
        </SectionShell>
        <SectionShell title="Wat krijg je terug?" intro="Elke run levert vijf direct leesbare outputs op. Je hoeft dus niet te zoeken in losse logs of markdownbestanden.">
          <ul className="space-y-3 text-sm leading-7 text-mist/80">
            <li>SUPER_PROMPT voor de volgende Codex-start.</li>
            <li>PROMPT_PLAYBOOK met rationale en anti-patronen.</li>
            <li>Decision register voor structurele keuzes.</li>
            <li>Prompt events als JSONL-log.</li>
            <li>Run report met score, warnings en diff-overzicht.</li>
          </ul>
        </SectionShell>
      </div>
    </div>
  );
}
