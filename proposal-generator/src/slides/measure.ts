/** Width of a string in inches at a given point size. */
export type Measure = (text: string, sizePt: number, bold: boolean) => number;

export const FONT_STACK = 'Arial, "Liberation Sans", Arimo, Helvetica, sans-serif';

/**
 * Headroom for renderer differences (PowerPoint, Keynote, LibreOffice and the
 * browser all shape Arial slightly differently).
 */
const SAFETY = 1.05;

export function canvasMeasure(): Measure {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return approxMeasure;
  const cache = new Map<string, number>();
  return (text, size, bold) => {
    const key = `${bold ? 1 : 0}|${size}|${text}`;
    let v = cache.get(key);
    if (v === undefined) {
      ctx.font = `${bold ? 'bold ' : ''}${size}pt ${FONT_STACK}`;
      v = (ctx.measureText(text).width / 96) * SAFETY;
      if (cache.size > 20000) cache.clear();
      cache.set(key, v);
    }
    return v;
  };
}

/** Rough Arial metrics for tests and non-browser use. */
export const approxMeasure: Measure = (text, size, bold) => {
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.28;
    else if ('il.,:;|!\'’'.includes(ch)) em += 0.25;
    else if ('mwMW@'.includes(ch)) em += 0.85;
    else if (ch >= 'A' && ch <= 'Z') em += 0.68;
    else em += 0.54;
  }
  return ((em * size * (bold ? 1.06 : 1)) / 72) * SAFETY;
};
