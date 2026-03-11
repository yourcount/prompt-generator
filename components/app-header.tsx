import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/generator", label: "Generator" },
  { href: "/voorbeelden", label: "Voorbeelden" },
  { href: "/artifacts", label: "Artifacts" }
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-2xl text-white">
          Prompt Foundry
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-mist/80 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/generator"
          className="rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal hover:bg-teal/20"
        >
          Start generator
        </Link>
      </div>
    </header>
  );
}
