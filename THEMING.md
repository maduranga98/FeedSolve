# Theming (light & dark)

The dashboard and the public submission form both support a light and a dark
theme, plus a "follow the OS" mode. Light mode is unchanged from before this
was added — every light value is reproduced exactly.

## How it works

The resolved theme lives in one place: a `data-theme="light" | "dark"`
attribute on `<html>`.

| Piece | Where | Job |
| --- | --- | --- |
| Pre-paint script | `index.html` | Reads `localStorage` (or the OS preference) and stamps `data-theme` **before first paint**, so there is no flash of the wrong theme. |
| Theme store | `src/lib/theme.ts` | Reads/writes the preference, resolves `system`, applies the attribute, updates `<meta name="theme-color">`. |
| Provider & hook | `src/hooks/useTheme.tsx` | `<ThemeProvider>` wraps the app in `App.tsx`; `useTheme()` exposes `{ mode, theme, setMode, toggle }`. |
| Controls | `src/components/Shared/ThemeToggle.tsx` | `<ThemeToggle />` (light / system / dark segmented control, used in the sidebar) and `<FloatingThemeToggle />` (a single button for chrome-less pages — the public form, tracking, resolution feed and auth screens). |
| Tokens | `src/index.css` | `--fs-*` semantic tokens declared once for light and once for `[data-theme='dark']`, mapped into Tailwind's `@theme`. Also defines the `dark:` variant. |
| Generated tokens | `src/styles/theme.generated.css` | One variable per literal colour used in the app, with its light and derived dark value. |

`mode` is what the user picked (`light`, `dark` or `system`); `theme` is what is
actually on screen. Only an explicit choice is persisted, so a user on `system`
keeps following the OS.

## Colour tokens

Prefer the semantic utilities for anything new — they are already theme-aware:

```
bg-color-bg  bg-color-surface  text-color-primary  text-color-body-text
text-color-muted-text  border-color-border  text-color-accent
```

The neutral Tailwind scales (`gray`, `slate`, `zinc`, `neutral`, `stone`) are
inverted under `[data-theme='dark']` in `src/index.css`, so `bg-gray-50`,
`text-gray-700` and `border-gray-200` read correctly in both themes with no
extra classes.

Chromatic scales (`blue`, `red`, `green`, …) are **not** inverted — the same
variable backs both `bg-blue-600` (a button that must stay blue) and
`text-blue-600` (copy that must lighten). Those classes are paired with an
explicit `dark:` counterpart instead, e.g.
`bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200`.

## The generator

Most of the UI predates theming and bakes colours into arbitrary utilities
(`text-[#1c1917]`, `bg-[#f5e6df]`). `scripts/generate-theme.mjs` retrofits
those:

```bash
npm run theme:generate
```

It rewrites each such utility to reference a variable
(`text-[var(--c-t1c1917)]`), adds the missing `dark:` pairs on chromatic
scales, and regenerates `src/styles/theme.generated.css` with a light value
(the original hex, unchanged) and a derived dark value.

Dark values are derived per *role*, because the utility prefix says how the
colour is used:

- **text** (`text-`, `placeholder-`, `fill-`, …) — flips along the lightness
  axis, so near-black copy becomes near-white and muted greys stay muted.
  Colours that are already light are left alone; they sit on accents.
- **surface** (`bg-`, `from-`, `to-`, …) — compresses into a narrow dark band
  that preserves ordering, so the page background stays behind cards.
  Near-neutral surfaces pick up a hint of the brand hue; tinted wells keep
  their hue at a lower saturation; saturated buttons and badges are untouched.
- **border** (`border-`, `ring-`, `divide-`) — lands just above the surface
  band. Saturated borders are accents and keep their colour.

The script is idempotent — re-running it only picks up newly added colours.

## Adding new UI

Use the semantic `*-color-*` utilities, or plain neutral scales. If you do need
a literal colour, write it normally (`bg-[#123456]`) and run
`npm run theme:generate`; if a chromatic scale needs a different dark pairing
than the default, write the `dark:` class yourself and the generator will leave
it alone.

Two stylesheets predate the token system and carry their own hooks: the
`FormBuilder` CSS files use `--fb-*` variables declared at the bottom of
`src/index.css`, and the public form's branded styles in
`src/pages/public/SubmitFeedback.tsx` restate their white gradients under
`[data-theme='dark']`. Customer brand colours are deliberately **not**
re-themed — an accent should look the same to a submitter in either theme.
