import { getProviderProfiles } from "@/lib/prompt-generator/providers";

export function ProviderProfileCards() {
  const profiles = getProviderProfiles();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {profiles.map((profile) => (
        <article key={profile.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-teal">{profile.label}</p>
          <h3 className="mt-3 font-serif text-2xl text-white">{profile.recommendedModelFamily}</h3>
          <p className="mt-3 text-sm leading-7 text-mist/75">Profielversie {profile.profileVersion}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber">Laatst geverifieerd: {profile.lastVerifiedAt}</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-mist/80">
            {profile.bestPracticeSummary.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
