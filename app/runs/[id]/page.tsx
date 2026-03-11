import { notFound } from "next/navigation";

import { ArtifactTabs } from "@/components/artifact-tabs";
import { getStorage } from "@/lib/storage";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getStorage().getRun(id);
  if (!run) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(18rem,0.28fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-teal">Run</p>
          <h1 className="mt-3 font-serif text-5xl text-white">{run.input.project_context.brand}</h1>
          <p className="mt-4 text-lg leading-8 text-mist/80">{run.input.project_context.website_goal}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-amber">Status</p>
          <div className="mt-3 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white">{run.qualityScore}</div>
          <p className="mt-4 text-sm leading-7 text-mist/70">{new Date(run.createdAt).toLocaleString("nl-NL")}</p>
          <div className="mt-4 space-y-2 text-sm leading-7 text-mist/80">
            <p>Warnings: {run.warnings.length}</p>
            <p>Blocking issues: {run.blockingIssues.length}</p>
          </div>
        </div>
      </div>

      {run.warnings.length > 0 ? (
        <div className="mt-8 rounded-3xl border border-amber/30 bg-amber/10 p-5 text-sm leading-7 text-mist/90">
          <strong className="block text-white">Warnings</strong>
          <ul className="mt-3 space-y-1">
            {run.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {run.blockingIssues.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          <strong className="block">Blocking issues</strong>
          <ul className="mt-3 space-y-1">
            {run.blockingIssues.map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8">
        <ArtifactTabs runId={run.id} artifacts={run.artifacts} />
      </div>
    </div>
  );
}
