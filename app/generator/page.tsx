import { GeneratorForm } from "@/components/generator-form";

export default function GeneratorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.32em] text-teal">Generator</p>
        <h1 className="mt-3 font-serif text-5xl text-white">Vul je run in en genereer direct artifacts.</h1>
        <p className="mt-4 text-lg leading-8 text-mist/80">De wizard is de hoofdroute. Het advanced panel is er voor gebruikers die liever direct op JSON-niveau werken.</p>
      </div>
      <GeneratorForm />
    </div>
  );
}
