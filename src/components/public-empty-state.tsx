import Link from "next/link";

type EmptyAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicEmptyStateProps = {
  title: string;
  description: string;
  actions?: EmptyAction[];
};

export default function PublicEmptyState({ title, description, actions = [] }: PublicEmptyStateProps) {
  return (
    <section className="neo-card border border-dashed p-6 text-center sm:p-8">
      <div className="mx-auto max-w-xl space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={
                action.variant === "primary"
                  ? "rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
                  : "rounded-md border px-3 py-2 text-sm hover:bg-muted/70"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
