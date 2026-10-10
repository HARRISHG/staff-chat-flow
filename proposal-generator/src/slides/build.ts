import type { ProposalData } from '../types';
import { WORKFLOW_IDS } from '../types';
import { WORKFLOW_NAME } from '../data/workflows';
import { addDays, formatDate, formatINR, lines } from '../lib/format';
import { summarisePricing } from '../lib/pricing';
import type { Measure } from './measure';
import type { Deck, LineEl, Overflow, Para, RectEl, Slide, SlideEl, TextEl } from './model';
import { BULLET_INDENT_PT, C, SLIDE_H, SLIDE_W, lineHeightFor } from './model';

/* ---------- layout constants ---------- */

const X0 = 0.6;
const CW = SLIDE_W - 2 * X0;
const CONTENT_TOP = 1.6;
const CONTENT_BOTTOM = 6.75;
const RADIUS = 0.125;

interface FieldRef {
  id: string;
  label: string;
}

class Ctx {
  overflows: Overflow[] = [];
  slideNo = 0;
  constructor(public measure: Measure) {}

  overflow(field: FieldRef | undefined) {
    if (!field) return;
    if (!this.overflows.some((o) => o.field === field.id && o.slide === this.slideNo)) {
      this.overflows.push({ field: field.id, label: field.label, slide: this.slideNo });
    }
  }
}

/* ---------- text measurement ---------- */

function wrap(ctx: Ctx, text: string, width: number, size: number, bold: boolean): string[] {
  const out: string[] = [];
  for (const hardLine of text.split('\n')) {
    const words = hardLine.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let cur = '';
    for (let word of words) {
      const candidate = cur ? `${cur} ${word}` : word;
      if (ctx.measure(candidate, size, bold) <= width) {
        cur = candidate;
        continue;
      }
      if (cur) out.push(cur);
      cur = '';
      // A single word wider than the box is broken by characters.
      while (ctx.measure(word, size, bold) > width && word.length > 1) {
        let n = word.length - 1;
        while (n > 1 && ctx.measure(word.slice(0, n), size, bold) > width) n--;
        out.push(word.slice(0, n));
        word = word.slice(n);
      }
      cur = word;
    }
    out.push(cur);
  }
  return out;
}

interface TextOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  paras: Para[] | string;
  size: number;
  minSize?: number;
  color?: string;
  bold?: boolean;
  align?: TextEl['align'];
  valign?: TextEl['valign'];
  paraSpace?: number;
  charSpacing?: number;
  field?: FieldRef;
}

const toParas = (p: Para[] | string): Para[] => (typeof p === 'string' ? [{ text: p }] : p);

function layoutParas(ctx: Ctx, paras: Para[], w: number, size: number, bold: boolean) {
  return paras.map((p) => {
    const indent = p.bullet ? BULLET_INDENT_PT / 72 : 0;
    return wrap(ctx, p.text, w - indent, size, p.bold ?? bold);
  });
}

/** Height in inches of laid-out paragraphs. */
function heightOf(wrapped: string[][], size: number, paraSpace: number): number {
  const count = wrapped.reduce((s, l) => s + l.length, 0);
  return (count * lineHeightFor(size) + Math.max(0, wrapped.length - 1) * paraSpace) / 72;
}

function measureBlock(ctx: Ctx, paras: Para[], w: number, size: number, bold = false, paraSpace = 0): number {
  return heightOf(layoutParas(ctx, paras, w, size, bold), size, paraSpace);
}

/** A text box that shrinks from `size` down to `minSize` until it fits. */
function text(ctx: Ctx, o: TextOpts): TextEl {
  const paras = toParas(o.paras);
  const bold = o.bold ?? false;
  const min = o.minSize ?? o.size;
  let size = o.size;
  let wrapped = layoutParas(ctx, paras, o.w, size, bold);
  const ps = (s: number) => o.paraSpace ?? (paras.length > 1 ? Math.round(s * 0.45) : 0);
  while (heightOf(wrapped, size, ps(size)) > o.h + 0.001 && size - 0.5 >= min) {
    size -= 0.5;
    wrapped = layoutParas(ctx, paras, o.w, size, bold);
  }
  if (heightOf(wrapped, size, ps(size)) > o.h + 0.001) ctx.overflow(o.field);
  return {
    type: 'text',
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    paras,
    size,
    color: o.color ?? C.deep,
    bold,
    align: o.align ?? 'left',
    valign: o.valign ?? 'top',
    lineHeight: lineHeightFor(size),
    paraSpace: ps(size),
    charSpacing: o.charSpacing,
    lines: wrapped,
  };
}

const rect = (x: number, y: number, w: number, h: number, o: Partial<RectEl> = {}): RectEl => ({ type: 'rect', x, y, w, h, ...o });
const hline = (x1: number, x2: number, y: number, color: string = C.line, width = 0.75): LineEl => ({ type: 'line', x1, y1: y, x2, y2: y, color, width });
const arrow = (x1: number, y1: number, x2: number, y2: number, color: string): LineEl => ({ type: 'line', x1, y1, x2, y2, color, width: 1.5, arrow: true });
const bullets = (items: string[]): Para[] => items.map((t) => ({ text: t, bullet: true }));
const label = (ctx: Ctx, x: number, y: number, w: number, t: string, color: string = C.jade, size = 10) =>
  text(ctx, { x, y, w, h: lineHeightFor(size) / 72, paras: t, size, bold: true, color });

