import type { WorkflowEntry, WorkflowId } from '../types';

export interface WorkflowDefinition {
  id: WorkflowId;
  name: string;
  defaults: Omit<WorkflowEntry, 'selected'>;
}

/**
 * The workflows the founder can offer. Default copy is deliberately neutral:
 * it describes what the workflow does, never a promised result.
 */
export const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'enquiryCapture',
    name: 'New enquiry capture',
    defaults: {
      description: "Records each new WhatsApp enquiry with the patient's name, number and stated need.",
      trigger: "A new patient messages the clinic's WhatsApp number.",
      result: 'The enquiry is logged and moved to the next configured step.',
      dependency: "Clinic's WhatsApp Business number connected to the platform.",
    },
  },
  {
    id: 'faq',
    name: 'Automated FAQ responses',
    defaults: {
      description: 'Answers common questions, such as timings, location and the consultation process, using clinic-approved content.',
      trigger: 'A patient asks a question covered by the approved answers.',
      result: 'The patient receives an approved answer; other questions are passed to staff.',
      dependency: 'Clinic approves the answer content before go-live.',
    },
  },
  {
    id: 'qualification',
    name: 'Lead qualification',
    defaults: {
      description: "Asks a few agreed questions to understand the patient's need and location.",
      trigger: 'A new enquiry has been captured.',
      result: 'The enquiry is tagged so the right next step can be offered.',
      dependency: 'Qualification questions agreed during onboarding.',
    },
  },
  {
    id: 'nonBookedFollowUp',
    name: "Follow-up for enquiries that haven't booked",
    defaults: {
      description: 'Sends scheduled WhatsApp follow-ups to enquiries that have not booked.',
      trigger: 'No booking within the agreed time after an enquiry.',
      result: 'The patient is invited to book, or flagged to staff for a call.',
      dependency: 'Approved WhatsApp message templates.',
    },
  },
  {
    id: 'reminders',
    name: 'Appointment reminders',
    defaults: {
      description: 'Reminds patients before their appointment and lets them confirm or ask to reschedule.',
      trigger: 'An appointment is booked.',
      result: 'The patient confirms, or asks to reschedule and staff are informed.',
      dependency: 'Appointment details from the booking calendar or clinic software.',
    },
  },
  {
    id: 'missedAppointment',
    name: 'Missed appointment follow-up',
    defaults: {
      description: 'Contacts patients who missed an appointment and offers a new time.',
      trigger: 'An appointment is marked as missed.',
      result: 'The patient is invited to rebook and staff are notified.',
      dependency: 'Staff mark missed appointments, or appointment data is synced.',
    },
  },
  {
    id: 'reactivation',
    name: 'Patient reactivation',
    defaults: {
      description: "Invites patients who haven't visited for an agreed period to book a check-up.",
      trigger: 'No visit within the agreed period.',
      result: 'Interested patients are invited to book.',
      dependency: 'A patient list with last-visit dates, supplied by the clinic.',
    },
  },
  {
    id: 'postTreatment',
    name: 'Post-treatment follow-up',
    defaults: {
      description: 'Checks in after treatment and reminds patients about follow-up visits where relevant.',
      trigger: 'A visit is marked complete.',
      result: 'The patient receives a care follow-up and, where relevant, a prompt for the next visit.',
      dependency: 'Visit completion recorded by staff or synced from clinic software.',
    },
  },
  {
    id: 'reviews',
    name: 'Review request automation',
    defaults: {
      description: 'Asks patients to rate their visit; patients who rate it highly receive the Google review link.',
      trigger: 'A visit is marked complete.',
      result: 'High ratings receive the review link; low ratings are shared privately with the clinic.',
      dependency: "The clinic's Google review link.",
    },
  },
  {
    id: 'staffNotifications',
    name: 'Staff notifications',
    defaults: {
      description: 'Alerts staff when a patient asks for a call back, cancels or needs a person to respond.',
      trigger: 'A patient requests help, or a configured event occurs.',
      result: 'Staff are told who needs a response.',
      dependency: 'Staff WhatsApp numbers for notifications.',
    },
  },
  {
    id: 'reporting',
    name: 'Enquiry and follow-up reporting',
    defaults: {
      description: 'Summarises enquiries, follow-ups and booking status.',
      trigger: 'Monthly, or at an agreed interval.',
      result: 'The clinic sees enquiry, follow-up and booking status for the period.',
      dependency: 'Data captured through the configured workflows.',
    },
  },
];

export const WORKFLOW_NAME: Record<WorkflowId, string> = Object.fromEntries(
  WORKFLOWS.map((w) => [w.id, w.name]),
) as Record<WorkflowId, string>;
