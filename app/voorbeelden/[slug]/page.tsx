import { notFound } from "next/navigation";

import { ArtifactTabs } from "@/components/artifact-tabs";
import { getExampleBySlug } from "@/lib/examples/examples";
import { createRunId, generatePromptRun } from "@/lib/prompt-generator/core";

export default async function ExampleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) notFound();

  const result = generatePromptRun(example.input, {
    runId: createRunId(example.input.run_metadata.source_project, new Date(example.input.run_metadata.date)),
    selectedProviders: example.input.selectedProviders
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.32em] text-amber">Voorbeeldcase</p>
        <h1 className="mt-3 font-serif text-5xl text-white">{example.title}</h1>
        <p className="mt-4 text-lg leading-8 text-mist/80">{example.summary}</p>
        <p className="mt-3 text-base leading-7 text-mist/65">{example.whyItMatters}</p>
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-mist/75 shadow-glow">
        Dit is een referentiecase. De generator blijft generiek; gebruik dit voorbeeld om inputstructuur, providerkeuze en outputvorm te begrijpen.
      </div>
      <div className="mt-8">
        <ArtifactTabs artifacts={result.artifacts} downloadable={false} />
      </div>
    </div>
  );
}
