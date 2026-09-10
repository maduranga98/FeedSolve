#!/usr/bin/env node
/**
 * Dark-theme retrofit generator.
 *
 * The UI was built with literal colours baked into arbitrary Tailwind
 * utilities (`text-[#1c1917]`, `bg-[#f5e6df]`, ...). This script:
 *
 *   1. rewrites every such utility to reference a CSS variable
 *      (`text-[var(--c-t1c1917)]`) so the value can be swapped per theme,
 *      and
 *   2. emits `src/styles/theme.generated.css` holding the light value
 *      (identical to the original hex, so light mode is pixel-identical)
 *      and a derived dark value.
 *
 * Dark values are derived per *role* — text, surface or border — because the
 * utility prefix tells us how the colour is used: dark text has to become
 * light, light surfaces have to become dark, and saturated accents mostly
 * stay put.
 *
 * Run with `npm run theme:generate` after adding new literal colours.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'styles', 'theme.generated.css');

/** Utility prefix -> semantic role. */
const ROLES = {
  text: 't', placeholder: 't', decoration: 't', caret: 't', fill: 't', stroke: 't',
  bg: 's', from: 's', to: 's', via: 's', accent: 's', shadow: 's',
  border: 'b', divide: 'b', ring: 'b', outline: 'b',
};
const PREFIXES = Object.keys(ROLES).join('|');

/* ------------------------------------------------------------------ colour */

const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

function parseHex(hex) {
  let h = hex.toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function rgbToHsl({ r, g, b, a }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l, a };
}

