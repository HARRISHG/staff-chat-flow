// Patientcurve overview deck: general, clinic-agnostic. Problem → solution → features → how to start.
// Brand guidelines v1.0: jade leads, deep for heroes, tint panels, surface page, rose only as one dot. Arial (Office fallback).
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fi = require("react-icons/fi");

const OUT = process.argv[2];
const BRAND = path.join(__dirname, "brand");
const H = {
  deep: "14232B", deepRaised: "1E3640", deepLine: "2E4A55", jade: "0E7C6B", jadeLight: "3FC0A6", tint: "DCEFEA",
  surface: "F6F8F7", muted: "5B6B70", onDeep: "C9D6D3", line: "D5DEDB", warning: "8F5A0E", warnBg: "FBF3E6",
  rose: "E2607A", roseLight: "F08AA0", white: "FFFFFF",
};
const W = 13.333;
const X0 = 0.6;
const CW = W - 2 * X0;
const LOGO_AR = 252 / 48;

async function svgPng(svg, width) {
  const buf = await sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
const iconSvg = (Comp, color) => ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256, strokeWidth: 2 }));

(async () => {
  const logo = await svgPng(fs.readFileSync(path.join(BRAND, "logo.svg")), 1260);
  const logoDark = await svgPng(fs.readFileSync(path.join(BRAND, "logo-dark.svg")), 1260);
  const curve = await svgPng('<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 40 40"><path d="M11 13 C13 33, 31 38, 35.5 20" fill="none" stroke="#F6F8F7" stroke-width="5" stroke-linecap="round"/><circle cx="37.5" cy="12" r="4.2" fill="#F08AA0"/></svg>', 1400);

  const icons = {
    inbox: fi.FiInbox, chat: fi.FiMessageCircle, filter: fi.FiFilter, clock: fi.FiClock, calendar: fi.FiCalendar,
    calX: fi.FiXCircle, refresh: fi.FiRefreshCw, heart: fi.FiHeart, star: fi.FiStar, bell: fi.FiBell, chart: fi.FiBarChart2,
    moon: fi.FiMoon, user: fi.FiUserX, list: fi.FiList, eye: fi.FiEyeOff, phone: fi.FiPhoneCall, users: fi.FiUsers,
    check: fi.FiCheckCircle, shield: fi.FiShield, edit: fi.FiEdit3, link: fi.FiLink, rupee: fi.FiCreditCard, help: fi.FiHelpCircle,
    cpu: fi.FiCpu, hand: fi.FiUserCheck, alert: fi.FiAlertTriangle, layers: fi.FiLayers,
  };
  const I = {}, IW = {}, IL = {};
  for (const [k, c] of Object.entries(icons)) {
    I[k] = await svgPng(iconSvg(c, H.jade), 256);
    IL[k] = await svgPng(iconSvg(c, H.jadeLight), 256);
    IW[k] = await svgPng(iconSvg(c, H.warning), 256);
  }

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Patientcurve: patient journey automation for dental clinics";
  pres.author = "Patientcurve";
  pres.company = "Patientcurve";
  pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };

  const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, color: H.deep, fontSize: 14, valign: "top", fontFace: "Arial" }, o));
  const card = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12, fill: { color: o.fill || H.white }, line: o.noLine ? { type: "none" } : { color: o.line || H.line, width: o.lw || 0.75 },
  });
  const box = (s, x, y, w, h, color) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color }, line: { type: "none" } });
  const img = (s, data, x, y, d = 0.42) => s.addImage({ data, x, y, w: d, h: d });
  const arrow = (s, x, y, w, h, color = H.jade) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color, width: 1.5, endArrowType: "triangle" } });
  const hline = (s, x, y, w, color = H.line, width = 0.75) => s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width } });

  let n = 0;
  const TOTAL = 15;
  function content(label, title, o = {}) {
    n++;
    const s = pres.addSlide();
    s.background = { color: o.bg || H.surface };
    T(s, label, { x: X0, y: 0.42, w: CW, h: 0.28, fontSize: 11, bold: true, color: H.jade, charSpacing: 1.5 });
    T(s, title, { x: X0, y: 0.74, w: CW, h: 0.75, fontSize: 30, bold: true });
    hline(s, X0, 6.85, CW);
    T(s, "Patientcurve  ·  Patient journey automation for dental clinics", { x: X0, y: 6.97, w: 8, h: 0.3, fontSize: 10, color: H.muted, valign: "middle" });
    T(s, `${n} / ${TOTAL}`, { x: 9.6, y: 6.97, w: 1.4, h: 0.3, fontSize: 10, color: H.muted, align: "right", valign: "middle" });
    s.addImage({ data: logo, x: 11.33, y: 6.98, w: 1.4, h: 1.4 / LOGO_AR });
    return s;
  }
  const lead = (s, text, y = 1.6) => T(s, text, { x: X0, y, w: CW, h: 0.4, fontSize: 15, color: H.muted });
  const exampleTag = (s, x, y) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.95, h: 0.28, rectRadius: 0.06, fill: { color: H.warnBg }, line: { color: H.warning, width: 0.75 } });
    T(s, "EXAMPLE", { x, y, w: 0.95, h: 0.28, fontSize: 9, bold: true, color: H.warning, align: "center", valign: "middle", charSpacing: 1 });
  };

  // 1. Cover
  {
    n++;
    const s = pres.addSlide();
    s.background = { color: H.deep };
    box(s, 8.73, 0, W - 8.73, 7.5, H.jade);
    s.addImage({ data: curve, x: 9.05, y: 1.35, w: 3.95, h: 3.95 });
    s.addImage({ data: logoDark, x: 0.8, y: 0.8, w: 2.6, h: 2.6 / LOGO_AR });
    T(s, "PATIENT JOURNEY AUTOMATION FOR DENTAL CLINICS", { x: 0.8, y: 2.45, w: 7.6, h: 0.35, fontSize: 12, bold: true, color: H.jadeLight, charSpacing: 1.5 });
    T(s, "Every enquiry deserves a next step.", { x: 0.8, y: 2.9, w: 7.5, h: 1.9, fontSize: 44, bold: true, color: H.white });
    T(s, "How structured WhatsApp follow-ups help clinics capture enquiries, follow up consistently and bring patients back.", { x: 0.8, y: 4.85, w: 7.3, h: 1.0, fontSize: 17, color: H.onDeep });
    T(s, "patientcurve.com", { x: 0.8, y: 6.55, w: 7.4, h: 0.35, fontSize: 12, color: H.white });
  }

  // 2. The problem
  {
    const s = content("THE PROBLEM", "Patients rarely leave. They slip away.");
    lead(s, "Most clinics don't lose patients to a bad experience. They lose them in the gaps between conversations.");
    const items = [
      ["moon", "Late or missed replies", "Enquiries that arrive after hours or on busy days wait, and the patient moves on to the next clinic."],
      ["user", "No second message", "A patient asks about aligners or implants, doesn't book on the first reply, and is never contacted again."],
      ["calX", "Missed visits stay missed", "A no-show is noted, but nobody has the time to call and offer a new slot."],
      ["refresh", "Past patients drift", "Recall visits, check-ups and unfinished treatment plans depend on the patient remembering."],
    ];
    const cw = (CW - 3 * 0.25) / 4;
    items.forEach(([ic, t, d], i) => {
      const x = X0 + i * (cw + 0.25);
      card(s, x, 2.3, cw, 3.25);
      img(s, IW[ic], x + 0.3, 2.6, 0.5);
      T(s, t, { x: x + 0.3, y: 3.3, w: cw - 0.6, h: 0.65, fontSize: 18, bold: true });
      T(s, d, { x: x + 0.3, y: 4.05, w: cw - 0.6, h: 1.4, fontSize: 14, color: H.muted });
    });
    card(s, X0, 5.8, CW, 0.8, { fill: H.tint, noLine: true });
    T(s, "None of this is a staff failure. It's what happens when follow-up depends on memory and a busy front desk.", { x: X0 + 0.35, y: 5.8, w: CW - 0.7, h: 0.8, fontSize: 15, bold: true, valign: "middle" });
  }

  // 3. Why it happens
  {
    const s = content("WHY IT KEEPS HAPPENING", "Follow-up has no owner and no system");
    lead(s, "The front desk is doing several jobs at once. Follow-up is the one that quietly gets dropped.");
    const items = [
      ["phone", "The desk is juggling", "Calls, walk-ins, billing and WhatsApp all arrive at the same time. The patient in front of you wins."],
      ["chat", "Conversations live in a phone", "Enquiries sit in one WhatsApp inbox, mixed with personal chats and old threads, with no status."],
      ["list", "No list of who needs what", "Nobody can see which enquiries are waiting, who hasn't booked, or who missed a visit last week."],
      ["eye", "No visibility for the doctor", "Without numbers, it's hard to know where patients are being lost or whether ad spend is turning into visits."],
    ];
    items.forEach(([ic, t, d], i) => {
      const x = X0 + (i % 2) * (CW / 2 + 0.125);
      const y = 2.3 + Math.floor(i / 2) * 2.15;
      const w = CW / 2 - 0.125;
      card(s, x, y, w, 1.95);
      img(s, I[ic], x + 0.35, y + 0.35, 0.5);
      T(s, t, { x: x + 1.15, y: y + 0.32, w: w - 1.5, h: 0.45, fontSize: 18, bold: true });
      T(s, d, { x: x + 1.15, y: y + 0.85, w: w - 1.5, h: 0.95, fontSize: 13.5, color: H.muted });
    });
  }

  // 4. Where patients are lost along the journey
  {
    const s = content("THE PATIENT JOURNEY", "Where patients are lost along the way");
    lead(s, "Every stage of the journey has a hand-off. Each hand-off is a place a patient can quietly drop out.");
    const stages = ["Enquiry", "Reply", "Booking", "Visit", "Treatment", "Return"];
    const leaks = ["Late reply", "No follow-up", "No-show", "Plan not finished", "No recall"];
    const bw = 1.7, gap = (CW - 6 * bw) / 5, y = 2.6;
    stages.forEach((t, i) => {
      const x = X0 + i * (bw + gap);
      const last = i === stages.length - 1;
      card(s, x, y, bw, 0.95, { fill: last ? H.tint : H.white, line: last ? H.jade : H.line, lw: last ? 1 : 0.75 });
      T(s, t, { x, y, w: bw, h: 0.95, fontSize: 16, bold: true, align: "center", valign: "middle" });
      if (i < stages.length - 1) {
        arrow(s, x + bw + 0.08, y + 0.475, gap - 0.16, 0);
        const lx = x + bw + gap / 2;
        s.addShape(pres.shapes.LINE, { x: lx, y: y + 0.55, w: 0, h: 1.0, line: { color: H.warning, width: 1, dashType: "dash" } });
        img(s, IW.alert, lx - 0.17, y + 1.6, 0.34);
        T(s, leaks[i], { x: lx - 0.95, y: y + 2.0, w: 1.9, h: 0.6, fontSize: 12.5, bold: true, color: H.warning, align: "center" });
      }
    });
    card(s, X0, 5.55, CW, 1.05, { fill: H.white });
    img(s, I.check, X0 + 0.35, 5.83, 0.48);
    T(s, [
      { text: "The fix isn't more effort from staff. ", options: { bold: true } },
      { text: "It's a consistent, automatic next step at every hand-off, with a person stepping in only when needed." },
    ], { x: X0 + 1.1, y: 5.55, w: CW - 1.4, h: 1.05, fontSize: 15, valign: "middle" });
  }

  // 5. The solution
  {
    const s = content("THE SOLUTION", "Patientcurve: the 3-step patient recovery system");
    lead(s, "Patientcurve runs structured WhatsApp workflows on the clinic's own number, so every patient gets a timely, approved next step.");
    const steps = [
      ["1", "Capture", "inbox", "Record every enquiry and what the patient needs, at any hour, so nothing sits unanswered or unrecorded."],
      ["2", "Follow up", "chat", "Send configured WhatsApp follow-ups based on agreed rules, until the patient books or says no."],
      ["3", "Recover", "refresh", "Bring back patients who missed a visit or haven't returned, and hand over to staff when a person is needed."],
    ];
    const cw = (CW - 2 * 0.3) / 3;
    steps.forEach(([num, t, ic, d], i) => {
      const x = X0 + i * (cw + 0.3);
      const last = i === 2;
      card(s, x, 2.35, cw, 3.6, { fill: last ? H.deep : H.white, line: last ? H.deep : H.line });
      T(s, num, { x: x + 0.4, y: 2.7, w: 1, h: 0.8, fontSize: 40, bold: true, color: last ? H.jadeLight : H.jade });
      img(s, last ? IL[ic] : I[ic], x + cw - 0.95, 2.8, 0.55);
      T(s, t, { x: x + 0.4, y: 3.65, w: cw - 0.8, h: 0.55, fontSize: 24, bold: true, color: last ? H.white : H.deep });
      T(s, d, { x: x + 0.4, y: 4.3, w: cw - 0.8, h: 1.5, fontSize: 14, color: last ? H.onDeep : H.muted });
      if (i < 2) arrow(s, x + cw + 0.03, 4.15, 0.24, 0);
    });
    T(s, "Not a chatbot that guesses. Every message is clinic-approved, and anything outside the agreed answers goes to your team.", { x: X0, y: 6.15, w: CW, h: 0.45, fontSize: 13.5, bold: true, color: H.jade });
  }

  // 6. How it works
  {
    const s = content("HOW IT WORKS", "From first message to booked appointment");
    lead(s, "A simple, rule-based flow. The clinic approves the content and rules; Patientcurve runs them.");
    const flow = [
      ["chat", "Patient enquiry", "A patient messages the clinic's WhatsApp number."],
      ["layers", "WhatsApp workflow", "Approved answers and a few short questions."],
      ["clock", "Follow-up logic", "Timed reminders if the patient hasn't booked."],
      ["calendar", "Booking or handoff", "A booking link, or a staff alert for a call."],
      ["chart", "Status tracking", "Every enquiry has a status the clinic can see."],
    ];
    const gap = 0.32, bw = (CW - 4 * gap) / 5;
    flow.forEach(([ic, t, d], i) => {
      const x = X0 + i * (bw + gap);
      const last = i === 4;
      card(s, x, 2.35, bw, 2.9, { fill: last ? H.tint : H.white, line: last ? H.jade : H.line, lw: last ? 1 : 0.75 });
      img(s, I[ic], x + 0.3, 2.65, 0.5);
      T(s, t, { x: x + 0.3, y: 3.35, w: bw - 0.5, h: 0.7, fontSize: 16, bold: true });
      T(s, d, { x: x + 0.3, y: 4.1, w: bw - 0.5, h: 1.05, fontSize: 12.5, color: H.muted });
      if (!last) arrow(s, x + bw + 0.05, 3.8, gap - 0.1, 0);
    });
    card(s, X0, 5.5, CW, 1.1, { fill: H.white });
    T(s, [
      { text: "Works with what the clinic already uses. ", options: { bold: true, breakLine: false } },
      { text: "Workflows run on the clinic's WhatsApp Business number. Calendar or software connections are added only where they are configured and tested for that clinic." },
    ], { x: X0 + 0.35, y: 5.5, w: CW - 0.7, h: 1.1, fontSize: 14, valign: "middle" });
  }

  // 7–8. Features
  const featureSlide = (label, title, items) => {
    const s = content(label, title);
    const cols = 3, gx = 0.25, gy = 0.22;
    const cw = (CW - (cols - 1) * gx) / cols, ch = 2.05;
    items.forEach(([ic, t, d], i) => {
      const x = X0 + (i % cols) * (cw + gx);
      const y = 1.75 + Math.floor(i / cols) * (ch + gy);
      card(s, x, y, cw, ch, i === items.length - 1 && items.length % 3 === 0 && label.includes("2") ? {} : {});
      img(s, I[ic], x + 0.3, y + 0.3, 0.45);
      T(s, t, { x: x + 0.95, y: y + 0.3, w: cw - 1.2, h: 0.5, fontSize: 16, bold: true, valign: "middle" });
      T(s, d, { x: x + 0.3, y: y + 0.95, w: cw - 0.6, h: 1.0, fontSize: 13, color: H.muted });
    });
    return s;
  };
  featureSlide("FEATURES  ·  CAPTURE AND FOLLOW UP", "Turn more enquiries into appointments", [
    ["inbox", "New enquiry capture", "Every WhatsApp enquiry is recorded with the patient's name, number and stated need."],
    ["help", "Automated FAQ answers", "Timings, location, consultation process and more, answered instantly with clinic-approved content."],
    ["filter", "Lead qualification", "A few short questions to understand the treatment interest, so the right next step is offered."],
    ["clock", "Follow-up for unbooked enquiries", "Timed, polite follow-ups for patients who asked but didn't book, until they book or opt out."],
    ["calendar", "Appointment reminders", "Reminders before each visit, with an easy way to confirm or ask to reschedule."],
    ["calX", "Missed appointment follow-up", "Patients who miss a visit are invited to rebook, and staff are told when a call is needed."],
  ]);
  {
    const s = featureSlide("FEATURES  ·  RECOVER AND REVIEW", "Bring patients back and see what's working", [
      ["refresh", "Patient reactivation", "Check-ins for patients who haven't visited in a while, with an easy way to book a routine visit."],
      ["heart", "Post-treatment follow-up", "Care messages after treatment, and a prompt to continue plans or book the next stage."],
      ["star", "Review requests", "Asks patients for feedback after a visit and shares the clinic's Google review link. Concerns are flagged to the clinic."],
      ["bell", "Staff notifications", "Your team is alerted when a patient asks for a call, raises a concern, or needs a person."],
      ["chart", "Enquiry and follow-up reporting", "See enquiries, follow-ups, bookings and missed visits for the period, in one simple summary."],
    ]);
    const x = X0 + 2 * ((CW - 0.5) / 3 + 0.25), y = 1.75 + 2.05 + 0.22, cw = (CW - 0.5) / 3;
    card(s, x, y, cw, 2.05, { fill: H.tint, noLine: true });
    T(s, "Choose what fits", { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.45, fontSize: 16, bold: true, color: H.jade });
    T(s, "Clinics start with the workflows that matter most and add more later. Nothing is switched on without approval.", { x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: 1.1, fontSize: 13 });
  }

  // 9. An example journey
  {
    const s = content("A PATIENT'S JOURNEY", "What it looks like for a patient");
    exampleTag(s, W - X0 - 0.95, 0.42);
    lead(s, "An illustrative journey for a patient enquiring about aligners. Timings and messages are set by each clinic.");
    const steps = [
      ["Day 1, 9:40 pm", "Enquiry", "Patient asks about aligners on WhatsApp after seeing an ad."],
      ["Day 1, 9:40 pm", "Instant reply", "Approved answer, two short questions and a booking link."],
      ["Day 2, 11:00 am", "Follow-up", "No booking yet, so a polite reminder with the link is sent."],
      ["Day 2, 4:15 pm", "Booked", "Patient books a consultation; the clinic sees the status."],
      ["Day 6, 6:00 pm", "Reminder", "A reminder the day before, with an easy way to reschedule."],
      ["Day 7, after visit", "Thank you", "A care message and a request for feedback."],
    ];
    const gap = 0.18, bw = (CW - 5 * gap) / 6, ly = 2.75;
    hline(s, X0 + 0.2, ly, CW - 0.4, H.jade, 1.5);
    steps.forEach(([when, t, d], i) => {
      const x = X0 + i * (bw + gap);
      s.addShape(pres.shapes.OVAL, { x: x + 0.05, y: ly - 0.14, w: 0.28, h: 0.28, fill: { color: i === 3 ? H.jade : H.white }, line: { color: H.jade, width: 1.5 } });
      T(s, when, { x, y: 3.05, w: bw, h: 0.3, fontSize: 11, bold: true, color: H.jade });
      card(s, x, 3.45, bw, 1.95, { fill: i === 3 ? H.tint : H.white, line: i === 3 ? H.jade : H.line });
      T(s, t, { x: x + 0.2, y: 3.65, w: bw - 0.4, h: 0.4, fontSize: 15, bold: true });
      T(s, d, { x: x + 0.2, y: 4.1, w: bw - 0.4, h: 1.2, fontSize: 13, color: H.muted });
    });
    T(s, "The front desk only stepped in once: to welcome the patient at the visit.", { x: X0, y: 5.75, w: CW, h: 0.45, fontSize: 15, bold: true, color: H.jade });
  }

  // 10. Automation and your team
  {
    const s = content("PEOPLE STAY IN CHARGE", "Automation handles the routine. Your team handles people.");
    const colW = (CW - 0.3) / 2;
    const cols = [
      ["cpu", "Patientcurve handles", H.white, [
        "Replying to new enquiries, day or night",
        "Answering common questions with approved content",
        "Sending follow-ups and appointment reminders",
        "Inviting patients who missed a visit to rebook",
        "Recall and review requests",
        "Keeping a status for every enquiry",
      ]],
      ["hand", "Your team handles", H.tint, [
        "Clinical questions and treatment advice",
        "Pricing discussions and treatment plans",
        "Concerns, complaints and urgent cases",
        "Patients who ask to speak to a person",
        "Final say on every message and rule",
        "The welcome and care at the clinic",
      ]],
    ];
    cols.forEach(([ic, t, fill, items], i) => {
      const x = X0 + i * (colW + 0.3);
      card(s, x, 1.75, colW, 4.85, { fill, noLine: i === 1 });
      img(s, I[ic], x + 0.4, 2.05, 0.5);
      T(s, t, { x: x + 1.1, y: 2.05, w: colW - 1.5, h: 0.5, fontSize: 20, bold: true, valign: "middle" });
      T(s, items.map((it, j) => ({ text: it, options: { bullet: { indent: 18 }, breakLine: j < items.length - 1, paraSpaceAfter: 9 } })),
        { x: x + 0.4, y: 2.85, w: colW - 0.8, h: 3.6, fontSize: 15 });
    });
  }

  // 11. Visibility
  {
    const s = content("VISIBILITY", "Know where every patient stands");
    lead(s, "A simple view of the patient pipeline, so the clinic can see what's working and where patients are still being lost.");
    exampleTag(s, W - X0 - 0.95, 0.42);
    const tiles = [
      ["inbox", "New enquiries", "Captured this period, by source where available"],
      ["clock", "Awaiting follow-up", "Patients who asked but haven't booked yet"],
      ["calendar", "Booked", "Enquiries that became appointments"],
      ["calX", "Missed visits", "No-shows and whether they rebooked"],
      ["refresh", "Returning patients", "Patients brought back through recall"],
      ["star", "Feedback", "Review requests sent and concerns raised"],
    ];
    const gx = 0.25, cw = (CW - 2 * gx) / 3;
    tiles.forEach(([ic, t, d], i) => {
      const x = X0 + (i % 3) * (cw + gx), y = 2.3 + Math.floor(i / 3) * 1.65;
      card(s, x, y, cw, 1.45);
      img(s, I[ic], x + 0.3, y + 0.3, 0.42);
      T(s, t, { x: x + 0.9, y: y + 0.27, w: cw - 1.2, h: 0.45, fontSize: 16, bold: true, valign: "middle" });
      T(s, d, { x: x + 0.9, y: y + 0.75, w: cw - 1.2, h: 0.6, fontSize: 12.5, color: H.muted });
    });
    T(s, "Reports cover what the configured workflows can see. Data from other tools appears only where it is connected.", { x: X0, y: 5.75, w: CW, h: 0.4, fontSize: 12.5, color: H.muted });
  }

  // 12. Getting started
  {
    const s = content("GETTING STARTED", "Live in four simple stages");
    const stages = [
      ["Confirm scope", "Agree the workflows, timings and commercial terms."],
      ["Collect details", "WhatsApp access, approved message content and clinic information."],
      ["Configure and test", "Set up the agreed workflows and test each one end to end with your team."],
      ["Go live and review", "Hand over, monitor and adjust the workflows within the agreed scope."],
    ];
    const sw = CW / 4, ly = 2.0;
    hline(s, X0 + 0.25, ly, sw * 3, H.line, 1.5);
    stages.forEach(([t, d], i) => {
      const x = X0 + i * sw;
      const last = i === 3;
      s.addShape(pres.shapes.OVAL, { x, y: ly - 0.25, w: 0.5, h: 0.5, fill: { color: last ? H.jade : H.white }, line: { color: H.jade, width: 1.5 } });
      T(s, String(i + 1), { x, y: ly - 0.25, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: last ? H.white : H.jade, align: "center", valign: "middle" });
      T(s, t, { x, y: ly + 0.45, w: sw - 0.35, h: 0.45, fontSize: 17, bold: true });
      T(s, d, { x, y: ly + 0.95, w: sw - 0.35, h: 0.9, fontSize: 13, color: H.muted });
    });
    card(s, X0, 4.15, CW, 2.45, { fill: H.white });
    T(s, "WHAT A CLINIC NEEDS TO PROVIDE", { x: X0 + 0.4, y: 4.4, w: CW - 0.8, h: 0.3, fontSize: 11, bold: true, color: H.jade, charSpacing: 1.5 });
    const needs = [
      "A WhatsApp Business number the clinic controls",
      "Clinic information: timings, services, location",
      "Approval of message content before go-live",
      "Staff contacts for notifications and handoffs",
      "Appointment status kept up to date where workflows rely on it",
      "Patients' agreement to receive WhatsApp messages",
    ];
    [needs.slice(0, 3), needs.slice(3)].forEach((col, i) => {
      T(s, col.map((it, j) => ({ text: it, options: { bullet: { indent: 18 }, breakLine: j < col.length - 1, paraSpaceAfter: 8 } })),
        { x: X0 + 0.4 + i * (CW / 2), y: 4.85, w: CW / 2 - 0.7, h: 1.6, fontSize: 14 });
    });
  }

  // 13. Principles
  {
    const s = content("HOW WE WORK", "Built to be trusted by clinics and patients");
    const items = [
      ["edit", "Clinic-approved content", "Every message and rule is approved by the clinic before it goes live, and can be changed at any time."],
      ["shield", "Minimal data", "Only the information needed to run the agreed workflows is used, and only for the clinic's own patients."],
      ["users", "Consent first", "Messages go to patients who have agreed to hear from the clinic, and they can opt out easily."],
      ["link", "Honest integrations", "Calendar and software connections are included only when they are configured and tested."],
      ["rupee", "Clear costs", "Setup and monthly fees are separate. WhatsApp charges set by Meta are shown clearly, not hidden."],
      ["check", "No promised numbers", "We set clear objectives, not guaranteed results. Outcomes depend on each clinic and its patients."],
    ];
    const gx = 0.25, cw = (CW - 2 * gx) / 3;
    items.forEach(([ic, t, d], i) => {
      const x = X0 + (i % 3) * (cw + gx), y = 1.75 + Math.floor(i / 3) * 2.45;
      card(s, x, y, cw, 2.25);
      img(s, I[ic], x + 0.3, y + 0.3, 0.45);
      T(s, t, { x: x + 0.3, y: y + 0.9, w: cw - 0.6, h: 0.4, fontSize: 16, bold: true });
      T(s, d, { x: x + 0.3, y: y + 1.35, w: cw - 0.6, h: 0.85, fontSize: 12.5, color: H.muted });
    });
  }

  // 14. FAQs
  {
    const s = content("COMMON QUESTIONS", "Questions clinics usually ask");
    const qa = [
      ["Does this replace my receptionist?", "No. It takes routine replies and reminders off the desk so your team can focus on patients in front of them."],
      ["Do we need new software?", "No. Workflows run on your WhatsApp Business number. Other tools are connected only where it's agreed."],
      ["Can we control what patients receive?", "Yes. You approve every message before go-live and can ask for changes at any time."],
      ["What happens when a patient needs a person?", "The patient is told someone will reach out, and your team is notified with the details."],
      ["Are WhatsApp charges included?", "Meta's WhatsApp conversation charges are billed separately at actual cost unless stated otherwise."],
      ["Will it work for my clinic?", "We start with a discovery call to understand your enquiries and process, then propose only what fits."],
    ];
    const colW = (CW - 0.4) / 2;
    qa.forEach(([q, a], i) => {
      const x = X0 + (i % 2) * (colW + 0.4), y = 1.7 + Math.floor(i / 2) * 1.68;
      hline(s, x, y, colW);
      T(s, q, { x, y: y + 0.18, w: colW, h: 0.4, fontSize: 15.5, bold: true });
      T(s, a, { x, y: y + 0.62, w: colW, h: 0.9, fontSize: 13, color: H.muted });
    });
  }

  // 15. Closing
  {
    n++;
    const s = pres.addSlide();
    s.background = { color: H.deep };
    s.addImage({ data: logoDark, x: 0.8, y: 0.8, w: 2.4, h: 2.4 / LOGO_AR });
    T(s, "NEXT STEP", { x: 0.8, y: 2.3, w: 8, h: 0.3, fontSize: 12, bold: true, color: H.jadeLight, charSpacing: 1.5 });
    T(s, "Let's make patient follow-up more consistent.", { x: 0.8, y: 2.7, w: 11, h: 1.3, fontSize: 40, bold: true, color: H.white });
    T(s, "Book a short discovery call. We'll map how enquiries reach your clinic today and show where structured follow-up could help.", { x: 0.8, y: 4.2, w: 9.5, h: 0.9, fontSize: 17, color: H.onDeep });
    s.addShape(pres.shapes.OVAL, { x: 0.8, y: 5.73, w: 0.16, h: 0.16, fill: { color: H.rose }, line: { type: "none" } });
    T(s, "patientcurve.com", { x: 1.1, y: 5.6, w: 6, h: 0.42, fontSize: 18, bold: true, color: H.white, valign: "middle" });
  }

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT, n, "slides");
})();