/* ---------- stacked blocks with a shared font size ---------- */

interface Block {
  heading?: string;
  paras: Para[];
  field?: FieldRef;
}

/**
 * Lays out blocks top to bottom within [y, maxY], choosing the largest body size
 * from `sizes` at which everything fits.
 */
function stack(ctx: Ctx, x: number, y: number, w: number, maxY: number, blocks: Block[], sizes: number[], gap = 0.22): SlideEl[] {
  const headSize = 10;
  const headH = lineHeightFor(headSize) / 72 + 0.06;
  const totalAt = (size: number) =>
    blocks.reduce((s, b) => s + (b.heading ? headH : 0) + measureBlock(ctx, b.paras, w, size, false, Math.round(size * 0.35)), 0) +
    gap * Math.max(0, blocks.length - 1);
  const size = sizes.find((s) => y + totalAt(s) <= maxY + 0.001) ?? sizes[sizes.length - 1];
  const out: SlideEl[] = [];
  let cy = y;
  for (const b of blocks) {
    if (b.heading) {
      out.push(label(ctx, x, cy, w, b.heading, C.jade, headSize));
      cy += headH;
    }
    const ps = Math.round(size * 0.35);
    const h = measureBlock(ctx, b.paras, w, size, false, ps);
    const avail = Math.max(0.2, Math.min(h, maxY - cy));
    out.push(text(ctx, { x, y: cy, w, h: avail, paras: b.paras, size, color: C.deep, paraSpace: ps, field: b.field }));
    cy += h + gap;
  }
  return out;
}

/* ---------- slide chrome ---------- */

function frame(ctx: Ctx, kicker: string, title: string): SlideEl[] {
  return [
    label(ctx, X0, 0.42, CW, kicker, C.jade, 11),
    text(ctx, { x: X0, y: 0.68, w: CW, h: 0.62, paras: title, size: 28, minSize: 22, bold: true, color: C.deep }),
  ];
}

function footer(ctx: Ctx, data: ProposalData, n: number, total: number): SlideEl[] {
  const clinic = data.clinic.name.trim();
  const shortName = clinic.length > 48 ? `${clinic.slice(0, 47).trimEnd()}…` : clinic;
  const parts = ['Patientcurve', shortName && `Proposal for ${shortName}`, data.meta.reference.trim() && `Ref ${data.meta.reference.trim()}`].filter(Boolean);
  return [
    hline(X0, SLIDE_W - X0, 6.95),
    text(ctx, { x: X0, y: 7.04, w: 10, h: 0.2, paras: parts.join('  ·  '), size: 9, minSize: 7, color: C.muted }),
    text(ctx, { x: SLIDE_W - X0 - 1.5, y: 7.04, w: 1.5, h: 0.2, paras: `${n} / ${total}`, size: 9, color: C.muted, align: 'right' }),
  ];
}

function sampleBanner(ctx: Ctx): SlideEl[] {
  return [
    rect(0, 0, SLIDE_W, 0.26, { fill: C.warning }),
    text(ctx, {
      x: 0, y: 0.055, w: SLIDE_W, h: 0.16, paras: 'SAMPLE PROPOSAL  ·  FICTIONAL CLINIC DATA  ·  DO NOT SEND',
      size: 8.5, bold: true, color: C.white, align: 'center', charSpacing: 1,
    }),
  ];
}

const contactLine = (d: ProposalData) =>
  [d.provider.contactName, d.provider.email, d.provider.phone, d.provider.website].map((s) => s.trim()).filter(Boolean).join('  ·  ');

/* ---------- slides ---------- */

