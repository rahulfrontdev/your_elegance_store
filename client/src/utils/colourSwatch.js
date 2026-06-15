/** Map common colour names to CSS hex values for swatch display. */
const COLOUR_MAP = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  black: '#171717',
  white: '#f5f5f5',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  grey: '#9ca3af',
  gray: '#9ca3af',
  brown: '#92400e',
  navy: '#1e3a8a',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  maroon: '#7f1d1d',
  beige: '#d4b896',
  gold: '#ca8a04',
  silver: '#c0c0c0',
};

export function colourToHex(colour) {
  if (!colour || typeof colour !== 'string') return '#d1d5db';
  const trimmed = colour.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;
  if (/^rgb/i.test(trimmed)) return trimmed;
  const key = trimmed.toLowerCase();
  return COLOUR_MAP[key] || '#d1d5db';
}

export function isLightColour(hex) {
  const h = hex.replace('#', '');
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}
