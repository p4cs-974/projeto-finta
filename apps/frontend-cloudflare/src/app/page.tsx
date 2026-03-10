export default function AppPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-2xl border border-border bg-card p-8 text-card-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Finta
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Authenticated app shell</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You reached the protected area. Unauthenticated requests are redirected
          to <code>/login</code>.
        </p>
      </div>
    </div>
  );
}