function cover(ctx: Ctx, d: ProposalData): Slide {
  const el: SlideEl[] = [];
  const panelX = 8.6;
  el.push(rect(panelX, 0, SLIDE_W - panelX, SLIDE_H, { fill: C.deep }));
  el.push({ type: 'image', x: 0.7, y: 0.65, w: 2.2, h: 2.2 / 5.25, src: 'logo' });

  el.push({ type: 'ellipse', x: 0.7, y: 1.83, w: 0.12, h: 0.12, fill: C.rose });
  el.push(label(ctx, 0.92, 1.78, 7, 'Patient journey automation proposal', C.jade, 12));
  el.push(text(ctx, {
    x: 0.7, y: 2.15, w: 7.5, h: 1.2, paras: d.clinic.name.trim() || 'Clinic name', size: 34, minSize: 22, bold: true,
    color: C.deep, field: { id: 'clinic-name', label: 'Clinic name' },
  }));

  const meta: [string, string, FieldRef][] = [
    ['Prepared for', d.clinic.doctor.trim() || '—', { id: 'clinic-doctor', label: "Doctor's name" }],
    ['Prepared by', d.provider.name.trim() || '—', { id: 'provider-name', label: 'Your company name' }],
    ['Date', formatDate(d.meta.date), { id: 'meta-date', label: 'Proposal date' }],
    ['Reference', d.meta.reference.trim() || '—', { id: 'meta-reference', label: 'Reference' }],
  ];
  meta.forEach(([k, v, f], i) => {
    const x = 0.7 + (i % 2) * 3.75;
    const y = 3.6 + Math.floor(i / 2) * 0.68;
    el.push(label(ctx, x, y, 3.5, k, C.muted, 9));
    el.push(text(ctx, { x, y: y + 0.2, w: 3.5, h: 0.24, paras: v, size: 13, minSize: 10, color: C.deep, field: f }));
  });

  el.push(hline(0.7, 8.0, 5.08));
  el.push(text(ctx, {
    x: 0.7, y: 5.25, w: 7.4, h: 0.62, paras: d.copy.headline, size: 18, minSize: 14, bold: true, color: C.deep,
    field: { id: 'copy-headline', label: 'Cover headline' },
  }));
  el.push(text(ctx, {
    x: 0.7, y: 5.95, w: 7.4, h: 0.72, paras: d.copy.intro, size: 12, minSize: 10, color: C.muted,
    field: { id: 'copy-intro', label: 'Cover introduction' },
  }));
  el.push(text(ctx, { x: 0.7, y: 6.95, w: 7.6, h: 0.2, paras: contactLine(d), size: 9.5, minSize: 7.5, color: C.muted }));

  // Capture → Follow up → Recover
  const bx = 9.15;
  const bw = SLIDE_W - bx - 0.55;
  el.push(label(ctx, bx, 1.05, bw, 'The 3-step patient recovery system', C.jadeLight, 11));
  const steps = [
    ['1', 'Capture', 'Record every enquiry and what the patient needs.'],
    ['2', 'Follow up', 'Configured WhatsApp follow-ups, based on agreed rules.'],
    ['3', 'Recover', 'Guide patients to booking, or hand over to staff.'],
  ];
  steps.forEach(([n, t, desc], i) => {
    const y = 1.6 + i * 1.72;
    const last = i === steps.length - 1;
    el.push(rect(bx, y, bw, 1.22, { fill: last ? C.jade : C.deepRaised, line: last ? C.jade : C.deepLine, lineWidth: 0.75, radius: RADIUS }));
    el.push(text(ctx, { x: bx + 0.28, y: y + 0.2, w: 0.5, h: 0.4, paras: n, size: 20, bold: true, color: last ? C.white : C.jadeLight }));
    el.push(text(ctx, { x: bx + 0.75, y: y + 0.22, w: bw - 1, h: 0.36, paras: t, size: 18, bold: true, color: C.white }));
    el.push(text(ctx, { x: bx + 0.75, y: y + 0.62, w: bw - 1, h: 0.45, paras: desc, size: 11, minSize: 9.5, color: last ? 'E6F4F0' : C.onDeep }));
    if (!last) el.push(arrow(bx + bw / 2, y + 1.27, bx + bw / 2, y + 1.67, C.jadeLight));
  });
  return { title: 'Cover', elements: el };
}

function needs(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Current situation', "Understanding your clinic's needs");
  const s = d.situation;
  const rows: [string, string, FieldRef, boolean][] = [
    ['How enquiries arrive', s.enquiryChannels, { id: 'situation-channels', label: 'How the clinic receives enquiries' }, false],
    ['WhatsApp setup', s.whatsappSetup, { id: 'situation-whatsapp', label: 'Current WhatsApp setup' }, false],
    ['Clinic software', s.software, { id: 'situation-software', label: 'Clinic management software' }, false],
    ['Booking process', s.bookingProcess, { id: 'situation-booking', label: 'Appointment booking process' }, false],
    ['Main challenge', s.challenge.trim() || d.copy.challengePlaceholder, { id: 'situation-challenge', label: 'Main challenge' }, !s.challenge.trim()],
    ['Discovery call notes', s.notes, { id: 'situation-notes', label: 'Additional notes' }, false],
  ];
  const shown = rows.filter(([, v]) => v.trim());
  const labelW = 2.05;
  const valX = X0 + labelW + 0.2;
  const valW = 7.6 - labelW - 0.2;
  el.push(label(ctx, X0, CONTENT_TOP + 0.05, 7.6, 'What we heard', C.jade, 11));
  const top = CONTENT_TOP + 0.45;
  const padY = 0.13;
  const sizes = [12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9];
  const rowH = (v: string, size: number) =>
    Math.max(lineHeightFor(10) / 72, measureBlock(ctx, [{ text: v }], valW, size)) + 2 * padY;
  const size = sizes.find((sz) => top + shown.reduce((a, [, v]) => a + rowH(v, sz), 0) <= CONTENT_BOTTOM) ?? 9;
  let y = top;
  el.push(hline(X0, X0 + 7.6, y));
  for (const [k, v, f, placeholder] of shown) {
    const h = rowH(v, size);
    el.push(label(ctx, X0, y + padY + 0.02, labelW, k, C.muted, 10));
    el.push(text(ctx, {
      x: valX, y: y + padY, w: valW, h: Math.min(h - 2 * padY, CONTENT_BOTTOM - y - padY), paras: v.trim(), size,
      color: placeholder ? C.muted : C.deep, field: f,
    }));
    y += h;
    el.push(hline(X0, X0 + 7.6, y));
  }

  const ox = 8.55;
  const ow = SLIDE_W - X0 - ox;
  el.push(label(ctx, ox, CONTENT_TOP + 0.05, ow, 'Objectives for this engagement', C.jade, 11));
  const objectives = d.objectives.map((o) => o.trim()).filter(Boolean).slice(0, 4);
  if (!objectives.length) objectives.push('Objectives to be agreed with the clinic.');
  objectives.forEach((o, i) => {
    const cy = top + i * 1.03;
    el.push(rect(ox, cy, ow, 0.9, { fill: C.surface, line: C.line, lineWidth: 0.75, radius: RADIUS }));
    el.push(text(ctx, { x: ox + 0.2, y: cy + 0.27, w: 0.4, h: 0.36, paras: String(i + 1).padStart(2, '0'), size: 14, bold: true, color: C.jade }));
    el.push(text(ctx, {
      x: ox + 0.7, y: cy + 0.1, w: ow - 0.9, h: 0.7, paras: o, size: 12, minSize: 9.5, color: C.deep, valign: 'middle',
      field: { id: `objective-${i}`, label: `Objective ${i + 1}` },
    }));
  });
  el.push(text(ctx, {
    x: ox, y: top + 4 * 1.03 + 0.02, w: ow, h: 0.42, paras: 'These are objectives for the engagement, not guaranteed outcomes.',
    size: 9.5, color: C.muted,
  }));
  return { title: 'Current situation', elements: el };
}

