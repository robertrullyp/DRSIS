export default function PublicLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted/50" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="neo-card space-y-3 p-4 sm:p-5">
            <div className="aspect-video animate-pulse rounded-lg bg-muted/40" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted/30" />
          </div>
        ))}
      </div>
    </main>
  );
}
