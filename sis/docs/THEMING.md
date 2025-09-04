# Theming Guide

This project ships with a flexible, modern theming system built on CSS variables and Tailwind v4 tokens. It supports Light, Dark, and example brand themes out of the box, with a header toggle and `localStorage` persistence.

## Overview

- Tokens are defined as CSS variables in `src/app/globals.css` and mapped to Tailwind tokens via `@theme inline`.
- The active theme is chosen by setting `data-theme` on the `<html>` element. The `ThemeProvider` manages this and persists the choice.
- Default behavior follows the system color scheme if no explicit theme is selected.

Files of interest:

- `src/app/globals.css` — theme tokens and palettes
- `src/components/theme-provider.tsx` — theme state, persistence, system sync
- `src/components/theme-toggle.tsx` — simple UI to switch themes

## Built-in Themes

- `light` — modern neutral surfaces with indigo accent
- `dark` — deep ink background with soft neutral foregrounds, indigo accent
- `emerald` — brand example (green accent)
- `ocean` — brand example (cyan/blue accent)

Use the toggle in the header to switch between: System, Light, Dark, and Emerald.

## Create a Custom Theme

1) Define the palette in CSS

Add a new `data-theme` block to `src/app/globals.css` and set the tokens. Example `ocean` theme:

```css
[data-theme="ocean"] {
  color-scheme: light;
  --background: #f6fbff;
  --foreground: #0b1f33;
  --card: #ffffff;
  --card-foreground: #0b1f33;
  --muted: #e6f3ff;
  --muted-foreground: #375a7f;
  --border: #cfe8ff;
  --accent: #2563eb; /* blue-600 */
  --accent-foreground: #ffffff;
}
```

2) Expose it in the UI (optional)

Add an option to the toggle in `src/components/theme-toggle.tsx`:

```tsx
<option value="ocean">Ocean</option>
```

3) Set it programmatically (optional)

Anywhere in client code:

```tsx
import { useTheme } from "@/components/theme-provider";

const { setTheme } = useTheme();
setTheme("ocean");
```

## Use Tokens in Components

Prefer token-backed utility classes over hard-coded colors so themes apply consistently:

- Backgrounds: `bg-background`, `bg-card`, `bg-muted`
- Text: `text-foreground`, `text-muted-foreground`
- Borders: `border-border`
- Accent: `bg-accent`, `text-accent-foreground`

Example:

```tsx
<button className="bg-accent text-accent-foreground hover:opacity-90 px-3 py-2 rounded">
  Action
"</button>
```

## Optional: Prevent Theme Flicker on First Paint

To avoid a flash of the default theme before React hydrates, you can inline a small script in `src/app/layout.tsx` to set `data-theme` early:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function(){
        try {
          var t = localStorage.getItem('theme') || 'system';
          var m = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', t === 'system' ? m : t);
        } catch (_) {}
      })();
    `,
  }}
/>
```

This step is optional; the app already follows the system theme by default.

## Tips

- Keep contrast high enough for accessibility (WCAG AA+).
- Reuse neutral scales (slate/zinc) for surfaces; reserve accent for interactive elements.
- If you add many themes, consider storing the available list in a constant shared by the toggle and docs.