function approach(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Proposed solution', 'The Patientcurve approach');
  el.push(text(ctx, {
    x: X0, y: CONTENT_TOP - 0.05, w: CW, h: 0.3, size: 13, color: C.muted,
    paras: 'A three-step mechanism that keeps each enquiry moving, with clinic staff stepping in where a person is needed.',
  }));
  const steps = [
    ['Step 1', 'Capture', 'Record eligible enquiries and organise the information required for the next step.'],
    ['Step 2', 'Follow up', 'Trigger configured WhatsApp follow-ups based on agreed rules and available data.'],
    ['Step 3', 'Recover', 'Guide interested patients toward booking or notify clinic staff when human intervention is required.'],
  ];
  const sw = (CW - 2 * 0.25) / 3;
  steps.forEach(([k, t, desc], i) => {
    const x = X0 + i * (sw + 0.25);
    const y = 2.1;
    el.push(rect(x, y, sw, 1.95, { fill: C.white, line: C.line, lineWidth: 0.75, radius: RADIUS }));
    el.push(rect(x, y, 0.08, 1.95, { fill: C.jade }));
    el.push(label(ctx, x + 0.3, y + 0.25, sw - 0.5, k, C.jade, 10));
    el.push(text(ctx, { x: x + 0.3, y: y + 0.5, w: sw - 0.5, h: 0.38, paras: t, size: 19, bold: true, color: C.deep }));
    el.push(text(ctx, { x: x + 0.3, y: y + 0.98, w: sw - 0.55, h: 0.8, paras: desc, size: 12, minSize: 10, color: C.muted }));
  });

  el.push(label(ctx, X0, 4.38, CW, 'How a patient moves through the workflow', C.jade, 11));
  const flow = ['Patient enquiry', 'WhatsApp workflow', 'Follow-up logic', 'Booking link or staff handoff', 'Status tracking'];
  const gap = 0.4;
  const bw = (CW - gap * (flow.length - 1)) / flow.length;
  flow.forEach((t, i) => {
    const x = X0 + i * (bw + gap);
    const last = i === flow.length - 1;
    el.push(rect(x, 4.75, bw, 0.9, { fill: last ? C.tint : C.surface, line: last ? C.jade : C.line, lineWidth: last ? 1 : 0.75, radius: RADIUS }));
    el.push(text(ctx, { x: x + 0.12, y: 4.8, w: bw - 0.24, h: 0.8, paras: t, size: 12, minSize: 10, bold: true, color: C.deep, align: 'center', valign: 'middle' }));
    if (!last) el.push(arrow(x + bw + 0.06, 5.2, x + bw + gap - 0.06, 5.2, C.jade));
  });

  el.push(rect(X0, 5.95, CW, 0.78, { fill: C.surface, radius: RADIUS }));
  el.push(text(ctx, {
    x: X0 + 0.3, y: 6.03, w: CW - 0.6, h: 0.62, paras: d.copy.approachNote, size: 11.5, minSize: 9, color: C.deep, valign: 'middle',
    field: { id: 'copy-approach', label: 'Approach note' },
  }));
  return { title: 'Approach', elements: el };
}

