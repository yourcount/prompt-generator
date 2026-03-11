import Link from "next/link";

import { ExampleCards } from "@/components/example-cards";
import { SectionShell } from "@/components/section-shell";
import { WorkflowVisual } from "@/components/workflow-visual";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow sm:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-teal">Prompt Generator Web App</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight text-white sm:text-6xl">
            Maak van ruwe projectlessons een bruikbare superprompt.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-mist/80">
            Prompt Foundry combineert uitleg, validatie, quality gates en directe artifact-output in één publieke workflow. Geen losse markdowns of terminalstappen meer voor de eerste run.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/generator" className="rounded-full bg-amber px-5 py-3 text-sm font-bold text-ink transition hover:bg-[#ffbb6d]">
              Open generator
            </Link>
            <Link href="/hoe-het-werkt" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-teal/50 hover:bg-teal/10">
              Begrijp de workflow
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-panel/80 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.24em] text-amber">Waarom dit bestaat</p>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-mist/80">
            <li>Gebruiksvriendelijke wizard voor gemengde doelgroepen.</li>
            <li>Directe outputtabs voor prompt, playbook, logs en report.</li>
            <li>Vercel-ready opslag met dev/local fallback.</li>
            <li>Voorbeelden en uitleg zodat nieuwe users meteen snappen wat de generator doet.</li>
          </ul>
        </div>
      </section>

      <SectionShell eyebrow="Input → gates → output" title="Hoe de flow werkt" intro="De webapp laat dezelfde generator-core draaien als de CLI, maar zet die om naar een begeleide flow met directe zichtbaarheid van warnings, blokkades en artifacts.">
        <WorkflowVisual />
      </SectionShell>

      <SectionShell eyebrow="Voorbeelden" title="Start met een bekend patroon" intro="De generator blijft generiek. Deze voorbeelden laten zien hoe de input eruitziet en waarom verschillende cases andere lessons learned opleveren.">
        <ExampleCards />
      </SectionShell>
    </div>
  );
}
