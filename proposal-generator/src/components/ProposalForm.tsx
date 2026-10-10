import type { ExtraCharge, ProposalData, WorkflowEntry, WorkflowId } from '../types';
import { WORKFLOW_IDS } from '../types';
import { WORKFLOWS } from '../data/workflows';
import { formatINR } from '../lib/format';
import { summarisePricing } from '../lib/pricing';
import { NumberField, Section, TextArea, TextField } from './fields';

type Recipe = (draft: ProposalData) => void;

interface Props {
  data: ProposalData;
  update: (recipe: Recipe) => void;
  errors: Record<string, string>;
}

const MAX_CHARGES = 5;
let chargeSeq = 0;

export function ProposalForm({ data, update, errors }: Props) {
  const d = data;
  const selectedCount = WORKFLOW_IDS.filter((id) => d.workflows[id].selected).length;
  const totals = summarisePricing(d);

  const setWorkflow = (id: WorkflowId, patch: Partial<WorkflowEntry>) =>
    update((x) => {
      x.workflows[id] = { ...x.workflows[id], ...patch };
    });
  const setCharge = (cid: string, patch: Partial<ExtraCharge>) =>
    update((x) => {
      x.pricing.extraCharges = x.pricing.extraCharges.map((c) => (c.id === cid ? { ...c, ...patch } : c));
    });

  return (
    <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
      <Section title="Your details" id="sec-provider" summary={d.provider.name}>
        <div className="grid-2">
          <TextField id="provider-name" label="Company name" required value={d.provider.name} error={errors['provider-name']} maxLength={60}
            onChange={(v) => update((x) => { x.provider.name = v; })} />
          <TextField id="provider-contact" label="Your name" value={d.provider.contactName} maxLength={60}
            onChange={(v) => update((x) => { x.provider.contactName = v; })} />
          <TextField id="provider-email" label="Email" type="email" value={d.provider.email} error={errors['provider-email']} maxLength={80}
            hint="Email or phone is required." onChange={(v) => update((x) => { x.provider.email = v; })} />
          <TextField id="provider-phone" label="Phone" type="tel" value={d.provider.phone} maxLength={30}
            onChange={(v) => update((x) => { x.provider.phone = v; })} />
          <TextField id="provider-website" label="Website" value={d.provider.website} maxLength={60}
            onChange={(v) => update((x) => { x.provider.website = v; })} />
        </div>
      </Section>

      <Section title="Clinic details" id="sec-clinic" summary={d.clinic.name}>
        <p className="note">Business contact details only. Do not enter patient information.</p>
        <div className="grid-2">
          <TextField id="clinic-name" label="Clinic name" required value={d.clinic.name} error={errors['clinic-name']} maxLength={80}
            onChange={(v) => update((x) => { x.clinic.name = v; })} />
          <TextField id="clinic-doctor" label="Doctor's name" required value={d.clinic.doctor} error={errors['clinic-doctor']} maxLength={60}
            onChange={(v) => update((x) => { x.clinic.doctor = v; })} />
          <TextField id="clinic-phone" label="Clinic phone" type="tel" value={d.clinic.phone} maxLength={30}
            onChange={(v) => update((x) => { x.clinic.phone = v; })} />
          <TextField id="clinic-email" label="Clinic email" type="email" value={d.clinic.email} error={errors['clinic-email']} maxLength={80}
            onChange={(v) => update((x) => { x.clinic.email = v; })} />
        </div>
        <TextField id="clinic-address" label="Clinic address" value={d.clinic.address} maxLength={140}
          onChange={(v) => update((x) => { x.clinic.address = v; })} />
        <div className="grid-2">
          <TextField id="meta-date" label="Proposal date" type="date" required value={d.meta.date} error={errors['meta-date']}
            onChange={(v) => update((x) => { x.meta.date = v; })} />
          <TextField id="meta-reference" label="Proposal reference" required value={d.meta.reference} error={errors['meta-reference']} maxLength={30}
            onChange={(v) => update((x) => { x.meta.reference = v; })} />
        </div>
      </Section>

      <Section title="Current situation" id="sec-situation">
        <p className="note">Record only what the clinic told you. Empty fields are left out of the proposal.</p>
        <TextArea id="situation-channels" label="How the clinic receives enquiries" rows={2} maxLength={220} value={d.situation.enquiryChannels}
          onChange={(v) => update((x) => { x.situation.enquiryChannels = v; })} />
        <TextArea id="situation-whatsapp" label="Current WhatsApp setup" rows={2} maxLength={220} value={d.situation.whatsappSetup}
          onChange={(v) => update((x) => { x.situation.whatsappSetup = v; })} />
        <TextArea id="situation-software" label="Existing clinic management software" rows={2} maxLength={220} value={d.situation.software}
          onChange={(v) => update((x) => { x.situation.software = v; })} />
        <TextArea id="situation-booking" label="Current appointment booking process" rows={2} maxLength={220} value={d.situation.bookingProcess}
          onChange={(v) => update((x) => { x.situation.bookingProcess = v; })} />
        <TextArea id="situation-challenge" label="Main challenge" rows={2} maxLength={220} value={d.situation.challenge}
          error={errors['situation-challenge']}
          hint="If left empty, the proposal shows the neutral placeholder set under Proposal copy."
          onChange={(v) => update((x) => { x.situation.challenge = v; })} />
        <TextArea id="situation-notes" label="Additional notes from the discovery call" rows={3} maxLength={400} value={d.situation.notes}
          error={errors['situation-notes']} onChange={(v) => update((x) => { x.situation.notes = v; })} />
      </Section>

      <Section title="Objectives" id="sec-objectives" summary={`${d.objectives.filter((o) => o.trim()).length} of 4`}>
        <p className="note">Shown as objectives for the engagement, never as guaranteed outcomes.</p>
        {[0, 1, 2, 3].map((i) => (
          <TextField key={i} id={`objective-${i}`} label={`Objective ${i + 1}`} value={d.objectives[i] ?? ''} maxLength={120}
            error={errors[`objective-${i}`]}
            onChange={(v) => update((x) => {
              const next = [...x.objectives];
              while (next.length <= i) next.push('');
              next[i] = v;
              x.objectives = next;
            })} />
        ))}
      </Section>

      <Section title="Workflows" id="sec-workflows" summary={`${selectedCount} selected`}>
        <p className="note">Only selected workflows appear in the proposal. Availability depends on the agreed scope, platform plan and integrations.</p>
        {errors['workflow-enquiryCapture'] && <p className="error-text">{errors['workflow-enquiryCapture']}</p>}
        <ul className="workflow-list">
          {WORKFLOWS.map((w) => {
            const entry = d.workflows[w.id];
            return (
              <li key={w.id} className={entry.selected ? 'is-selected' : undefined}>
                <label className="check">
                  <input id={`workflow-${w.id}`} type="checkbox" checked={entry.selected}
                    onChange={(e) => setWorkflow(w.id, { selected: e.target.checked })} />
                  <span>{w.name}</span>
                </label>
                {entry.selected && (
                  <div className="workflow-fields">
                    <TextArea id={`workflow-description-${w.id}`} label="What it does" rows={2} maxLength={160} value={entry.description}
                      error={errors[`workflow-description-${w.id}`]} onChange={(v) => setWorkflow(w.id, { description: v })} />
                    <div className="grid-2">
                      <TextArea id={`workflow-trigger-${w.id}`} label="Triggered when" rows={2} maxLength={110} value={entry.trigger}
                        error={errors[`workflow-trigger-${w.id}`]} onChange={(v) => setWorkflow(w.id, { trigger: v })} />
                      <TextArea id={`workflow-result-${w.id}`} label="Expected action" rows={2} maxLength={110} value={entry.result}
                        error={errors[`workflow-result-${w.id}`]} onChange={(v) => setWorkflow(w.id, { result: v })} />
                    </div>
                    <TextArea id={`workflow-dependency-${w.id}`} label="Depends on (integration or data)" rows={2} maxLength={110} value={entry.dependency}
                      error={errors[`workflow-dependency-${w.id}`]} hint="Leave empty if there is no dependency."
                      onChange={(v) => setWorkflow(w.id, { dependency: v })} />
                    <button type="button" className="link" onClick={() => setWorkflow(w.id, { ...w.defaults })}>Reset to default copy</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Deliverables" id="sec-deliverables" open={false}>
        <p className="note">One item per line.</p>
        <TextArea id="deliverables-setup" label="Setup and configuration" rows={4} maxLength={600} value={d.deliverables.setup}
          error={errors['deliverables-setup']} onChange={(v) => update((x) => { x.deliverables.setup = v; })} />
        <TextArea id="deliverables-integrations" label="Integrations included" rows={2} maxLength={400} value={d.deliverables.integrations}
          error={errors['deliverables-integrations']}
          hint="List only integrations you have confirmed for this clinic. Leave empty and the Integrations section is left out."
          onChange={(v) => update((x) => { x.deliverables.integrations = v; })} />
        <TextArea id="deliverables-testing" label="Testing and handover" rows={3} maxLength={500} value={d.deliverables.testing}
          error={errors['deliverables-testing']} onChange={(v) => update((x) => { x.deliverables.testing = v; })} />
      </Section>

      <Section title="Pricing" id="sec-pricing" summary={`${formatINR(totals.oneTimeTotal)} + ${formatINR(totals.monthlyTotal)}/mo`}>
        <div className="grid-2">
          <NumberField id="pricing-setup" label="One-time setup fee" prefix="₹" required min={0} value={d.pricing.setupFee} error={errors['pricing-setup']}
            onChange={(v) => update((x) => { x.pricing.setupFee = v; })} />
          <NumberField id="pricing-monthly" label="Monthly service fee" prefix="₹" required min={0} value={d.pricing.monthlyFee} error={errors['pricing-monthly']}
            onChange={(v) => update((x) => { x.pricing.monthlyFee = v; })} />
        </div>
        <TextArea id="pricing-allowance" label="Included messaging allowance or usage limits" rows={2} maxLength={160} value={d.pricing.messagingAllowance}
          error={errors['pricing-allowance']} onChange={(v) => update((x) => { x.pricing.messagingAllowance = v; })} />
        <TextArea id="pricing-third-party" label="Third-party messaging charges" rows={2} maxLength={200} value={d.pricing.thirdPartyCharges}
          error={errors['pricing-third-party']} onChange={(v) => update((x) => { x.pricing.thirdPartyCharges = v; })} />

        <fieldset className="charges">
          <legend>Additional charges</legend>
          {d.pricing.extraCharges.length === 0 && <p className="hint">None. Add integration or other charges only when agreed.</p>}
          {d.pricing.extraCharges.map((c, i) => (
            <div className="charge" key={c.id}>
              <div className="grid-2">
                <TextField id={`charge-label-${c.id}`} label={`Charge ${i + 1} name`} value={c.label} maxLength={50} error={errors[`charge-label-${c.id}`]}
                  onChange={(v) => setCharge(c.id, { label: v })} />
                <NumberField id={`charge-amount-${c.id}`} label="Amount" prefix="₹" min={0} value={c.amount} error={errors[`charge-amount-${c.id}`]}
                  onChange={(v) => setCharge(c.id, { amount: v })} />
              </div>
              <TextField id={`charge-desc-${c.id}`} label="Description" value={c.description} maxLength={70}
                onChange={(v) => setCharge(c.id, { description: v })} />
              <div className="row">
                <div className="segmented" role="radiogroup" aria-label={`Charge ${i + 1} frequency`}>
                  {(['one-time', 'monthly'] as const).map((k) => (
                    <label key={k}>
                      <input type="radio" name={`kind-${c.id}`} checked={c.kind === k} onChange={() => setCharge(c.id, { kind: k })} />
                      <span>{k === 'one-time' ? 'One-time' : 'Monthly'}</span>
                    </label>
                  ))}
                </div>
                <button type="button" className="link danger" onClick={() => update((x) => {
                  x.pricing.extraCharges = x.pricing.extraCharges.filter((e) => e.id !== c.id);
                })}>Remove</button>
              </div>
            </div>
          ))}
          {d.pricing.extraCharges.length < MAX_CHARGES && (
            <button type="button" className="secondary small" onClick={() => update((x) => {
              x.pricing.extraCharges = [...x.pricing.extraCharges, { id: `c${Date.now().toString(36)}${chargeSeq++}`, label: '', description: '', amount: null, kind: 'one-time' }];
            })}>Add charge</button>
          )}
        </fieldset>

        <fieldset className="tax">
          <legend>Taxes</legend>
          <div className="segmented" role="radiogroup" aria-label="Tax treatment">
            {(['exclusive', 'inclusive'] as const).map((m) => (
              <label key={m}>
                <input id={`pricing-tax-mode-${m}`} type="radio" name="tax-mode" checked={d.pricing.taxMode === m}
                  onChange={() => update((x) => { x.pricing.taxMode = m; })} />
                <span>{m === 'exclusive' ? 'Amounts exclude tax' : 'Amounts include tax'}</span>
              </label>
            ))}
          </div>
          <div className="grid-2">
            <TextField id="pricing-tax-label" label="Tax name" value={d.pricing.taxLabel} maxLength={12}
              onChange={(v) => update((x) => { x.pricing.taxLabel = v; })} />
            {d.pricing.taxMode === 'exclusive' && (
              <NumberField id="pricing-tax-rate" label="Rate to add (%)" min={0} value={d.pricing.taxRate} error={errors['pricing-tax-rate']}
                hint="Leave empty to not calculate tax." onChange={(v) => update((x) => { x.pricing.taxRate = v; })} />
            )}
          </div>
        </fieldset>

        <div className="totals" aria-live="polite">
          <div><span>One-time total</span><strong>{formatINR(totals.oneTimeTotal)}</strong></div>
          <div><span>Monthly total</span><strong>{formatINR(totals.monthlyTotal)}</strong></div>
          <p className="hint">{totals.taxNote}</p>
        </div>

        <TextArea id="pricing-terms" label="Payment terms" rows={2} maxLength={200} value={d.pricing.paymentTerms} error={errors['pricing-terms']}
          onChange={(v) => update((x) => { x.pricing.paymentTerms = v; })} />
        <NumberField id="pricing-validity" label="Proposal valid for (days)" min={1} step="1" value={d.pricing.validityDays} error={errors['pricing-validity']}
          onChange={(v) => update((x) => { x.pricing.validityDays = v; })} />
      </Section>

      <Section title="Implementation" id="sec-implementation" open={false}>
        <TextField id="impl-duration" label="Estimated setup duration" value={d.implementation.duration} maxLength={80}
          hint="Shown only if filled in." error={errors['impl-duration']} onChange={(v) => update((x) => { x.implementation.duration = v; })} />
        <p className="note">One item per line.</p>
        <TextArea id="impl-onboarding" label="Onboarding requirements" rows={3} maxLength={500} value={d.implementation.onboardingRequirements}
          error={errors['impl-onboarding']} onChange={(v) => update((x) => { x.implementation.onboardingRequirements = v; })} />
        <TextArea id="impl-responsibilities" label="Client responsibilities" rows={4} maxLength={600} value={d.implementation.clientResponsibilities}
          error={errors['impl-responsibilities']} onChange={(v) => update((x) => { x.implementation.clientResponsibilities = v; })} />
        <TextArea id="impl-support" label="Support scope" rows={3} maxLength={500} value={d.implementation.supportScope}
          error={errors['impl-support']} onChange={(v) => update((x) => { x.implementation.supportScope = v; })} />
        <TextArea id="impl-assumptions" label="Assumptions and exclusions" rows={4} maxLength={600} value={d.implementation.assumptions}
          error={errors['impl-assumptions']} onChange={(v) => update((x) => { x.implementation.assumptions = v; })} />
        <TextArea id="impl-data" label="Data and access" rows={3} maxLength={500} value={d.implementation.dataAccess}
          error={errors['impl-data']} onChange={(v) => update((x) => { x.implementation.dataAccess = v; })} />
        <TextArea id="impl-approval" label="Review and approval process" rows={2} maxLength={200} value={d.implementation.approvalProcess}
          error={errors['impl-approval']} onChange={(v) => update((x) => { x.implementation.approvalProcess = v; })} />
      </Section>

      <Section title="Call to action and proposal copy" id="sec-copy" open={false}>
        <TextArea id="cta" label="Call to action" rows={2} maxLength={110} value={d.cta} error={errors['cta']}
          onChange={(v) => update((x) => { x.cta = v; })} />
        <TextArea id="copy-headline" label="Cover headline" rows={2} maxLength={90} value={d.copy.headline} error={errors['copy-headline']}
          onChange={(v) => update((x) => { x.copy.headline = v; })} />
        <TextArea id="copy-intro" label="Cover introduction" rows={3} maxLength={220} value={d.copy.intro} error={errors['copy-intro']}
          onChange={(v) => update((x) => { x.copy.intro = v; })} />
        <TextArea id="copy-challenge-placeholder" label="Placeholder when no challenge is entered" rows={2} maxLength={120} value={d.copy.challengePlaceholder}
          onChange={(v) => update((x) => { x.copy.challengePlaceholder = v; })} />
        <TextArea id="copy-approach" label="Approach note (dependencies)" rows={3} maxLength={260} value={d.copy.approachNote} error={errors['copy-approach']}
          onChange={(v) => update((x) => { x.copy.approachNote = v; })} />
        <TextField id="copy-closing" label="Closing line" value={d.copy.closing} maxLength={70} error={errors['copy-closing']}
          onChange={(v) => update((x) => { x.copy.closing = v; })} />
      </Section>
    </form>
  );
}