function card(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, title: string, body: Para[] | Para[][], field?: FieldRef): SlideEl[] {
  const el: SlideEl[] = [rect(x, y, w, h, { fill: C.white, line: C.line, lineWidth: 0.75, radius: RADIUS })];
  el.push(text(ctx, { x: x + 0.25, y: y + 0.2, w: 0.4, h: 0.3, paras: String(n), size: 14, bold: true, color: C.jade }));
  el.push(text(ctx, { x: x + 0.55, y: y + 0.21, w: w - 0.8, h: 0.3, paras: title, size: 13.5, minSize: 11, bold: true, color: C.deep }));
  const cols = (Array.isArray(body[0]) ? body : [body]) as Para[][];
  const colGap = 0.25;
  const cw = (w - 0.5 - colGap * (cols.length - 1)) / cols.length;
  // All columns share the largest size at which every column fits.
  const sizes = [11.5, 11, 10.5, 10, 9.5, 9, 8.5];
  const bodyH = h - 0.75;
  const size = sizes.find((s) => cols.every((c) => measureBlock(ctx, c, cw, s, false, Math.round(s * 0.35)) <= bodyH)) ?? 8.5;
  cols.forEach((c, i) => {
    el.push(text(ctx, { x: x + 0.25 + i * (cw + colGap), y: y + 0.62, w: cw, h: bodyH, paras: c, size, color: C.deep, paraSpace: Math.round(size * 0.35), field }));
  });
  return el;
}

function included(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Scope and deliverables', 'What is included');
  el.push(text(ctx, {
    x: X0, y: CONTENT_TOP - 0.05, w: CW, h: 0.3, size: 13, color: C.muted,
    paras: 'Only the workflows and integrations listed in this proposal are included in the agreed scope.',
  }));
  const selected = WORKFLOW_IDS.filter((id) => d.workflows[id].selected).map((id) => WORKFLOW_NAME[id]);
  const wfParas = bullets(selected);
  const wfBody = selected.length > 5 ? [wfParas.slice(0, Math.ceil(selected.length / 2)), wfParas.slice(Math.ceil(selected.length / 2))] : wfParas;
  const integrations = lines(d.deliverables.integrations);

  const topY = 2.05;
  const topH = 2.35;
  const leftW = 5.4;
  let n = 1;
  el.push(...card(ctx, X0, topY, leftW, topH, n++, 'Setup and configuration', bullets(lines(d.deliverables.setup)), { id: 'deliverables-setup', label: 'Setup deliverables' }));
  el.push(...card(ctx, X0 + leftW + 0.25, topY, CW - leftW - 0.25, topH, n++, `Automation workflows (${selected.length})`, wfBody));

  const bottom: [string, Para[], FieldRef][] = [];
  if (integrations.length) bottom.push(['Integrations', bullets(integrations), { id: 'deliverables-integrations', label: 'Integrations' }]);
  bottom.push(['Testing and handover', bullets(lines(d.deliverables.testing)), { id: 'deliverables-testing', label: 'Testing and handover' }]);
  bottom.push(['Ongoing support and maintenance', bullets(lines(d.implementation.supportScope)), { id: 'impl-support', label: 'Support scope' }]);
  const by = topY + topH + 0.2;
  const bh = CONTENT_BOTTOM - by;
  const bw = (CW - 0.25 * (bottom.length - 1)) / bottom.length;
  bottom.forEach(([t, body, f], i) => el.push(...card(ctx, X0 + i * (bw + 0.25), by, bw, bh, n++, t, body, f)));
  return { title: 'What is included', elements: el };
}

function workflowSlides(ctx: Ctx, d: ProposalData, startNo: number): Slide[] {
  const ids = WORKFLOW_IDS.filter((id) => d.workflows[id].selected);
  const perSlide = 4;
  const slides: Slide[] = [];
  const cols = [
    { k: 'Workflow and what it does', x: X0, w: 3.75 },
    { k: 'Triggered when', x: 4.6, w: 2.65 },
    { k: 'Expected action', x: 7.5, w: 2.65 },
    { k: 'Depends on', x: 10.4, w: SLIDE_W - X0 - 10.4 },
  ];
  for (let i = 0; i < ids.length; i += perSlide) {
    ctx.slideNo = startNo + slides.length;
    const chunk = ids.slice(i, i + perSlide);
    const el = frame(ctx, 'Scope and deliverables', i === 0 ? 'Automation workflows' : 'Automation workflows (continued)');
    const headY = CONTENT_TOP;
    cols.forEach((c) => el.push(label(ctx, c.x, headY, c.w, c.k, C.muted, 10)));
    el.push(hline(X0, SLIDE_W - X0, headY + 0.3, C.deep, 1));
    const rowH = (CONTENT_BOTTOM - headY - 0.35) / perSlide;
    chunk.forEach((id, r) => {
      const w = d.workflows[id];
      const y = headY + 0.35 + r * rowH;
      const f = (part: string, name: string): FieldRef => ({ id: `workflow-${part}-${id}`, label: `${WORKFLOW_NAME[id]}: ${name}` });
      const cell = (j: number, paras: Para[], field?: FieldRef) =>
        text(ctx, { x: cols[j].x, y: y + 0.12, w: cols[j].w, h: rowH - 0.22, paras, size: 11, minSize: 8.5, color: C.deep, paraSpace: 4, field });
      el.push(cell(0, [{ text: WORKFLOW_NAME[id], bold: true }, { text: w.description.trim(), color: C.muted }].filter((p) => p.text), f('description', 'description')));
      el.push(cell(1, [{ text: w.trigger.trim() || '—' }], f('trigger', 'trigger')));
      el.push(cell(2, [{ text: w.result.trim() || '—' }], f('result', 'expected action')));
      el.push(cell(3, [{ text: w.dependency.trim() || 'None stated', color: w.dependency.trim() ? C.deep : C.muted }], f('dependency', 'dependency')));
      el.push(hline(X0, SLIDE_W - X0, y + rowH));
    });
    slides.push({ title: i === 0 ? 'Workflows' : 'Workflows (cont.)', elements: el });
  }
  return slides;
}

