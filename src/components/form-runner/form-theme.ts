import type { CSSProperties } from 'react';
import { readableOn, type FormTheme } from '~/lib/form-model';

const mix = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

// CSS variables consumed by the respondent UI (`--fp-*`).
export function themeStyle(theme: FormTheme): CSSProperties {
  return {
    '--fp-bg': theme.background,
    '--fp-text': theme.text,
    '--fp-accent': theme.accent,
    '--fp-on-accent': readableOn(theme.accent),
    '--fp-soft': mix(theme.text, 68),
    '--fp-faint': mix(theme.text, 34),
    '--fp-line': mix(theme.text, 16),
    '--fp-accent-soft': mix(theme.accent, 9),
    '--fp-accent-hover': mix(theme.accent, 16),
    '--fp-accent-line': mix(theme.accent, 42)
  } as CSSProperties;
}
