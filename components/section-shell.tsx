import type { ReactNode } from "react";

export function SectionShell({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="prose-shell p-6 sm:p-8 lg:p-10">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-amber">{eyebrow}</p> : null}
      <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">{title}</h2>
      {intro ? <p className="mt-3 max-w-3xl text-base leading-8 text-mist/80">{intro}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
