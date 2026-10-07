/** Цветовые пары фон/текст для чипов и аватарок. */
export const TONE = {
  neutral: 'bg-chip text-label',
  violet: 'bg-[#e9e6ff] text-[#3a2fd6]',
  peach: 'bg-[#ffebdd] text-[#9a3b0b]',
  sky: 'bg-[#ddf0ff] text-[#0b5a88]',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  accent: 'bg-accent text-ink',
  ink: 'bg-ink text-white',
  /** На тёмном фоне. */
  glass: 'bg-white/12 text-white',
} as const;

export type Tone = keyof typeof TONE;
