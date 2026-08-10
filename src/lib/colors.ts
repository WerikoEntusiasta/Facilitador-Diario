import React from 'react';

export interface NoteColorOption {
  name: string;
  value: string;
  darkValue: string;
}

export const PRESET_COLORS: NoteColorOption[] = [
  { name: 'Padrão', value: '#ffffff', darkValue: '#1e293b' },
  { name: 'Amarelo', value: '#fef3c7', darkValue: '#451a03' },
  { name: 'Azul', value: '#e0f2fe', darkValue: '#0c4a6e' },
  { name: 'Verde', value: '#dcfce7', darkValue: '#064e3b' },
  { name: 'Roxo', value: '#f3e8ff', darkValue: '#3b0764' },
  { name: 'Rosa', value: '#fce7f3', darkValue: '#500724' },
  { name: 'Laranja', value: '#ffedd5', darkValue: '#431407' },
];

/**
 * Returns a style object with CSS custom variables for light and dark mode note backgrounds.
 * Use with className="bg-[var(--note-bg-light)] dark:bg-[var(--note-bg-dark)]"
 */
export function getNoteCardStyle(colorHex: string | undefined | null): React.CSSProperties {
  if (!colorHex || colorHex === 'transparent') {
    return {
      '--note-bg-light': '#ffffff',
      '--note-bg-dark': '#1e293b',
    } as React.CSSProperties;
  }

  const hex = colorHex.toLowerCase().trim();

  const colorMap: Record<string, { lightBg: string; darkBg: string }> = {
    '#ffffff': { lightBg: '#ffffff', darkBg: '#1e293b' },
    '#eff6ff': { lightBg: '#e0f2fe', darkBg: '#0c4a6e' }, // Azul claro -> Azul escuro
    '#f0f7ff': { lightBg: '#e0f2fe', darkBg: '#0c4a6e' }, // Azul claro -> Azul escuro
    '#e0f2fe': { lightBg: '#e0f2fe', darkBg: '#0c4a6e' }, // Azul claro -> Azul escuro
    '#dbeafe': { lightBg: '#e0f2fe', darkBg: '#0c4a6e' },
    '#fef3c7': { lightBg: '#fef3c7', darkBg: '#451a03' }, // Amarelo
    '#fef08a': { lightBg: '#fef3c7', darkBg: '#451a03' },
    '#fef9c3': { lightBg: '#fef3c7', darkBg: '#451a03' },
    '#dcfce7': { lightBg: '#dcfce7', darkBg: '#064e3b' }, // Verde
    '#bbf7d0': { lightBg: '#dcfce7', darkBg: '#064e3b' },
    '#f3e8ff': { lightBg: '#f3e8ff', darkBg: '#3b0764' }, // Roxo
    '#e9d5ff': { lightBg: '#f3e8ff', darkBg: '#3b0764' },
    '#fce7f3': { lightBg: '#fce7f3', darkBg: '#500724' }, // Rosa
    '#fbcfe8': { lightBg: '#fce7f3', darkBg: '#500724' },
    '#ffedd5': { lightBg: '#ffedd5', darkBg: '#431407' }, // Laranja
    '#fed7aa': { lightBg: '#ffedd5', darkBg: '#431407' },
  };

  if (colorMap[hex]) {
    return {
      '--note-bg-light': colorMap[hex].lightBg,
      '--note-bg-dark': colorMap[hex].darkBg,
    } as React.CSSProperties;
  }

  // Fallback for custom hex codes: if hex is light, use dark slate in dark mode
  let isLight = true;
  if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
    let r = 255, g = 255, b = 255;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16) || 255;
      g = parseInt(hex.substring(3, 5), 16) || 255;
      b = parseInt(hex.substring(5, 7), 16) || 255;
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    isLight = luminance > 0.5;
  }

  return {
    '--note-bg-light': hex,
    '--note-bg-dark': isLight ? '#1e293b' : hex,
  } as React.CSSProperties;
}
