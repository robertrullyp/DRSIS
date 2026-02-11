import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-foreground hover:opacity-90"
      : variant === "secondary"
      ? "bg-muted text-foreground hover:bg-muted/80"
      : variant === "ghost"
      ? "hover:bg-muted"
      : "border border-border hover:bg-muted";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
