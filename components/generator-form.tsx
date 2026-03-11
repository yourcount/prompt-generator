"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { createRun } from "@/lib/prompt-generator/api";
import { defaultRunInput } from "@/lib/prompt-generator/defaults";
import { getProviderProfiles } from "@/lib/prompt-generator/providers";
import type { LessonLabel, PromptRunInput, ProviderId } from "@/lib/prompt-generator/types";

const steps = [
  { title: "Projectcontext", helper: "Wie is het project, wat is het doel en welke AI-profielen moeten direct output krijgen?" },
  { title: "Doelgroepen en doelen", helper: "Voor wie maak je deze prompt-run en wat moet hij concreet afdwingen?" },
  { title: "Repo-artifacts", helper: "Welke paden en categorieën onderbouwen de run?" },
  { title: "Lessons learned", helper: "Leg vast wat werkte, wat misging en wat structureel is veranderd." },
  { title: "Open vragen en scope notes", helper: "Welke ambiguities zijn er nog en welke scopekaders moeten zichtbaar blijven?" },
  { title: "Review en genereren", helper: "Controleer de runinput voordat je artifacts laat maken." }
] as const;

const lessonLabels: Array<{ label: LessonLabel; title: string }> = [
  { label: "success", title: "Success" },
  { label: "regression", title: "Regression" },
  { label: "misunderstanding", title: "Misunderstanding" },
  { label: "process_change", title: "Process change" }
];

const providerProfiles = getProviderProfiles();

function toMultiline(items: string[]) {
  return items.join("\n");
}

