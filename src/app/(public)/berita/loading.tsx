export default function NewsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-72 animate-pulse rounded bg-muted/50" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/40" />
      </div>
      <div className="neo-card h-24 animate-pulse rounded-xl bg-muted/30 p-4" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="neo-card space-y-3 p-5 sm:p-6">
            <div className="h-52 animate-pulse rounded-lg bg-muted/40" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted/40" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted/40" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
          </div>
        ))}
      </div>
    </main>
  );
}
