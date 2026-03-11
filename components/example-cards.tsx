import Link from "next/link";

import { exampleCases } from "@/lib/examples/examples";

export function ExampleCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {exampleCases.map((example) => (
        <article key={example.slug} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-teal">Voorbeeld</p>
          <h3 className="mt-3 font-serif text-2xl text-white">{example.title}</h3>
          <p className="mt-3 text-sm leading-7 text-mist/80">{example.summary}</p>
          <p className="mt-3 text-sm leading-7 text-mist/60">{example.whyItMatters}</p>
          <Link href={`/voorbeelden/${example.slug}`} className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/50 hover:bg-teal/10">
            Bekijk voorbeeld
          </Link>
        </article>
      ))}
    </div>
  );
}
