import type { ProposalData, WorkflowEntry, WorkflowId } from '../types';
import { WORKFLOWS } from './workflows';

export const DEFAULT_CTA = 'Approve the proposal and schedule the implementation discussion.';

export const DEFAULT_OBJECTIVES = [
  'Improve consistency of enquiry follow-up.',
  'Reduce manual follow-up work.',
  'Make appointment reminders more systematic.',
  'Improve visibility into follow-up and booking status.',
];

export const DEFAULT_COPY: ProposalData['copy'] = {
  headline: 'A more consistent way to manage patient enquiries and follow-ups.',
  intro:
    'Patientcurve helps dental clinics organise patient enquiries, automate appropriate follow-ups, and guide patients toward their next appointment through structured WhatsApp workflows.',
  challengePlaceholder: 'To be confirmed with the clinic before the proposal is finalised.',
  approachNote:
    "Exact behaviour depends on the clinic's current tools and the approved implementation scope. Each workflow runs only once the required access, approved message content and any listed integrations are in place.",
  closing: "Let's make patient follow-up more consistent.",
};

export const SAMPLE_CLINIC_NAME = 'Sample Smile Dental Studio (fictional)';

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function workflowState(selected: WorkflowId[] = []): Record<WorkflowId, WorkflowEntry> {
  return Object.fromEntries(
    WORKFLOWS.map((w) => [w.id, { selected: selected.includes(w.id), ...w.defaults }]),
  ) as Record<WorkflowId, WorkflowEntry>;
}

export function createEmptyProposal(now = new Date()): ProposalData {
  const date = todayISO(now);
  return {
    version: 1,
    provider: {
      name: 'Patientcurve',
      contactName: '',
      email: '',
      phone: '',
      website: 'patientcurve.com',
    },
    clinic: { name: '', doctor: '', address: '', phone: '', email: '' },
    meta: { date, reference: `PC-${date.replace(/-/g, '')}-01` },
    situation: {
      enquiryChannels: '',
      whatsappSetup: '',
      software: '',
      bookingProcess: '',
      challenge: '',
      notes: '',
    },
    objectives: [...DEFAULT_OBJECTIVES],
    workflows: workflowState(),
    deliverables: {
      setup: [
        'Onboarding call to confirm workflows, timings and message content',
        'Configuration of the selected workflows',
        'Preparation of WhatsApp message templates for the clinic to approve',
        'Walkthrough for the clinic team',
      ].join('\n'),
      integrations: '',
      testing: [
        'End-to-end testing of each selected workflow with the clinic team',
        'Corrections identified during testing',
        'Handover walkthrough and a written summary of the configured workflows',
      ].join('\n'),
    },
    pricing: {
      setupFee: null,
      monthlyFee: null,
      messagingAllowance: '',
      thirdPartyCharges: 'WhatsApp conversation charges set by Meta are billed separately, at actual cost.',
      extraCharges: [],
      taxMode: 'exclusive',
      taxLabel: 'GST',
      taxRate: null,
      paymentTerms: 'Setup fee payable on approval. Monthly fee payable in advance at the start of each month.',
      validityDays: 30,
    },
    implementation: {
      duration: '',
      onboardingRequirements: [
        "Access to the clinic's WhatsApp Business number",
        'Clinic information for approved answers: timings, services, location',
        'Staff contact numbers for notifications',
      ].join('\n'),
      clientResponsibilities: [
        'Provide accurate clinic information and keep it up to date',
        'Review and approve message content before go-live',
        'Keep appointment status updated where a workflow depends on it',
        'Ensure patients have agreed to receive WhatsApp messages from the clinic',
      ].join('\n'),
      supportScope: [
        'Support on WhatsApp and email during business hours',
        'Adjustments to configured workflows within the agreed scope',
        'Monitoring of the configured workflows',
      ].join('\n'),
      approvalProcess: 'The clinic reviews and approves message content and workflow behaviour before go-live.',
      assumptions: [
        "Workflows run on the clinic's existing WhatsApp Business number",
        "Exact behaviour depends on the clinic's current tools and the approved scope",
        'Integrations not listed in this proposal are excluded',
        'Third-party platform and messaging charges are billed separately unless stated',
      ].join('\n'),
      dataAccess: [
        'Only the data needed to run the agreed workflows is accessed',
        'Patient data is used only to operate the clinic’s workflows',
        'The clinic can withdraw access at any time',
      ].join('\n'),
    },
    copy: { ...DEFAULT_COPY },
    cta: DEFAULT_CTA,
  };
}

/** Clearly fictional data for testing the output. Never real clinic or patient information. */
export function createSampleProposal(now = new Date()): ProposalData {
  const base = createEmptyProposal(now);
  return {
    ...base,
    provider: {
      ...base.provider,
      contactName: 'Sample Founder (fictional)',
      email: 'hello@example.com',
      phone: '+91 90000 00000',
    },
    clinic: {
      name: SAMPLE_CLINIC_NAME,
      doctor: 'Dr. Sample Name',
      address: '12 Example Road, Sampleville 600000',
      phone: '+91 90000 00001',
      email: 'clinic@example.com',
    },
    meta: { ...base.meta, reference: 'SAMPLE-001' },
    situation: {
      enquiryChannels: 'Mostly WhatsApp messages from social media ads, plus phone calls.',
      whatsappSetup: 'WhatsApp Business app on the front-desk phone.',
      software: 'Appointments kept in a paper register and a shared spreadsheet.',
      bookingProcess: 'The receptionist replies to each enquiry and books a slot by phone.',
      challenge: 'Enquiries that do not book on the first reply are rarely followed up.',
      notes: 'Sample notes from a fictional discovery call.',
    },
    workflows: workflowState(['enquiryCapture', 'faq', 'nonBookedFollowUp', 'reminders', 'missedAppointment', 'reviews', 'reporting']),
    deliverables: {
      ...base.deliverables,
      integrations: 'Google Calendar booking for the clinic calendar',
    },
    pricing: {
      ...base.pricing,
      setupFee: 7500,
      monthlyFee: 4999,
      messagingAllowance: 'Up to 1,000 automated follow-up messages a month.',
      extraCharges: [
        { id: 'sample-gcal', label: 'Google Calendar integration', description: 'One-time connection and testing', amount: 2000, kind: 'one-time' },
      ],
      taxRate: 18,
    },
    implementation: { ...base.implementation, duration: 'About 2 weeks from approval' },
  };
}
