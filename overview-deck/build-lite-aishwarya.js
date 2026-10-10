// Patientcurve lite proposal: 2 slides. 1) problem and solution, 2) pricing and next steps.
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
  pres.title = "Patientcurve proposal for Dr. Aishwarya Arun";
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


  const TOTAL = 2;
  const DOCTOR = "Dr. Aishwarya Arun";
  const CLINIC = "[Clinic name]"; // placeholder: replace before sending
  const DATE = "10 Oct 2026";
  const bullets = (items, o = {}) => items.map((t, j) => ({ text: t, options: { bullet: { indent: 15 }, breakLine: j < items.length - 1, paraSpaceAfter: o.ps ?? 4 } }));
  const label = (s, t, x, y, w, color = H.jade) => T(s, t, { x, y, w, h: 0.26, fontSize: 10.5, bold: true, color, charSpacing: 1.5 });
  function page(no, kicker, title) {
    const s = pres.addSlide();
    s.background = { color: H.surface };
    s.addImage({ data: logo, x: W - X0 - 1.75, y: 0.42, w: 1.75, h: 1.75 / LOGO_AR });
    T(s, kicker, { x: X0, y: 0.38, w: 9, h: 0.28, fontSize: 11, bold: true, color: H.jade, charSpacing: 1.5 });
    T(s, title, { x: X0, y: 0.68, w: 10, h: 0.6, fontSize: 28, bold: true });
    hline(s, X0, 6.95, CW);
    T(s, [{ text: "Prepared for  ", options: { bold: true } }, { text: `${DOCTOR}  ·  ` }, { text: CLINIC, options: { color: H.warning, bold: true } }, { text: `  ·  ${DATE}` }],
      { x: X0, y: 7.04, w: 9, h: 0.26, fontSize: 10, color: H.muted, valign: "middle" });
    T(s, `Patientcurve proposal  ·  ${no} / ${TOTAL}`, { x: 9.2, y: 7.04, w: W - X0 - 9.2, h: 0.26, fontSize: 10, color: H.muted, align: "right", valign: "middle" });
    return s;
  }

  // ---------- Page 1: problem and solution ----------
  {
    const s = page(1, "PROPOSAL FOR DR. AISHWARYA ARUN  ·  THE PROBLEM AND THE SOLUTION", "Every enquiry deserves a next step");
    const mx = 7.9, mw = W - X0 - mx;
    T(s, [
      { text: "Prepared for ", options: { color: H.muted } }, { text: DOCTOR, options: { bold: true, breakLine: true } },
      { text: CLINIC, options: { bold: true, color: H.warning } }, { text: `   ·   ${DATE}`, options: { color: H.muted } },
    ], { x: mx, y: 0.86, w: mw, h: 0.52, fontSize: 12.5, align: "right" });
    // Problem
    card(s, X0, 1.55, 3.95, 2.75, { fill: H.deep, noLine: true });
    label(s, "THE PROBLEM", X0 + 0.3, 1.8, 3.4, H.jadeLight);
    T(s, "Patients don't leave. They slip away between conversations.", { x: X0 + 0.3, y: 2.12, w: 3.4, h: 0.65, fontSize: 14.5, bold: true, color: H.white });
    T(s, bullets([
      "Enquiries wait for a reply after hours or on busy days",
      "Patients who don't book on the first reply never hear back",
      "Missed visits and recalls depend on someone remembering",
    ]), { x: X0 + 0.3, y: 2.9, w: 3.4, h: 1.3, fontSize: 11.5, color: H.onDeep });

    // What Patientcurve does
    const sx = X0 + 4.2, sw = (W - X0 - sx - 0.4) / 3;
    label(s, "WHAT PATIENTCURVE DOES", sx, 1.55, 7);
    T(s, "Structured WhatsApp follow-ups on the clinic's own number, using clinic-approved messages.", { x: sx, y: 1.85, w: W - X0 - sx, h: 0.3, fontSize: 12.5, color: H.muted });
    const steps = [
      ["1", "Capture", "inbox", "Every enquiry is answered and recorded with the patient's need, day or night."],
      ["2", "Follow up", "chat", "Timed follow-ups and reminders until the patient books or opts out."],
      ["3", "Recover", "refresh", "Missed visits and past patients are invited back where appointment data allows."],
    ];
    steps.forEach(([num, t, ic, d], i) => {
      const x = sx + i * (sw + 0.2);
      const last = i === 2;
      card(s, x, 2.3, sw, 2.0, { fill: last ? H.tint : H.white, line: last ? H.jade : H.line });
      T(s, num, { x: x + 0.25, y: 2.45, w: 0.5, h: 0.45, fontSize: 22, bold: true, color: H.jade });
      img(s, I[ic], x + sw - 0.65, 2.5, 0.38);
      T(s, t, { x: x + 0.25, y: 2.95, w: sw - 0.5, h: 0.35, fontSize: 16, bold: true });
      T(s, d, { x: x + 0.25, y: 3.35, w: sw - 0.45, h: 0.85, fontSize: 11.5, color: H.muted });
    });

    // How it works
    label(s, "HOW IT WORKS", X0, 4.55, 6);
    const flow = ["Patient messages on WhatsApp", "Approved answers and a few questions", "Follow-ups if not booked", "Booking link or staff call", "Status tracked for every enquiry"];
    const gap = 0.3, bw = (CW - 4 * gap) / 5;
    flow.forEach((t, i) => {
      const x = X0 + i * (bw + gap);
      const last = i === 4;
      card(s, x, 4.85, bw, 0.62, { fill: last ? H.deep : H.white, line: last ? H.deep : H.line });
      T(s, t, { x: x + 0.12, y: 4.85, w: bw - 0.24, h: 0.62, fontSize: 11.5, bold: true, align: "center", valign: "middle", color: last ? H.white : H.deep });
      if (!last) arrow(s, x + bw + 0.04, 5.16, gap - 0.08, 0);
    });

    // What changes
    label(s, "WHAT CHANGES FOR THE CLINIC", X0, 5.72, 6);
    const changes = [
      ["check", "No enquiry goes unanswered"],
      ["clock", "Follow-up happens without staff chasing"],
      ["calendar", "Fewer missed bookings left unrecovered"],
      ["chart", "A clear view of every patient's status"],
    ];
    const cw = (CW - 3 * 0.2) / 4;
    changes.forEach(([ic, t], i) => {
      const x = X0 + i * (cw + 0.2);
      card(s, x, 6.02, cw, 0.7, { fill: H.tint, noLine: true });
      img(s, I[ic], x + 0.2, 6.2, 0.34);
      T(s, t, { x: x + 0.68, y: 6.02, w: cw - 0.85, h: 0.7, fontSize: 12, bold: true, valign: "middle" });
    });
  }

  // ---------- Page 2: pricing and next steps ----------
  {
    const s = page(2, "PROPOSAL FOR DR. AISHWARYA ARUN  ·  PRICING AND NEXT STEPS", "Your pilot price and clear scope");
    const colW = (CW - 2 * 0.25) / 3, top = 1.45, ch = 3.7;
    const price = (i, lab, big, unit, pilot, items, dark) => {
      const x = X0 + i * (colW + 0.25);
      card(s, x, top, colW, ch, { fill: dark ? H.deep : H.white, line: dark ? H.deep : H.line });
      label(s, lab, x + 0.3, top + 0.25, colW - 0.6, dark ? H.jadeLight : H.jade);
      T(s, [{ text: big, options: { fontSize: 30, bold: true, color: dark ? H.white : H.deep } }, { text: unit, options: { fontSize: 13, color: dark ? H.onDeep : H.muted } }],
        { x: x + 0.3, y: top + 0.5, w: colW - 0.6, h: 0.6, valign: "bottom" });
      T(s, pilot, { x: x + 0.3, y: top + 1.15, w: colW - 0.6, h: 0.26, fontSize: 11, bold: true, color: dark ? H.jadeLight : H.jade });
      hline(s, x + 0.3, top + 1.5, colW - 0.6, dark ? H.deepLine : H.line);
      T(s, bullets(items, { ps: 3 }), { x: x + 0.3, y: top + 1.62, w: colW - 0.55, h: ch - 1.72, fontSize: 11, color: dark ? H.white : H.deep });
    };
    price(0, "SETUP  ·  YOUR PILOT PRICE", "₹5,000", "", "Standard price ₹7,500", [
      "Onboarding call to agree workflows and timings",
      "Approved answers, written by us, signed off by you",
      "Enquiry, follow-up and reminder workflows",
      "Your WhatsApp Business number connected",
      "Staff notifications for calls and handoffs",
      "Team walkthrough and end-to-end testing",
    ], false);
    price(1, "MONTHLY FEE  ·  YOUR PILOT PRICE", "₹2,999", " a month", "Standard price ₹4,999 a month", [
      "Every enquiry answered and followed up",
      "Appointment reminders and missed-visit follow-up *",
      "Recall and review requests *",
      "Monthly enquiry-to-appointment report",
      "Answer updates when fees or timings change",
      "Hosting, monitoring and updates",
    ], true);
    // Support + exclusions
    const x = X0 + 2 * (colW + 0.25);
    card(s, x, top, colW, 1.75, { fill: H.white });
    img(s, I.users, x + 0.3, top + 0.22, 0.32);
    label(s, "SUPPORT INCLUDED", x + 0.75, top + 0.26, colW - 1);
    T(s, bullets(["Help on WhatsApp and phone for you and your team", "Issues investigated and fixed", "Answer and rule changes on request"], { ps: 3 }),
      { x: x + 0.3, y: top + 0.68, w: colW - 0.55, h: 1.3, fontSize: 11 });
    card(s, x, top + 1.9, colW, ch - 1.9, { fill: H.warnBg, line: H.warning });
    img(s, IW.alert, x + 0.3, top + 2.1, 0.3);
    label(s, "NOT INCLUDED", x + 0.75, top + 2.12, colW - 1, H.warning);
    T(s, bullets(["WhatsApp charges set by Meta, billed at actual cost", "Calendar or software integrations, unless agreed and quoted separately", "Running ad campaigns"], { ps: 3 }),
      { x: x + 0.3, y: top + 2.5, w: colW - 0.55, h: 1.1, fontSize: 11 });
    T(s, [
      { text: "Pilot offer: ", options: { bold: true, color: H.deep } },
      { text: `₹5,000 setup and ₹2,999 a month is the specific pilot price offered to ${DOCTOR} for this proposal. Other clinics pay the standard price. Taxes as applicable.`, options: { breakLine: true } },
      { text: "* Scope: ", options: { bold: true, color: H.deep } },
      { text: "booking, reminders, recall and review requests depend on the clinic's systems and the configuration agreed at onboarding. No integration is included unless listed." },
    ], { x: X0, y: top + ch + 0.1, w: CW, h: 0.5, fontSize: 10.5, color: H.muted, paraSpaceAfter: 2 });

    // Getting started
    const gy = 6.22;
    label(s, "HOW TO GET STARTED", X0, gy - 0.27, 6);
    const st = ["Approve this proposal", "Share WhatsApp access and clinic details", "We configure and test with your team", "Go live, with support from day one"];
    const sw = (CW - 3 * 0.2) / 4;
    st.forEach((t, i) => {
      const sx = X0 + i * (sw + 0.2);
      const last = i === 3;
      card(s, sx, gy, sw, 0.6, { fill: last ? H.jade : H.white, line: last ? H.jade : H.line });
      s.addShape(pres.shapes.OVAL, { x: sx + 0.2, y: gy + 0.12, w: 0.36, h: 0.36, fill: { color: last ? H.white : H.tint }, line: { type: "none" } });
      T(s, String(i + 1), { x: sx + 0.2, y: gy + 0.12, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: H.jade, align: "center", valign: "middle" });
      T(s, t, { x: sx + 0.7, y: gy, w: sw - 0.85, h: 0.6, fontSize: 12, bold: true, valign: "middle", color: last ? H.white : H.deep });
    });
  }

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