function fromMultiline(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GeneratorForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultRunInput, null, 2));
  const [form, setForm] = useState<PromptRunInput>(defaultRunInput);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const prettyJson = useMemo(() => JSON.stringify(form, null, 2), [form]);

  const updateForm = (next: PromptRunInput) => {
    setForm(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const patchLesson = (label: LessonLabel, summary: string) => {
    const lessonMap = new Map(form.lessons_learned.map((lesson) => [lesson.label, lesson.summary]));
    lessonMap.set(label, summary);
    updateForm({
      ...form,
      lessons_learned: lessonLabels.map((item) => ({
        label: item.label,
        summary: lessonMap.get(item.label) ?? ""
      }))
    });
  };

  const toggleProvider = (provider: ProviderId) => {
    const current = new Set(form.selectedProviders ?? []);
    if (current.has(provider)) {
      current.delete(provider);
    } else {
      current.add(provider);
    }

    updateForm({
      ...form,
      selectedProviders: providerProfiles.map((profile) => profile.id).filter((id) => current.has(id))
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setMessages([]);

    try {
      const payload = advanced ? (JSON.parse(jsonText) as PromptRunInput) : form;
      const result = await createRun(payload);
      router.push(`/runs/${result.id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Er ging iets mis tijdens genereren.");
    } finally {
      setSubmitting(false);
    }
  };

  const parseAdvanced = () => {
    try {
      const parsed = JSON.parse(jsonText) as PromptRunInput;
      setForm(parsed);
      setMessages(["JSON is geldig en is teruggesynchroniseerd naar het formulier."]);
      setError(null);
    } catch {
      setError("JSON is ongeldig. Corrigeer de syntax voordat je verdergaat.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-teal">Wizard</p>
            <h2 className="mt-2 font-serif text-3xl text-white">{steps[step].title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-mist/75">{steps[step].helper}</p>
          </div>
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber/40 hover:bg-amber/10"
          >
            {advanced ? "Terug naar wizard" : "Open advanced panel"}
          </button>
        </div>

        {!advanced ? (
          <div className="mt-8 space-y-6">
            {step === 0 ? (
              <>
                <Field label="Merknaam" help="Wordt gebruikt in de prompttitel en context.">
                  <input className="input" value={form.project_context.brand} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, brand: e.target.value } })} />
                </Field>
                <Field label="Bron van het gesprek" help="Bijvoorbeeld afgerond traject, interview of samenvatting.">
                  <input className="input" value={form.conversation_source.source} onChange={(e) => updateForm({ ...form, conversation_source: { ...form.conversation_source, source: e.target.value } })} />
                </Field>
                <Field label="Conversation type" help="Bijvoorbeeld phase-summary of full-transcript.">
                  <input className="input" value={form.conversation_source.type} onChange={(e) => updateForm({ ...form, conversation_source: { ...form.conversation_source, type: e.target.value } })} />
                </Field>
                <Field label="Korte samenvatting" help="Vat de context compact samen; deze tekst voedt de generator.">
                  <textarea className="textarea" value={form.conversation_source.summary} onChange={(e) => updateForm({ ...form, conversation_source: { ...form.conversation_source, summary: e.target.value } })} />
                </Field>
                <Field label="Website- of productdoel" help="Wat moet de uiteindelijke run concreet opleveren of afdwingen?">
                  <textarea className="textarea" value={form.project_context.website_goal} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, website_goal: e.target.value } })} />
                </Field>
                <Field label="Tone of voice" help="Bijvoorbeeld warm, professioneel of technisch en direct.">
                  <input className="input" value={form.project_context.tone_of_voice} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, tone_of_voice: e.target.value } })} />
                </Field>
                <Field label="Providerprofielen" help="Dezelfde run wordt vertaald naar directe prompts per geselecteerde AI-provider.">
                  <div className="flex flex-wrap gap-3">
                    {providerProfiles.map((profile) => {
                      const active = (form.selectedProviders ?? []).includes(profile.id);
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => toggleProvider(profile.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "border border-teal/40 bg-teal/15 text-white" : "border border-white/10 bg-white/5 text-mist/75 hover:border-teal/40 hover:text-white"}`}
                        >
                          {profile.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Field label="Doelgroepen" help="Eén doelgroep per regel.">
                  <textarea className="textarea" value={toMultiline(form.project_context.audiences)} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, audiences: fromMultiline(e.target.value) } })} />
                </Field>
                <Field label="Features / deliverables" help="Eén feature of deliverable per regel.">
                  <textarea className="textarea" value={toMultiline(form.project_context.features)} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, features: fromMultiline(e.target.value) } })} />
                </Field>
                <Field label="Succescriteria" help="Welke uitkomst moet deze generator-run helpen afdwingen?">
                  <textarea className="textarea" value={toMultiline(form.success_criteria)} onChange={(e) => updateForm({ ...form, success_criteria: fromMultiline(e.target.value) })} />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Field label="Repo-paden" help="Concrete paden helpen claims evidence-based te houden.">
                  <textarea className="textarea" value={toMultiline(form.repo_artifacts.paths)} onChange={(e) => updateForm({ ...form, repo_artifacts: { ...form.repo_artifacts, paths: fromMultiline(e.target.value) } })} />
                </Field>
                <Field label="Artifact-categorieën" help="Gebruik dit als sommige repo-paden nog niet exact bekend zijn.">
                  <textarea className="textarea" value={toMultiline(form.repo_artifacts.categories)} onChange={(e) => updateForm({ ...form, repo_artifacts: { ...form.repo_artifacts, categories: fromMultiline(e.target.value) } })} />
                </Field>
                <Field label="Constraints" help="Denk aan scope, teamgrenzen, kwaliteitseisen en deploymentrandvoorwaarden.">
                  <textarea className="textarea" value={toMultiline(form.project_context.constraints)} onChange={(e) => updateForm({ ...form, project_context: { ...form.project_context, constraints: fromMultiline(e.target.value) } })} />
                </Field>
              </>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {lessonLabels.map((item) => (
                  <Field key={item.label} label={item.title} help="Beschrijf kort wat deze lesson betekent voor volgende runs.">
                    <textarea
                      className="textarea min-h-[180px]"
                      value={form.lessons_learned.find((lesson) => lesson.label === item.label)?.summary ?? ""}
                      onChange={(e) => patchLesson(item.label, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            ) : null}

            {step === 4 ? (
              <>
                <Field label="Open questions" help="Laat high-impact ambiguities zichtbaar; één item per regel.">
                  <textarea className="textarea" value={toMultiline(form.open_questions)} onChange={(e) => updateForm({ ...form, open_questions: fromMultiline(e.target.value) })} />
                </Field>
                <Field label="Scope notes" help="Gebruik dit voor implementatiekaders en grenzen die niet in de hoofdcontext passen.">
                  <textarea className="textarea" value={toMultiline(form.scope_notes)} onChange={(e) => updateForm({ ...form, scope_notes: fromMultiline(e.target.value) })} />
                </Field>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <Field label="Review van de JSON-run" help="Hier zie je exact wat naar de generator gaat.">
                  <pre className="code-scroll max-h-[28rem] overflow-auto rounded-3xl border border-white/10 bg-ink/80 p-4 text-xs leading-6 text-mist/85">
                    <code>{prettyJson}</code>
                  </pre>
                </Field>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <Field label="Directe JSON-runinput" help="Gebruik dit als je liever rechtstreeks het volledige contract bewerkt.">
              <textarea className="min-h-[34rem] w-full rounded-3xl border border-white/10 bg-ink/70 p-4 text-sm leading-7 text-mist/90 outline-none transition focus:border-teal/50" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={parseAdvanced} className="rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/20">
                JSON valideren en syncen
              </button>
              <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-mist/60">Schema help: v4 inputcontract + providerprofielen</div>
            </div>
          </div>
        )}

        {messages.length > 0 ? <div className="mt-6 rounded-2xl border border-teal/30 bg-teal/10 p-4 text-sm text-mist/90">{messages.join(" ")}</div> : null}
        {error ? <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <div className="flex gap-2">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                className={`h-2.5 w-10 rounded-full transition ${index === step ? "bg-amber" : "bg-white/10 hover:bg-white/20"}`}
                aria-label={`Ga naar stap ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 disabled:opacity-40">
              Vorige
            </button>
            {step < steps.length - 1 && !advanced ? (
              <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/20">
                Volgende
              </button>
            ) : null}
            <button type="button" onClick={submit} disabled={submitting} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-[#ffbb6d] disabled:opacity-70">
              {submitting ? "Bezig met genereren..." : "Genereer artifacts"}
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-amber">Waarom vragen we dit?</p>
          <p className="mt-3 text-sm leading-7 text-mist/80">De wizard vraagt alleen de input die de generator nodig heeft om context, lessons learned, quality gates en provider-specifieke promptvarianten consistent op te bouwen.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-teal">Wat komt eruit?</p>
          <ul className="mt-3 space-y-3 text-sm leading-7 text-mist/80">
            <li>Base prompt als neutrale bron van waarheid</li>
            <li>Direct inzetbare prompts voor OpenAI, Claude en Gemini</li>
            <li>Playbook, decision register, eventlog en run-report</li>
            <li>Traceerbare output die je kunt kopiëren of downloaden</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.22em] text-amber">Laatst geverifieerd</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-mist/80">
            {providerProfiles.map((profile) => (
              <li key={profile.id}>{profile.label}: {profile.profileVersion} · {profile.lastVerifiedAt}</li>
            ))}
          </ul>
        </div>
      </aside>
      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(12, 18, 31, 0.7);
          padding: 0.9rem 1rem;
          color: #edf3ff;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .input:focus,
        .textarea:focus {
          border-color: rgba(48, 204, 200, 0.45);
        }

        .textarea {
          min-height: 11rem;
          width: 100%;
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(12, 18, 31, 0.7);
          padding: 1rem;
          color: #edf3ff;
          outline: none;
          transition: border-color 0.2s ease;
        }
      `}</style>
    </div>
  );
}

function Field({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-mist/65">{help}</p>
      </div>
      {children}
    </label>
  );
}
