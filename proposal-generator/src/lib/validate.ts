import type { ProposalData } from '../types';
import { WORKFLOW_IDS } from '../types';
import { parseISODate } from './format';

export interface ValidationIssue {
  /** Element id of the field to focus. */
  field: string;
  message: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** Fields that must be filled before a proposal is generated. */
export function validateProposal(data: ProposalData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const need = (value: string, field: string, label: string) => {
    if (!value.trim()) issues.push({ field, message: `${label} is required.` });
  };
  need(data.clinic.name, 'clinic-name', 'Clinic name');
  need(data.clinic.doctor, 'clinic-doctor', "Doctor's name");
  if (!parseISODate(data.meta.date)) issues.push({ field: 'meta-date', message: 'Proposal date must be a valid date.' });
  need(data.meta.reference, 'meta-reference', 'Proposal reference number');
  need(data.provider.name, 'provider-name', 'Your company name');
  if (!data.provider.email.trim() && !data.provider.phone.trim()) {
    issues.push({ field: 'provider-email', message: 'Add your email or phone so the clinic can contact you.' });
  }
  if (data.provider.email.trim() && !isEmail(data.provider.email)) {
    issues.push({ field: 'provider-email', message: 'Your email address looks incomplete.' });
  }
  if (data.clinic.email.trim() && !isEmail(data.clinic.email)) {
    issues.push({ field: 'clinic-email', message: 'Clinic email address looks incomplete.' });
  }
  if (!WORKFLOW_IDS.some((id) => data.workflows[id].selected)) {
    issues.push({ field: 'workflow-enquiryCapture', message: 'Select at least one workflow.' });
  }
  if (data.pricing.setupFee === null) issues.push({ field: 'pricing-setup', message: 'Setup fee is required (enter 0 if there is none).' });
  if (data.pricing.monthlyFee === null) issues.push({ field: 'pricing-monthly', message: 'Monthly service fee is required (enter 0 if there is none).' });
  for (const [label, v, field] of [
    ['Setup fee', data.pricing.setupFee, 'pricing-setup'],
    ['Monthly service fee', data.pricing.monthlyFee, 'pricing-monthly'],
  ] as const) {
    if (v !== null && v < 0) issues.push({ field, message: `${label} cannot be negative.` });
  }
  data.pricing.extraCharges.forEach((c, i) => {
    const hasLabel = c.label.trim() !== '';
    if (hasLabel && c.amount === null) issues.push({ field: `charge-amount-${c.id}`, message: `Enter an amount for "${c.label.trim()}".` });
    if (!hasLabel && c.amount !== null) issues.push({ field: `charge-label-${c.id}`, message: `Additional charge ${i + 1} needs a name.` });
    if (c.amount !== null && c.amount < 0) issues.push({ field: `charge-amount-${c.id}`, message: 'Charges cannot be negative.' });
  });
  if (data.pricing.taxMode === 'exclusive' && data.pricing.taxRate !== null && (data.pricing.taxRate < 0 || data.pricing.taxRate > 100)) {
    issues.push({ field: 'pricing-tax-rate', message: 'Tax rate must be between 0 and 100.' });
  }
  if (data.pricing.validityDays !== null && (data.pricing.validityDays < 1 || !Number.isInteger(data.pricing.validityDays))) {
    issues.push({ field: 'pricing-validity', message: 'Validity must be a whole number of days.' });
  }
  need(data.cta, 'cta', 'Call to action');
  return issues;
}

/** Non-blocking reminders shown before export. */
export function proposalWarnings(data: ProposalData): string[] {
  const w: string[] = [];
  if (!data.situation.challenge.trim()) w.push('Main challenge is empty; the proposal shows a neutral placeholder.');
  if (!data.objectives.some((o) => o.trim())) w.push('No objectives entered.');
  return w;
}
