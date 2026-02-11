import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`border border-border rounded-md px-3 py-2 bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 ${className}`}
      {...props}
    />
  );
}