function investment(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Investment and commercial terms', 'Investment');
  const p = summarisePricing(d);
  const cols = [
    { k: 'Item', w: 2.2, align: 'left' as const },
    { k: 'Description', w: 2.75, align: 'left' as const },
    { k: 'One-time', w: 1.45, align: 'right' as const },
    { k: 'Monthly', w: 1.45, align: 'right' as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const colX = cols.map((_, i) => X0 + cols.slice(0, i).reduce((s, c) => s + c.w, 0));
  const pad = 0.12;
  const money = (v: number | null) => (v === null ? '—' : formatINR(v));

  type Row = { cells: string[]; kind: 'item' | 'sub' | 'tax' | 'total' };
  const rows: Row[] = p.rows.map((r) => ({ cells: [r.item, r.description || '—', money(r.oneTime), money(r.monthly)], kind: 'item' }));
  if (p.tax) {
    rows.push({ cells: ['Subtotal', '', money(p.oneTimeSubtotal), money(p.monthlySubtotal)], kind: 'sub' });
    rows.push({ cells: [p.tax.label, '', money(p.tax.oneTime), money(p.tax.monthly)], kind: 'tax' });
  }
  rows.push({ cells: ['Total', p.tax ? 'Including tax' : '', money(p.oneTimeTotal), `${money(p.monthlyTotal)}`], kind: 'total' });

  const notes = [p.taxNote, 'Third-party platform, messaging, and integration charges are included only where explicitly stated in this proposal.'];
  const headH = 0.4;
  const rowHeight = (r: Row, size: number) =>
    Math.max(...r.cells.map((c, i) => measureBlock(ctx, [{ text: c }], cols[i].w - 2 * pad, size, r.kind !== 'item' || i === 0))) + 2 * pad;
  const notesH = (size: number) => measureBlock(ctx, notes.map((t) => ({ text: t })), tableW, size - 1.5, false, 4) + 0.15;
  const sizes = [11.5, 11, 10.5, 10, 9.5, 9];
  const fits = (s: number) => CONTENT_TOP + headH + rows.reduce((a, r) => a + rowHeight(r, s), 0) + notesH(s) <= CONTENT_BOTTOM;
  const size = sizes.find(fits) ?? 9;
  if (!fits(size)) ctx.overflow({ id: 'pricing-setup', label: 'Pricing table (too many or too long additional charges)' });

  let y = CONTENT_TOP;
  el.push(rect(X0, y, tableW, headH, { fill: C.deep }));
  cols.forEach((c, i) =>
    el.push(text(ctx, { x: colX[i] + pad, y: y + 0.11, w: c.w - 2 * pad, h: 0.2, paras: c.k, size: 10, bold: true, color: C.white, align: c.align })),
  );
  y += headH;
  for (const r of rows) {
    const h = rowHeight(r, size);
    if (r.kind === 'total') el.push(rect(X0, y, tableW, h, { fill: C.tint }));
    else if (r.kind === 'sub') el.push(rect(X0, y, tableW, h, { fill: C.surface }));
    r.cells.forEach((c, i) => {
      if (!c) return;
      el.push(text(ctx, {
        x: colX[i] + pad, y: y + pad, w: cols[i].w - 2 * pad, h: h - 2 * pad, paras: c, size,
        bold: r.kind !== 'item' || i === 0, color: r.kind === 'item' && i === 1 ? C.muted : C.deep, align: cols[i].align,
      }));
    });
    y += h;
    el.push(hline(X0, X0 + tableW, y, r.kind === 'total' ? C.jade : C.line, r.kind === 'total' ? 1 : 0.75));
  }
  el.push(text(ctx, {
    x: X0, y: y + 0.15, w: tableW, h: Math.max(0.2, CONTENT_BOTTOM - y - 0.15), paras: notes.map((t) => ({ text: t })),
    size: size - 1.5, color: C.muted, paraSpace: 4,
  }));

  // Totals and terms
  const rx = 8.85;
  const rw = SLIDE_W - X0 - rx;
  const taxLabel = d.pricing.taxLabel.trim() || 'tax';
  const taxSub = p.tax ? `Including ${p.tax.label}` : d.pricing.taxMode === 'inclusive' ? `Inclusive of ${taxLabel}` : `Exclusive of ${taxLabel}`;
  const totalCard = (cy: number, k: string, v: string, sub: string, dark: boolean) => {
    el.push(rect(rx, cy, rw, 1.05, { fill: dark ? C.deep : C.white, line: dark ? C.deep : C.line, lineWidth: 0.75, radius: RADIUS }));
    el.push(label(ctx, rx + 0.25, cy + 0.15, rw - 0.5, k, dark ? C.jadeLight : C.jade, 10));
    el.push(text(ctx, { x: rx + 0.25, y: cy + 0.37, w: rw - 0.5, h: 0.4, paras: v, size: 22, minSize: 14, bold: true, color: dark ? C.white : C.deep }));
    el.push(text(ctx, { x: rx + 0.25, y: cy + 0.78, w: rw - 0.5, h: 0.18, paras: sub, size: 9, minSize: 7.5, color: dark ? C.onDeep : C.muted }));
  };
  totalCard(CONTENT_TOP, 'One-time total', formatINR(p.oneTimeTotal), taxSub, false);
  totalCard(CONTENT_TOP + 1.2, 'Monthly total', `${formatINR(p.monthlyTotal)} / month`, taxSub, true);

  const validity = d.pricing.validityDays
    ? `Valid for ${d.pricing.validityDays} days${addDays(d.meta.date, d.pricing.validityDays) ? `, until ${formatDate(addDays(d.meta.date, d.pricing.validityDays)!)}` : ''}.`
    : '';
  const terms: Block[] = (
    [
      ['Included usage', d.pricing.messagingAllowance, { id: 'pricing-allowance', label: 'Messaging allowance' }],
      ['Third-party charges', d.pricing.thirdPartyCharges, { id: 'pricing-third-party', label: 'Third-party charges' }],
      ['Payment terms', d.pricing.paymentTerms, { id: 'pricing-terms', label: 'Payment terms' }],
      ['Proposal validity', validity, { id: 'pricing-validity', label: 'Validity' }],
    ] as [string, string, FieldRef][]
  )
    .filter(([, v]) => v.trim())
    .map(([heading, v, field]) => ({ heading, paras: [{ text: v.trim() }], field }));
  el.push(...stack(ctx, rx, CONTENT_TOP + 2.5, rw, CONTENT_BOTTOM, terms, [11, 10.5, 10, 9.5, 9, 8.5], 0.16));
  return { title: 'Investment', elements: el };
}

/** Card height that wraps the tallest column, within the content area. */
function fitCardHeight(stacks: SlideEl[][], top: number, pad: number, minH: number): number {
  const bottom = Math.max(...stacks.flat().map((e) => (e.type === 'text' ? e.y + e.h : top)));
  return Math.min(CONTENT_BOTTOM - top, Math.max(minH, bottom - top + pad));
}

function getStarted(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Implementation and next steps', 'How we get started');
  const stages = [
    'Confirm scope and commercial terms.',
    'Collect access, approved message templates, and required configuration details.',
    'Configure and test the agreed workflows.',
    'Review the implementation and hand over the system.',
  ];
  const sw = CW / 4;
  const ly = CONTENT_TOP + 0.2;
  el.push(hline(X0 + 0.2, X0 + 3 * sw + 0.2, ly, C.line, 1.5));
  stages.forEach((s, i) => {
    const x = X0 + i * sw;
    el.push({ type: 'ellipse', x, y: ly - 0.2, w: 0.4, h: 0.4, fill: i === 3 ? C.jade : C.white, line: C.jade, lineWidth: 1.5 });
    el.push(text(ctx, { x, y: ly - 0.12, w: 0.4, h: 0.24, paras: String(i + 1), size: 12, bold: true, color: i === 3 ? C.white : C.jade, align: 'center' }));
    el.push(text(ctx, { x, y: ly + 0.35, w: sw - 0.35, h: 0.8, paras: s, size: 12.5, minSize: 10, color: C.deep }));
  });
  let y = ly + 1.3;
  if (d.implementation.duration.trim()) {
    const t = `Estimated timeline: ${d.implementation.duration.trim()}`;
    el.push(rect(X0, y, CW, 0.42, { fill: C.tint, radius: RADIUS }));
    el.push(text(ctx, { x: X0 + 0.25, y: y + 0.1, w: CW - 0.5, h: 0.24, paras: t, size: 12, minSize: 9, bold: true, color: C.deep, field: { id: 'impl-duration', label: 'Estimated setup duration' } }));
    y += 0.62;
  } else {
    y += 0.1;
  }
  const colW = (CW - 0.3) / 2;
  const cols: [string, string, FieldRef][] = [
    ['What we need to get started', d.implementation.onboardingRequirements, { id: 'impl-onboarding', label: 'Onboarding requirements' }],
    ['Client responsibilities', d.implementation.clientResponsibilities, { id: 'impl-responsibilities', label: 'Client responsibilities' }],
  ];
  const stacks = cols.map(([h, v, f], i) =>
    stack(ctx, X0 + i * (colW + 0.3) + 0.3, y + 0.25, colW - 0.6, CONTENT_BOTTOM - 0.15, [{ heading: h, paras: bullets(lines(v).length ? lines(v) : ['To be agreed.']), field: f }], [12, 11.5, 11, 10.5, 10, 9.5, 9]),
  );
  const cardH = fitCardHeight(stacks, y, 0.25, 1.6);
  stacks.forEach((st, i) => el.push(rect(X0 + i * (colW + 0.3), y, colW, cardH, { fill: C.surface, radius: RADIUS }), ...st));
  return { title: 'Getting started', elements: el };
}

function supportScope(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Implementation and next steps', 'Support, assumptions and data');
  const cols: [string, string, FieldRef][] = [
    ['Support scope', d.implementation.supportScope, { id: 'impl-support', label: 'Support scope' }],
    ['Assumptions and exclusions', d.implementation.assumptions, { id: 'impl-assumptions', label: 'Assumptions and exclusions' }],
    ['Data and access', d.implementation.dataAccess, { id: 'impl-data', label: 'Data and access' }],
  ];
  const cw = (CW - 0.5) / 3;
  const y = CONTENT_TOP;
  const stacks = cols.map(([h, v, f], i) =>
    stack(ctx, X0 + i * (cw + 0.25) + 0.3, y + 0.35, cw - 0.6, CONTENT_BOTTOM - 0.2, [{ heading: h, paras: bullets(lines(v).length ? lines(v) : ['None stated.']), field: f }], [12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9]),
  );
  const cardH = fitCardHeight(stacks, y, 0.3, 2.4);
  stacks.forEach((st, i) => {
    const x = X0 + i * (cw + 0.25);
    el.push(rect(x, y, cw, cardH, { fill: C.white, line: C.line, lineWidth: 0.75, radius: RADIUS }), rect(x, y, cw, 0.08, { fill: i === 0 ? C.jade : C.line }), ...st);
  });
  return { title: 'Support and scope', elements: el };
}

function approval(ctx: Ctx, d: ProposalData): Slide {
  const el = frame(ctx, 'Approval', 'Acceptance and next step');
  el.push(text(ctx, {
    x: X0, y: CONTENT_TOP - 0.05, w: CW, h: 0.5, paras: d.implementation.approvalProcess.trim() || 'Sign below to approve this proposal.',
    size: 13, minSize: 10, color: C.muted, field: { id: 'impl-approval', label: 'Review and approval process' },
  }));
  const cw = (CW - 0.3) / 2;
  const cy = 2.2;
  const ch = 2.25;
  const sig = (x: number, heading: string, org: string, fields: string[]) => {
    el.push(rect(x, cy, cw, ch, { fill: C.white, line: C.line, lineWidth: 0.75, radius: RADIUS }));
    el.push(label(ctx, x + 0.3, cy + 0.22, cw - 0.6, heading, C.jade, 10));
    el.push(text(ctx, { x: x + 0.3, y: cy + 0.45, w: cw - 0.6, h: 0.3, paras: org || '—', size: 14, minSize: 10, bold: true, color: C.deep }));
    fields.forEach((f, i) => {
      const fx = x + 0.3 + (i === 2 ? (cw - 0.6) * 0.62 : 0);
      const fw = i === 2 ? (cw - 0.6) * 0.38 : i === 1 ? (cw - 0.6) * 0.56 : cw - 0.6;
      const ly = cy + (i === 0 ? 1.3 : 2.0);
      el.push(hline(fx, fx + fw, ly, C.muted, 0.75));
      el.push(text(ctx, { x: fx, y: ly + 0.06, w: fw, h: 0.2, paras: f, size: 9.5, color: C.muted }));
    });
  };
  sig(X0, 'For the clinic', d.clinic.name.trim(), ['Name', 'Signature', 'Date']);
  sig(X0 + cw + 0.3, 'For Patientcurve', d.provider.name.trim(), ['Authorised representative', 'Signature', 'Date']);

  const by = cy + ch + 0.3;
  el.push(rect(X0, by, CW, 1.0, { fill: C.tint, radius: RADIUS }));
  el.push(label(ctx, X0 + 0.3, by + 0.17, CW - 0.6, 'Next step', C.jade, 10));
  el.push(text(ctx, { x: X0 + 0.3, y: by + 0.4, w: CW - 0.6, h: 0.5, paras: d.cta, size: 17, minSize: 12, bold: true, color: C.deep, field: { id: 'cta', label: 'Call to action' } }));

  el.push({ type: 'ellipse', x: X0, y: 6.13, w: 0.12, h: 0.12, fill: C.rose });
  el.push(text(ctx, { x: X0 + 0.25, y: 5.97, w: 7.5, h: 0.4, paras: d.copy.closing, size: 18, minSize: 13, bold: true, color: C.deep, field: { id: 'copy-closing', label: 'Closing line' } }));
  el.push(text(ctx, { x: 7.9, y: 6.08, w: SLIDE_W - X0 - 7.9, h: 0.24, paras: contactLine(d), size: 11, minSize: 8, color: C.muted, align: 'right' }));
  return { title: 'Approval', elements: el };
}

/* ---------- deck ---------- */

export function buildDeck(data: ProposalData, measure: Measure): Deck {
  const ctx = new Ctx(measure);
  const slides: Slide[] = [];
  const add = (fn: (c: Ctx, d: ProposalData) => Slide) => {
    ctx.slideNo = slides.length + 1;
    slides.push(fn(ctx, data));
  };
  add(cover);
  add(needs);
  add(approach);
  add(included);
  slides.push(...workflowSlides(ctx, data, slides.length + 1));
  add(investment);
  add(getStarted);
  add(supportScope);
  add(approval);

  const isSample = data.meta.reference.trim().toUpperCase().startsWith('SAMPLE');
  slides.forEach((s, i) => {
    ctx.slideNo = i + 1;
    if (i > 0) s.elements.push(...footer(ctx, data, i + 1, slides.length));
    if (isSample) s.elements.push(...sampleBanner(ctx));
  });
  return { slides, overflows: ctx.overflows };
}
