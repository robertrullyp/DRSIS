export default function GalleryLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-72 animate-pulse rounded bg-muted/50" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/40" />
      </div>
      <div className="neo-card h-24 animate-pulse rounded-xl bg-muted/30 p-4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="neo-card overflow-hidden">
            <div className="aspect-video animate-pulse bg-muted/40" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
