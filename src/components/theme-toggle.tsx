"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">Theme</span>
      <select
        className="border border-border rounded px-2 py-1 bg-card text-foreground"
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        aria-label="Theme"
      >
        <option value="system">System ({resolvedTheme})</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="emerald">Emerald</option>
        <option value="ocean">Ocean</option>
      </select>
    </label>
  );
}
