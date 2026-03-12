export default function SearchLoading() {
  return (
    <main className="flex min-h-0 flex-1 px-4 pb-4 md:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <section className="grid min-h-0 flex-1 border border-border bg-card lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
          <aside className="flex min-h-0 flex-col border-b border-border p-5 lg:border-r lg:border-b-0 lg:p-7">
            <div className="h-14 border border-border bg-muted/30" />
            <div className="mt-5 flex-1 border border-dashed border-border bg-muted/20" />
          </aside>
          <div className="p-5 lg:p-7">
            <div className="h-full min-h-64 border border-dashed border-border bg-muted/20" />
          </div>
        </section>
      </div>
    </main>
  );
}
