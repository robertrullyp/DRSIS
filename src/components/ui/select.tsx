import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: Props) {
  return (
    <select
      className={`border border-border rounded-md px-3 py-2 bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
