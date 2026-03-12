"use client";

export default function SearchError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-0 flex-1 px-4 pb-4 md:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <section className="border border-dashed border-rose-500/40 bg-rose-500/8 p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-rose-700 dark:text-rose-300">
            Search Error
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            The search view failed to render.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {error.message}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Retry
          </button>
        </section>
      </div>
    </main>
  );
}
