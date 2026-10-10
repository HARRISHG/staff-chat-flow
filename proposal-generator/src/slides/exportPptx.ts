import PptxGenJS from 'pptxgenjs';
import type { Deck, SlideEl } from './model';
import { BULLET_INDENT_PT, FONT_FACE } from './model';

export interface ExportMeta {
  title: string;
  author: string;
  company: string;
  fileName: string;
  logoDataUri: string;
}

type PptxSlide = ReturnType<PptxGenJS['addSlide']>;

function draw(pptx: PptxGenJS, slide: PptxSlide, el: SlideEl, logo: string) {
  switch (el.type) {
    case 'rect':
    case 'ellipse': {
      const shape = el.type === 'ellipse' ? pptx.ShapeType.ellipse : el.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
      slide.addShape(shape, {
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        fill: el.fill ? { color: el.fill } : { color: 'FFFFFF', transparency: 100 },
        line: el.line ? { color: el.line, width: el.lineWidth ?? 0.75 } : { type: 'none' },
        ...(el.radius && el.type === 'rect' ? { rectRadius: el.radius } : {}),
      });
      return;
    }
    case 'line': {
      slide.addShape(pptx.ShapeType.line, {
        x: Math.min(el.x1, el.x2),
        y: Math.min(el.y1, el.y2),
        w: Math.abs(el.x2 - el.x1),
        h: Math.abs(el.y2 - el.y1),
        flipH: el.x2 < el.x1,
        flipV: el.y2 < el.y1,
        line: { color: el.color, width: el.width, ...(el.arrow ? { endArrowType: 'triangle' as const } : {}) },
      });
      return;
    }
    case 'image':
      slide.addImage({ data: logo, x: el.x, y: el.y, w: el.w, h: el.h });
      return;
    case 'text': {
      const runs = el.paras.map((p, i) => ({
        text: p.text,
        options: {
          bold: p.bold ?? el.bold,
          color: p.color ?? el.color,
          bullet: p.bullet ? { indent: BULLET_INDENT_PT } : false,
          breakLine: i < el.paras.length - 1,
          paraSpaceAfter: i < el.paras.length - 1 ? el.paraSpace : 0,
        },
      }));
      slide.addText(runs, {
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        fontFace: FONT_FACE,
        fontSize: el.size,
        color: el.color,
        bold: el.bold,
        align: el.align,
        valign: el.valign,
        margin: 0,
        lineSpacing: el.lineHeight,
        charSpacing: el.charSpacing,
        isTextBox: true,
        fit: 'none',
        wrap: true,
      });
    }
  }
}

/** Writes the deck as .pptx and starts the download. Rejects if anything fails. */
export async function exportPptx(deck: Deck, meta: ExportMeta): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = meta.title;
  pptx.author = meta.author;
  pptx.company = meta.company;
  pptx.subject = 'Patient journey automation proposal';
  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    for (const el of s.elements) draw(pptx, slide, el, meta.logoDataUri);
  }
  return pptx.writeFile({ fileName: meta.fileName, compression: true });
}

export async function loadLogoDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load the Patientcurve logo.');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the Patientcurve logo.'));
    reader.readAsDataURL(blob);
  });
}
