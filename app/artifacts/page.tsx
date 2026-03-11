import Link from "next/link";

import { getStorage } from "@/lib/storage";

export default async function ArtifactsPage() {
  const runs = await getStorage().listRuns(12);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.32em] text-amber">Artifacts</p>
        <h1 className="mt-3 font-serif text-5xl text-white">Recente runs en hun output.</h1>
        <p className="mt-4 text-lg leading-8 text-mist/80">Elke succesvolle run bewaart input, artifacts en run-report. Daardoor kun je generator-output altijd teruglezen of opnieuw downloaden.</p>
      </div>
      <div className="grid gap-5">
        {runs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-mist/70 shadow-glow">Nog geen runs opgeslagen. Genereer eerst een run via de generator.</div>
        ) : (
          runs.map((run) => (
            <Link key={run.id} href={`/runs/${run.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow transition hover:border-teal/40 hover:bg-white/[0.07]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-teal">{run.qualityScore}</p>
                  <h2 className="mt-2 font-serif text-3xl text-white">{run.brand}</h2>
                  <p className="mt-2 text-sm text-mist/70">{run.sourceProject} · {new Date(run.createdAt).toLocaleString("nl-NL")}</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white">Bekijk output</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
