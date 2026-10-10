import { describe, expect, it } from 'vitest';
import { formatDate, formatINR, lines, proposalFilename, slugify } from '../lib/format';
import { summarisePricing } from '../lib/pricing';
import { validateProposal } from '../lib/validate';
import { parseProposalJson, serialiseProposal } from '../lib/storage';
import { createEmptyProposal, createSampleProposal } from '../data/defaults';
import { buildDeck } from '../slides/build';
import { approxMeasure } from '../slides/measure';
import type { TextEl } from '../slides/model';
import { WORKFLOW_IDS } from '../types';
import { WORKFLOW_NAME } from '../data/workflows';

const NOW = new Date(2026, 9, 10);

describe('format', () => {
  it('formats rupees in the Indian system', () => {
    expect(formatINR(184500)).toBe('₹1,84,500');
    expect(formatINR(539.82)).toBe('₹539.82');
    expect(formatINR(0)).toBe('₹0');
  });
  it('formats dates as 10 Oct 2026', () => expect(formatDate('2026-10-10')).toBe('10 Oct 2026'));
  it('splits list text', () => expect(lines('• one\n\n- two \n  three')).toEqual(['one', 'two', 'three']));
  it('builds a safe filename', () => {
    expect(slugify('Dr. Rao’s Dental & Implant Centre / Chennai')).toBe('Dr-Rao-s-Dental-and-Implant-Centre-Chennai');
    expect(slugify('   ')).toBe('Clinic');
    expect(proposalFilename('Smile Clinic', '2026-10-10')).toBe('Patientcurve-Proposal-Smile-Clinic-2026-10-10.pptx');
    expect(proposalFilename('Smile', 'bad')).toBe('Patientcurve-Proposal-Smile-undated.pptx');
  });
});

describe('pricing', () => {
  it('adds tax only when exclusive with a rate', () => {
    const p = summarisePricing(createSampleProposal(NOW));
    expect(p.oneTimeSubtotal).toBe(9500);
    expect(p.monthlySubtotal).toBe(4999);
    expect(p.tax).toEqual({ label: 'GST @ 18%', oneTime: 1710, monthly: 899.82 });
    expect(p.oneTimeTotal).toBe(11210);
    expect(p.monthlyTotal).toBe(5898.82);
  });
  it('does not add GST unless configured', () => {
    const d = createSampleProposal(NOW);
    d.pricing.taxRate = null;
    const p = summarisePricing(d);
    expect(p.tax).toBeNull();
    expect(p.oneTimeTotal).toBe(9500);
    d.pricing.taxRate = 18;
    d.pricing.taxMode = 'inclusive';
    expect(summarisePricing(d).tax).toBeNull();
    expect(summarisePricing(d).monthlyTotal).toBe(4999);
  });
  it('never invents a fee', () => {
    const p = summarisePricing(createEmptyProposal(NOW));
    expect(p.rows).toEqual([]);
    expect(p.oneTimeTotal).toBe(0);
  });
});

describe('validation', () => {
  it('flags the essentials on an empty proposal', () => {
    const fields = validateProposal(createEmptyProposal(NOW)).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(['clinic-name', 'clinic-doctor', 'provider-email', 'workflow-enquiryCapture', 'pricing-setup', 'pricing-monthly']));
  });
  it('accepts the sample', () => expect(validateProposal(createSampleProposal(NOW))).toEqual([]));
});

describe('storage', () => {
  it('round-trips and rejects junk', () => {
    const d = createSampleProposal(NOW);
    expect(parseProposalJson(serialiseProposal(d))).toEqual(d);
    expect(() => parseProposalJson('nope')).toThrow('not valid JSON');
    expect(() => parseProposalJson('{"a":1}')).toThrow('not a Patientcurve proposal');
  });
});

const allText = (d: ReturnType<typeof buildDeck>) =>
  d.slides.flatMap((s) => s.elements.filter((e): e is TextEl => e.type === 'text').flatMap((e) => e.paras.map((p) => p.text))).join('\n');

describe('deck', () => {
  it('builds the sample without overflow', () => {
    const deck = buildDeck(createSampleProposal(NOW), approxMeasure);
    expect(deck.overflows).toEqual([]);
    expect(deck.slides.map((s) => s.title)).toEqual([
      'Cover', 'Current situation', 'Approach', 'What is included', 'Workflows', 'Workflows (cont.)', 'Investment', 'Getting started', 'Support and scope', 'Approval',
    ]);
    const text = allText(deck);
    expect(text).toContain('₹11,210');
    expect(text).toContain('₹5,898.82 / month');
    expect(text).toContain('Third-party platform, messaging, and integration charges are included only where explicitly stated in this proposal.');
  });
  it('shows only selected workflows', () => {
    const d = createSampleProposal(NOW);
    for (const id of WORKFLOW_IDS) d.workflows[id].selected = id === 'reminders';
    d.deliverables.integrations = '';
    const deck = buildDeck(d, approxMeasure);
    const text = allText(deck);
    expect(text).toContain(WORKFLOW_NAME.reminders);
    expect(text).not.toContain(WORKFLOW_NAME.reactivation);
    expect(text.split('\n')).not.toContain('Integrations');
    expect(deck.slides.filter((s) => s.title.startsWith('Workflows'))).toHaveLength(1);
  });
  it('paginates all eleven workflows', () => {
    const d = createSampleProposal(NOW);
    for (const id of WORKFLOW_IDS) d.workflows[id].selected = true;
    const deck = buildDeck(d, approxMeasure);
    expect(deck.slides.filter((s) => s.title.startsWith('Workflows'))).toHaveLength(3);
    expect(deck.overflows).toEqual([]);
  });
  it('omits the timeline duration when not provided', () => {
    const d = createSampleProposal(NOW);
    d.implementation.duration = '';
    expect(allText(buildDeck(d, approxMeasure))).not.toContain('Estimated timeline');
  });
  it('reports text that cannot fit', () => {
    const d = createSampleProposal(NOW);
    d.cta = 'word '.repeat(200);
    expect(buildDeck(d, approxMeasure).overflows.map((o) => o.field)).toContain('cta');
  });
});
