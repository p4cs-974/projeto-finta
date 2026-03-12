export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pb-4 md:px-6">
      <section className="w-full max-w-5xl border border-border bg-card p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Welcome back to Finta
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use the search view to inspect cached and live market quotes for B3
          stocks and crypto assets.
        </p>
      </section>
    </main>
  );
}