function hslToHex({ h, s, l, a }) {
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue = (p, q, t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to = (v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}${a < 1 ? to(a) : ''}`;
}

/**
 * Chroma in 0..1 terms. HSL saturation is unreliable at the extremes — a
 * near-white like #f5f0ec reports a high saturation while reading as neutral —
 * so tint detection uses raw chroma instead.
 */
const chromaOf = ({ r, g, b }) => Math.max(r, g, b) - Math.min(r, g, b);

/** Brand hue, used to keep neutral dark surfaces subtly warm. */
const WARM_HUE = 30 / 360;
const TINT_THRESHOLD = 15 / 255;

/**
 * Text keeps its hue but flips along the lightness axis, so near-black copy
 * becomes near-white and muted greys stay proportionally muted. Colours that
 * are already light are left alone: they sit on coloured or dark backgrounds
 * in both themes.
 */
function darkText({ h, s, l, a }) {
  if (l >= 0.82) return null;
  return { h, s: Math.min(s, 0.7), l: clamp(0.88 - 0.58 * l, 0.42, 0.94), a };
}

/**
 * Surfaces compress into a narrow dark band while preserving their ordering,
 * so the page background stays behind cards. Near-neutral surfaces pick up a
 * hint of the brand hue instead of going flat grey; tinted chips (accent,
 * info, success wells) keep their identity at a muted saturation. Saturated
 * mid-tones — buttons and badges — are left untouched.
 */
function darkSurface({ h, s, l, a }, chroma) {
  const tinted = chroma >= TINT_THRESHOLD;
  const neutral = (lightness) => ({ h: WARM_HUE, s: 0.05, l: lightness, a });

  if (l >= 0.86) {
    const next = 0.115 + (l - 0.86) * 0.45;
    return tinted ? { h, s: Math.min(s * 0.55, 0.32), l: next + 0.015, a } : neutral(next);
  }
  if (l >= 0.55) {
    const next = 0.19 + (l - 0.55) * 0.29;
    return tinted ? { h, s: Math.min(s * 0.6, 0.3), l: next, a } : neutral(next);
  }
  if (l >= 0.3) return null;
  const next = 0.17 + l * 0.3;
  return tinted ? { h, s: Math.min(s, 0.4), l: next, a } : neutral(next);
}

/**
 * Borders land just above the surface band so edges stay readable. Saturated
 * borders are accents (focus rings, selected states) and keep their colour.
 */
function darkBorder({ h, s, l, a }, chroma) {
  if (chroma >= 0.18 && l < 0.7) return null;
  const tinted = chroma >= TINT_THRESHOLD;
  const next = l >= 0.8 ? 0.245 + (l - 0.8) * 0.175 : l >= 0.5 ? 0.285 + (l - 0.5) * 0.1 : null;
  if (next === null) return null;
  return tinted
    ? { h, s: Math.min(s * 0.5, 0.22), l: next, a }
    : { h: WARM_HUE, s: 0.06, l: next, a };
}

const TRANSFORMS = { t: darkText, s: darkSurface, b: darkBorder };

function darkValue(role, hex) {
  const rgb = parseHex(hex);
  const next = TRANSFORMS[role](rgbToHsl(rgb), chromaOf(rgb));
  return next ? hslToHex(next) : null;
}

/* ------------------------------------------------------------------- files */

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const used = new Map(); // varName -> { role, hex }
const register = (role, hex) => {
  const name = `--c-${role}${hex.toLowerCase()}`;
  if (!used.has(name)) used.set(name, { role, hex: hex.toLowerCase() });
  return name;
};

const ARBITRARY = new RegExp(`\\b(${PREFIXES})-\\[#([0-9a-fA-F]{3,8})\\]`, 'g');

// Surface uses of pure white, but never `bg-white/70` (opacity overlays are
// intentional in both themes) and never `text-white` (it sits on accents).
const WHITE = /\b(bg|border|from|to|via)-white(?![\w/-])/g;

/**
 * Chromatic palette scales cannot be flipped wholesale: `bg-red-600` is a
 * button that must stay red while `text-red-800` is copy that has to lighten,
 * and both ends of a scale share one theme variable. So each affected class
 * is paired with an explicit `dark:` counterpart instead — the light end of a
 * scale becomes the dark end for surfaces and borders, and the reverse for
 * text.
 */
const HUES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];
const HUE = HUES.join('|');

/** Utility groups that need pairing, and the shade each one maps to in dark. */
const SHADE_PAIRS = [
  // Tinted wells and gradient stops: light tint -> deep tint.
  { props: ['bg', 'from', 'to', 'via'], map: { 50: 950, 100: 900, 200: 800, 300: 800 } },
  // Outlines: light hairline -> deep hairline.
  { props: ['border', 'divide'], map: { 50: 950, 100: 900, 200: 800, 300: 700 } },
  // Copy and icons: mid/dark ink -> light ink.
  { props: ['text'], map: { 500: 400, 600: 400, 700: 300, 800: 200, 900: 200, 950: 100 } },
];

/** Pairs every chromatic utility in `source` with its dark counterpart. */
function pairShades(source, onReplace) {
  let out = source;
  for (const { props, map } of SHADE_PAIRS) {
    const shades = Object.keys(map).join('|');
    const pattern = new RegExp(
      `(^|[\\s"'\`{])((?:[a-z-]+:)*)(${props.join('|')})-(${HUE})-(${shades})(?![\\w/-])`,
      'g'
    );
    out = out.replace(pattern, (match, _lead, variants, prop, hue, shade, offset, whole) => {
      if (variants.includes('dark:')) return match;
      const paired = ` ${variants}dark:${prop}-${hue}-${map[shade]}`;
      // Idempotent: skip classes an earlier run already paired.
      if (whole.startsWith(paired, offset + match.length)) return match;
      onReplace();
      return `${match}${paired}`;
    });
  }
  return out;
}

let changedFiles = 0;
let replacements = 0;

for (const file of walk(SRC)) {
  const before = readFileSync(file, 'utf8');
  let after = before
    .replace(ARBITRARY, (_m, prefix, hex) => {
      replacements += 1;
      return `${prefix}-[var(${register(ROLES[prefix], hex)})]`;
    })
    .replace(WHITE, (_m, prefix) => {
      replacements += 1;
      return `${prefix}-[var(${register(ROLES[prefix], 'ffffff')})]`;
    });
  after = pairShades(after, () => {
    replacements += 1;
  });
  // Re-register tokens already rewritten by an earlier run so the generated
  // stylesheet stays complete and this script stays idempotent.
  for (const [, role, hex] of after.matchAll(/\(--c-([tsb])([0-9a-f]{3,8})\)/g)) {
    register(role, hex);
  }
  if (after !== before) {
    writeFileSync(file, after);
    changedFiles += 1;
  }
}

/* --------------------------------------------------------------- emit CSS */

const names = [...used.keys()].sort();
const light = names.map((n) => `  ${n}: ${used.get(n).hex.startsWith('#') ? '' : '#'}${used.get(n).hex};`);
const dark = [];
for (const name of names) {
  const { role, hex } = used.get(name);
  const value = darkValue(role, hex);
  if (value) dark.push(`  ${name}: ${value};`);
}

const css = `/*
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run theme:generate\` to regenerate.
 *
 * Every literal colour used by an arbitrary Tailwind utility is exposed as a
 * variable. The \`:root\` block reproduces the original light value exactly;
 * the \`[data-theme="dark"]\` block holds the derived dark counterpart.
 * Colours with no dark entry are theme-independent (saturated accents,
 * buttons, badges) and deliberately inherit the light value.
 */

:root {
${light.join('\n')}
}

[data-theme='dark'] {
${dark.join('\n')}
}
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, css);

console.log(
  `theme: ${replacements} utilities rewritten across ${changedFiles} files; ` +
    `${names.length} tokens (${dark.length} with dark values) -> ${OUT.replace(ROOT + '/', '')}`
);
