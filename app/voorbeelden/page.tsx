import { ExampleCards } from "@/components/example-cards";

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.32em] text-amber">Voorbeelden</p>
        <h1 className="mt-3 font-serif text-5xl text-white">Reference cases voor betere starts.</h1>
        <p className="mt-4 text-lg leading-8 text-mist/80">Gebruik voorbeelden om het inputcontract en de artifactvorm te begrijpen. De generator zelf blijft generiek.</p>
      </div>
      <ExampleCards />
    </div>
  );
}
