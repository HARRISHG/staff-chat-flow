import type { ProposalData } from '../types';

export interface PricingRow {
  item: string;
  description: string;
  oneTime: number | null;
  monthly: number | null;
}

export interface PricingSummary {
  rows: PricingRow[];
  oneTimeSubtotal: number;
  monthlySubtotal: number;
  /** Tax lines are only present when taxes are exclusive and a rate is configured. */
  tax: { label: string; oneTime: number; monthly: number } | null;
  oneTimeTotal: number;
  monthlyTotal: number;
  taxNote: string;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Builds the pricing table. Every amount comes from the form; nothing is invented. */
export function summarisePricing(data: ProposalData): PricingSummary {
  const p = data.pricing;
  const rows: PricingRow[] = [];
  if (p.setupFee !== null) {
    rows.push({ item: 'Setup and configuration', description: 'One-time setup of the agreed scope', oneTime: p.setupFee, monthly: null });
  }
  if (p.monthlyFee !== null) {
    rows.push({ item: 'Monthly service', description: 'Running, monitoring and support of the configured workflows', oneTime: null, monthly: p.monthlyFee });
  }
  for (const c of p.extraCharges) {
    if (!c.label.trim() || c.amount === null) continue;
    rows.push({
      item: c.label.trim(),
      description: c.description.trim(),
      oneTime: c.kind === 'one-time' ? c.amount : null,
      monthly: c.kind === 'monthly' ? c.amount : null,
    });
  }
  const oneTimeSubtotal = round2(rows.reduce((s, r) => s + (r.oneTime ?? 0), 0));
  const monthlySubtotal = round2(rows.reduce((s, r) => s + (r.monthly ?? 0), 0));

  const label = p.taxLabel.trim() || 'Tax';
  let tax: PricingSummary['tax'] = null;
  let taxNote: string;
  if (p.taxMode === 'inclusive') {
    taxNote = `All amounts include applicable ${label}.`;
  } else if (p.taxRate !== null && p.taxRate > 0) {
    tax = {
      label: `${label} @ ${p.taxRate}%`,
      oneTime: round2((oneTimeSubtotal * p.taxRate) / 100),
      monthly: round2((monthlySubtotal * p.taxRate) / 100),
    };
    taxNote = `Amounts above are exclusive of ${label}; ${label} at ${p.taxRate}% is shown separately.`;
  } else {
    taxNote = `Amounts are exclusive of applicable ${label}, which will be charged as per law.`;
  }
  return {
    rows,
    oneTimeSubtotal,
    monthlySubtotal,
    tax,
    oneTimeTotal: round2(oneTimeSubtotal + (tax?.oneTime ?? 0)),
    monthlyTotal: round2(monthlySubtotal + (tax?.monthly ?? 0)),
    taxNote,
  };
}
