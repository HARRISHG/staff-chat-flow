/**
 * A small scene graph for one 16:9 slide, in inches. The same model is drawn by
 * the HTML preview and written to PowerPoint, so the two always match.
 */

export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;
export const FONT_FACE = 'Arial';

export const C = {
  jade: '0E7C6B',
  jadeLight: '3FC0A6',
  deep: '14232B',
  deepRaised: '1E3640',
  deepLine: '2E4A55',
  rose: 'E2607A',
  tint: 'DCEFEA',
  surface: 'F6F8F7',
  muted: '5B6B70',
  onDeep: 'C9D6D3',
  line: 'D5DEDB',
  warning: '8F5A0E',
  white: 'FFFFFF',
} as const;

export interface Para {
  text: string;
  bold?: boolean;
  color?: string;
  bullet?: boolean;
}

export interface TextEl {
  type: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  paras: Para[];
  /** Font size in points, after fitting. */
  size: number;
  color: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  /** Exact line spacing in points. */
  lineHeight: number;
  /** Space after each paragraph, in points. */
  paraSpace: number;
  /** Character spacing in points (labels only). */
  charSpacing?: number;
  /** Wrapped lines per paragraph, as measured. Used by the preview. */
  lines: string[][];
}

export interface RectEl {
  type: 'rect' | 'ellipse';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  line?: string;
  lineWidth?: number;
  /** Corner radius in inches. */
  radius?: number;
}

export interface LineEl {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  arrow?: boolean;
}

export interface ImageEl {
  type: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  src: 'logo';
}

export type SlideEl = TextEl | RectEl | LineEl | ImageEl;

export interface Slide {
  title: string;
  elements: SlideEl[];
}

/** Text that does not fit its box, reported back to the form. */
export interface Overflow {
  field: string;
  label: string;
  slide: number;
}

export interface Deck {
  slides: Slide[];
  overflows: Overflow[];
}

export const BULLET_INDENT_PT = 13;
export const lineHeightFor = (size: number) => Math.round(size * 1.25 * 10) / 10;
