const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Indian-format rupees: ₹1,84,500 or ₹539.82. Paise only shown when present. */
export function formatINR(value: number): string {
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Parses YYYY-MM-DD as a calendar date (no time-zone shift). */
export function parseISODate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return { y, m, d };
}

/** "12 Nov 2026", as the brand guidelines write dates. */
export function formatDate(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return iso;
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

export function addDays(iso: string, days: number): string | null {
  const p = parseISODate(iso);
  if (!p) return null;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Splits a one-item-per-line textarea into trimmed, non-empty items. */
export function lines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean);
}

/** Filename-safe slug: ASCII letters, digits and hyphens, at most 60 characters. */
export function slugify(input: string, fallback = 'Clinic'): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || fallback;
}

export function proposalFilename(clinicName: string, isoDate: string): string {
  const date = parseISODate(isoDate) ? isoDate : 'undated';
  return `Patientcurve-Proposal-${slugify(clinicName)}-${date}.pptx`;
}
