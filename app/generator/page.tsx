import { GeneratorForm } from "@/components/generator-form";

export default function GeneratorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-4xl">
        <p className="text-xs uppercase tracking-[0.32em] text-amber">Generator</p>
        <h1 className="mt-3 font-serif text-5xl text-white">Vul je run in en genereer direct prompts en artifacts.</h1>
        <p className="mt-4 text-lg leading-8 text-mist/80">
          De wizard bouwt één gedeelde run en vertaalt die vervolgens naar provider-specifieke prompts voor OpenAI, Claude en Gemini. Je ziet meteen warnings, blokkades en het uiteindelijke artifactpakket.
        </p>
      </div>
      <div className="mt-8">
        <GeneratorForm />
      </div>
    </div>
  );
}
