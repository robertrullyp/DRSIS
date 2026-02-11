export default function PublicPageLoading() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-muted/50" />
      </div>
      <div className="neo-card space-y-3 p-5 sm:p-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-4 w-full animate-pulse rounded bg-muted/30" />
        ))}
      </div>
    </main>
  );
}
