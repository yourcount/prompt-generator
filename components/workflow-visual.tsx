const steps = [
  { label: "Input", detail: "Projectcontext, repo-artifacts en lessons learned" },
  { label: "Gates", detail: "Validatie, warnings en blocking issues" },
  { label: "Artifacts", detail: "Super prompt, playbook, logs en report" },
  { label: "Snapshot", detail: "Bewaarbare run die later terug te lezen is" }
];

export function WorkflowVisual() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.label} className="relative rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-sm font-semibold text-amber">
            {index + 1}
          </div>
          <h3 className="text-lg font-semibold text-white">{step.label}</h3>
          <p className="mt-2 text-sm leading-6 text-mist/75">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}
