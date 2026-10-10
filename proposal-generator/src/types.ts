export const WORKFLOW_IDS = [
  'enquiryCapture',
  'faq',
  'qualification',
  'nonBookedFollowUp',
  'reminders',
  'missedAppointment',
  'reactivation',
  'postTreatment',
  'reviews',
  'staffNotifications',
  'reporting',
] as const;

export type WorkflowId = (typeof WORKFLOW_IDS)[number];

export interface WorkflowEntry {
  selected: boolean;
  /** What it does, as it should read in the proposal. */
  description: string;
  trigger: string;
  result: string;
  /** Integration or data the workflow depends on. Empty means none stated. */
  dependency: string;
}

export type ChargeKind = 'one-time' | 'monthly';

export interface ExtraCharge {
  id: string;
  label: string;
  description: string;
  /** Amount in INR. `null` while the field is empty. */
  amount: number | null;
  kind: ChargeKind;
}

export type TaxMode = 'exclusive' | 'inclusive';

export interface ProposalData {
  version: 1;
  provider: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    website: string;
  };
  clinic: {
    name: string;
    doctor: string;
    address: string;
    phone: string;
    email: string;
  };
  meta: {
    /** ISO date, YYYY-MM-DD. */
    date: string;
    reference: string;
  };
  situation: {
    enquiryChannels: string;
    whatsappSetup: string;
    software: string;
    bookingProcess: string;
    challenge: string;
    notes: string;
  };
  objectives: string[];
  workflows: Record<WorkflowId, WorkflowEntry>;
  deliverables: {
    /** One item per line. */
    setup: string;
    /** One item per line. Empty means no integrations are included. */
    integrations: string;
    testing: string;
  };
  pricing: {
    setupFee: number | null;
    monthlyFee: number | null;
    messagingAllowance: string;
    thirdPartyCharges: string;
    extraCharges: ExtraCharge[];
    taxMode: TaxMode;
    taxLabel: string;
    /** Percentage. `null` means taxes are not calculated in this proposal. */
    taxRate: number | null;
    paymentTerms: string;
    validityDays: number | null;
  };
  implementation: {
    duration: string;
    onboardingRequirements: string;
    clientResponsibilities: string;
    supportScope: string;
    approvalProcess: string;
    assumptions: string;
    dataAccess: string;
  };
  /** Template copy shown in the proposal; editable before export. */
  copy: {
    headline: string;
    intro: string;
    challengePlaceholder: string;
    approachNote: string;
    closing: string;
  };
  cta: string;
}
