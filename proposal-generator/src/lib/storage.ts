import type { ExtraCharge, ProposalData } from '../types';
import { WORKFLOW_IDS } from '../types';
import { createEmptyProposal } from '../data/defaults';

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number | null) =>
  v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

function mergeStrings<T extends Record<string, string>>(base: T, incoming: unknown): T {
  const src = obj(incoming);
  const out = { ...base };
  for (const k of Object.keys(base) as (keyof T)[]) out[k] = str(src[k as string], base[k]) as T[keyof T];
  return out;
}

/**
 * Reads a saved proposal. Unknown keys are ignored and missing keys fall back to
 * defaults, so files from older versions still load.
 */
export function parseProposalJson(text: string): ProposalData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const src = obj(raw);
  if (!('clinic' in src) || !('pricing' in src)) throw new Error('This file is not a Patientcurve proposal.');
  const base = createEmptyProposal();
  const pricing = obj(src.pricing);
  const workflowsIn = obj(src.workflows);

  const workflows = { ...base.workflows };
  for (const id of WORKFLOW_IDS) {
    const w = obj(workflowsIn[id]);
    workflows[id] = {
      selected: w.selected === true,
      description: str(w.description, base.workflows[id].description),
      trigger: str(w.trigger, base.workflows[id].trigger),
      result: str(w.result, base.workflows[id].result),
      dependency: str(w.dependency, base.workflows[id].dependency),
    };
  }

  const extraCharges: ExtraCharge[] = Array.isArray(pricing.extraCharges)
    ? pricing.extraCharges.slice(0, 20).map((c, i) => {
        const o = obj(c);
        return {
          id: str(o.id, `imported-${i}`),
          label: str(o.label, ''),
          description: str(o.description, ''),
          amount: num(o.amount, null),
          kind: o.kind === 'monthly' ? 'monthly' : 'one-time',
        };
      })
    : [];

  return {
    version: 1,
    provider: mergeStrings(base.provider, src.provider),
    clinic: mergeStrings(base.clinic, src.clinic),
    meta: mergeStrings(base.meta, src.meta),
    situation: mergeStrings(base.situation, src.situation),
    objectives: Array.isArray(src.objectives)
      ? src.objectives.filter((o): o is string => typeof o === 'string').slice(0, 4)
      : base.objectives,
    workflows,
    deliverables: mergeStrings(base.deliverables, src.deliverables),
    pricing: {
      setupFee: num(pricing.setupFee, null),
      monthlyFee: num(pricing.monthlyFee, null),
      messagingAllowance: str(pricing.messagingAllowance, base.pricing.messagingAllowance),
      thirdPartyCharges: str(pricing.thirdPartyCharges, base.pricing.thirdPartyCharges),
      extraCharges,
      taxMode: pricing.taxMode === 'inclusive' ? 'inclusive' : 'exclusive',
      taxLabel: str(pricing.taxLabel, base.pricing.taxLabel),
      taxRate: num(pricing.taxRate, null),
      paymentTerms: str(pricing.paymentTerms, base.pricing.paymentTerms),
      validityDays: num(pricing.validityDays, base.pricing.validityDays),
    },
    implementation: mergeStrings(base.implementation, src.implementation),
    copy: mergeStrings(base.copy, src.copy),
    cta: str(src.cta, base.cta),
  };
}

export function serialiseProposal(data: ProposalData): string {
  return JSON.stringify(data, null, 2);
}
